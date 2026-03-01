/**
 * @pre/illustrations — User Component
 * Human figure: head circle (radial gradient) + body arc (shoulders) + optional arm indicators
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createRadialGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY } from '../design-tokens.js';
import type { VisualEntity } from '@pre/shared';

export function renderUser(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity) * 0.8;
  const color = entity.color ?? getCategoryColor('User');
  const defs = ensureDefs(parentEl);
  const headGradId = `grad-user-head-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createRadialGradient(headGradId, color, defs);

  // Head with radial gradient for roundness
  const head = document.createElementNS(SVG_NS, 'circle');
  head.setAttribute('cx', '0');
  head.setAttribute('cy', String(-s / 3));
  head.setAttribute('r', String(s / 4));
  head.setAttribute('fill', `url(#${headGradId})`);
  head.setAttribute('stroke', color);
  head.setAttribute('stroke-width', '2');
  innerG.appendChild(head);

  // Body arc (shoulders) — improved curve
  const body = document.createElementNS(SVG_NS, 'path');
  body.setAttribute('d', `M ${-s / 2.5} ${s / 6} Q 0 ${-s / 6} ${s / 2.5} ${s / 6}`);
  body.setAttribute('fill', `${color}30`);
  body.setAttribute('stroke', color);
  body.setAttribute('stroke-width', '2');
  innerG.appendChild(body);

  // Simple arm indicators (short lines from shoulders)
  const armL = document.createElementNS(SVG_NS, 'line');
  armL.setAttribute('x1', String(-s / 2.5));
  armL.setAttribute('y1', String(s / 8));
  armL.setAttribute('x2', String(-s / 1.8));
  armL.setAttribute('y2', String(s / 4));
  armL.setAttribute('stroke', color);
  armL.setAttribute('stroke-width', '1.5');
  armL.setAttribute('opacity', '0.8');
  innerG.appendChild(armL);
  const armR = document.createElementNS(SVG_NS, 'line');
  armR.setAttribute('x1', String(s / 2.5));
  armR.setAttribute('y1', String(s / 8));
  armR.setAttribute('x2', String(s / 1.8));
  armR.setAttribute('y2', String(s / 4));
  armR.setAttribute('stroke', color);
  armR.setAttribute('stroke-width', '1.5');
  armR.setAttribute('opacity', '0.8');
  innerG.appendChild(armR);

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(s / 2 + 20));
    text.setAttribute('text-anchor', 'middle');
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
