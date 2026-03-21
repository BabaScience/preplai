/**
 * @preplai/illustrations — Equation Component (minimalist)
 *
 * Clean rect with centered equation text. No glow filter, no inner dashed rect.
 * Uses scaleGroup for size-responsive rendering.
 *
 * Metadata: { expression?: string, width?: number }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor,
  getLabelFontSize,
  TYPOGRAPHY,
  SHAPES,
  STROKE,
  LABEL_DEFAULTS,
  colorWithAlpha,
  OPACITY,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

const DESIGN_H = 44;
const MAX_CHARS = 28;

/** Superscript/subscript formatting. Shared with Expression. */
export function formatMathExpression(raw: string): string {
  return raw
    .replace(/\^2/g, '\u00B2')
    .replace(/\^3/g, '\u00B3')
    .replace(/\^1/g, '\u00B9')
    .replace(/\^n/g, '\u207F')
    .replace(/\^([0-9])/g, (_, d) => '\u2070\u00B9\u00B2\u00B3\u2074\u2075\u2076\u2077\u2078\u2079'[+d])
    .replace(/_0/g, '\u2080')
    .replace(/_1/g, '\u2081')
    .replace(/_2/g, '\u2082')
    .replace(/_3/g, '\u2083')
    .replace(/_([0-9])/g, (_, d) => '\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089'[+d]);
}

export function renderEquation(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Equation');

  const meta = entity.metadata ?? {};
  const raw = (meta.expression as string) ?? entity.label ?? 'E = mc\u00B2';
  const expression = formatMathExpression(raw);
  const displayText = expression.length > MAX_CHARS ? expression.slice(0, MAX_CHARS - 1) + '\u2026' : expression;

  const designW = typeof meta.width === 'number' ? meta.width : Math.max(80, Math.min(140, expression.length * 8));
  const w = designW;
  const h = DESIGN_H;
  const hw = w / 2;
  const hh = h / 2;

  const scaleGroup = document.createElementNS(SVG_NS, 'g');
  scaleGroup.setAttribute('transform', `scale(${scale})`);

  const fontSize = getLabelFontSize('metric', 1) / scale;

  // Single clean rect
  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x', String(-hw));
  rect.setAttribute('y', String(-hh));
  rect.setAttribute('width', String(w));
  rect.setAttribute('height', String(h));
  rect.setAttribute('rx', String(SHAPES.borderRadius));
  rect.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  rect.setAttribute('stroke', color);
  rect.setAttribute('stroke-width', String(STROKE.default));
  scaleGroup.appendChild(rect);

  // Equation text
  const text = document.createElementNS(SVG_NS, 'text');
  text.setAttribute('x', '0');
  text.setAttribute('y', '0');
  text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
  text.setAttribute('dominant-baseline', 'central');
  text.setAttribute('fill', color);
  text.setAttribute('font-size', String(fontSize));
  text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
  text.setAttribute('font-family', TYPOGRAPHY.fontCode);
  text.textContent = displayText;
  scaleGroup.appendChild(text);

  innerG.appendChild(scaleGroup);

  // Optional label below
  if (meta.expression && entity.label) {
    const subText = document.createElementNS(SVG_NS, 'text');
    subText.setAttribute('x', '0');
    subText.setAttribute('y', String(hh * scale + LABEL_DEFAULTS.offsetBelow));
    subText.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    subText.setAttribute('fill', color);
    subText.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    subText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    subText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    subText.textContent = entity.label;
    innerG.appendChild(subText);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
