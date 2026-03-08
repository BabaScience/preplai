/**
 * @preplai/illustrations — Equation Component
 *
 * Rounded rect with gradient fill, inner dashed accent, centered equation text.
 * Uses monospace font for math expressions. Size-responsive via scaleGroup.
 *
 * @see METADATA_SCHEMAS.md#equation
 *
 * Metadata:
 *   expression: string — equation text (or use entity.label)
 *   width: number — design width (default auto from expression length)
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs, ensureGlowFilter } from '../visual-utils.js';
import {
  getCategoryColor,
  getLabelFontSize,
  TYPOGRAPHY,
  SHAPES,
  STROKE,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

const DESIGN_H = 44;
const INNER_INSET = 8;
const MAX_CHARS = 28;

/** Superscript: ^2→², ^3→³, ^n→ⁿ, ^1→¹. Subscript: _0→₀, _1→₁, etc. Shared with Expression. */
export function formatMathExpression(raw: string): string {
  return raw
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/\^1/g, '¹')
    .replace(/\^n/g, 'ⁿ')
    .replace(/\^([0-9])/g, (_, d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d])
    .replace(/_0/g, '₀')
    .replace(/_1/g, '₁')
    .replace(/_2/g, '₂')
    .replace(/_3/g, '₃')
    .replace(/_([0-9])/g, (_, d) => '₀₁₂₃₄₅₆₇₈₉'[+d]);
}

export function renderEquation(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Equation');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-eq-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const raw = (meta.expression as string) ?? entity.label ?? 'E = mc²';
  const expression = formatMathExpression(raw);
  const displayText = expression.length > MAX_CHARS ? expression.slice(0, MAX_CHARS - 1) + '…' : expression;

  const designW = typeof meta.width === 'number' ? meta.width : Math.max(80, Math.min(140, expression.length * 8));
  const w = designW;
  const h = DESIGN_H;
  const hw = w / 2;
  const hh = h / 2;

  const scaleGroup = document.createElementNS(SVG_NS, 'g');
  scaleGroup.setAttribute('transform', `scale(${scale})`);

  const fontSize = getLabelFontSize('metric', 1) / scale;

  const outerRect = document.createElementNS(SVG_NS, 'rect');
  outerRect.setAttribute('x', String(-hw));
  outerRect.setAttribute('y', String(-hh));
  outerRect.setAttribute('width', String(w));
  outerRect.setAttribute('height', String(h));
  outerRect.setAttribute('rx', String(SHAPES.borderRadius));
  outerRect.setAttribute('fill', `url(#${gradId})`);
  outerRect.setAttribute('stroke', color);
  outerRect.setAttribute('stroke-width', String(STROKE.default));
  outerRect.setAttribute('filter', ensureGlowFilter(parentEl, color, 'pre-eq-glow'));
  scaleGroup.appendChild(outerRect);

  const innerRect = document.createElementNS(SVG_NS, 'rect');
  innerRect.setAttribute('x', String(-hw + INNER_INSET));
  innerRect.setAttribute('y', String(-hh + INNER_INSET));
  innerRect.setAttribute('width', String(w - 2 * INNER_INSET));
  innerRect.setAttribute('height', String(h - 2 * INNER_INSET));
  innerRect.setAttribute('rx', String(Math.max(0, SHAPES.borderRadius - 2)));
  innerRect.setAttribute('fill', 'none');
  innerRect.setAttribute('stroke', `${color}50`);
  innerRect.setAttribute('stroke-width', String(STROKE.thin));
  innerRect.setAttribute('stroke-dasharray', '4,4');
  scaleGroup.appendChild(innerRect);

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
