/**
 * @preplai/illustrations — Visual Utilities
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
  stop1.setAttribute('stop-color', colorWithAlpha(color, OPACITY.fillHeavy));
  gradient.appendChild(stop1);

  const stop2 = document.createElementNS(SVG_NS, 'stop');
  stop2.setAttribute('offset', '100%');
  stop2.setAttribute('stop-color', colorWithAlpha(color, OPACITY.fillMedium));
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
  stop1.setAttribute('stop-color', colorWithAlpha(color, OPACITY.fillHeavy));
  gradient.appendChild(stop1);

  const stop2 = document.createElementNS(SVG_NS, 'stop');
  stop2.setAttribute('offset', '100%');
  stop2.setAttribute('stop-color', colorWithAlpha(color, OPACITY.fillMedium));
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

// ── Glass materiality filter (visionOS-style depth) ────────────────────────

const GLASS_FILTER_ID = 'pre-glass';

/**
 * Glass materiality filter: subtle inner shadow + top highlight.
 * Gives infrastructure entities (Server, Database, CPU, etc.) a sense of
 * physical depth — like visionOS icons. Subtle, not skeuomorphic.
 *
 * Apply to body shapes: `element.setAttribute('filter', ensureGlassFilter(parentEl))`
 */
export function ensureGlassFilter(parentEl: SVGElement): string {
  const defs = ensureDefs(parentEl);
  if (defs.querySelector(`#${GLASS_FILTER_ID}`)) {
    return `url(#${GLASS_FILTER_ID})`;
  }

  const filter = document.createElementNS(SVG_NS, 'filter');
  filter.setAttribute('id', GLASS_FILTER_ID);
  filter.setAttribute('x', '-5%');
  filter.setAttribute('y', '-5%');
  filter.setAttribute('width', '110%');
  filter.setAttribute('height', '120%');

  // ── Inner shadow (bottom-weighted) ────────────────────────
  // Invert alpha → blur → offset down → colorize black → clip to shape
  const invertAlpha = document.createElementNS(SVG_NS, 'feComponentTransfer');
  invertAlpha.setAttribute('in', 'SourceAlpha');
  invertAlpha.setAttribute('result', 'invAlpha');
  const funcA = document.createElementNS(SVG_NS, 'feFuncA');
  funcA.setAttribute('type', 'table');
  funcA.setAttribute('tableValues', '1 0');
  invertAlpha.appendChild(funcA);
  filter.appendChild(invertAlpha);

  const blurShadow = document.createElementNS(SVG_NS, 'feGaussianBlur');
  blurShadow.setAttribute('in', 'invAlpha');
  blurShadow.setAttribute('stdDeviation', '2.5');
  blurShadow.setAttribute('result', 'blurInv');
  filter.appendChild(blurShadow);

  const offsetShadow = document.createElementNS(SVG_NS, 'feOffset');
  offsetShadow.setAttribute('in', 'blurInv');
  offsetShadow.setAttribute('dx', '0');
  offsetShadow.setAttribute('dy', '1.5');
  offsetShadow.setAttribute('result', 'offsetInv');
  filter.appendChild(offsetShadow);

  const floodShadow = document.createElementNS(SVG_NS, 'feFlood');
  floodShadow.setAttribute('flood-color', '#000000');
  floodShadow.setAttribute('flood-opacity', '0.2');
  floodShadow.setAttribute('result', 'shadowFlood');
  filter.appendChild(floodShadow);

  const compShadow = document.createElementNS(SVG_NS, 'feComposite');
  compShadow.setAttribute('in', 'shadowFlood');
  compShadow.setAttribute('in2', 'offsetInv');
  compShadow.setAttribute('operator', 'in');
  compShadow.setAttribute('result', 'shadowCut');
  filter.appendChild(compShadow);

  const clipShadow = document.createElementNS(SVG_NS, 'feComposite');
  clipShadow.setAttribute('in', 'shadowCut');
  clipShadow.setAttribute('in2', 'SourceAlpha');
  clipShadow.setAttribute('operator', 'in');
  clipShadow.setAttribute('result', 'innerShadow');
  filter.appendChild(clipShadow);

  // ── Top highlight (subtle white edge) ─────────────────────
  const blurHL = document.createElementNS(SVG_NS, 'feGaussianBlur');
  blurHL.setAttribute('in', 'invAlpha');
  blurHL.setAttribute('stdDeviation', '1.5');
  blurHL.setAttribute('result', 'hlBlur');
  filter.appendChild(blurHL);

  const offsetHL = document.createElementNS(SVG_NS, 'feOffset');
  offsetHL.setAttribute('in', 'hlBlur');
  offsetHL.setAttribute('dx', '0');
  offsetHL.setAttribute('dy', '-1');
  offsetHL.setAttribute('result', 'hlOff');
  filter.appendChild(offsetHL);

  const floodHL = document.createElementNS(SVG_NS, 'feFlood');
  floodHL.setAttribute('flood-color', '#ffffff');
  floodHL.setAttribute('flood-opacity', '0.07');
  floodHL.setAttribute('result', 'hlFlood');
  filter.appendChild(floodHL);

  const compHL = document.createElementNS(SVG_NS, 'feComposite');
  compHL.setAttribute('in', 'hlFlood');
  compHL.setAttribute('in2', 'hlOff');
  compHL.setAttribute('operator', 'in');
  compHL.setAttribute('result', 'hlCut');
  filter.appendChild(compHL);

  const clipHL = document.createElementNS(SVG_NS, 'feComposite');
  clipHL.setAttribute('in', 'hlCut');
  clipHL.setAttribute('in2', 'SourceAlpha');
  clipHL.setAttribute('operator', 'in');
  clipHL.setAttribute('result', 'innerHL');
  filter.appendChild(clipHL);

  // ── Merge: source graphic + inner shadow + highlight ──────
  const merge = document.createElementNS(SVG_NS, 'feMerge');
  for (const input of ['SourceGraphic', 'innerShadow', 'innerHL']) {
    const node = document.createElementNS(SVG_NS, 'feMergeNode');
    node.setAttribute('in', input);
    merge.appendChild(node);
  }
  filter.appendChild(merge);

  defs.appendChild(filter);
  return `url(#${GLASS_FILTER_ID})`;
}

// ── Glow filter (colored soft glow) ────────────────────────────────────────

/**
 * Create a soft colored glow filter. Use for concept bubbles, highlighted elements.
 * Returns the filter URL; caller applies via element.setAttribute('filter', url).
 */
export function ensureGlowFilter(
  parentEl: SVGElement,
  color: string,
  filterId: string = 'pre-concept-glow',
): string {
  const defs = ensureDefs(parentEl);
  const id = `${filterId}-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  if (defs.querySelector(`#${id}`)) {
    return `url(#${id})`;
  }

  const filter = document.createElementNS(SVG_NS, 'filter');
  filter.setAttribute('id', id);
  filter.setAttribute('x', '-30%');
  filter.setAttribute('y', '-30%');
  filter.setAttribute('width', '160%');
  filter.setAttribute('height', '160%');

  const feDropShadow = document.createElementNS(SVG_NS, 'feDropShadow');
  feDropShadow.setAttribute('dx', '0');
  feDropShadow.setAttribute('dy', '0');
  feDropShadow.setAttribute('stdDeviation', '6');
  feDropShadow.setAttribute('flood-color', color);
  feDropShadow.setAttribute('flood-opacity', '0.5');
  filter.appendChild(feDropShadow);
  defs.appendChild(filter);

  return `url(#${id})`;
}
