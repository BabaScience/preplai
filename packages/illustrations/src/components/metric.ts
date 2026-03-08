/**
 * @preplai/illustrations — Metric Component
 * Circle + large value — emphasize number. Optional unit, trend (up/down/flat), trendValue.
 *
 * Metadata: { value, unit?, trend?: 'up'|'down'|'flat', trendValue?: string }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createRadialGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  TYPOGRAPHY,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderMetric(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Metric');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-metric-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createRadialGradient(gradId, color, defs);

  const r = s / 2;
  const meta = entity.metadata ?? {};
  const value = String(meta.value ?? entity.label ?? '0');
  const unit = (meta.unit as string) ?? '';
  const trend = (meta.trend as 'up' | 'down' | 'flat') ?? 'flat';
  const trendValue = (meta.trendValue as string) ?? '';

  const circle = document.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('cx', '0');
  circle.setAttribute('cy', '0');
  circle.setAttribute('r', String(r));
  circle.setAttribute('fill', `url(#${gradId})`);
  circle.setAttribute('stroke', color);
  circle.setAttribute('stroke-width', String(getStrokeWidth('default', scale)));
  innerG.appendChild(circle);

  const valueFontSize = getLabelFontSize('metric', scale);
  const valueText = document.createElementNS(SVG_NS, 'text');
  valueText.setAttribute('x', '0');
  valueText.setAttribute('y', unit ? '2' : '6');
  valueText.setAttribute('text-anchor', 'middle');
  valueText.setAttribute('fill', color);
  valueText.setAttribute('font-size', String(Math.min(valueFontSize, s * 0.8)));
  valueText.setAttribute('font-weight', '700');
  valueText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  valueText.textContent = value + (unit ? ` ${unit}` : '');
  innerG.appendChild(valueText);

  if (trend !== 'flat' && (trendValue || trend === 'up' || trend === 'down')) {
    const trendY = unit ? 18 : 20;
    const trendText = document.createElementNS(SVG_NS, 'text');
    trendText.setAttribute('x', '0');
    trendText.setAttribute('y', String(trendY));
    trendText.setAttribute('text-anchor', 'middle');
    trendText.setAttribute('fill', color);
    trendText.setAttribute('font-size', String(getLabelFontSize('inline', scale)));
    trendText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    trendText.textContent = trend === 'up' ? `↑ ${trendValue}` : trend === 'down' ? `↓ ${trendValue}` : trendValue;
    innerG.appendChild(trendText);
  }

  if (entity.label && entity.label !== value) {
    const labelText = document.createElementNS(SVG_NS, 'text');
    labelText.setAttribute('x', '0');
    labelText.setAttribute('y', String(r + LABEL_DEFAULTS.offsetBelow));
    labelText.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    labelText.setAttribute('fill', color);
    labelText.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    labelText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    labelText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    labelText.textContent = entity.label;
    innerG.appendChild(labelText);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
