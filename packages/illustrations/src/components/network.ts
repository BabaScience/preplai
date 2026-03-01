/**
 * @pre/illustrations — Network Component
 * Network mesh: central node + 6 radiating spokes
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createRadialGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY } from '../design-tokens.js';
import type { VisualEntity } from '@pre/shared';

export function renderNetwork(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Network');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-network-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createRadialGradient(gradId, color, defs);

  const centerR = s / 6;
  const spokeCount = 6;
  const spokeLen = s / 2.5;

  // ── Radiating spokes
  for (let i = 0; i < spokeCount; i++) {
    const angle = (Math.PI * 2 * i) / spokeCount - Math.PI / 2;
    const x2 = Math.cos(angle) * spokeLen;
    const y2 = Math.sin(angle) * spokeLen;
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', '0');
    line.setAttribute('y1', '0');
    line.setAttribute('x2', String(x2));
    line.setAttribute('y2', String(y2));
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '2');
    line.setAttribute('opacity', '0.7');
    innerG.appendChild(line);

    // End node
    const endNode = document.createElementNS(SVG_NS, 'circle');
    endNode.setAttribute('cx', String(x2));
    endNode.setAttribute('cy', String(y2));
    endNode.setAttribute('r', String(centerR * 0.6));
    endNode.setAttribute('fill', `${color}30`);
    endNode.setAttribute('stroke', color);
    endNode.setAttribute('stroke-width', '1.5');
    innerG.appendChild(endNode);
  }

  // ── Central node
  const center = document.createElementNS(SVG_NS, 'circle');
  center.setAttribute('cx', '0');
  center.setAttribute('cy', '0');
  center.setAttribute('r', String(centerR));
  center.setAttribute('fill', `url(#${gradId})`);
  center.setAttribute('stroke', color);
  center.setAttribute('stroke-width', '2');
  innerG.appendChild(center);

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
