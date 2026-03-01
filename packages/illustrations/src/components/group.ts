/**
 * @pre/illustrations — Group Component
 * Large dashed rect, label above, corner accents
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY } from '../design-tokens.js';
import type { VisualEntity } from '@pre/shared';

export function renderGroup(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity, 1.5);
  const color = entity.color ?? getCategoryColor('Group');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-group-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const w = s * 2.2;
  const h = s * 1.8;

  const border = document.createElementNS(SVG_NS, 'rect');
  border.setAttribute('x', String(-w / 2));
  border.setAttribute('y', String(-h / 2));
  border.setAttribute('width', String(w));
  border.setAttribute('height', String(h));
  border.setAttribute('rx', '8');
  border.setAttribute('fill', `url(#${gradId})`);
  border.setAttribute('stroke', color);
  border.setAttribute('stroke-width', '2');
  border.setAttribute('stroke-dasharray', '8,6');
  innerG.appendChild(border);

  // Corner accents
  const accLen = 12;
  [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => {
    const ax = (sx * w) / 2;
    const ay = (sy * h) / 2;
    const line1 = document.createElementNS(SVG_NS, 'line');
    line1.setAttribute('x1', String(ax));
    line1.setAttribute('y1', String(ay));
    line1.setAttribute('x2', String(ax + sx * accLen));
    line1.setAttribute('y2', String(ay));
    line1.setAttribute('stroke', color);
    line1.setAttribute('stroke-width', '2');
    line1.setAttribute('opacity', '0.8');
    innerG.appendChild(line1);
    const line2 = document.createElementNS(SVG_NS, 'line');
    line2.setAttribute('x1', String(ax));
    line2.setAttribute('y1', String(ay));
    line2.setAttribute('x2', String(ax));
    line2.setAttribute('y2', String(ay + sy * accLen));
    line2.setAttribute('stroke', color);
    line2.setAttribute('stroke-width', '2');
    line2.setAttribute('opacity', '0.8');
    innerG.appendChild(line2);
  });

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(-h / 2 - 12));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeTitle));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
