/**
 * @preplai/illustrations — ArrayCell Component
 *
 * Single array cell for algorithm visualization (binary search, sorting, etc.).
 * Shows value, index, and state-based styling.
 *
 * Metadata:
 *   value: string | number — cell value (center)
 *   index: number — index label (above or below)
 *   state: 'default' | 'active' | 'compare' | 'swap' | 'done'
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, COLORS, colorWithAlpha, OPACITY, getStrokeWidth, getLabelFontSize } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

type CellState = 'default' | 'active' | 'compare' | 'swap' | 'done';

function getStateColor(state: CellState, baseColor: string): string {
  switch (state) {
    case 'active':
      return baseColor;
    case 'compare':
      return COLORS.gold;
    case 'swap':
      return COLORS.orange;
    case 'done':
      return colorWithAlpha(baseColor, OPACITY.strokeSoft);
    default:
      return baseColor;
  }
}

export function renderArrayCell(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const baseColor = entity.color ?? getCategoryColor('ArrayCell');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-arraycell-${baseColor.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, baseColor, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const value = String(meta.value ?? entity.label ?? '?');
  const index = typeof meta.index === 'number' ? meta.index : 0;
  const state = (meta.state as CellState) ?? 'default';

  const color = getStateColor(state, baseColor);
  const scale = s / 50;

  const cellW = 28 * scale;
  const cellH = 24 * scale;
  const pad = 2 * scale;
  const rx = Math.max(1, 2 * scale);

  const cell = document.createElementNS(SVG_NS, 'rect');
  cell.setAttribute('x', String(-cellW / 2 + pad));
  cell.setAttribute('y', String(-cellH / 2));
  cell.setAttribute('width', String(cellW - pad * 2));
  cell.setAttribute('height', String(cellH));
  cell.setAttribute('rx', String(rx));
  cell.setAttribute('fill', `url(#${gradId})`);
  cell.setAttribute('stroke', color);
  cell.setAttribute('stroke-width', String(getStrokeWidth(state === 'active' || state === 'compare' ? 'selected' : 'thin', scale)));

  if (state === 'swap') {
    cell.setAttribute('stroke-dasharray', '4,3');
  }
  if (state === 'done') {
    cell.setAttribute('opacity', '0.6');
  }
  if (state === 'active' || state === 'compare') {
    cell.setAttribute('filter', `drop-shadow(0 0 ${4 * scale}px ${color})`);
  }

  innerG.appendChild(cell);

  // Index (above cell)
  const indexText = document.createElementNS(SVG_NS, 'text');
  indexText.setAttribute('x', '0');
  indexText.setAttribute('y', String(-cellH / 2 - 6));
  indexText.setAttribute('text-anchor', 'middle');
  indexText.setAttribute('fill', colorWithAlpha(color, state === 'done' ? '60' : '99'));
  indexText.setAttribute('font-size', String(getLabelFontSize('index', scale)));
  indexText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  indexText.textContent = String(index);
  innerG.appendChild(indexText);

  // Value (center)
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

  if (entity.label && entity.label !== value) {
    const labelText = document.createElementNS(SVG_NS, 'text');
    labelText.setAttribute('x', '0');
    labelText.setAttribute('y', String(cellH / 2 + 12 * scale + 8));
    labelText.setAttribute('text-anchor', 'middle');
    labelText.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
    labelText.setAttribute('font-size', String(getLabelFontSize('inline', scale)));
    labelText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    labelText.textContent = entity.label;
    innerG.appendChild(labelText);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
