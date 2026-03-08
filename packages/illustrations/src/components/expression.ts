/**
 * @preplai/illustrations — Expression Component
 *
 * Inline math expression: compact box with centered text. Lighter than Equation.
 * Use for: inline formulas, f(x) = x², short expressions in flow.
 *
 * @see METADATA_SCHEMAS.md#expression
 *
 * Metadata:
 *   expression: string — expression text (or use entity.label)
 *   width: number — design width (default auto)
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { ensureDefs } from '../visual-utils.js';
import { formatMathExpression } from './equation.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  TYPOGRAPHY,
  SHAPES,
  LABEL_DEFAULTS,
  colorWithAlpha,
  OPACITY,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

const DESIGN_H = 32;
const MAX_CHARS = 20;

export function renderExpression(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Expression');
  ensureDefs(parentEl);

  const meta = entity.metadata ?? {};
  const raw = (meta.expression as string) ?? entity.label ?? 'f(x) = x^2';
  const expression = formatMathExpression(raw);
  const displayText = expression.length > MAX_CHARS ? expression.slice(0, MAX_CHARS - 1) + '…' : expression;

  const designW = typeof meta.width === 'number' ? meta.width : Math.max(60, Math.min(110, expression.length * 7));
  const w = designW;
  const h = DESIGN_H;
  const hw = w / 2;
  const hh = h / 2;

  const scaleGroup = document.createElementNS(SVG_NS, 'g');
  scaleGroup.setAttribute('transform', `scale(${scale})`);

  const strokeWidth = getStrokeWidth('thin', 1);

  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x', String(-hw));
  rect.setAttribute('y', String(-hh));
  rect.setAttribute('width', String(w));
  rect.setAttribute('height', String(h));
  rect.setAttribute('rx', String(SHAPES.borderRadius));
  rect.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  rect.setAttribute('stroke', color);
  rect.setAttribute('stroke-width', String(strokeWidth));
  rect.setAttribute('stroke-dasharray', '4,4');
  scaleGroup.appendChild(rect);

  const fontSize = getLabelFontSize('value', 1) / scale;

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
