/**
 * @preplai/illustrations — ConfusionMatrix Component (minimalist)
 *
 * Clean N×N grid for classification metrics. 2×2 auto-colors: TP/TN/FP/FN.
 * No gridLayoutFromMatrix import — manual grid layout.
 *
 * Metadata: { matrix: number[][], rowLabels?: string[], colLabels?: string[] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
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
import type { VisualEntity } from '@preplai/shared';

const CM_COLORS = {
  tp: COLORS.green,
  tn: COLORS.teal,
  fp: COLORS.orange,
  fn: COLORS.red,
} as const;

function getCellType(r: number, c: number, rows: number, cols: number): 'tp' | 'tn' | 'fp' | 'fn' | null {
  if (rows !== 2 || cols !== 2) return null;
  if (r === 0 && c === 0) return 'tn';
  if (r === 0 && c === 1) return 'fp';
  if (r === 1 && c === 0) return 'fn';
  if (r === 1 && c === 1) return 'tp';
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

  const meta = entity.metadata ?? {};
  const matrixData = meta.matrix as number[][] | undefined;
  const rowLabels = (meta.rowLabels as string[]) ?? ['Actual -', 'Actual +'];
  const colLabels = (meta.colLabels as string[]) ?? ['Pred -', 'Pred +'];

  const matrix: number[][] = matrixData ?? [[45, 5], [8, 42]];
  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 2;

  const cellW = Math.round(40 * scale);
  const cellH = Math.round(28 * scale);
  const gap = 6;

  const totalGridW = cols * cellW + (cols - 1) * gap;
  const totalGridH = rows * cellH + (rows - 1) * gap;
  const headerW = cellW;
  const headerH = cellH;
  const offsetX = headerW / 2 + gap / 2;
  const offsetY = headerH / 2 + gap / 2;

  // Column headers
  colLabels.slice(0, cols).forEach((label, c) => {
    const x = -totalGridW / 2 + offsetX + c * (cellW + gap) + cellW / 2;
    const y = -totalGridH / 2 - offsetY;

    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(x - cellW / 2));
    rect.setAttribute('y', String(y - cellH / 2));
    rect.setAttribute('width', String(cellW));
    rect.setAttribute('height', String(cellH));
    rect.setAttribute('rx', String(SHAPES.borderRadius));
    rect.setAttribute('fill', colorWithAlpha(baseColor, OPACITY.fillLight));
    rect.setAttribute('stroke', colorWithAlpha(baseColor, OPACITY.strokeSoft));
    rect.setAttribute('stroke-width', String(strokeWidth));
    innerG.appendChild(rect);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(y + 5));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', baseColor);
    text.setAttribute('font-size', String(headerFontSize));
    text.setAttribute('font-weight', '600');
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = label;
    innerG.appendChild(text);
  });

  // Row headers + data cells
  matrix.forEach((row, r) => {
    // Row header
    const rowLabel = rowLabels[r] ?? '';
    if (rowLabel) {
      const hx = -totalGridW / 2 - offsetX;
      const hy = -totalGridH / 2 + r * (cellH + gap) + cellH / 2;

      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(hx - cellW / 2));
      rect.setAttribute('y', String(hy - cellH / 2));
      rect.setAttribute('width', String(cellW));
      rect.setAttribute('height', String(cellH));
      rect.setAttribute('rx', String(SHAPES.borderRadius));
      rect.setAttribute('fill', colorWithAlpha(baseColor, OPACITY.fillLight));
      rect.setAttribute('stroke', colorWithAlpha(baseColor, OPACITY.strokeSoft));
      rect.setAttribute('stroke-width', String(strokeWidth));
      innerG.appendChild(rect);

      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', String(hx));
      text.setAttribute('y', String(hy + 5));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', baseColor);
      text.setAttribute('font-size', String(headerFontSize));
      text.setAttribute('font-weight', '600');
      text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      text.textContent = rowLabel;
      innerG.appendChild(text);
    }

    // Data cells
    row.forEach((val, c) => {
      const x = -totalGridW / 2 + offsetX + c * (cellW + gap) + cellW / 2;
      const y = -totalGridH / 2 + r * (cellH + gap) + cellH / 2;
      const cmType = getCellType(r, c, rows, cols);
      const cellColor = cmType ? CM_COLORS[cmType] : baseColor;

      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(x - cellW / 2));
      rect.setAttribute('y', String(y - cellH / 2));
      rect.setAttribute('width', String(cellW));
      rect.setAttribute('height', String(cellH));
      rect.setAttribute('rx', String(SHAPES.borderRadius));
      rect.setAttribute('fill', colorWithAlpha(cellColor, OPACITY.fillMedium));
      rect.setAttribute('stroke', cellColor);
      rect.setAttribute('stroke-width', String(strokeWidth));
      innerG.appendChild(rect);

      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', String(x));
      text.setAttribute('y', String(y + 5));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', cellColor);
      text.setAttribute('font-size', String(cellFontSize));
      text.setAttribute('font-weight', '600');
      text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      text.textContent = String(val);
      innerG.appendChild(text);

      // CM type badge
      if (cmType) {
        const badge = document.createElementNS(SVG_NS, 'text');
        badge.setAttribute('x', String(x - cellW / 2 + 6));
        badge.setAttribute('y', String(y - cellH / 2 + 9));
        badge.setAttribute('fill', cellColor);
        badge.setAttribute('font-size', String(badgeFontSize));
        badge.setAttribute('font-weight', '500');
        badge.setAttribute('font-family', TYPOGRAPHY.fontBadge);
        badge.setAttribute('opacity', '0.8');
        badge.textContent = cmType.toUpperCase();
        innerG.appendChild(badge);
      }
    });
  });

  // Label below
  if (entity.label) {
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String(totalGridH / 2 + LABEL_DEFAULTS.offsetBelow));
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
