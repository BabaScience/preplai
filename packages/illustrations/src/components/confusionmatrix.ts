/**
 * @preplai/illustrations — ConfusionMatrix Component
 * 2x2 or NxN grid with TP/FP/TN/FN or custom labels
 *
 * Metadata: { matrix: number[][], rowLabels?: string[], colLabels?: string[] }
 * For 2x2: rowLabels/colLabels can be ["Actual-", "Actual+"] and ["Pred-", "Pred+"]
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import { gridLayoutFromMatrix } from '../layouts/index.js';
import type { VisualEntity } from '@preplai/shared';

export function renderConfusionMatrix(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const _s = getSizeParam(entity, 1.5);
  const color = entity.color ?? getCategoryColor('ConfusionMatrix');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-cm-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

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
    cellWidth: 36,
    cellHeight: 24,
    cols: layoutCols,
    hasRowHeaders: hasHeaders,
    hasColHeaders: hasHeaders,
  });

  cells.forEach(({ x, y, width, height, content, cellType }) => {
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(x - width / 2));
    rect.setAttribute('y', String(y - height / 2));
    rect.setAttribute('width', String(width));
    rect.setAttribute('height', String(height));
    rect.setAttribute('rx', String(SHAPES.borderRadius - 2));
    if (cellType === 'header') {
      rect.setAttribute('fill', `${color}30`);
    } else {
      rect.setAttribute('fill', `url(#${gradId})`);
    }
    rect.setAttribute('stroke', color);
    rect.setAttribute('stroke-width', String(SHAPES.strokeWidthThin));
    innerG.appendChild(rect);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(y + 4));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', cellType === 'header' ? '9' : '11');
    text.setAttribute('font-weight', cellType === 'header' ? '600' : '600');
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = content;
    innerG.appendChild(text);
  });

  if (entity.label) {
    const totalH = rows * 24 + (hasHeaders ? 24 : 0) + 16;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(totalH / 2 + 20));
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
