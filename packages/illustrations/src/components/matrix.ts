/**
 * @preplai/illustrations — Matrix Component
 *
 * Clean numeric grid with optional row/column labels.
 * Use for: matrices, 2D arrays, grids, tables of numbers.
 *
 * Metadata: { rows: number[][], rowLabels?: string[], colLabels?: string[] }
 *
 * Minimalist style matching the Composable engine aesthetic.
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
  STROKE,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderMatrix(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Matrix');

  const meta = entity.metadata ?? {};
  const rawRows = (meta.rows as number[][]) ?? [[1, 0], [0, 1]];
  const rows = rawRows.slice(0, 8).map((row) =>
    Array.isArray(row)
      ? row.slice(0, 8).map((v) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0))
      : []
  ).filter((r) => r.length > 0);

  const numCols = Math.max(...rows.map((r) => r.length), 1);
  const cellW = 32 * scale;
  const cellH = 24 * scale;
  const gap = 4 * scale;

  const totalW = numCols * cellW + (numCols - 1) * gap;
  const totalH = rows.length * cellH + (rows.length - 1) * gap;

  // Highlight glow
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-totalW / 2 - 3));
    glow.setAttribute('y', String(-totalH / 2 - 3));
    glow.setAttribute('width', String(totalW + 6));
    glow.setAttribute('height', String(totalH + 6));
    glow.setAttribute('rx', String(SHAPES.borderRadius + 2));
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    innerG.appendChild(glow);
  }

  // Cells
  const fontSize = getLabelFontSize('value', scale);
  rows.forEach((row, rowIdx) => {
    row.forEach((val, colIdx) => {
      const x = -totalW / 2 + colIdx * (cellW + gap) + cellW / 2;
      const y = -totalH / 2 + rowIdx * (cellH + gap) + cellH / 2;

      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(x - cellW / 2));
      rect.setAttribute('y', String(y - cellH / 2));
      rect.setAttribute('width', String(cellW));
      rect.setAttribute('height', String(cellH));
      rect.setAttribute('rx', String(SHAPES.borderRadius - 2));
      rect.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
      rect.setAttribute('stroke', color);
      rect.setAttribute('stroke-width', String(getStrokeWidth('thin', scale)));
      innerG.appendChild(rect);

      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', String(x));
      text.setAttribute('y', String(y + 4));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', color);
      text.setAttribute('font-size', String(fontSize));
      text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
      text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      text.textContent = String(val);
      innerG.appendChild(text);
    });
  });

  // Label below
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
