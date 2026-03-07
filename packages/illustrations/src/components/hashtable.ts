/**
 * @preplai/illustrations — HashTable Component
 * Grid of key→value pairs; bucket slots with key:value labels
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import { gridLayoutFromPairs } from '../layouts/index.js';
import type { VisualEntity } from '@preplai/shared';

export function renderHashTable(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const _s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('HashTable');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-ht-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const pairs = (meta.pairs as [string, string][]) ?? [
    ['a', '1'],
    ['b', '2'],
    ['k', 'v'],
  ];
  const visiblePairs = pairs.slice(0, 6);

  const cells = gridLayoutFromPairs(visiblePairs, { cols: 2 });

  cells.forEach(({ x, y, width, height, content }) => {
    const cell = document.createElementNS(SVG_NS, 'rect');
    cell.setAttribute('x', String(x - width / 2));
    cell.setAttribute('y', String(y - height / 2));
    cell.setAttribute('width', String(width));
    cell.setAttribute('height', String(height));
    cell.setAttribute('rx', String(SHAPES.borderRadius - 2));
    cell.setAttribute('fill', `url(#${gradId})`);
    cell.setAttribute('stroke', color);
    cell.setAttribute('stroke-width', String(SHAPES.strokeWidthThin));
    innerG.appendChild(cell);

    const pairText = document.createElementNS(SVG_NS, 'text');
    pairText.setAttribute('x', String(x));
    pairText.setAttribute('y', String(y + 4));
    pairText.setAttribute('text-anchor', 'middle');
    pairText.setAttribute('fill', color);
    pairText.setAttribute('font-size', '10');
    pairText.setAttribute('font-weight', '600');
    pairText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    pairText.textContent = content;
    innerG.appendChild(pairText);
  });

  const cellH = 22;
  const rows = Math.ceil(visiblePairs.length / 2);
  const totalH = rows * cellH + 8;

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(totalH / 2 + 18));
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
