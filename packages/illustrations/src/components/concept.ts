/**
 * @pre/illustrations — Concept Component
 * Concept bubble: outer circle + dashed inner ring + centered label
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import type { VisualEntity } from '@pre/shared';

export function renderConcept(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? '#00e5ff';

  // Outer solid circle
  const outerCircle = document.createElementNS(SVG_NS, 'circle');
  outerCircle.setAttribute('cx', '0');
  outerCircle.setAttribute('cy', '0');
  outerCircle.setAttribute('r', String(s / 2));
  outerCircle.setAttribute('fill', `${color}15`);
  outerCircle.setAttribute('stroke', color);
  outerCircle.setAttribute('stroke-width', '2.5');
  innerG.appendChild(outerCircle);

  // Inner dashed ring
  const innerRing = document.createElementNS(SVG_NS, 'circle');
  innerRing.setAttribute('cx', '0');
  innerRing.setAttribute('cy', '0');
  innerRing.setAttribute('r', String(s / 2 - 8));
  innerRing.setAttribute('fill', 'none');
  innerRing.setAttribute('stroke', `${color}40`);
  innerRing.setAttribute('stroke-width', '1');
  innerRing.setAttribute('stroke-dasharray', '4,4');
  innerG.appendChild(innerRing);

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', '5');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(Math.min(13, s / 5)));
    text.setAttribute('font-weight', '600');
    text.setAttribute('font-family', 'Geist Mono, monospace');
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
