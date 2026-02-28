/**
 * @pre/player — SceneController
 *
 * Central coordinator for the player. Holds the current VisualScript,
 * manages frame state, dispatches render calls via @pre/illustrations,
 * and handles patchEntity / clear operations.
 *
 * Uses jsdom-compatible DOM APIs (createElementNS, getElementById, etc.).
 */
import type { VisualScript, VisualEntity, IllustrationFrame } from '@pre/shared';
import {
  ENTITY_COUNT_WARN_THRESHOLD,
  ENTITY_COUNT_ERROR_THRESHOLD,
} from '@pre/shared';
import { renderEntity } from '@pre/illustrations';
import { applyDefaults, assignEntranceDelays } from './apply-defaults.js';

// ── Types ────────────────────────────────────────────────────────────

export interface SceneControllerOptions {
  entityLayer: SVGGElement;
  connectionLayer: SVGGElement;
  /** Callback when narrator text changes */
  onNarratorUpdate?: (text: string) => void;
  /** Callback when a frame is rendered (for postMessage bridge) */
  onFrameChange?: (frameIndex: number) => void;
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

  constructor(options: SceneControllerOptions) {
    this.entityLayer = options.entityLayer;
    this.connectionLayer = options.connectionLayer;
    this.onNarratorUpdate = options.onNarratorUpdate;
    this.onFrameChange = options.onFrameChange;
  }

  /**
   * Load a new VisualScript. Clears the canvas and seeks to frame 0.
   */
  loadScript(script: VisualScript): void {
    this.currentScript = script;
    this.renderedEntityIds.clear();
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
   * Core render function. Clears layers, renders entities, then arrows.
   */
  private _renderFrame(frame: IllustrationFrame): void {
    const entities = frame.entities ?? [];
    const entityCount = entities.length;

    // Performance contract: warn/refuse at thresholds
    if (entityCount > ENTITY_COUNT_ERROR_THRESHOLD) {
      console.error(
        `[scene-controller] Frame has ${entityCount} entities. Exceeds hard limit of ${ENTITY_COUNT_ERROR_THRESHOLD}. Refusing to render.`,
      );
      this._clearLayers();
      this.renderedEntityIds.clear();
      return;
    }

    if (entityCount > ENTITY_COUNT_WARN_THRESHOLD) {
      console.warn(
        `[scene-controller] Frame has ${entityCount} entities (>${ENTITY_COUNT_WARN_THRESHOLD} limit). Performance may degrade.`,
      );
    }

    // Clear layers
    this._clearLayers();
    this.renderedEntityIds.clear();

    // Separate connections from non-connection entities
    const connections = entities.filter((e: VisualEntity) => isConnectionType(e.type));
    const nonConnections = entities.filter((e: VisualEntity) => !isConnectionType(e.type));

    // Assign stagger delays to non-connection entities
    const staggered = assignEntranceDelays(nonConnections);

    // Pass 1: Render non-connection entities (populates DOM positions)
    for (const entity of staggered) {
      // Skip child entities at top level — rendered by their parent
      if (entity.parentEntityId) continue;

      const defaulted = applyDefaults(entity);
      const el = renderEntity(defaulted, this.entityLayer);
      if (el) {
        this.renderedEntityIds.add(entity.id);
      }
    }

    // Pass 2: Render connections (arrows, data flows) — needs resolved positions
    for (const conn of connections) {
      const defaulted = applyDefaults(conn);
      const el = renderEntity(defaulted, this.connectionLayer, entities);
      if (el) {
        // Connection IDs are NOT tracked in renderedEntityIds
        // (they are in the connectionLayer, not entityLayer)
      }
    }

    // Update narrator text
    if (frame.narrationSegment) {
      this.onNarratorUpdate?.(
        typeof frame.narrationSegment === 'string'
          ? frame.narrationSegment
          : '',
      );
    }
  }

  /**
   * Live entity patch — update a single entity's visual properties.
   */
  patchEntity(entityId: string, patch: EntityPatch): void {
    const outerEl = document.getElementById(entityId);
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
      const cx = (patch.position.x / 100) * 1920;
      const cy = (patch.position.y / 100) * 1080;
      outerEl.setAttribute('transform', `translate(${cx}, ${cy})`);
    }
  }

  /**
   * Clear the canvas — remove all entities and reset state.
   */
  clear(): void {
    this._clearLayers();
    this.currentScript = null;
    this.currentFrameIdx = 0;
    this.renderedEntityIds.clear();
    this.onNarratorUpdate?.('');
  }

  /**
   * Clear DOM layers (entity + connection).
   */
  private _clearLayers(): void {
    this.entityLayer.innerHTML = '';
    this.connectionLayer.innerHTML = '';
  }
}
