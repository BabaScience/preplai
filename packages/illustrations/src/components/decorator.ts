/**
 * @preplai/illustrations — Decorator Component
 * Box-in-box: outer "wrapper" rect, inner "function" rect, arrows in/out
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderDecorator(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Decorator');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-decorator-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const outerW = s * 1.6;
  const outerH = s * 1.2;
  const innerW = s * 1.0;
  const innerH = s * 0.6;

  // ── Outer wrapper rect (dashed)
  const outerRect = document.createElementNS(SVG_NS, 'rect');
  outerRect.setAttribute('x', String(-outerW / 2));
  outerRect.setAttribute('y', String(-outerH / 2));
  outerRect.setAttribute('width', String(outerW));
  outerRect.setAttribute('height', String(outerH));
  outerRect.setAttribute('rx', String(SHAPES.borderRadius));
  outerRect.setAttribute('fill', `${color}10`);
  outerRect.setAttribute('stroke', color);
  outerRect.setAttribute('stroke-width', String(SHAPES.strokeWidth));
  outerRect.setAttribute('stroke-dasharray', '6,4');
  innerG.appendChild(outerRect);

  // ── Inner function rect
  const innerRect = document.createElementNS(SVG_NS, 'rect');
  innerRect.setAttribute('x', String(-innerW / 2));
  innerRect.setAttribute('y', String(-innerH / 2));
  innerRect.setAttribute('width', String(innerW));
  innerRect.setAttribute('height', String(innerH));
  innerRect.setAttribute('rx', String(SHAPES.borderRadius - 2));
  innerRect.setAttribute('fill', `url(#${gradId})`);
  innerRect.setAttribute('stroke', color);
  innerRect.setAttribute('stroke-width', String(SHAPES.strokeWidthThin));
  innerG.appendChild(innerRect);

  // ── In arrow (left, into wrapper)
  const inLine = document.createElementNS(SVG_NS, 'line');
  inLine.setAttribute('x1', String(-outerW / 2 - 8));
  inLine.setAttribute('y1', '0');
  inLine.setAttribute('x2', String(-outerW / 2 + 4));
  inLine.setAttribute('y2', '0');
  inLine.setAttribute('stroke', color);
  inLine.setAttribute('stroke-width', String(SHAPES.strokeWidthThin));
  inLine.setAttribute('opacity', '0.7');
  innerG.appendChild(inLine);

  // ── Out arrow (right, from wrapper)
  const outLine = document.createElementNS(SVG_NS, 'line');
  outLine.setAttribute('x1', String(outerW / 2 - 4));
  outLine.setAttribute('y1', '0');
  outLine.setAttribute('x2', String(outerW / 2 + 8));
  outLine.setAttribute('y2', '0');
  outLine.setAttribute('stroke', color);
  outLine.setAttribute('stroke-width', String(SHAPES.strokeWidthThin));
  outLine.setAttribute('opacity', '0.7');
  innerG.appendChild(outLine);

  // ── Inner label (fn)
  const fnText = document.createElementNS(SVG_NS, 'text');
  fnText.setAttribute('x', '0');
  fnText.setAttribute('y', '4');
  fnText.setAttribute('text-anchor', 'middle');
  fnText.setAttribute('fill', color);
  fnText.setAttribute('font-size', '11');
  fnText.setAttribute('font-weight', '600');
  fnText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  fnText.textContent = 'fn';
  innerG.appendChild(fnText);

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(outerH / 2 + 18));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
