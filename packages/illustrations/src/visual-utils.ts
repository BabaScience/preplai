/**
 * @pre/illustrations — Visual Utilities
 *
 * Helpers for gradients, shadows, and visual polish.
 */

import { SVG_NS } from './utils.js';
import { colorWithAlpha, OPACITY } from './design-tokens.js';

// ── Gradient helpers ─────────────────────────────────────────────────

export type GradientDirection = 'vertical' | 'horizontal' | 'radial';

/**
 * Create a linear gradient for fills (top lighter, bottom darker).
 * Returns the gradient element; caller must append to defs and use url(#id) as fill.
 */
export function createLinearGradient(
  id: string,
  color: string,
  direction: 'vertical' | 'horizontal' = 'vertical',
  parentDefs: SVGDefsElement,
): SVGLinearGradientElement {
  let existing = parentDefs.querySelector(`#${id}`) as SVGLinearGradientElement | null;
  if (existing) return existing;

  const gradient = document.createElementNS(SVG_NS, 'linearGradient');
  gradient.setAttribute('id', id);
  if (direction === 'vertical') {
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '0%');
    gradient.setAttribute('y2', '100%');
  } else {
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '0%');
  }

  const stop1 = document.createElementNS(SVG_NS, 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', colorWithAlpha(color, '25'));
  gradient.appendChild(stop1);

  const stop2 = document.createElementNS(SVG_NS, 'stop');
  stop2.setAttribute('offset', '100%');
  stop2.setAttribute('stop-color', colorWithAlpha(color, OPACITY.fillLight));
  gradient.appendChild(stop2);

  parentDefs.appendChild(gradient);
  return gradient;
}

/**
 * Create a radial gradient (center lighter, edge darker).
 */
export function createRadialGradient(
  id: string,
  color: string,
  parentDefs: SVGDefsElement,
): SVGRadialGradientElement {
  let existing = parentDefs.querySelector(`#${id}`) as SVGRadialGradientElement | null;
  if (existing) return existing;

  const gradient = document.createElementNS(SVG_NS, 'radialGradient');
  gradient.setAttribute('id', id);
  gradient.setAttribute('cx', '50%');
  gradient.setAttribute('cy', '50%');
  gradient.setAttribute('r', '50%');

  const stop1 = document.createElementNS(SVG_NS, 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', colorWithAlpha(color, '30'));
  gradient.appendChild(stop1);

  const stop2 = document.createElementNS(SVG_NS, 'stop');
  stop2.setAttribute('offset', '100%');
  stop2.setAttribute('stop-color', colorWithAlpha(color, OPACITY.fillLight));
  gradient.appendChild(stop2);

  parentDefs.appendChild(gradient);
  return gradient;
}

/**
 * Create a dark background gradient (for charts, code blocks).
 * Goes from slightly lighter to darker.
 */
export function createDarkGradient(
  id: string,
  parentDefs: SVGDefsElement,
  colorTint?: string,
): SVGLinearGradientElement {
  let existing = parentDefs.querySelector(`#${id}`) as SVGLinearGradientElement | null;
  if (existing) return existing;

  const gradient = document.createElementNS(SVG_NS, 'linearGradient');
  gradient.setAttribute('id', id);
  gradient.setAttribute('x1', '0%');
  gradient.setAttribute('y1', '0%');
  gradient.setAttribute('x2', '0%');
  gradient.setAttribute('y2', '100%');

  const stop1 = document.createElementNS(SVG_NS, 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', colorTint ? `${colorTint}18` : '#0f1018');
  gradient.appendChild(stop1);

  const stop2 = document.createElementNS(SVG_NS, 'stop');
  stop2.setAttribute('offset', '100%');
  stop2.setAttribute('stop-color', colorTint ? `${colorTint}08` : '#08090e');
  gradient.appendChild(stop2);

  parentDefs.appendChild(gradient);
  return gradient;
}

// ── Defs helpers ─────────────────────────────────────────────────────

/**
 * Get or create a defs element in the SVG tree.
 * Searches up from parentEl to find the root SVG, then finds or creates defs.
 */
export function ensureDefs(parentEl: SVGElement): SVGDefsElement {
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  let defs = svg.querySelector('defs') as SVGDefsElement | null;
  if (!defs) {
    defs = document.createElementNS(SVG_NS, 'defs');
    svg.insertBefore(defs, svg.firstChild);
  }
  return defs;
}

// ── Drop shadow filter ────────────────────────────────────────────────

const DROP_SHADOW_FILTER_ID = 'pre-drop-shadow';

/**
 * Create a subtle drop shadow filter in defs.
 * Apply via element.setAttribute('filter', 'url(#pre-drop-shadow)').
 */
export function ensureDropShadowFilter(parentEl: SVGElement): string {
  const defs = ensureDefs(parentEl);
  if (defs.querySelector(`#${DROP_SHADOW_FILTER_ID}`)) {
    return `url(#${DROP_SHADOW_FILTER_ID})`;
  }

  const filter = document.createElementNS(SVG_NS, 'filter');
  filter.setAttribute('id', DROP_SHADOW_FILTER_ID);
  filter.setAttribute('x', '-20%');
  filter.setAttribute('y', '-20%');
  filter.setAttribute('width', '140%');
  filter.setAttribute('height', '140%');

  const feDropShadow = document.createElementNS(SVG_NS, 'feDropShadow');
  feDropShadow.setAttribute('dx', '0');
  feDropShadow.setAttribute('dy', '2');
  feDropShadow.setAttribute('stdDeviation', '2');
  feDropShadow.setAttribute('flood-color', '#000000');
  feDropShadow.setAttribute('flood-opacity', '0.25');
  filter.appendChild(feDropShadow);
  defs.appendChild(filter);

  return `url(#${DROP_SHADOW_FILTER_ID})`;
}
