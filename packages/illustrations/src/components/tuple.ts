/**
 * @preplai/illustrations — Tuple Component
 *
 * Ordered immutable cells with (0), (1), (2) indices + lock icon.
 * Metadata: { values: (string|number)[] } or { cells: (string|number)[] }
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
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderTuple(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const strokeWidth = getStrokeWidth('thin', 1);
  const indexFontSize = getLabelFontSize('index', 1) / scale;
  const valueFontSize = getLabelFontSize('value', 1) / scale;
  const color = entity.color ?? getCategoryColor('Tuple');

  const meta = entity.metadata ?? {};
  const values = (meta.values as (string | number)[]) ?? (meta.cells as (string | number)[]) ?? [1, 2, 3];
  const visibleValues = values.slice(0, 6);

  const cellW = 28;
  const cellH = 24;
  const gap = 4;
  const totalW = visibleValues.length * cellW + (visibleValues.length - 1) * gap;
  const startX = -totalW / 2 + cellW / 2 + gap / 2;

  const scaleGroup = document.createElementNS(SVG_NS, 'g');
  scaleGroup.setAttribute('transform', `scale(${scale})`);

  visibleValues.forEach((val, i) => {
    const x = startX + i * (cellW + gap);

    const cell = document.createElementNS(SVG_NS, 'rect');
    cell.setAttribute('x', String(x - cellW / 2 + 2));
    cell.setAttribute('y', String(-cellH / 2));
    cell.setAttribute('width', String(cellW - 4));
    cell.setAttribute('height', String(cellH));
    cell.setAttribute('rx', String(Math.max(1, SHAPES.borderRadius - 2)));
    cell.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
    cell.setAttribute('stroke', color);
    cell.setAttribute('stroke-width', String(strokeWidth));
    cell.setAttribute('stroke-linejoin', 'round');
    scaleGroup.appendChild(cell);

    const indexText = document.createElementNS(SVG_NS, 'text');
    indexText.setAttribute('x', String(x));
    indexText.setAttribute('y', String(-cellH / 2 - 6));
    indexText.setAttribute('text-anchor', 'middle');
    indexText.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
    indexText.setAttribute('font-size', String(indexFontSize));
    indexText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    indexText.textContent = `(${i})`;
    scaleGroup.appendChild(indexText);

    const valueText = document.createElementNS(SVG_NS, 'text');
    valueText.setAttribute('x', String(x));
    valueText.setAttribute('y', String(5));
    valueText.setAttribute('text-anchor', 'middle');
    valueText.setAttribute('fill', color);
    valueText.setAttribute('font-size', String(valueFontSize));
    valueText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    valueText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    const display = String(val).length > 6 ? String(val).slice(0, 5) + '…' : String(val);
    valueText.textContent = display;
    scaleGroup.appendChild(valueText);
  });

  // Lock icon (top-right) — immutability cue
  const lockX = totalW / 2 - 4;
  const lockY = -cellH / 2 - 12;
  const lockW = 10;
  const lockH = 7;
  const lockBody = document.createElementNS(SVG_NS, 'rect');
  lockBody.setAttribute('x', String(lockX - lockW / 2));
  lockBody.setAttribute('y', String(lockY + 2));
  lockBody.setAttribute('width', String(lockW));
  lockBody.setAttribute('height', String(lockH));
  lockBody.setAttribute('rx', '2');
  lockBody.setAttribute('fill', colorWithAlpha(color, OPACITY.fillHeavy));
  lockBody.setAttribute('stroke', color);
  lockBody.setAttribute('stroke-width', String(strokeWidth * 0.8));
  scaleGroup.appendChild(lockBody);
  const lockShackle = document.createElementNS(SVG_NS, 'rect');
  lockShackle.setAttribute('x', String(lockX - lockW / 2 + 1));
  lockShackle.setAttribute('y', String(lockY));
  lockShackle.setAttribute('width', String(lockW - 2));
  lockShackle.setAttribute('height', String(3));
  lockShackle.setAttribute('rx', '1.5');
  lockShackle.setAttribute('fill', 'none');
  lockShackle.setAttribute('stroke', color);
  lockShackle.setAttribute('stroke-width', String(strokeWidth * 0.8));
  scaleGroup.appendChild(lockShackle);

  innerG.appendChild(scaleGroup);

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(cellH / 2 * scale + LABEL_DEFAULTS.offsetBelow));
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
