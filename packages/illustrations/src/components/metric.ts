/**
 * @preplai/illustrations — Metric Component
 *
 * Clean card with large value centered.
 * Use for: KPIs, dashboard metrics, performance counters.
 *
 * Metadata: { value, unit?, trend?: 'up'|'down'|'flat' }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  getLabelFontSize,
  TYPOGRAPHY,
  STROKE,
  LABEL_DEFAULTS,
  COLORS,
  colorWithAlpha,
  OPACITY,
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

  const w = s * 1.2;
  const h = s * 0.75;
  const hw = w / 2;
  const hh = h / 2;
  const rx = 6;

  // Highlight glow
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-hw - 3));
    glow.setAttribute('y', String(-hh - 3));
    glow.setAttribute('width', String(w + 6));
    glow.setAttribute('height', String(h + 6));
    glow.setAttribute('rx', String(rx + 2));
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    innerG.appendChild(glow);
  }

  // Card
  const card = document.createElementNS(SVG_NS, 'rect');
  card.setAttribute('x', String(-hw));
  card.setAttribute('y', String(-hh));
  card.setAttribute('width', String(w));
  card.setAttribute('height', String(h));
  card.setAttribute('rx', String(rx));
  card.setAttribute('fill', `url(#${gradId})`);
  card.setAttribute('stroke', color);
  card.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(card);

  // Value + unit centered
  const valueFontSize = getLabelFontSize('metric', scale);
  const valueEl = document.createElementNS(SVG_NS, 'text');
  valueEl.setAttribute('x', '0');
  valueEl.setAttribute('y', '2');
  valueEl.setAttribute('text-anchor', 'middle');
  valueEl.setAttribute('dominant-baseline', 'central');
  valueEl.setAttribute('fill', color);
  valueEl.setAttribute('font-size', String(Math.min(valueFontSize, s * 0.45)));
  valueEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  valueEl.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  valueEl.textContent = value + (unit ? ` ${unit}` : '');
  innerG.appendChild(valueEl);

  // Trend indicator (small triangle at bottom-right)
  if (trend !== 'flat') {
    const trendColor = trend === 'up' ? COLORS.green : COLORS.red;
    const tx = hw - 10;
    const ty = hh - 8;
    const tri = document.createElementNS(SVG_NS, 'polygon');
    tri.setAttribute('points', trend === 'up'
      ? `${tx},${ty - 3} ${tx + 3},${ty + 2} ${tx - 3},${ty + 2}`
      : `${tx},${ty + 3} ${tx + 3},${ty - 2} ${tx - 3},${ty - 2}`);
    tri.setAttribute('fill', trendColor);
    innerG.appendChild(tri);
  }

  // Label below
  if (entity.label && entity.label !== value) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(hh + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
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
