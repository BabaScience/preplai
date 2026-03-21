/**
 * @preplai/illustrations — ArrayCell Component
 *
 * Single clean cell with value and index.
 * Use for: individual array elements, algorithm step visualization.
 *
 * Metadata: { value: string|number, index: number }
 *
 * Minimalist style matching the Composable engine aesthetic.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha, OPACITY, getStrokeWidth, getLabelFontSize } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderArrayCell(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('ArrayCell');

  const meta = entity.metadata ?? {};
  const value = String(meta.value ?? entity.label ?? '?');
  const index = typeof meta.index === 'number' ? meta.index : 0;

  const cellW = 28 * scale;
  const cellH = 24 * scale;

  // Highlight glow
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-cellW / 2 - 3));
    glow.setAttribute('y', String(-cellH / 2 - 3));
    glow.setAttribute('width', String(cellW + 6));
    glow.setAttribute('height', String(cellH + 6));
    glow.setAttribute('rx', '6');
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    innerG.appendChild(glow);
  }

  // Cell
  const pad = 2 * scale;
  const cell = document.createElementNS(SVG_NS, 'rect');
  cell.setAttribute('x', String(-cellW / 2 + pad));
  cell.setAttribute('y', String(-cellH / 2));
  cell.setAttribute('width', String(cellW - pad * 2));
  cell.setAttribute('height', String(cellH));
  cell.setAttribute('rx', String(Math.max(1, 2 * scale)));
  cell.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  cell.setAttribute('stroke', color);
  cell.setAttribute('stroke-width', String(getStrokeWidth('thin', scale)));
  innerG.appendChild(cell);

  // Index above
  const indexText = document.createElementNS(SVG_NS, 'text');
  indexText.setAttribute('x', '0');
  indexText.setAttribute('y', String(-cellH / 2 - 6));
  indexText.setAttribute('text-anchor', 'middle');
  indexText.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
  indexText.setAttribute('font-size', String(getLabelFontSize('index', scale)));
  indexText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  indexText.textContent = String(index);
  innerG.appendChild(indexText);

  // Value centered
  const valueText = document.createElementNS(SVG_NS, 'text');
  valueText.setAttribute('x', '0');
  valueText.setAttribute('y', String(4));
  valueText.setAttribute('text-anchor', 'middle');
  valueText.setAttribute('fill', color);
  valueText.setAttribute('font-size', String(getLabelFontSize('value', scale)));
  valueText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
  valueText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  valueText.textContent = value;
  innerG.appendChild(valueText);

  // Label below
  if (entity.label && entity.label !== value) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(cellH / 2 + LABEL_DEFAULTS.offsetBelow));
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
