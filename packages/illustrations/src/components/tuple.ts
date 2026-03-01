/**
 * @pre/illustrations — Tuple Component
 * Ordered cells + lock icon for immutability
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@pre/shared';

export function renderTuple(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity, 1.5);
  const color = entity.color ?? getCategoryColor('Tuple');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-tuple-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const values = (meta.values as (string | number)[]) ?? (meta.cells as (string | number)[]) ?? [1, 2, 3];
  const visibleValues = values.slice(0, 5);

  const cellW = 26;
  const cellH = 22;
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
    cell.setAttribute('stroke-width', String(SHAPES.strokeWidthThin));
    innerG.appendChild(cell);

    const indexText = document.createElementNS(SVG_NS, 'text');
    indexText.setAttribute('x', String(x));
    indexText.setAttribute('y', String(-cellH / 2 - 5));
    indexText.setAttribute('text-anchor', 'middle');
    indexText.setAttribute('fill', `${color}99`);
    indexText.setAttribute('font-size', '8');
    indexText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    indexText.textContent = `(${i})`;
    innerG.appendChild(indexText);

    const valueText = document.createElementNS(SVG_NS, 'text');
    valueText.setAttribute('x', String(x));
    valueText.setAttribute('y', String(4));
    valueText.setAttribute('text-anchor', 'middle');
    valueText.setAttribute('fill', color);
    valueText.setAttribute('font-size', '10');
    valueText.setAttribute('font-weight', '600');
    valueText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    valueText.textContent = String(val);
    innerG.appendChild(valueText);
  });

  // ── Lock icon (top-right, small) — immutability cue
  const lockX = totalW / 2 - 2;
  const lockY = -cellH / 2 - 10;
  const lockW = 8;
  const lockH = 6;
  const lockBody = document.createElementNS(SVG_NS, 'rect');
  lockBody.setAttribute('x', String(lockX - lockW / 2));
  lockBody.setAttribute('y', String(lockY + 2));
  lockBody.setAttribute('width', String(lockW));
  lockBody.setAttribute('height', String(lockH));
  lockBody.setAttribute('rx', '1');
  lockBody.setAttribute('fill', color);
  lockBody.setAttribute('opacity', '0.85');
  innerG.appendChild(lockBody);
  const lockShackle = document.createElementNS(SVG_NS, 'rect');
  lockShackle.setAttribute('x', String(lockX - lockW / 2 + 1));
  lockShackle.setAttribute('y', String(lockY));
  lockShackle.setAttribute('width', String(lockW - 2));
  lockShackle.setAttribute('height', String(3));
  lockShackle.setAttribute('rx', '1');
  lockShackle.setAttribute('fill', 'none');
  lockShackle.setAttribute('stroke', color);
  lockShackle.setAttribute('stroke-width', '1');
  innerG.appendChild(lockShackle);

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
