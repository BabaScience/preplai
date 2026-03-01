/**
 * @pre/illustrations — Metric Component
 * Circle + large value — emphasize number
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createRadialGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY } from '../design-tokens.js';
import type { VisualEntity } from '@pre/shared';

export function renderMetric(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity, 1.2);
  const color = entity.color ?? getCategoryColor('Metric');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-metric-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createRadialGradient(gradId, color, defs);

  const r = s / 2;
  const meta = entity.metadata ?? {};
  const value = (meta.value as string) ?? entity.label ?? '0';

  const circle = document.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('cx', '0');
  circle.setAttribute('cy', '0');
  circle.setAttribute('r', String(r));
  circle.setAttribute('fill', `url(#${gradId})`);
  circle.setAttribute('stroke', color);
  circle.setAttribute('stroke-width', '2');
  innerG.appendChild(circle);

  const valueText = document.createElementNS(SVG_NS, 'text');
  valueText.setAttribute('x', '0');
  valueText.setAttribute('y', '6');
  valueText.setAttribute('text-anchor', 'middle');
  valueText.setAttribute('fill', color);
  valueText.setAttribute('font-size', String(Math.min(TYPOGRAPHY.fontSizeMetric, s * 0.8)));
  valueText.setAttribute('font-weight', '700');
  valueText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  valueText.textContent = value;
  innerG.appendChild(valueText);

  if (entity.label && entity.label !== value) {
    const labelText = document.createElementNS(SVG_NS, 'text');
    labelText.setAttribute('x', '0');
    labelText.setAttribute('y', String(r + 18));
    labelText.setAttribute('text-anchor', 'middle');
    labelText.setAttribute('fill', color);
    labelText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeBadge));
    labelText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    labelText.textContent = entity.label;
    innerG.appendChild(labelText);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
