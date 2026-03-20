/**
 * @preplai/illustrations — Set Component
 *
 * Clean container with value pills inside, flanked by { } braces.
 * Use for: sets, unique collections, mathematical sets.
 *
 * Metadata: { values: (string|number)[] }
 *
 * Minimalist style matching the Composable engine aesthetic.
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
  STROKE,
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
  const values = ((meta.values as (string | number)[]) ?? ['a', 'b', 'c']).slice(0, 8).map(String);

  const pillW = 28 * scale;
  const pillH = 18 * scale;
  const pillGap = 6 * scale;
  const maxPerRow = 4;
  const pad = 8 * scale;

  const rows: string[][] = [];
  for (let i = 0; i < values.length; i += maxPerRow) {
    rows.push(values.slice(i, i + maxPerRow));
  }

  const totalW = Math.min(values.length, maxPerRow) * (pillW + pillGap) - pillGap + pad * 2;
  const totalH = rows.length * (pillH + pillGap) - pillGap + pad * 2;

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

  // Container
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

  // Braces
  const braceSize = Math.min(totalH - 4, 22 * scale);
  const braceLeft = document.createElementNS(SVG_NS, 'text');
  braceLeft.setAttribute('x', String(-totalW / 2 - 2));
  braceLeft.setAttribute('y', '5');
  braceLeft.setAttribute('text-anchor', 'end');
  braceLeft.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
  braceLeft.setAttribute('font-size', String(braceSize));
  braceLeft.setAttribute('font-family', 'serif');
  braceLeft.textContent = '{';
  innerG.appendChild(braceLeft);

  const braceRight = document.createElementNS(SVG_NS, 'text');
  braceRight.setAttribute('x', String(totalW / 2 + 2));
  braceRight.setAttribute('y', '5');
  braceRight.setAttribute('text-anchor', 'start');
  braceRight.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
  braceRight.setAttribute('font-size', String(braceSize));
  braceRight.setAttribute('font-family', 'serif');
  braceRight.textContent = '}';
  innerG.appendChild(braceRight);

  // Value pills
  const fontSize = getLabelFontSize('value', scale);
  rows.forEach((row, rowIdx) => {
    const rowW = row.length * (pillW + pillGap) - pillGap;
    const startX = -rowW / 2 + pillW / 2;

    row.forEach((val, colIdx) => {
      const x = startX + colIdx * (pillW + pillGap);
      const y = -totalH / 2 + pad + pillH / 2 + rowIdx * (pillH + pillGap);

      const pill = document.createElementNS(SVG_NS, 'rect');
      pill.setAttribute('x', String(x - pillW / 2 + 2));
      pill.setAttribute('y', String(y - pillH / 2));
      pill.setAttribute('width', String(pillW - 4));
      pill.setAttribute('height', String(pillH));
      pill.setAttribute('rx', String(pillH / 2));
      pill.setAttribute('fill', `url(#${gradId})`);
      pill.setAttribute('stroke', color);
      pill.setAttribute('stroke-width', String(getStrokeWidth('thin', scale)));
      innerG.appendChild(pill);

      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', String(x));
      text.setAttribute('y', String(y + 4));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', color);
      text.setAttribute('font-size', String(Math.min(fontSize, 11 * scale)));
      text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
      text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      text.textContent = val.slice(0, 6);
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
