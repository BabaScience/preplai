/**
 * @preplai/illustrations — Set Component
 *
 * Unordered unique elements displayed as pills in a rounded container.
 * Set notation: { a, b, c } — no indices, no duplicates.
 *
 * Metadata:
 *   values?: (string | number)[] — set elements (default: ['a', 'b', 'c'])
 *   highlightIndex?: number — optional 0-based index to highlight
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
import type { VisualEntity } from '@preplai/shared';

export function renderSet(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Set');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-set-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const rawValues = (meta.values as (string | number)[]) ?? ['a', 'b', 'c'];
  const values = rawValues.slice(0, 8).map((v) => String(v));
  const highlightIndex = typeof meta.highlightIndex === 'number' ? meta.highlightIndex : -1;

  const pad = 8;
  const pillH = 18;
  const pillGap = 6;
  const maxPillsPerRow = 4;
  const pillW = 28;

  const rows: string[][] = [];
  for (let i = 0; i < values.length; i += maxPillsPerRow) {
    rows.push(values.slice(i, i + maxPillsPerRow));
  }

  const totalW = Math.min(values.length, maxPillsPerRow) * (pillW + pillGap) - pillGap + pad * 2;
  const totalH = rows.length * (pillH + pillGap) - pillGap + pad * 2;

  const container = document.createElementNS(SVG_NS, 'rect');
  container.setAttribute('x', String(-totalW / 2));
  container.setAttribute('y', String(-totalH / 2));
  container.setAttribute('width', String(totalW));
  container.setAttribute('height', String(totalH));
  container.setAttribute('rx', String(SHAPES.borderRadius));
  container.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  container.setAttribute('stroke', color);
  container.setAttribute('stroke-width', String(getStrokeWidth('thin', scale)));
  container.setAttribute('stroke-dasharray', '4,3');
  innerG.appendChild(container);

  const braceSize = Math.min(totalH - 4, 22);
  const braceLeft = document.createElementNS(SVG_NS, 'text');
  braceLeft.setAttribute('x', String(-totalW / 2 - 2));
  braceLeft.setAttribute('y', '5');
  braceLeft.setAttribute('text-anchor', 'end');
  braceLeft.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
  braceLeft.setAttribute('font-size', String(braceSize));
  braceLeft.setAttribute('font-family', 'serif');
  braceLeft.setAttribute('font-weight', '400');
  braceLeft.textContent = '{';
  innerG.appendChild(braceLeft);

  const braceRight = document.createElementNS(SVG_NS, 'text');
  braceRight.setAttribute('x', String(totalW / 2 + 2));
  braceRight.setAttribute('y', '5');
  braceRight.setAttribute('text-anchor', 'start');
  braceRight.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
  braceRight.setAttribute('font-size', String(braceSize));
  braceRight.setAttribute('font-family', 'serif');
  braceRight.setAttribute('font-weight', '400');
  braceRight.textContent = '}';
  innerG.appendChild(braceRight);

  const valueFontSize = getLabelFontSize('value', scale);
  let idx = 0;
  rows.forEach((row, rowIdx) => {
    const rowW = row.length * (pillW + pillGap) - pillGap;
    const startX = -rowW / 2 + pillW / 2 + pillGap / 2;

    row.forEach((val, colIdx) => {
      const x = startX + colIdx * (pillW + pillGap);
      const y = -totalH / 2 + pad + pillH / 2 + rowIdx * (pillH + pillGap);
      const isHighlighted = idx === highlightIndex;

      const pill = document.createElementNS(SVG_NS, 'rect');
      pill.setAttribute('x', String(x - pillW / 2 + 2));
      pill.setAttribute('y', String(y - pillH / 2));
      pill.setAttribute('width', String(pillW - 4));
      pill.setAttribute('height', String(pillH));
      pill.setAttribute('rx', String(pillH / 2));
      pill.setAttribute('fill', `url(#${gradId})`);
      pill.setAttribute('stroke', color);
      pill.setAttribute('stroke-width', String(getStrokeWidth(isHighlighted ? 'emphasized' : 'thin', scale)));
      if (isHighlighted) {
        pill.setAttribute('filter', `drop-shadow(0 0 ${3 * scale}px ${color})`);
      }
      innerG.appendChild(pill);

      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', String(x));
      text.setAttribute('y', String(y + 4));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', color);
      text.setAttribute('font-size', String(Math.min(valueFontSize, 11)));
      text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
      text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      text.textContent = val.length > 6 ? val.slice(0, 4) + '…' : val;
      innerG.appendChild(text);

      idx++;
    });
  });

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
