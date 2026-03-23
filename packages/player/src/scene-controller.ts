/**
 * @preplai/player — SceneController
 *
 * Central coordinator for the player. Holds the current VisualScript,
 * manages frame state, dispatches render calls via @preplai/illustrations,
 * and handles patchEntity / clear operations.
 *
 * P2.1 Cinematic Mode: Persistent scene — entities that exist across frames
 * stay in place (no clear/rebuild). New entities animate in, removed entities
 * animate out. Connections are always re-rendered.
 *
 * Uses jsdom-compatible DOM APIs (createElementNS, querySelector, etc.).
 *
 * IMPORTANT: All entity lookups are scoped to this.entityLayer (not document)
 * to avoid cross-instance ID collisions when multiple players exist on the
 * same page (e.g. hero player + showcase players on the landing page).
 */
import type { VisualScript, VisualEntity, IllustrationFrame } from '@preplai/shared';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  ENTITY_COUNT_WARN_THRESHOLD,
  ENTITY_COUNT_ERROR_THRESHOLD,
  INTER_ENTITY_STAGGER_MS,
} from '@preplai/shared';
import { renderEntity, destroyLottieOverlay } from '@preplai/illustrations';
import { applyDefaults, assignEntranceDelays } from './apply-defaults.js';

// ── Types ────────────────────────────────────────────────────────────

export interface FocusInfo {
  entityId: string;
  /** All focused entity IDs */
  entityIds: string[];
  /** Screen-space position (CSS pixels) of the primary focused entity center */
  screenX: number;
  screenY: number;
}

export interface SceneControllerOptions {
  entityLayer: SVGGElement;
  connectionLayer: SVGGElement;
  /** Callback when narrator text changes */
  onNarratorUpdate?: (text: string) => void;
  /** Callback when a frame is rendered (for postMessage bridge) */
  onFrameChange?: (frameIndex: number) => void;
  /** Callback when entity focus changes (for spatial narrator) */
  onFocusChange?: (focus: FocusInfo | null) => void;
}

export interface EntityPatch {
  label?: string;
  color?: string;
  highlight?: boolean;
  position?: { x: number; y: number };
}

// ── Connection types that go to the connection layer ─────────────────

const CONNECTION_TYPES = new Set(['Arrow', 'DataFlow', 'BidirectArrow', 'DottedArrow']);

function isConnectionType(type: string): boolean {
  return CONNECTION_TYPES.has(type);
}

// ── Always-visible entity types (never get dof-bg blur) ─────────────
// These types provide context, headings, or supporting text that the viewer
// needs to read regardless of which entity the narrator is discussing.
const ALWAYS_VISIBLE_TYPES = new Set([
  'H1', 'H2', 'H3',         // Headings — always needed for context
  'Label',                    // Explanatory text — always readable
  'Text',                     // Paragraph / body text — always readable
  'Span',                     // Inline annotation text — always readable
  'StepList',                 // Steps/lists — reference material
  'Badge',                    // Status badges — always informative
  'Quote',                    // Quotes — always readable
  'Definition',               // Definitions — reference text
  'Callout',                  // Callouts — supporting context
  'Annotation',               // Annotations — supporting context
  'Table',                    // Data tables — reference material
]);

// ── Exit animation duration ──────────────────────────────────────────

const EXIT_DURATION_MS = 300;

// ── ViewBox animation ────────────────────────────────────────────────

interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

const VIEWBOX_PADDING = 0.12; // 12% padding around entity bounding box
const VIEWBOX_MIN_W = 600; // don't zoom in tighter than this
const VIEWBOX_ANIM_MS_DEFAULT = 600; // fallback

/** Scale camera duration based on change magnitude. Snappy for small pans, dramatic for reveals. */
function computeViewBoxDuration(start: ViewBox, target: ViewBox): number {
  const dx = Math.abs(target.x - start.x);
  const dy = Math.abs(target.y - start.y);
  const dw = Math.abs(target.w - start.w);
  const dh = Math.abs(target.h - start.h);
  const panDelta = Math.sqrt(dx * dx + dy * dy) / Math.sqrt(1920 * 1920 + 1080 * 1080);
  const zoomDelta = (dw + dh) / (1920 + 1080);
  const totalDelta = Math.max(panDelta, zoomDelta);
  // 400ms (snappy small pan) to 800ms (dramatic reveal)
  return Math.round(Math.min(800, Math.max(400, 400 + totalDelta * 2000)));
}

/** Ease-in-out quad */
function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}


// ═══════════════════════════════════════════════════════════════════════
// SceneController
// ═══════════════════════════════════════════════════════════════════════

export class SceneController {
  currentScript: VisualScript | null = null;
  currentFrameIdx: number = 0;
  renderedEntityIds: Set<string> = new Set();

  private entityLayer: SVGGElement;
  private connectionLayer: SVGGElement;
  private onNarratorUpdate?: (text: string) => void;
  private onFrameChange?: (frameIndex: number) => void;
  private onFocusChange?: (focus: FocusInfo | null) => void;

  /** Tracks which non-connection entities are currently in the DOM by ID */
  private liveEntityIds: Set<string> = new Set();
  /** Previous frame's non-connection entities (for diffing) */
  private prevNonConnections: VisualEntity[] = [];
  /** Active viewBox animation frame ID */
  private viewBoxAnimId: number = 0;

  // ── Focus coalescing state ──────────────────────────────────────────
  /** Currently active focus entity IDs (accumulated via coalescing) */
  private _activeFocusIds: Set<string> = new Set();
  /** Confidence map for currently active focus */
  private _activeFocusConfidences: Map<string, number> = new Map();
  /** Timer to clear stale focus after no new cues arrive */
  private _focusDecayTimer: ReturnType<typeof setTimeout> | null = null;
  /** Timestamp of last focus cue (for coalescing window) */
  private _lastCueTime: number = 0;

  constructor(options: SceneControllerOptions) {
    this.entityLayer = options.entityLayer;
    this.connectionLayer = options.connectionLayer;
    this.onNarratorUpdate = options.onNarratorUpdate;
    this.onFrameChange = options.onFrameChange;
    this.onFocusChange = options.onFocusChange;
  }

  /**
   * Find an entity element by ID, scoped to this controller's entity layer.
   * Avoids global document.getElementById collisions when multiple players
   * exist on the same page.
   */
  private _findEntity(entityId: string): Element | null {
    return this.entityLayer.querySelector(`[id="${entityId}"]`);
  }

  /**
   * Load a new VisualScript. Clears the canvas and seeks to frame 0.
   */
  loadScript(script: VisualScript): void {
    this.currentScript = script;
    this._fullClear();
    this.seekToFrame(0);
  }

  /**
   * Jump to a specific frame by index.
   */
  seekToFrame(frameIndex: number): void {
    const script = this.currentScript;
    if (!script) return;

    const frame = script.frames[frameIndex];
    if (!frame) return;

    this.currentFrameIdx = frameIndex;
    this._renderFrame(frame);
    this.onFrameChange?.(frameIndex);
  }

  /**
   * Core render function — CINEMATIC MODE.
   *
   * Instead of clear + rebuild, diffs entities between frames:
   * - Kept entities stay in DOM (position animated if changed)
   * - New entities render with entrance animation
   * - Removed entities get exit animation then removed from DOM
   * - Connections always re-rendered (they depend on entity positions)
   */
  private _renderFrame(frame: IllustrationFrame): void {
    const entities = frame.entities ?? [];
    const entityCount = entities.length;

    // Performance contract: warn/refuse at thresholds
    if (entityCount > ENTITY_COUNT_ERROR_THRESHOLD) {
      console.error(
        `[scene-controller] Frame has ${entityCount} entities. Exceeds hard limit of ${ENTITY_COUNT_ERROR_THRESHOLD}. Refusing to render.`,
      );
      this._fullClear();
      return;
    }

    if (entityCount > ENTITY_COUNT_WARN_THRESHOLD) {
      console.warn(
        `[scene-controller] Frame has ${entityCount} entities (>${ENTITY_COUNT_WARN_THRESHOLD} limit). Performance may degrade.`,
      );
    }

    // Separate connections from non-connection entities
    const connections = entities.filter((e: VisualEntity) => isConnectionType(e.type));
    const nonConnections = entities.filter((e: VisualEntity) => !isConnectionType(e.type));

    // ── Diff entities ──────────────────────────────────────────────
    const prevIds = new Set(this.prevNonConnections.map(e => e.id));
    const currIds = new Set(nonConnections.map(e => e.id));

    const added = nonConnections.filter(e => !prevIds.has(e.id) && !e.parentEntityId);
    const removed = this.prevNonConnections.filter(e => !currIds.has(e.id) && !e.parentEntityId);
    const kept = nonConnections.filter(e => prevIds.has(e.id) && !e.parentEntityId);

    // ── Exit animation for removed entities (staggered, outside-in) ──
    const EXIT_STAGGER_MS = 30;
    const sortedRemoved = [...removed].sort((a, b) => {
      const distA = Math.sqrt(Math.pow((a.position?.x ?? 50) - 50, 2) + Math.pow((a.position?.y ?? 50) - 50, 2));
      const distB = Math.sqrt(Math.pow((b.position?.x ?? 50) - 50, 2) + Math.pow((b.position?.y ?? 50) - 50, 2));
      return distB - distA; // furthest from center exits first
    });
    for (let i = 0; i < sortedRemoved.length; i++) {
      const entity = sortedRemoved[i];
      if (i === 0) {
        this._exitEntity(entity.id, entity.position);
      } else {
        setTimeout(() => {
          this._exitEntity(entity.id, entity.position);
        }, i * EXIT_STAGGER_MS);
      }
    }

    // ── Update kept entities (position, type, color, label changes) ──
    const prevMap = new Map(this.prevNonConnections.map(e => [e.id, e]));
    for (const entity of kept) {
      const prev = prevMap.get(entity.id);
      if (!prev) continue;

      // Position change
      this._updateEntityPosition(entity.id, prev.position, entity.position);

      // Type change → morph transition (shape morph)
      if (prev.type !== entity.type) {
        this._morphEntity(entity.id, prev, entity);
      }
      // Same type but property changes → property morph (color, label)
      else {
        this._morphEntityProperties(entity.id, prev, entity);
      }
    }

    // ── Render new entities with motivated entrance animation ─────
    const staggered = assignEntranceDelays(added);
    for (const entity of staggered) {
      // Assign motivated entrance direction based on position (P2.4)
      if (!entity.animation?.entrance) {
        const motivated = this._motivatedEntrance(entity, kept);
        entity.animation = { ...(entity.animation ?? {}), entrance: motivated };
      }
      const defaulted = applyDefaults(entity);
      const el = renderEntity(defaulted, this.entityLayer);
      if (el) {
        this.renderedEntityIds.add(entity.id);
        this.liveEntityIds.add(entity.id);
      }
    }

    // ── Connections: always clear + re-render ──────────────────────
    this.connectionLayer.innerHTML = '';

    // Connection delay: only stagger if we have new entities entering
    const hasNewEntities = added.length > 0;
    const connectionBaseDelay = hasNewEntities
      ? added.length * INTER_ENTITY_STAGGER_MS + 150
      : 80; // minimal delay for connection draw-on when no new entities
    const connectionStagger = 80;

    for (let ci = 0; ci < connections.length; ci++) {
      const conn = connections[ci];
      const defaulted = applyDefaults(conn);
      defaulted.animation = {
        ...(defaulted.animation ?? {}),
        delay: connectionBaseDelay + ci * connectionStagger,
      };
      renderEntity(defaulted, this.connectionLayer, entities);
    }

    // ── ViewBox camera ─────────────────────────────────────────────
    this._animateViewBoxToEntities(nonConnections);

    // ── Depth of field ──────────────────────────────────────────────
    this._applyDepthOfField(nonConnections);

    // ── Save current state for next diff ───────────────────────────
    this.prevNonConnections = [...nonConnections];

    // Update narrator text
    if (frame.narrationSegment) {
      this.onNarratorUpdate?.(
        typeof frame.narrationSegment === 'string'
          ? frame.narrationSegment
          : '',
      );
    }
  }

  // ── Entity exit animation ──────────────────────────────────────────

  private _exitEntity(entityId: string, position?: { x: number; y: number }): void {
    const el = this._findEntity(entityId) as HTMLElement | null;
    if (!el) return;

    // Find the innerG (animation target)
    const innerG = el.querySelector('.animate-element') as SVGGElement | null;
    const target = innerG ?? el;

    // Remove entrance/DoF classes that might interfere
    const classAttr = target.getAttribute('class') ?? '';
    target.setAttribute('class', classAttr.replace(/entrance-\S+/g, '').trim());
    el.classList.remove('dof-focus', 'dof-bg');

    // Determine directional exit transform based on position (P2.4)
    let exitTransform = 'scale(0.85) rotate(-1deg)';
    if (position) {
      const x = position.x;
      const y = position.y;
      const distLeft = x;
      const distRight = 100 - x;
      const distTop = y;
      const distBottom = 100 - y;
      const minDist = Math.min(distLeft, distRight, distTop, distBottom);

      if (minDist === distLeft) exitTransform = 'translateX(-100px) scale(0.9) rotate(-2deg)';
      else if (minDist === distRight) exitTransform = 'translateX(100px) scale(0.9) rotate(2deg)';
      else if (minDist === distTop) exitTransform = 'translateY(-80px) scale(0.9) rotate(-1deg)';
      else exitTransform = 'translateY(80px) scale(0.9) rotate(1deg)';
    }

    // Apply exit: fade out + directional slide
    target.style.transition = `opacity ${EXIT_DURATION_MS}ms ease, transform ${EXIT_DURATION_MS}ms ease`;
    target.style.opacity = '0';
    target.style.transform = exitTransform;

    // Remove from DOM after animation
    setTimeout(() => {
      el.remove();
    }, EXIT_DURATION_MS);

    this.renderedEntityIds.delete(entityId);
    this.liveEntityIds.delete(entityId);
    // Clean up any Lottie animation instance for this entity
    destroyLottieOverlay(entityId);
  }

  // ── Entity position update ─────────────────────────────────────────

  private _updateEntityPosition(
    entityId: string,
    prevPos: { x: number; y: number },
    newPos: { x: number; y: number },
  ): void {
    if (prevPos.x === newPos.x && prevPos.y === newPos.y) return;

    const el = this._findEntity(entityId) as HTMLElement | null;
    if (!el) return;

    const cx = (newPos.x / 100) * CANVAS_WIDTH;
    const cy = (newPos.y / 100) * CANVAS_HEIGHT;

    // Animate position via CSS transition on the outerG's transform
    el.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
    el.setAttribute('transform', `translate(${cx}, ${cy})`);

    // Clean up transition after it completes
    setTimeout(() => {
      el.style.transition = '';
    }, 550);
  }

  // ── Entity type morph (Move 1: GSAP MorphSVG) ─────────────────────────

  /**
   * Morph an entity from one type to another using GSAP MorphSVG.
   * The entity stays in DOM — its primary shape morphs smoothly.
   * Falls back to exit/enter if morph target not found or MorphSVG unavailable.
   */
  private _morphEntity(
    entityId: string,
    prevEntity: VisualEntity,
    newEntity: VisualEntity,
  ): void {
    const gsap = (window as any).gsap;
    const hasMorphPlugin = gsap && typeof gsap.to === 'function' && (window as any).MorphSVGPlugin;

    const el = this._findEntity(entityId);
    if (!el) return;

    const innerG = el.querySelector('.animate-element') as SVGGElement | null;
    if (!innerG) return;

    // Find the current morph target shape
    const currentShape = innerG.querySelector('[data-morph-target]') as SVGElement | null;
    if (!currentShape || !hasMorphPlugin) {
      // Fallback: exit old, enter new
      this._exitEntity(entityId, prevEntity.position);
      this.renderedEntityIds.delete(entityId);
      this.liveEntityIds.delete(entityId);

      const defaulted = applyDefaults(newEntity);
      defaulted.animation = { ...(defaulted.animation ?? {}), entrance: 'entrance-scaleIn' };
      setTimeout(() => {
        const newEl = renderEntity(defaulted, this.entityLayer);
        if (newEl) {
          this.renderedEntityIds.add(entityId);
          this.liveEntityIds.add(entityId);
        }
      }, EXIT_DURATION_MS + 50);
      return;
    }

    // Render the new entity off-screen to get its target shape
    const offscreen = document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGGElement;
    offscreen.style.visibility = 'hidden';
    offscreen.style.position = 'absolute';
    this.entityLayer.appendChild(offscreen);

    const defaulted = applyDefaults(newEntity);
    defaulted.animation = { ...(defaulted.animation ?? {}), entrance: 'none' };
    const tempEl = renderEntity(defaulted, offscreen);
    const targetShape = tempEl?.querySelector('[data-morph-target]') as SVGElement | null;

    if (!targetShape) {
      // No target shape in new entity — clean up and fallback
      offscreen.remove();
      this._exitEntity(entityId, prevEntity.position);
      setTimeout(() => {
        const def2 = applyDefaults(newEntity);
        def2.animation = { ...(def2.animation ?? {}), entrance: 'entrance-scaleIn' };
        const newEl = renderEntity(def2, this.entityLayer);
        if (newEl) {
          this.renderedEntityIds.add(entityId);
          this.liveEntityIds.add(entityId);
        }
      }, EXIT_DURATION_MS + 50);
      return;
    }

    // Perform the morph animation
    const morphDuration = 0.6;
    const MorphSVGPlugin = (window as any).MorphSVGPlugin;

    // MorphSVG requires <path> elements — convert rect/circle/ellipse to path first
    // convertToPath() replaces the element in DOM and returns the new <path>
    let morphSource: SVGElement = currentShape;
    let morphTargetEl: SVGElement = targetShape;
    try {
      if (currentShape.tagName.toLowerCase() !== 'path') {
        const converted = MorphSVGPlugin.convertToPath(currentShape);
        if (converted && converted.length > 0) {
          morphSource = converted[0];
          // Preserve the morph-target attribute on the converted path
          morphSource.setAttribute('data-morph-target', 'true');
        }
      }
      if (targetShape.tagName.toLowerCase() !== 'path') {
        const converted = MorphSVGPlugin.convertToPath(targetShape);
        if (converted && converted.length > 0) {
          morphTargetEl = converted[0];
        }
      }
    } catch (e) {
      console.warn('[morph] convertToPath failed, using fallback', e);
    }

    // Get the path data string from the target for morphSVG
    const targetPathData = morphTargetEl.getAttribute('d') || morphTargetEl;

    // Morph the shape path
    gsap.to(morphSource, {
      morphSVG: targetPathData,
      duration: morphDuration,
      ease: 'power2.inOut',
    });

    // Morph fill and stroke colors
    const newFill = targetShape.getAttribute('fill') ?? morphTargetEl.getAttribute('fill') ?? '';
    const newStroke = targetShape.getAttribute('stroke') ?? morphTargetEl.getAttribute('stroke') ?? '';
    if (newFill) {
      gsap.to(morphSource, { attr: { fill: newFill }, duration: morphDuration, ease: 'power2.inOut' });
    }
    if (newStroke) {
      gsap.to(morphSource, { attr: { stroke: newStroke }, duration: morphDuration, ease: 'power2.inOut' });
    }

    // Update the data-type attribute
    el.setAttribute('data-type', newEntity.type);

    // After morph completes, swap innerG contents with the properly rendered new entity
    setTimeout(() => {
      offscreen.remove();
      // Re-render the entity properly in place
      const finalDefaulted = applyDefaults(newEntity);
      finalDefaulted.animation = { ...(finalDefaulted.animation ?? {}), entrance: 'none' };
      const finalOffscreen = document.createElementNS('http://www.w3.org/2000/svg', 'g') as SVGGElement;
      finalOffscreen.style.visibility = 'hidden';
      this.entityLayer.appendChild(finalOffscreen);
      const finalEl = renderEntity(finalDefaulted, finalOffscreen);
      const finalInner = finalEl?.querySelector('.animate-element');
      if (finalInner && innerG.parentNode) {
        while (innerG.firstChild) innerG.removeChild(innerG.firstChild);
        while (finalInner.firstChild) innerG.appendChild(finalInner.firstChild);
      }
      finalOffscreen.remove();
    }, morphDuration * 1000 + 50);
  }

  // ── Entity property morph (color, label changes on same type) ─────────

  /**
   * Animate property changes (color, label) when an entity persists
   * across frames with the same type but different visual properties.
   */
  private _morphEntityProperties(
    entityId: string,
    prevEntity: VisualEntity,
    newEntity: VisualEntity,
  ): void {
    const gsap = (window as any).gsap;
    if (!gsap) return;

    const el = this._findEntity(entityId);
    if (!el) return;

    const innerG = el.querySelector('.animate-element') as SVGGElement | null;
    if (!innerG) return;

    const prevColor = prevEntity.color;
    const newColor = newEntity.color;

    // Color change: animate fill/stroke on morph target
    if (prevColor !== newColor && newColor) {
      const morphTarget = innerG.querySelector('[data-morph-target]') as SVGElement | null;
      if (morphTarget) {
        const currentStroke = morphTarget.getAttribute('stroke');
        if (currentStroke && currentStroke !== '#ffffff') {
          gsap.to(morphTarget, { attr: { stroke: newColor }, duration: 0.4, ease: 'power2.inOut' });
        }
      }
    }

    // Label change: crossfade text
    if (prevEntity.label !== newEntity.label && newEntity.label) {
      const labels = innerG.querySelectorAll('text');
      const lastLabel = labels[labels.length - 1] as SVGTextElement | null;
      if (lastLabel) {
        gsap.to(lastLabel, {
          opacity: 0,
          duration: 0.2,
          ease: 'power2.in',
          onComplete: () => {
            lastLabel.textContent = newEntity.label ?? '';
            gsap.to(lastLabel, { opacity: 1, duration: 0.2, ease: 'power2.out' });
          },
        });
      }
    }
  }

  // ── Motivated entrance direction (P2.4) ──────────────────────────────

  /**
   * Determine the best entrance animation class based on entity position.
   * Entities near edges fly in from that edge. Entities near existing entities
   * grow from a point. Center entities use the default fadeInUp.
   */
  private _motivatedEntrance(entity: VisualEntity, keptEntities: VisualEntity[]): string {
    const x = entity.position.x; // 0–100
    const y = entity.position.y; // 0–100

    // Check if this entity is near an existing (kept) entity → grow from point
    for (const kept of keptEntities) {
      const dx = Math.abs(x - kept.position.x);
      const dy = Math.abs(y - kept.position.y);
      if (dx < 12 && dy < 12) {
        return 'entrance-growFromPoint';
      }
    }

    // Edge proximity thresholds (percentage of canvas)
    const EDGE_THRESHOLD = 22;

    // Find distances to each edge
    const distLeft = x;
    const distRight = 100 - x;
    const distTop = y;
    const distBottom = 100 - y;

    const minDist = Math.min(distLeft, distRight, distTop, distBottom);

    // Only use directional entrance if close enough to an edge
    if (minDist < EDGE_THRESHOLD) {
      if (minDist === distLeft) return 'entrance-flyInFromLeft';
      if (minDist === distRight) return 'entrance-flyInFromRight';
      if (minDist === distTop) return 'entrance-flyInFromTop';
      if (minDist === distBottom) return 'entrance-flyInFromBottom';
    }

    // Center/default: gentle rise
    return 'entrance-fadeInUp';
  }

  // ── Depth of field ───────────────────────────────────────────────────

  private _applyDepthOfField(nonConnections: VisualEntity[]): void {
    // On frame render, clear all DoF classes so every entity starts fully visible.
    // Focus cues from the audio engine (or timer-based fallback) will apply
    // dof-focus / dof-bg dynamically during narration via shiftFocus().
    // This prevents the "everything blurred" state when narration plays
    // but hasn't targeted a specific entity yet.
    for (const entity of nonConnections) {
      const el = this._findEntity(entity.id);
      if (!el) continue;
      el.classList.remove('dof-focus', 'dof-bg', 'dof-focus-secondary');
    }

    // No initial focus — spatial narrator returns to default position.
    // Focus cues will drive spatial positioning during playback.
    if (this.onFocusChange) {
      this.onFocusChange(null);
    }
  }

  // ── ViewBox camera animation ───────────────────────────────────────

  private _animateViewBoxToEntities(nonConnections: VisualEntity[]): void {
    const svg = this.entityLayer.ownerSVGElement;
    if (!svg || nonConnections.length === 0) return;

    // Calculate bounding box of current entities (in canvas pixels)
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const e of nonConnections) {
      const cx = (e.position.x / 100) * CANVAS_WIDTH;
      const cy = (e.position.y / 100) * CANVAS_HEIGHT;
      // Approximate entity radius based on size
      const r = (e.size ?? 1) * 40;
      minX = Math.min(minX, cx - r);
      minY = Math.min(minY, cy - r);
      maxX = Math.max(maxX, cx + r);
      maxY = Math.max(maxY, cy + r);
    }

    // Add padding
    const rawW = maxX - minX;
    const rawH = maxY - minY;
    const padX = rawW * VIEWBOX_PADDING;
    const padY = rawH * VIEWBOX_PADDING;
    let vbX = minX - padX;
    let vbY = minY - padY;
    let vbW = rawW + padX * 2;
    let vbH = rawH + padY * 2;

    // Enforce minimum zoom (don't zoom in too tight)
    if (vbW < VIEWBOX_MIN_W) {
      const cx = vbX + vbW / 2;
      vbW = VIEWBOX_MIN_W;
      vbX = cx - vbW / 2;
    }

    // Maintain 16:9 aspect ratio
    const targetAspect = CANVAS_WIDTH / CANVAS_HEIGHT;
    const currentAspect = vbW / vbH;
    if (currentAspect > targetAspect) {
      // Too wide — expand height
      const newH = vbW / targetAspect;
      vbY -= (newH - vbH) / 2;
      vbH = newH;
    } else {
      // Too tall — expand width
      const newW = vbH * targetAspect;
      vbX -= (newW - vbW) / 2;
      vbW = newW;
    }

    // Clamp to canvas bounds (don't show outside the canvas)
    if (vbX < 0) vbX = 0;
    if (vbY < 0) vbY = 0;
    if (vbX + vbW > CANVAS_WIDTH) {
      // If entities demand more width than canvas, show full width
      if (vbW >= CANVAS_WIDTH) {
        vbX = 0;
        vbW = CANVAS_WIDTH;
      } else {
        vbX = CANVAS_WIDTH - vbW;
      }
    }
    if (vbY + vbH > CANVAS_HEIGHT) {
      if (vbH >= CANVAS_HEIGHT) {
        vbY = 0;
        vbH = CANVAS_HEIGHT;
      } else {
        vbY = CANVAS_HEIGHT - vbH;
      }
    }

    // If the resulting viewBox is essentially the full canvas, just use full canvas
    // (avoids micro-zooms that look jittery). Threshold at 93% allows moderate
    // entity clusters to still trigger cinematic camera zoom.
    if (vbW > CANVAS_WIDTH * 0.93 && vbH > CANVAS_HEIGHT * 0.93) {
      vbX = 0;
      vbY = 0;
      vbW = CANVAS_WIDTH;
      vbH = CANVAS_HEIGHT;
    }

    const target: ViewBox = { x: vbX, y: vbY, w: vbW, h: vbH };
    this._animateViewBox(svg, target);
  }

  private _animateViewBox(svg: SVGSVGElement, target: ViewBox): void {
    // Cancel any in-flight animation
    if (this.viewBoxAnimId) {
      cancelAnimationFrame(this.viewBoxAnimId);
      this.viewBoxAnimId = 0;
    }

    // Read current viewBox
    const vb = svg.viewBox.baseVal;
    const start: ViewBox = { x: vb.x, y: vb.y, w: vb.width, h: vb.height };

    // Skip animation if already at target (within tolerance)
    const tol = 2;
    if (
      Math.abs(start.x - target.x) < tol &&
      Math.abs(start.y - target.y) < tol &&
      Math.abs(start.w - target.w) < tol &&
      Math.abs(start.h - target.h) < tol
    ) {
      return;
    }

    const duration = computeViewBoxDuration(start, target);
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const ease = easeInOutQuad(t);

      const x = start.x + (target.x - start.x) * ease;
      const y = start.y + (target.y - start.y) * ease;
      const w = start.w + (target.w - start.w) * ease;
      const h = start.h + (target.h - start.h) * ease;

      svg.setAttribute('viewBox', `${x.toFixed(1)} ${y.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);

      if (t < 1) {
        this.viewBoxAnimId = requestAnimationFrame(step);
      } else {
        this.viewBoxAnimId = 0;
      }
    };

    this.viewBoxAnimId = requestAnimationFrame(step);
  }

  // ── Public API ─────────────────────────────────────────────────────

  /**
   * Live entity patch — update a single entity's visual properties.
   */
  patchEntity(entityId: string, patch: EntityPatch): void {
    const outerEl = this._findEntity(entityId);
    if (!outerEl) {
      console.warn(
        `[scene-controller] patchEntity: entity "${entityId}" not found in DOM`,
      );
      return;
    }

    // Label patch
    if (patch.label !== undefined) {
      const textEl = outerEl.querySelector('text');
      if (textEl) textEl.textContent = patch.label;
    }

    // Color patch — update fill on all colored child elements
    if (patch.color) {
      outerEl.querySelectorAll('[fill]').forEach((node: Element) => {
        const currentFill = node.getAttribute('fill');
        if (currentFill && currentFill !== 'none' && !currentFill.startsWith('rgba(0,0,0')) {
          node.setAttribute('fill', patch.color!);
        }
      });
    }

    // Highlight toggle
    if (patch.highlight !== undefined) {
      if (patch.highlight) {
        outerEl.setAttribute('filter', 'url(#entity-glow)');
      } else {
        outerEl.removeAttribute('filter');
      }
    }

    // Position patch — update SVG transform attribute
    if (patch.position) {
      const cx = (patch.position.x / 100) * CANVAS_WIDTH;
      const cy = (patch.position.y / 100) * CANVAS_HEIGHT;
      outerEl.setAttribute('transform', `translate(${cx}, ${cy})`);
    }
  }

  /**
   * Coalescing focus: when a new cue arrives within COALESCE_WINDOW_MS of the
   * previous one, merge the new entity IDs into the active focus set instead
   * of replacing them. This prevents the "rapid blink" effect when the narrator
   * mentions two entities in quick succession (e.g. "the server and database").
   *
   * After no new cues arrive for FOCUS_DECAY_MS, focus clears and all entities
   * return to their normal state (no blur). This prevents the "everything is
   * blurred with nothing highlighted" dead zone.
   */
  private static readonly COALESCE_WINDOW_MS = 800;
  private static readonly FOCUS_DECAY_MS = 4000;

  /**
   * Dynamically shift focus to one or more entities during audio playback.
   * Uses cue coalescing: rapid successive cues merge into multi-entity focus.
   * Always-visible types (H1, Label, StepList, etc.) never get background blur.
   *
   * @param entityIds  Entity IDs to focus on (array, single string, or null to clear)
   * @param confidences  Per-entity confidence scores (0-1), same order as entityIds
   */
  shiftFocus(entityIds: string[] | string | null, confidences?: number[]): void {
    if (!this.currentScript) return;
    const frame = this.currentScript.frames[this.currentFrameIdx];
    if (!frame) return;

    // ── Null = explicit clear (audio ended, frame change) ──────────
    if (entityIds === null) {
      this._activeFocusIds.clear();
      this._activeFocusConfidences.clear();
      if (this._focusDecayTimer) {
        clearTimeout(this._focusDecayTimer);
        this._focusDecayTimer = null;
      }
      this._applyFocusToDOM(frame);
      return;
    }

    // Normalize to array
    const newIds: string[] = typeof entityIds === 'string' ? [entityIds] : entityIds;

    // ── Coalescing: merge with active focus if within window ───────
    const now = performance.now();
    const withinWindow = (now - this._lastCueTime) < SceneController.COALESCE_WINDOW_MS;

    if (withinWindow && this._activeFocusIds.size > 0) {
      // Merge new IDs into existing focus set
      for (let i = 0; i < newIds.length; i++) {
        this._activeFocusIds.add(newIds[i]);
        this._activeFocusConfidences.set(newIds[i], confidences?.[i] ?? 1.0);
      }
    } else {
      // New focus set — replace active
      this._activeFocusIds.clear();
      this._activeFocusConfidences.clear();
      for (let i = 0; i < newIds.length; i++) {
        this._activeFocusIds.add(newIds[i]);
        this._activeFocusConfidences.set(newIds[i], confidences?.[i] ?? 1.0);
      }
    }

    this._lastCueTime = now;

    // ── Reset decay timer: clear focus after no new cues ──────────
    if (this._focusDecayTimer) {
      clearTimeout(this._focusDecayTimer);
    }
    this._focusDecayTimer = setTimeout(() => {
      this._activeFocusIds.clear();
      this._activeFocusConfidences.clear();
      this._focusDecayTimer = null;
      if (this.currentScript) {
        const f = this.currentScript.frames[this.currentFrameIdx];
        if (f) this._applyFocusToDOM(f);
      }
    }, SceneController.FOCUS_DECAY_MS);

    // ── Apply to DOM ──────────────────────────────────────────────
    this._applyFocusToDOM(frame);
  }

  /**
   * Apply current focus state to DOM elements.
   * Handles: coalesced focus set, always-visible exemptions, no-focus reset.
   */
  private _applyFocusToDOM(frame: IllustrationFrame): void {
    const hasFocus = this._activeFocusIds.size > 0;
    const nonConnections = frame.entities.filter(e => !isConnectionType(e.type));

    for (const entity of nonConnections) {
      const el = this._findEntity(entity.id);
      if (!el) continue;

      if (hasFocus && this._activeFocusIds.has(entity.id)) {
        // ── Focused entity: primary or secondary based on confidence ──
        const confidence = this._activeFocusConfidences.get(entity.id) ?? 1.0;
        el.classList.remove('dof-bg', 'dof-focus', 'dof-focus-secondary');
        if (confidence >= 0.8) {
          el.classList.add('dof-focus');
        } else {
          el.classList.add('dof-focus-secondary');
        }
      } else if (hasFocus && ALWAYS_VISIBLE_TYPES.has(entity.type)) {
        // ── Always-visible type: never blur, use secondary focus ──
        el.classList.remove('dof-bg', 'dof-focus');
        el.classList.add('dof-focus-secondary');
      } else if (hasFocus) {
        // ── Background entity: dim and blur ──
        el.classList.remove('dof-focus', 'dof-focus-secondary');
        el.classList.add('dof-bg');
      } else {
        // ── No focus: clear all DoF, show everything normally ──
        el.classList.remove('dof-focus', 'dof-bg', 'dof-focus-secondary');
      }
    }

    // Emit focus change for spatial narrator positioning
    if (this.onFocusChange) {
      if (hasFocus) {
        // Use the most recently added entity as primary for narrator positioning
        const allIds = Array.from(this._activeFocusIds);
        const primaryId = allIds[allIds.length - 1];
        const el = this._findEntity(primaryId);
        if (el) {
          const rect = el.getBoundingClientRect();
          this.onFocusChange({
            entityId: primaryId,
            entityIds: allIds,
            screenX: rect.left + rect.width / 2,
            screenY: rect.top,
          });
        }
      } else {
        this.onFocusChange(null);
      }
    }
  }

  /**
   * Clear the canvas — remove all entities and reset state.
   */
  clear(): void {
    this.currentScript = null;
    this._fullClear();
    this.onNarratorUpdate?.('');
  }

  /**
   * Full clear — reset everything (used on loadScript and clear).
   */
  private _fullClear(): void {
    if (this.viewBoxAnimId) {
      cancelAnimationFrame(this.viewBoxAnimId);
      this.viewBoxAnimId = 0;
    }
    // Clear focus coalescing state
    this._activeFocusIds.clear();
    this._activeFocusConfidences.clear();
    if (this._focusDecayTimer) {
      clearTimeout(this._focusDecayTimer);
      this._focusDecayTimer = null;
    }
    this._lastCueTime = 0;

    this.entityLayer.innerHTML = '';
    this.connectionLayer.innerHTML = '';
    this.renderedEntityIds.clear();
    this.liveEntityIds.clear();
    this.prevNonConnections = [];
    this.currentFrameIdx = 0;

    // Reset viewBox to full canvas
    const svg = this.entityLayer.ownerSVGElement;
    if (svg) {
      svg.setAttribute('viewBox', `0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`);
    }
  }
}
