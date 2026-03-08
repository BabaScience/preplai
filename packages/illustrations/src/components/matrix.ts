/**
 * @preplai/illustrations — Matrix Component
 *
 * Numeric matrix with rows/columns in a grid. Optional row/col labels.
 *
 * Metadata: { rows: number[][] }, rowLabels?: string[], colLabels?: string[]
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
import { gridLayoutFromMatrix } from '../layouts/index.js';
import type { VisualEntity } from '@preplai/shared';

function parseRows(meta: Record<string, unknown>): number[][] {
  const raw = meta.rows as number[][] | undefined;
  if (!Array.isArray(raw) || raw.length === 0) {
    return [
      [1, 0],
      [0, 1],
    ];
  }
  return raw.slice(0, 8).map((row) =>
    Array.isArray(row)
      ? row.slice(0, 8).map((v) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0))
      : [],
  ).filter((r) => r.length > 0);
}

export function renderMatrix(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const cellFontSize = getLabelFontSize('value', scale);
  const headerFontSize = getLabelFontSize('inline', scale);
  const strokeWidth = getStrokeWidth('thin', scale);
  const color = entity.color ?? getCategoryColor('Matrix');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-matrix-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const rows = parseRows(meta);
  const rowLabels = (meta.rowLabels as string[]) ?? [];
  const colLabels = (meta.colLabels as string[]) ?? [];

  const _numRows = rows.length;
  const numCols = Math.max(...rows.map((r) => r.length), 1);
  const hasHeaders = rowLabels.length > 0 || colLabels.length > 0;

  const cellW = Math.round(32 * scale);
  const cellH = Math.round(24 * scale);
  const gap = 4;

  const matrixStr: string[][] = [];
  if (hasHeaders) {
    matrixStr.push(['', ...colLabels.slice(0, numCols)]);
  }
  rows.forEach((row, i) => {
    const rLabel = hasHeaders ? (rowLabels[i] ?? '') : '';
    const vals = row.slice(0, numCols);
    while (vals.length < numCols) vals.push(0);
    matrixStr.push([rLabel, ...vals.map(String)]);
  });

  const layoutCols = hasHeaders ? numCols + 1 : numCols;
  const cells = gridLayoutFromMatrix(matrixStr, {
    cellWidth: cellW,
    cellHeight: cellH,
    gap,
    cols: layoutCols,
    hasRowHeaders: hasHeaders,
    hasColHeaders: hasHeaders,
  });

  cells.forEach((cell) => {
    const { x, y, width, height, content, cellType } = cell;

    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(x - width / 2));
    rect.setAttribute('y', String(y - height / 2));
    rect.setAttribute('width', String(width));
    rect.setAttribute('height', String(height));
    rect.setAttribute('rx', String(SHAPES.borderRadius - 2));
    if (cellType === 'header') {
      rect.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
      rect.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeSoft));
    } else {
      rect.setAttribute('fill', `url(#${gradId})`);
      rect.setAttribute('stroke', color);
    }
    rect.setAttribute('stroke-width', String(strokeWidth));
    innerG.appendChild(rect);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(y + 4));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', cellType === 'header' ? colorWithAlpha(color, OPACITY.strokeSoft) : color);
    text.setAttribute('font-size', String(cellType === 'header' ? headerFontSize : cellFontSize));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = content;
    innerG.appendChild(text);
  });

  const totalH = matrixStr.length * cellH + (matrixStr.length - 1) * gap;

  if (entity.label) {
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String(totalH / 2 + LABEL_DEFAULTS.offsetBelow));
    labelEl.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    labelEl.setAttribute('fill', color);
    labelEl.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    labelEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    labelEl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    labelEl.textContent = entity.label;
    innerG.appendChild(labelEl);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
