/**
 * @preplai/illustrations — SVG Utilities
 *
 * Core utilities for the programmatic SVG component library.
 * Implements the double-<g> pattern (Section 5 of architecture).
 */

import { CANVAS_WIDTH, CANVAS_HEIGHT, ENTITY_DEFAULTS } from '@preplai/shared';
import type { VisualEntity } from '@preplai/shared';

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

/** Base pixel unit at size=1. Uniform across all entity types. */
export const VISIBILITY_BASE = 50;
export const SIZE_CLAMP_MIN = 15;
export const SIZE_CLAMP_MAX = 150;

/**
 * Convert agent size (0–10 scale factor) to a usable component base unit in pixels.
 * Uniform across all entity types: size 1 = same visibility for everyone.
 *
 * @param entity - VisualEntity descriptor
 * @returns Base unit in pixels (typically 25–80px range)
 */
export function getSizeParam(entity: VisualEntity): number {
  const s = entity.size ?? ENTITY_DEFAULTS.size;
  return Math.min(Math.max(s * VISIBILITY_BASE, SIZE_CLAMP_MIN), SIZE_CLAMP_MAX);
}

// ── wrapBodyText ─────────────────────────────────────────────────────

/** Conservative char width ratio for wrapping (wider chars → wrap sooner). */
export const CHAR_WIDTH_RATIO = 0.65;

/**
 * Wrap body text into lines. Honours explicit newlines and word-wraps at edge.
 * Use for Callout, Definition, Goal body/definition text.
 *
 * @param text - Raw body text (may contain \n)
 * @param maxCharsPerLine - Max chars per line (from availableWidth / (fontSize * CHAR_WIDTH_RATIO))
 * @param maxLines - Max lines before truncation
 * @returns { lines, truncated }
 */
export function wrapBodyText(
  text: string,
  maxCharsPerLine: number,
  maxLines: number,
): { lines: string[]; truncated: boolean } {
  if (!text || maxCharsPerLine < 1 || maxLines < 1) {
    return { lines: [], truncated: false };
  }
  const effectiveMax = Math.max(8, maxCharsPerLine);
  const lines: string[] = [];
  let truncated = false;

  function wordWrap(paragraph: string): void {
    if (lines.length >= maxLines) return;
    const words = paragraph.trim().split(/\s+/);
    let current = '';
    for (const w of words) {
      const next = current ? `${current} ${w}` : w;
      if (next.length <= effectiveMax) {
        current = next;
      } else {
        if (current) {
          lines.push(current);
          if (lines.length >= maxLines) {
            truncated = true;
            return;
          }
          current = '';
        }
        if (w.length <= effectiveMax) {
          current = w;
        } else {
          const chunks = w.match(new RegExp(`.{1,${effectiveMax}}`, 'g')) ?? [w];
          for (let i = 0; i < chunks.length; i++) {
            if (i < chunks.length - 1) {
              lines.push(chunks[i]);
              if (lines.length >= maxLines) {
                truncated = true;
                return;
              }
            } else {
              current = chunks[i];
            }
          }
        }
      }
    }
    if (current && lines.length < maxLines) lines.push(current);
  }

  const paragraphs = text.split(/\r?\n/);
  for (const p of paragraphs) {
    if (lines.length >= maxLines) {
      truncated = true;
      break;
    }
    if (!p.trim()) {
      lines.push('');
      continue;
    }
    wordWrap(p);
  }

  if (truncated && lines.length > 0) {
    const last = lines[lines.length - 1];
    const suffix = '…';
    if (last.length + suffix.length > effectiveMax) {
      lines[lines.length - 1] = last.slice(0, effectiveMax - suffix.length) + suffix;
    } else {
      lines[lines.length - 1] = last + suffix;
    }
  }

  return { lines, truncated };
}
