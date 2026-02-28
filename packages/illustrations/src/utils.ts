/**
 * @pre/illustrations — SVG Utilities
 *
 * Core utilities for the programmatic SVG component library.
 * Implements the double-<g> pattern (Section 5 of architecture).
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@pre/shared';
import type { VisualEntity } from '@pre/shared';

// ── SVG namespace (required for createElementNS) ─────────────────────

export const SVG_NS = 'http://www.w3.org/2000/svg';

// ── buildEntityGroup ─────────────────────────────────────────────────

/**
 * Build the standard double-<g> structure for any positioned entity.
 *
 * Returns:
 *   outerG — carries translate(cx, cy). Never animated. Never receives CSS transforms.
 *   innerG — carries CSS animation class. All shape children go here.
 *
 * @param entity - VisualEntity descriptor
 * @returns outerG and innerG elements
 */
export function buildEntityGroup(entity: VisualEntity): { outerG: SVGGElement; innerG: SVGGElement } {
  // ── OUTER <g>: position only ──────────────────────────────────────
  const outerG = document.createElementNS(SVG_NS, 'g') as SVGGElement;

  // Identity attributes — used for GSAP targeting and scene controller queries
  outerG.setAttribute('id', entity.id);
  outerG.setAttribute('data-type', entity.type);

  // Convert percentage coordinates (0–100) → canvas pixels (1920×1080)
  const cx = (entity.position.x / 100) * CANVAS_WIDTH;
  const cy = (entity.position.y / 100) * CANVAS_HEIGHT;
  outerG.setAttribute('transform', `translate(${cx}, ${cy})`);

  // ── INNER <g>: animation target ───────────────────────────────────
  const innerG = document.createElementNS(SVG_NS, 'g') as SVGGElement;
  innerG.setAttribute('class', 'animate-element');

  // These three CSS properties are MANDATORY for compositor-path animation.
  // transformBox:    scopes transform-origin to the element's own bounding box
  // transformOrigin: scale/rotate from the element's visual center
  // willChange:      hints GPU to promote element to its own compositing layer
  innerG.style.transformBox = 'fill-box';
  innerG.style.transformOrigin = 'center center';
  innerG.style.willChange = 'transform, opacity';

  // Choreography: stagger entrance animation via CSS delay
  if (entity.animation?.delay != null) {
    innerG.style.animationDelay = `${entity.animation.delay}ms`;
  }

  outerG.appendChild(innerG);
  return { outerG, innerG };
}

// ── applyEntranceAnimation ───────────────────────────────────────────

/**
 * Apply CSS entrance animation class to the innerG element.
 *
 * The entrance class name comes from entity.animation.entrance.
 * If not specified, defaults to 'entrance-fadeInUp'.
 * If animation type is 'none', no class is applied.
 *
 * @param innerG - The inner <g> element (animation target)
 * @param entity - VisualEntity descriptor
 */
export function applyEntranceAnimation(innerG: SVGGElement, entity: VisualEntity): void {
  // No animation requested
  if (entity.animation?.entrance === 'none') return;

  const entranceClass = entity.animation?.entrance ?? 'entrance-fadeInUp';
  innerG.classList.add(entranceClass);
}

// ── getSizeParam ─────────────────────────────────────────────────────

/**
 * Convert agent size (number 0–10 scale factor or percentage width)
 * to a usable component base unit in pixels.
 *
 * @param entity - VisualEntity descriptor
 * @param defaultSize - Default size value if entity.size is undefined
 * @returns Base unit in pixels (typically 25-80px range)
 */
export function getSizeParam(entity: VisualEntity, defaultSize: number = 1.0): number {
  const s = entity.size ?? defaultSize;
  // size is a 0–10 scale factor. Convert to pixel base unit.
  // 1.0 = default ≈ 50px base, scale linearly
  return Math.min(Math.max(s * 50, 15), 120);
}
