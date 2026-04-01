/**
 * @preplai/illustrations — Lottie Animation Overlay
 *
 * Embeds Lottie animations into entity SVG via <foreignObject>.
 * Lottie-web renders into a <div> inside the foreignObject.
 *
 * Usage: entities can specify metadata.lottieAnimation to get animated
 * micro-assets (spinning gears, flowing data, pulsing heartbeats, etc.)
 *
 * Requires lottie-web loaded globally (window.lottie or window.bodymovin).
 * Degrades gracefully — if lottie-web not available, no overlay is added.
 */

import { SVG_NS, getSizeParam } from './utils.js';
import type { VisualEntity } from '@preplai/shared';

// ── Types ───────────────────────────────────────────────────────────

export interface LottieAnimationConfig {
  /** URL to hosted .json Lottie file, or built-in animation name */
  src: string;
  /** Whether to loop the animation (default: true) */
  loop?: boolean;
  /** Playback speed multiplier (default: 1.0) */
  speed?: number;
  /** When to play: 'idle' = continuous, 'entrance' = once on enter, 'focus' = on narration focus */
  trigger?: 'idle' | 'entrance' | 'focus';
}

// Track active Lottie instances for cleanup
const activeLottieInstances = new Map<string, any>();

// ── Built-in animation catalog ──────────────────────────────────────

/**
 * Built-in Lottie animation URLs.
 * These are curated, small (<50KB) animations from public CDNs.
 * Agents reference them by name: metadata.lottieAnimation.src = "gear-spin"
 */
const BUILTIN_ANIMATIONS: Record<string, string> = {
  // Built-in catalog removed — lottie.host URLs returned 403 Forbidden.
  // Agents can still use custom Lottie URLs via metadata.lottieAnimation.src.
};

// ── Core functions ──────────────────────────────────────────────────

/**
 * Check if Lottie library is available globally.
 */
function getLottieLib(): any | null {
  const w = typeof window !== 'undefined' ? window as any : null;
  return w?.lottie ?? w?.bodymovin ?? null;
}

/**
 * Resolve animation source — built-in name or URL.
 */
function resolveAnimationSrc(src: string): string {
  return BUILTIN_ANIMATIONS[src] ?? src;
}

/**
 * Apply a Lottie animation overlay to an entity.
 * Creates a <foreignObject> inside innerG with a <div> for lottie-web to render into.
 *
 * @param innerG - The entity's inner <g> element
 * @param entity - The VisualEntity descriptor
 * @returns The Lottie animation instance, or null if unavailable
 */
export function applyLottieOverlay(innerG: SVGGElement, entity: VisualEntity): any | null {
  const config = entity.metadata?.lottieAnimation as LottieAnimationConfig | undefined;
  if (!config?.src) return null;

  const lottieLib = getLottieLib();
  if (!lottieLib) return null;

  const s = getSizeParam(entity);
  const size = s * 1.2; // Slightly larger than entity base

  // Create foreignObject to host the Lottie div
  const fo = document.createElementNS(SVG_NS, 'foreignObject');
  fo.setAttribute('x', String(-size / 2));
  fo.setAttribute('y', String(-size / 2));
  fo.setAttribute('width', String(size));
  fo.setAttribute('height', String(size));
  fo.setAttribute('class', 'lottie-overlay');
  fo.style.pointerEvents = 'none';
  fo.style.overflow = 'visible';

  // Create container div for lottie-web
  const container = document.createElement('div');
  container.style.width = '100%';
  container.style.height = '100%';
  container.style.display = 'flex';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';
  container.style.opacity = '0.6'; // Semi-transparent overlay
  container.style.mixBlendMode = 'screen'; // Blend with entity

  fo.appendChild(container);
  innerG.appendChild(fo);

  // Initialize Lottie animation
  const animSrc = resolveAnimationSrc(config.src);
  const loop = config.loop !== false; // default true
  const trigger = config.trigger ?? 'idle';

  try {
    const anim = lottieLib.loadAnimation({
      container: container,
      renderer: 'svg',
      loop: loop,
      autoplay: trigger === 'idle' || trigger === 'entrance',
      path: animSrc,
    });

    // Set playback speed
    if (config.speed && config.speed !== 1.0) {
      anim.setSpeed(config.speed);
    }

    // For 'entrance' trigger, stop after first play
    if (trigger === 'entrance') {
      anim.addEventListener('loopComplete', () => {
        anim.stop();
      });
    }

    // For 'focus' trigger, start paused
    if (trigger === 'focus') {
      anim.addEventListener('DOMLoaded', () => {
        anim.pause();
      });
    }

    // Track instance for cleanup and focus control
    activeLottieInstances.set(entity.id, { anim, container, trigger });

    return anim;
  } catch (err) {
    console.warn(`[lottie-overlay] Failed to load animation for entity "${entity.id}":`, err);
    fo.remove();
    return null;
  }
}

/**
 * Destroy a Lottie instance for an entity.
 * Called when the entity exits the scene.
 */
export function destroyLottieOverlay(entityId: string): void {
  const instance = activeLottieInstances.get(entityId);
  if (instance) {
    try {
      instance.anim.destroy();
    } catch {
      // Already destroyed or errored
    }
    activeLottieInstances.delete(entityId);
  }
}

/**
 * Notify Lottie overlays of focus change.
 * Plays 'focus'-triggered animations when entity gains focus,
 * pauses when it loses focus.
 */
export function notifyLottieFocus(entityId: string, isFocused: boolean): void {
  const instance = activeLottieInstances.get(entityId);
  if (!instance || instance.trigger !== 'focus') return;

  if (isFocused) {
    instance.anim.play();
  } else {
    instance.anim.pause();
  }
}

/**
 * Speed up/slow down a Lottie animation (for depth-of-field effects).
 */
export function setLottieSpeed(entityId: string, speed: number): void {
  const instance = activeLottieInstances.get(entityId);
  if (!instance) return;
  instance.anim.setSpeed(speed);
}

/**
 * Get all active Lottie entity IDs (for bulk cleanup).
 */
export function getActiveLottieIds(): string[] {
  return Array.from(activeLottieInstances.keys());
}

/**
 * Destroy all active Lottie instances.
 */
export function destroyAllLottie(): void {
  for (const id of activeLottieInstances.keys()) {
    destroyLottieOverlay(id);
  }
}
