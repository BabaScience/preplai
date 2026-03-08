/**
 * @preplai/illustrations — HashTable / Dict Component
 * Grid of key→value pairs; bucket slots with key:value labels.
 * Used for both HashTable and Dict entity types.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
  TYPOGRAPHY,
  SHAPES,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
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
  const strokeWidth = getStrokeWidth('minimal', 1);
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

  const cellW = 44;
  const cellH = 22;
  const gap = 4;
  const cells = gridLayoutFromPairs(visiblePairs, {
    cols,
    cellWidth: cellW,
    cellHeight: cellH,
    gap,
  });

  const scaleGroup = document.createElementNS(SVG_NS, 'g');
  scaleGroup.setAttribute('transform', `scale(${scale})`);

  const fontSize = getLabelFontSize('value', 1) / scale;
  const keyColor = colorWithAlpha(color, OPACITY.strokeSoft);
  const halfW = cellW / scale / 2;

  cells.forEach(({ x, y, width, height }, i) => {
    const [key, val] = visiblePairs[i] ?? ['', ''];
    const cellLeft = x - width / 2;
    const cellTop = y - height / 2;

    const cell = document.createElementNS(SVG_NS, 'rect');
    cell.setAttribute('x', String(cellLeft));
    cell.setAttribute('y', String(cellTop));
    cell.setAttribute('width', String(width));
    cell.setAttribute('height', String(height));
    cell.setAttribute('rx', String(Math.max(1, SHAPES.borderRadius - 2)));
    cell.setAttribute('fill', `url(#${gradId})`);
    cell.setAttribute('stroke', color);
    cell.setAttribute('stroke-width', String(strokeWidth));
    cell.setAttribute('stroke-linejoin', 'round');
    scaleGroup.appendChild(cell);

    const divider = document.createElementNS(SVG_NS, 'line');
    divider.setAttribute('x1', String(x));
    divider.setAttribute('y1', String(cellTop + 2));
    divider.setAttribute('x2', String(x));
    divider.setAttribute('y2', String(cellTop + height - 2));
    divider.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    divider.setAttribute('stroke-width', String(strokeWidth * 0.5));
    scaleGroup.appendChild(divider);

    const usableHalf = width / 2 - 4;
    const displayKey = truncateToFit(key, usableHalf, fontSize);
    const displayVal = truncateToFit(val, usableHalf, fontSize);

    const clipId = `clip-dict-${entity.id.replace(/[^a-z0-9]/gi, '')}-${i}`;
    const clipPath = document.createElementNS(SVG_NS, 'clipPath');
    clipPath.setAttribute('id', clipId);
    const clipRect = document.createElementNS(SVG_NS, 'rect');
    clipRect.setAttribute('x', String(cellLeft + 2));
    clipRect.setAttribute('y', String(cellTop + 2));
    clipRect.setAttribute('width', String(width - 4));
    clipRect.setAttribute('height', String(height - 4));
    clipPath.appendChild(clipRect);
    defs.appendChild(clipPath);

    const keyText = document.createElementNS(SVG_NS, 'text');
    keyText.setAttribute('x', String(x - halfW / 2));
    keyText.setAttribute('y', String(y + 4));
    keyText.setAttribute('text-anchor', 'end');
    keyText.setAttribute('fill', keyColor);
    keyText.setAttribute('font-size', String(fontSize));
    keyText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    keyText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    keyText.setAttribute('clip-path', `url(#${clipId})`);
    keyText.textContent = displayKey;
    scaleGroup.appendChild(keyText);

    const valText = document.createElementNS(SVG_NS, 'text');
    valText.setAttribute('x', String(x + halfW / 2));
    valText.setAttribute('y', String(y + 4));
    valText.setAttribute('text-anchor', 'start');
    valText.setAttribute('fill', color);
    valText.setAttribute('font-size', String(fontSize));
    valText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    valText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    valText.setAttribute('clip-path', `url(#${clipId})`);
    valText.textContent = displayVal;
    scaleGroup.appendChild(valText);
  });

  innerG.appendChild(scaleGroup);

  const rows = Math.ceil(visiblePairs.length / cols);
  const totalH = (rows * cellH + 8) * scale;

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(totalH / 2 + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
