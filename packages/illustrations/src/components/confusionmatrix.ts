/**
 * @preplai/illustrations — ConfusionMatrix Component
 *
 * 2×2 or N×N grid for classification metrics. 2×2 with headers auto-colors: TP (green),
 * TN (teal), FP (orange), FN (red). Use for: ML evaluation, precision/recall context.
 *
 * @see METADATA_SCHEMAS.md#confusionmatrix
 * @see ILLUSTRATIONS_AGENT_GUIDE.md
 *
 * Metadata:
 *   matrix: number[][] — 2D array of counts
 *   rowLabels: string[] — e.g. ["Actual -", "Actual +"]
 *   colLabels: string[] — e.g. ["Pred -", "Pred +"]
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
  COLORS,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import { gridLayoutFromMatrix } from '../layouts/index.js';
import type { VisualEntity } from '@preplai/shared';

/** TP/FP/TN/FN cell colors: correct = green/teal, errors = orange/red */
const CM_COLORS = {
  tp: COLORS.green,
  tn: COLORS.teal,
  fp: COLORS.orange,
  fn: COLORS.red,
} as const;

function getCellType(
  layoutCols: number,
  hasHeaders: boolean,
  cellIndex: number,
  rows: number,
  cols: number,
): 'tp' | 'tn' | 'fp' | 'fn' | null {
  if (!hasHeaders || rows !== 2 || cols !== 2) return null;
  const r = Math.floor(cellIndex / layoutCols);
  const c = cellIndex % layoutCols;
  if (r === 1 && c === 1) return 'tn';
  if (r === 1 && c === 2) return 'fp';
  if (r === 2 && c === 1) return 'fn';
  if (r === 2 && c === 2) return 'tp';
  return null;
}

export function renderConfusionMatrix(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const cellFontSize = getLabelFontSize('value', scale);
  const headerFontSize = getLabelFontSize('inline', scale);
  const badgeFontSize = getLabelFontSize('index', scale);
  const strokeWidth = getStrokeWidth('thin', scale);
  const baseColor = entity.color ?? getCategoryColor('ConfusionMatrix');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-cm-${baseColor.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, baseColor, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const matrixData = meta.matrix as number[][] | undefined;
  const rowLabels = (meta.rowLabels as string[]) ?? ['Actual -', 'Actual +'];
  const colLabels = (meta.colLabels as string[]) ?? ['Pred -', 'Pred +'];

  const matrix: number[][] = matrixData ?? [
    [45, 5],
    [8, 42],
  ];

  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 2;
  const hasHeaders = rowLabels.length > 0 || colLabels.length > 0;

  const cellW = Math.round(40 * scale);
  const cellH = Math.round(28 * scale);
  const gap = 6;

  const matrixStr: string[][] = [];
  if (hasHeaders) {
    matrixStr.push(['', ...colLabels.slice(0, cols)]);
  }
  matrix.forEach((row, i) => {
    const rLabel = hasHeaders ? (rowLabels[i] ?? '') : '';
    matrixStr.push([rLabel, ...row.map(String)]);
  });

  const layoutCols = hasHeaders ? cols + 1 : cols;
  const cells = gridLayoutFromMatrix(matrixStr, {
    cellWidth: cellW,
    cellHeight: cellH,
    gap,
    cols: layoutCols,
    hasRowHeaders: hasHeaders,
    hasColHeaders: hasHeaders,
  });

  cells.forEach((cell, idx) => {
    const { x, y, width, height, content, cellType } = cell;
    const cmType = getCellType(layoutCols, hasHeaders, idx, rows, cols);

    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(x - width / 2));
    rect.setAttribute('y', String(y - height / 2));
    rect.setAttribute('width', String(width));
    rect.setAttribute('height', String(height));
    rect.setAttribute('rx', String(SHAPES.borderRadius));
    if (cellType === 'header') {
      rect.setAttribute('fill', colorWithAlpha(baseColor, OPACITY.fillLight));
      rect.setAttribute('stroke', colorWithAlpha(baseColor, OPACITY.strokeSoft));
    } else if (cmType) {
      const fillColor = CM_COLORS[cmType];
      rect.setAttribute('fill', colorWithAlpha(fillColor, OPACITY.fillMedium));
      rect.setAttribute('stroke', fillColor);
    } else {
      rect.setAttribute('fill', `url(#${gradId})`);
      rect.setAttribute('stroke', baseColor);
    }
    rect.setAttribute('stroke-width', String(strokeWidth));
    innerG.appendChild(rect);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(y + 5));
    text.setAttribute('text-anchor', 'middle');
    const textColor = cellType === 'header' ? baseColor : (cmType ? CM_COLORS[cmType] : baseColor);
    text.setAttribute('fill', textColor);
    text.setAttribute('font-size', String(cellType === 'header' ? headerFontSize : cellFontSize));
    text.setAttribute('font-weight', '600');
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = content;
    innerG.appendChild(text);

    if (cmType && content) {
      const badge = document.createElementNS(SVG_NS, 'text');
      badge.setAttribute('x', String(x - width / 2 + 10));
      badge.setAttribute('y', String(y - height / 2 + 9));
      badge.setAttribute('text-anchor', 'start');
      badge.setAttribute('fill', textColor);
      badge.setAttribute('font-size', String(badgeFontSize));
      badge.setAttribute('font-weight', '500');
      badge.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      badge.setAttribute('opacity', '0.9');
      badge.textContent = cmType.toUpperCase();
      innerG.appendChild(badge);
    }
  });

  if (entity.label) {
    const totalH = rows * cellH + (rows - 1) * gap + (hasHeaders ? cellH + gap : 0);
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String(totalH / 2 + LABEL_DEFAULTS.offsetBelow));
    labelEl.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    labelEl.setAttribute('fill', baseColor);
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
