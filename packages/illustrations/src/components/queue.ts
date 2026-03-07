/**
 * @preplai/illustrations — Queue Component
 * Horizontal FIFO: items entering left, exiting right; arrow flow
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderQueue(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const _s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Queue');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-queue-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'horizontal', defs);

  const meta = entity.metadata ?? {};
  const values = (meta.values as (string | number)[]) ?? [1, 2, 3];
  const visibleValues = values.slice(0, 4);

  const cellW = 28;
  const cellH = 24;
  const gap = 12;
  const totalW = visibleValues.length * (cellW + gap) - gap + 40;
  const startX = -totalW / 2 + 20 + cellW / 2;

  // ── In arrow (left) — arrowhead via polygon
  const inArrow = document.createElementNS(SVG_NS, 'line');
  inArrow.setAttribute('x1', String(-totalW / 2));
  inArrow.setAttribute('y1', '0');
  inArrow.setAttribute('x2', String(-totalW / 2 + 15));
  inArrow.setAttribute('y2', '0');
  inArrow.setAttribute('stroke', color);
  inArrow.setAttribute('stroke-width', String(SHAPES.strokeWidth));
  inArrow.setAttribute('opacity', '0.8');
  innerG.appendChild(inArrow);
  const inHead = document.createElementNS(SVG_NS, 'polygon');
  inHead.setAttribute('points', `${-totalW / 2 + 15},-4 ${-totalW / 2 + 22},0 ${-totalW / 2 + 15},4`);
  inHead.setAttribute('fill', color);
  inHead.setAttribute('opacity', '0.8');
  innerG.appendChild(inHead);

  visibleValues.forEach((val, i) => {
    const x = startX + i * (cellW + gap);

    const cell = document.createElementNS(SVG_NS, 'rect');
    cell.setAttribute('x', String(x - cellW / 2));
    cell.setAttribute('y', String(-cellH / 2));
    cell.setAttribute('width', String(cellW));
    cell.setAttribute('height', String(cellH));
    cell.setAttribute('rx', '4');
    cell.setAttribute('fill', `url(#${gradId})`);
    cell.setAttribute('stroke', color);
    cell.setAttribute('stroke-width', String(SHAPES.strokeWidthThin));
    innerG.appendChild(cell);

    const valueText = document.createElementNS(SVG_NS, 'text');
    valueText.setAttribute('x', String(x));
    valueText.setAttribute('y', String(4));
    valueText.setAttribute('text-anchor', 'middle');
    valueText.setAttribute('fill', color);
    valueText.setAttribute('font-size', '11');
    valueText.setAttribute('font-weight', '600');
    valueText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    valueText.textContent = String(val);
    innerG.appendChild(valueText);
  });

  // ── Out arrow (right)
  const outArrow = document.createElementNS(SVG_NS, 'line');
  outArrow.setAttribute('x1', String(totalW / 2 - 15));
  outArrow.setAttribute('y1', '0');
  outArrow.setAttribute('x2', String(totalW / 2));
  outArrow.setAttribute('y2', '0');
  outArrow.setAttribute('stroke', color);
  outArrow.setAttribute('stroke-width', String(SHAPES.strokeWidth));
  outArrow.setAttribute('opacity', '0.8');
  innerG.appendChild(outArrow);

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(cellH / 2 + 18));
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
