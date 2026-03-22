/**
 * @preplai/illustrations — Color Cascade System
 *
 * Single-function color application for entity components.
 * Replaces scattered colorWithAlpha() calls across 152 components
 * with a unified, theme-aware color resolution system.
 *
 * Usage:
 *   const cc = resolveColorCascade(entity);
 *   rect.setAttribute('fill', cc.fill);
 *   rect.setAttribute('stroke', cc.stroke);
 *   text.setAttribute('fill', cc.textPrimary);
 *
 * The cascade resolves fill, stroke, text, glow, and secondary
 * colors from a single entity color — correctly for both themes.
 */

import { colorWithAlpha, OPACITY, generateColorRamp } from './design-tokens.js';
import type { VisualEntity } from '@preplai/shared';
import { getCategoryColor } from './design-tokens.js';

// ── Color Cascade Interface ──────────────────────────────────────────

export interface ColorCascade {
  /** Base color (full hex, e.g. '#00e676') */
  base: string;

  /** Shape fill — light transparent (15% opacity) */
  fill: string;
  /** Shape fill — medium emphasis (25% opacity) */
  fillMedium: string;
  /** Shape fill — heavy emphasis (40% opacity) */
  fillHeavy: string;

  /** Shape stroke — default (full color) */
  stroke: string;
  /** Stroke — soft/secondary (60% opacity) */
  strokeSoft: string;
  /** Stroke — muted/glow (40% opacity) */
  strokeMuted: string;

  /** Text — primary labels (full color) */
  textPrimary: string;
  /** Text — secondary/subtitle (60% opacity) */
  textSecondary: string;
  /** Text — tertiary/caption (40% opacity) */
  textTertiary: string;

  /** Highlight glow stroke (40% opacity, for dashed highlight rings) */
  glow: string;
  /** Badge/overlay background (25% opacity) */
  badgeBg: string;
}

// ── Resolve Color Cascade ────────────────────────────────────────────

/**
 * Resolve a full color cascade from an entity.
 * Uses entity.color if set, otherwise falls back to getCategoryColor(type).
 *
 * @param entity - VisualEntity (or just { color?, type })
 * @returns ColorCascade with all derived color values
 */
export function resolveColorCascade(entity: Pick<VisualEntity, 'color' | 'type'>): ColorCascade {
  const base = entity.color ?? getCategoryColor(entity.type);
  const ramp = generateColorRamp(base);

  // Map 7-stop perceptual ramp to cascade roles
  return {
    base,

    fill: ramp[50],                                    // lightest fill
    fillMedium: ramp[100],                             // medium fill
    fillHeavy: ramp[300],                              // heavy fill

    stroke: ramp[500],                                 // base stroke
    strokeSoft: ramp[600],                             // emphasis stroke
    strokeMuted: colorWithAlpha(ramp[500], OPACITY.strokeMuted), // glow (still needs alpha for transparency)

    textPrimary: ramp[800],                            // readable labels
    textSecondary: ramp[600],                          // secondary text
    textTertiary: colorWithAlpha(ramp[600], OPACITY.strokeMuted), // captions

    glow: colorWithAlpha(ramp[500], OPACITY.strokeMuted), // transparent glow
    badgeBg: ramp[100],                                // badge background
  };
}

/**
 * Resolve color cascade from a raw color string (not entity).
 * Useful when you have the color but not the entity.
 */
export function resolveColorCascadeFromHex(hex: string): ColorCascade {
  return resolveColorCascade({ color: hex, type: 'Entity' });
}

// ── Apply helpers (optional convenience) ────────────────────────────

/**
 * Apply standard fill + stroke to a shape element using the cascade.
 */
export function applyShapeColors(el: SVGElement, cc: ColorCascade): void {
  el.setAttribute('fill', cc.fill);
  el.setAttribute('stroke', cc.stroke);
}

/**
 * Apply label text colors using the cascade.
 * @param role - 'primary' | 'secondary' | 'tertiary'
 */
export function applyTextColor(el: SVGElement, cc: ColorCascade, role: 'primary' | 'secondary' | 'tertiary' = 'primary'): void {
  const color = role === 'primary' ? cc.textPrimary
    : role === 'secondary' ? cc.textSecondary
    : cc.textTertiary;
  el.setAttribute('fill', color);
}

/**
 * Apply highlight glow ring styling using the cascade.
 */
export function applyGlowColors(el: SVGElement, cc: ColorCascade): void {
  el.setAttribute('fill', 'none');
  el.setAttribute('stroke', cc.glow);
}
