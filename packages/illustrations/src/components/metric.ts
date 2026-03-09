/**
 * @preplai/illustrations — Metric Component
 * Dashboard card with accent bar, large value, label header, and trend indicator.
 *
 * Metadata: { value, unit?, trend?: 'up'|'down'|'flat', trendValue?: string }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  TYPOGRAPHY,
  SHAPES,
  COLORS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderMetric(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Metric');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-metric-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const value = String(meta.value ?? entity.label ?? '0');
  const unit = (meta.unit as string) ?? '';
  const trend = (meta.trend as 'up' | 'down' | 'flat') ?? 'flat';
  const trendValue = (meta.trendValue as string) ?? '';
  const labelText = entity.label && entity.label !== value ? entity.label : '';

  const w = s * 1.6;
  const h = s * 0.9;
  const hw = w / 2;
  const hh = h / 2;

  // ── Card background ──
  const card = document.createElementNS(SVG_NS, 'rect');
  card.setAttribute('x', String(-hw));
  card.setAttribute('y', String(-hh));
  card.setAttribute('width', String(w));
  card.setAttribute('height', String(h));
  card.setAttribute('rx', String(SHAPES.borderRadius));
  card.setAttribute('fill', `url(#${gradId})`);
  card.setAttribute('stroke', color);
  card.setAttribute('stroke-width', String(getStrokeWidth('default', scale)));
  innerG.appendChild(card);

  // ── Left accent bar ──
  const accentBar = document.createElementNS(SVG_NS, 'rect');
  accentBar.setAttribute('x', String(-hw));
  accentBar.setAttribute('y', String(-hh));
  accentBar.setAttribute('width', '3');
  accentBar.setAttribute('height', String(h));
  accentBar.setAttribute('rx', '1.5');
  accentBar.setAttribute('fill', color);
  accentBar.setAttribute('opacity', '0.8');
  innerG.appendChild(accentBar);

  // ── Label header (metric name) at top ──
  if (labelText) {
    const header = document.createElementNS(SVG_NS, 'text');
    header.setAttribute('x', String(-hw + 12));
    header.setAttribute('y', String(-hh + 14));
    header.setAttribute('text-anchor', 'start');
    header.setAttribute('fill', color);
    header.setAttribute('font-size', String(getLabelFontSize('inline', scale)));
    header.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    header.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    header.setAttribute('opacity', '0.7');
    header.textContent = labelText;
    innerG.appendChild(header);
  }

  // ── Large value + unit (center of card) ──
  const valueFontSize = getLabelFontSize('metric', scale);
  const valueY = labelText ? 4 : 2;
  const valueEl = document.createElementNS(SVG_NS, 'text');
  valueEl.setAttribute('x', '0');
  valueEl.setAttribute('y', String(valueY));
  valueEl.setAttribute('text-anchor', 'middle');
  valueEl.setAttribute('dominant-baseline', 'central');
  valueEl.setAttribute('fill', color);
  valueEl.setAttribute('font-size', String(Math.min(valueFontSize, s * 0.5)));
  valueEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  valueEl.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  valueEl.textContent = value + (unit ? ` ${unit}` : '');
  innerG.appendChild(valueEl);

  // ── Trend indicator (SVG triangle + value at bottom-right) ──
  if (trend !== 'flat' && (trendValue || trend === 'up' || trend === 'down')) {
    const trendG = document.createElementNS(SVG_NS, 'g');
    const trendX = hw - 14;
    const trendY = hh - 10;
    trendG.setAttribute('transform', `translate(${trendX}, ${trendY})`);

    const trendColor = trend === 'up' ? COLORS.green : COLORS.red;
    const triPoints = trend === 'up' ? '0,-4 3,2 -3,2' : '0,4 3,-2 -3,-2';

    const tri = document.createElementNS(SVG_NS, 'polygon');
    tri.setAttribute('points', triPoints);
    tri.setAttribute('fill', trendColor);
    trendG.appendChild(tri);

    if (trendValue) {
      const tv = document.createElementNS(SVG_NS, 'text');
      tv.setAttribute('x', '-8');
      tv.setAttribute('y', '3');
      tv.setAttribute('text-anchor', 'end');
      tv.setAttribute('fill', trendColor);
      tv.setAttribute('font-size', String(getLabelFontSize('inline', scale)));
      tv.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      tv.textContent = trendValue;
      trendG.appendChild(tv);
    }

    innerG.appendChild(trendG);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
