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
import { renderEntity } from '@preplai/illustrations';
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

    // ── Update kept entities (position changes) ────────────────────
    const prevMap = new Map(this.prevNonConnections.map(e => [e.id, e]));
    for (const entity of kept) {
      const prev = prevMap.get(entity.id);
      if (prev) {
        this._updateEntityPosition(entity.id, prev.position, entity.position);
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
   * Dynamically shift focus to one or more entities during audio playback.
   * Used by AudioEngine focus cues to drive narration-synced highlight shifts.
   * Applies DoF classes and fires onFocusChange callback for spatial narrator.
   *
   * @param entityIds  Entity IDs to focus on (array, single string, or null to clear)
   * @param confidences  Per-entity confidence scores (0-1), same order as entityIds
   */
  shiftFocus(entityIds: string[] | string | null, confidences?: number[]): void {
    if (!this.currentScript) return;
    const frame = this.currentScript.frames[this.currentFrameIdx];
    if (!frame) return;

    // Normalize to array
    const focusIds: string[] | null = entityIds === null
      ? null
      : typeof entityIds === 'string'
        ? [entityIds]
        : entityIds;

    const focusSet = new Set(focusIds ?? []);
    const hasFocus = focusSet.size > 0;

    // Build confidence map for graduated focus
    const confidenceMap = new Map<string, number>();
    if (focusIds && confidences) {
      for (let i = 0; i < focusIds.length; i++) {
        confidenceMap.set(focusIds[i], confidences[i] ?? 1.0);
      }
    }

    const nonConnections = frame.entities.filter(e => !isConnectionType(e.type));

    for (const entity of nonConnections) {
      const el = this._findEntity(entity.id);
      if (!el) continue;

      if (hasFocus && focusSet.has(entity.id)) {
        const confidence = confidenceMap.get(entity.id) ?? 1.0;
        el.classList.remove('dof-bg', 'dof-focus', 'dof-focus-secondary');

        if (confidence >= 0.8) {
          el.classList.add('dof-focus');
        } else {
          el.classList.add('dof-focus-secondary');
        }
      } else if (hasFocus) {
        el.classList.remove('dof-focus', 'dof-focus-secondary');
        el.classList.add('dof-bg');
      } else {
        // No focus — clear all DoF
        el.classList.remove('dof-focus', 'dof-bg', 'dof-focus-secondary');
      }
    }

    // Emit focus change for spatial narrator positioning (use primary entity)
    if (this.onFocusChange) {
      if (hasFocus && focusIds && focusIds.length > 0) {
        const primaryId = focusIds[0];
        const el = this._findEntity(primaryId);
        if (el) {
          const rect = el.getBoundingClientRect();
          this.onFocusChange({
            entityId: primaryId,
            entityIds: focusIds,
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
