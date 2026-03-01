/**
 * @pre/illustrations — LoadBalancer Component
 * Hexagon with Y-fork / branching lines inside
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY } from '../design-tokens.js';
import type { VisualEntity } from '@pre/shared';

export function renderLoadBalancer(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('LoadBalancer');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-lb-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const hexPoints = [0, 1, 2, 3, 4, 5]
    .map(i => {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      return `${(Math.cos(angle) * s * 0.5).toFixed(1)},${(Math.sin(angle) * s * 0.5).toFixed(1)}`;
    })
    .join(' ');

  const polygon = document.createElementNS(SVG_NS, 'polygon');
  polygon.setAttribute('points', hexPoints);
  polygon.setAttribute('fill', `url(#${gradId})`);
  polygon.setAttribute('stroke', color);
  polygon.setAttribute('stroke-width', '2');
  innerG.appendChild(polygon);

  // ── Y-fork lines (input top, outputs bottom-left and bottom-right)
  const forkY = -s * 0.15;
  const forkOutY = s * 0.2;
  const forkOutX = s * 0.25;

  const lineIn = document.createElementNS(SVG_NS, 'line');
  lineIn.setAttribute('x1', '0');
  lineIn.setAttribute('y1', String(-s * 0.4));
  lineIn.setAttribute('x2', '0');
  lineIn.setAttribute('y2', String(forkY));
  lineIn.setAttribute('stroke', color);
  lineIn.setAttribute('stroke-width', '2');
  lineIn.setAttribute('opacity', '0.8');
  innerG.appendChild(lineIn);

  const lineOutL = document.createElementNS(SVG_NS, 'line');
  lineOutL.setAttribute('x1', '0');
  lineOutL.setAttribute('y1', String(forkY));
  lineOutL.setAttribute('x2', String(-forkOutX));
  lineOutL.setAttribute('y2', String(forkOutY));
  lineOutL.setAttribute('stroke', color);
  lineOutL.setAttribute('stroke-width', '2');
  lineOutL.setAttribute('opacity', '0.8');
  innerG.appendChild(lineOutL);

  const lineOutR = document.createElementNS(SVG_NS, 'line');
  lineOutR.setAttribute('x1', '0');
  lineOutR.setAttribute('y1', String(forkY));
  lineOutR.setAttribute('x2', String(forkOutX));
  lineOutR.setAttribute('y2', String(forkOutY));
  lineOutR.setAttribute('stroke', color);
  lineOutR.setAttribute('stroke-width', '2');
  lineOutR.setAttribute('opacity', '0.8');
  innerG.appendChild(lineOutR);

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
