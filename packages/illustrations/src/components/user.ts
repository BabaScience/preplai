/**
 * @pre/illustrations — User Component
 * Human figure: head circle + body arc (shoulders)
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import type { VisualEntity } from '@pre/shared';

export function renderUser(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity) * 0.8;
  const color = entity.color ?? '#ff2d7b';

  // Head
  const head = document.createElementNS(SVG_NS, 'circle');
  head.setAttribute('cx', '0');
  head.setAttribute('cy', String(-s / 3));
  head.setAttribute('r', String(s / 4));
  head.setAttribute('fill', `${color}30`);
  head.setAttribute('stroke', color);
  head.setAttribute('stroke-width', '2');
  innerG.appendChild(head);

  // Body arc (shoulders)
  const body = document.createElementNS(SVG_NS, 'path');
  body.setAttribute('d', `M ${-s / 2.5} ${s / 6} Q 0 ${-s / 6} ${s / 2.5} ${s / 6}`);
  body.setAttribute('fill', `${color}30`);
  body.setAttribute('stroke', color);
  body.setAttribute('stroke-width', '2');
  innerG.appendChild(body);

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(s / 2 + 20));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', '12');
    text.setAttribute('font-family', 'Inter, DM Sans, sans-serif');
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
