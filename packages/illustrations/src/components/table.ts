/**
 * @preplai/illustrations — Table Component
 *
 * Tabular grid with optional headers. Use for: data tables, comparison grids,
 * structured key-value layouts when HashTable (pairs) doesn't fit.
 *
 * Metadata: { headers?: string[], rows: string[][] }
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

function parseTableData(meta: Record<string, unknown>): { headers: string[]; rows: string[][] } {
  const headers = (meta.headers as string[]) ?? [];
  const rawRows = (meta.rows as string[][]) ?? [];
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    return {
      headers: ['Name', 'Value'],
      rows: [
        ['a', '1'],
        ['b', '2'],
        ['c', '3'],
      ],
    };
  }
  const rows = rawRows.slice(0, 8).map((row) =>
    Array.isArray(row)
      ? row.slice(0, 6).map((v) => String(v ?? ''))
      : [],
  ).filter((r) => r.length > 0);
  return { headers, rows };
}

export function renderTable(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const cellFontSize = getLabelFontSize('value', scale);
  const headerFontSize = getLabelFontSize('inline', scale);
  const strokeWidth = getStrokeWidth('thin', scale);
  const color = entity.color ?? getCategoryColor('Table');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-table-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const { headers, rows } = parseTableData(meta);

  const numCols = Math.max(
    headers.length,
    ...rows.map((r) => r.length),
    1,
  );
  const hasHeaders = headers.length > 0;

  const matrixStr: string[][] = [];
  if (hasHeaders) {
    const headerRow = [...headers];
    while (headerRow.length < numCols) headerRow.push('');
    matrixStr.push(headerRow);
  }
  rows.forEach((row) => {
    const r = [...row];
    while (r.length < numCols) r.push('');
    matrixStr.push(r);
  });

  const cellW = Math.round(44 * scale);
  const cellH = Math.round(24 * scale);
  const gap = 4;

  const cells = gridLayoutFromMatrix(matrixStr, {
    cellWidth: cellW,
    cellHeight: cellH,
    gap,
    cols: numCols,
    hasRowHeaders: hasHeaders,
    hasColHeaders: false,
  });

  cells.forEach((cell) => {
    const { x, y, width, height, content, cellType } = cell;
    const isHeader = cellType === 'header';

    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(x - width / 2));
    rect.setAttribute('y', String(y - height / 2));
    rect.setAttribute('width', String(width));
    rect.setAttribute('height', String(height));
    rect.setAttribute('rx', String(Math.max(1, SHAPES.borderRadius - 2)));
    if (isHeader) {
      rect.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
      rect.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeSoft));
    } else {
      rect.setAttribute('fill', `url(#${gradId})`);
      rect.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    }
    rect.setAttribute('stroke-width', String(strokeWidth));
    rect.setAttribute('stroke-linejoin', 'round');
    innerG.appendChild(rect);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(y + 4));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', isHeader ? color : colorWithAlpha(color, OPACITY.strokeFull));
    text.setAttribute('font-size', String(isHeader ? headerFontSize : cellFontSize));
    text.setAttribute('font-weight', isHeader ? String(TYPOGRAPHY.fontWeightBold) : String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    const display = content.length > 12 ? content.slice(0, 11) + '…' : content;
    text.textContent = display;
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
