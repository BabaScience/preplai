/**
 * @pre/illustrations — Concept Component
 * Concept bubble: gradient circle + double-ring accent + centered label
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createRadialGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@pre/shared';

export function renderConcept(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Concept');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-concept-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createRadialGradient(gradId, color, defs);

  // Outer circle with gradient fill
  const outerCircle = document.createElementNS(SVG_NS, 'circle');
  outerCircle.setAttribute('cx', '0');
  outerCircle.setAttribute('cy', '0');
  outerCircle.setAttribute('r', String(s / 2));
  outerCircle.setAttribute('fill', `url(#${gradId})`);
  outerCircle.setAttribute('stroke', color);
  outerCircle.setAttribute('stroke-width', String(SHAPES.strokeWidthHeavy));
  innerG.appendChild(outerCircle);

  // Inner dashed ring (accent)
  const innerRing = document.createElementNS(SVG_NS, 'circle');
  innerRing.setAttribute('cx', '0');
  innerRing.setAttribute('cy', '0');
  innerRing.setAttribute('r', String(s / 2 - 8));
  innerRing.setAttribute('fill', 'none');
  innerRing.setAttribute('stroke', `${color}50`);
  innerRing.setAttribute('stroke-width', '1.5');
  innerRing.setAttribute('stroke-dasharray', '4,4');
  innerG.appendChild(innerRing);

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', '5');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(Math.min(TYPOGRAPHY.fontSizeTitle, s / 4)));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
