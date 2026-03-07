/**
 * @preplai/illustrations — HashTable / Dict Component
 * Grid of key→value pairs; bucket slots with key:value labels.
 * Used for both HashTable and Dict entity types.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import { gridLayoutFromPairs } from '../layouts/index.js';
import type { VisualEntity } from '@preplai/shared';

/** Truncate text to fit within pixel width; ~0.6em per char for typical bold font */
function truncateToFit(text: string, maxWidth: number, fontSize: number): string {
  const approxCharWidth = fontSize * 0.6;
  const maxChars = Math.max(1, Math.floor(maxWidth / approxCharWidth));
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 1) + '…';
}

export function renderHashTable(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor(entity.type);
  const defs = ensureDefs(parentEl);
  const gradId = `grad-ht-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const pairs = (meta.pairs as [string, string][]) ?? [
    ['a', '1'],
    ['b', '2'],
    ['k', 'v'],
  ];
  const cols = Math.max(1, Math.min(4, (meta.cols as number) ?? 2));
  const visiblePairs = pairs.slice(0, 8);

  const cellW = 44 * scale;
  const cellH = 22 * scale;
  const cells = gridLayoutFromPairs(visiblePairs, {
    cols,
    cellWidth: cellW,
    cellHeight: cellH,
    gap: 4 * scale,
  });

  cells.forEach(({ x, y, width, height, content }, i) => {
    const cell = document.createElementNS(SVG_NS, 'rect');
    cell.setAttribute('x', String(x - width / 2));
    cell.setAttribute('y', String(y - height / 2));
    cell.setAttribute('width', String(width));
    cell.setAttribute('height', String(height));
    cell.setAttribute('rx', String(Math.max(1, (SHAPES.borderRadius - 2) * scale)));
    cell.setAttribute('fill', `url(#${gradId})`);
    cell.setAttribute('stroke', color);
    cell.setAttribute('stroke-width', String(Math.max(1, SHAPES.strokeWidthThin * scale)));
    innerG.appendChild(cell);

    const fontSize = Math.round(8 * scale);
    const usableWidth = width - 6;
    const displayContent = truncateToFit(content, usableWidth, fontSize);

    const clipId = `clip-dict-${entity.id}-${i}`;
    const clipPath = document.createElementNS(SVG_NS, 'clipPath');
    clipPath.setAttribute('id', clipId);
    const clipRect = document.createElementNS(SVG_NS, 'rect');
    clipRect.setAttribute('x', String(x - width / 2 + 2));
    clipRect.setAttribute('y', String(y - height / 2 + 2));
    clipRect.setAttribute('width', String(width - 4));
    clipRect.setAttribute('height', String(height - 4));
    clipPath.appendChild(clipRect);
    defs.appendChild(clipPath);

    const pairText = document.createElementNS(SVG_NS, 'text');
    pairText.setAttribute('x', String(x));
    pairText.setAttribute('y', String(y + 4 * scale));
    pairText.setAttribute('text-anchor', 'middle');
    pairText.setAttribute('fill', color);
    pairText.setAttribute('font-size', String(fontSize));
    pairText.setAttribute('font-weight', '600');
    pairText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    pairText.setAttribute('clip-path', `url(#${clipId})`);
    pairText.textContent = displayContent;
    innerG.appendChild(pairText);
  });

  const rows = Math.ceil(visiblePairs.length / cols);
  const totalH = rows * cellH + 8 * scale;

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(totalH / 2 + 18 * scale));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(Math.round(TYPOGRAPHY.fontSizeLabel * scale)));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
