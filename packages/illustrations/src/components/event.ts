/**
 * @preplai/illustrations — Event Component
 * Domain event / message: hexagon with lightning bolt + event name
 * Metadata: { eventName?: string, payload?: string }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  TYPOGRAPHY,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderEvent(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Event');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-event-${entity.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const label = entity.label ?? 'Event';
  const r = s * 0.45;

  // Hexagon shape (event = signal)
  const hex = document.createElementNS(SVG_NS, 'polygon');
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    points.push(`${r * Math.cos(angle)},${r * Math.sin(angle)}`);
  }
  hex.setAttribute('points', points.join(' '));
  hex.setAttribute('fill', `url(#${gradId})`);
  hex.setAttribute('stroke', color);
  hex.setAttribute('stroke-width', String(getStrokeWidth('default', scale)));
  innerG.appendChild(hex);

  // Lightning bolt icon (small, centered)
  const bolt = document.createElementNS(SVG_NS, 'path');
  bolt.setAttribute('d', 'M 2,-8 L -3,-1 L 1,-1 L -2,8 L 3,1 L -1,1 Z');
  bolt.setAttribute('fill', color);
  bolt.setAttribute('opacity', '0.5');
  innerG.appendChild(bolt);

  // Label below
  if (label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(r + 18));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
