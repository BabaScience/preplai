/**
 * @preplai/illustrations — Container Component
 * Container box: dashed border + inner process blocks (2–3 small rects)
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderContainer(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Container');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-container-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const w = s * 1.4;
  const h = s;

  // ── Dashed border rect
  const border = document.createElementNS(SVG_NS, 'rect');
  border.setAttribute('x', String(-w / 2));
  border.setAttribute('y', String(-h / 2));
  border.setAttribute('width', String(w));
  border.setAttribute('height', String(h));
  border.setAttribute('rx', String(SHAPES.borderRadius));
  border.setAttribute('fill', `url(#${gradId})`);
  border.setAttribute('stroke', color);
  border.setAttribute('stroke-width', String(SHAPES.strokeWidth));
  border.setAttribute('stroke-dasharray', '6,4');
  innerG.appendChild(border);

  // ── Inner process blocks (2 small rects)
  const blockW = w * 0.25;
  const blockH = h * 0.2;
  const blockGap = w * 0.08;
  [-1, 1].forEach((sign) => {
    const bx = sign * (blockW / 2 + blockGap / 2);
    const block = document.createElementNS(SVG_NS, 'rect');
    block.setAttribute('x', String(bx - blockW / 2));
    block.setAttribute('y', String(-blockH / 2));
    block.setAttribute('width', String(blockW));
    block.setAttribute('height', String(blockH));
    block.setAttribute('rx', '2');
    block.setAttribute('fill', `${color}40`);
    block.setAttribute('stroke', color);
    block.setAttribute('stroke-width', '1');
    block.setAttribute('opacity', '0.8');
    innerG.appendChild(block);
  });

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(h / 2 + 18));
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
