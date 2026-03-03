/**
 * @preplai/illustrations — Array Component
 * Row of cells with indices
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderArray(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity, 1.5);
  const color = entity.color ?? getCategoryColor('Array');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-array-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const values = (meta.values as (string | number)[]) ?? (meta.cells as (string | number)[]) ?? [1, 2, 3, 4, 5];
  const visibleValues = values.slice(0, 8);

  const cellW = 28;
  const cellH = 24;
  const totalW = visibleValues.length * cellW;
  const startX = -totalW / 2 + cellW / 2;

  visibleValues.forEach((val, i) => {
    const x = startX + i * cellW;

    const cell = document.createElementNS(SVG_NS, 'rect');
    cell.setAttribute('x', String(x - cellW / 2 + 2));
    cell.setAttribute('y', String(-cellH / 2));
    cell.setAttribute('width', String(cellW - 4));
    cell.setAttribute('height', String(cellH));
    cell.setAttribute('rx', '2');
    cell.setAttribute('fill', `url(#${gradId})`);
    cell.setAttribute('stroke', color);
    cell.setAttribute('stroke-width', '1.5');
    innerG.appendChild(cell);

    const indexText = document.createElementNS(SVG_NS, 'text');
    indexText.setAttribute('x', String(x));
    indexText.setAttribute('y', String(-cellH / 2 - 6));
    indexText.setAttribute('text-anchor', 'middle');
    indexText.setAttribute('fill', `${color}99`);
    indexText.setAttribute('font-size', '9');
    indexText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    indexText.textContent = String(i);
    innerG.appendChild(indexText);

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
