/**
 * @preplai/illustrations — List Component
 * Ordered indexed cells (like Array) + subtle "mutable" cue (dashed stroke)
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

export function renderList(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const strokeWidth = getStrokeWidth('minimal', 1);
  const indexFontSize = getLabelFontSize('index', 1) / scale;
  const valueFontSize = getLabelFontSize('value', 1) / scale;
  const color = entity.color ?? getCategoryColor('List');

  const meta = entity.metadata ?? {};
  const values = (meta.values as (string | number)[]) ?? (meta.cells as (string | number)[]) ?? [1, 2, 3, 4];
  const visibleValues = values.slice(0, 6);

  const cellW = 26;
  const cellH = 22;
  const totalW = visibleValues.length * cellW;
  const startX = -totalW / 2 + cellW / 2;

  const scaleGroup = document.createElementNS(SVG_NS, 'g');
  scaleGroup.setAttribute('transform', `scale(${scale})`);

  visibleValues.forEach((val, i) => {
    const x = startX + i * cellW;

    const cell = document.createElementNS(SVG_NS, 'rect');
    cell.setAttribute('x', String(x - cellW / 2 + 2));
    cell.setAttribute('y', String(-cellH / 2));
    cell.setAttribute('width', String(cellW - 4));
    cell.setAttribute('height', String(cellH));
    cell.setAttribute('rx', String(Math.max(1, SHAPES.borderRadius - 2)));
    cell.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
    cell.setAttribute('stroke', color);
    cell.setAttribute('stroke-width', String(strokeWidth));
    cell.setAttribute('stroke-dasharray', '2,2');
    cell.setAttribute('stroke-linejoin', 'round');
    scaleGroup.appendChild(cell);

    const indexText = document.createElementNS(SVG_NS, 'text');
    indexText.setAttribute('x', String(x));
    indexText.setAttribute('y', String(-cellH / 2 - 5));
    indexText.setAttribute('text-anchor', 'middle');
    indexText.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
    indexText.setAttribute('font-size', String(indexFontSize));
    indexText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    indexText.textContent = `[${i}]`;
    scaleGroup.appendChild(indexText);

    const valueText = document.createElementNS(SVG_NS, 'text');
    valueText.setAttribute('x', String(x));
    valueText.setAttribute('y', String(4));
    valueText.setAttribute('text-anchor', 'middle');
    valueText.setAttribute('fill', color);
    valueText.setAttribute('font-size', String(valueFontSize));
    valueText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    valueText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    valueText.textContent = String(val);
    scaleGroup.appendChild(valueText);
  });

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
