/**
 * @preplai/illustrations — Cache Component
 * Circle with lightning bolt path inside
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createRadialGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderCache(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Cache');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-cache-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createRadialGradient(gradId, color, defs);

  const r = s / 2;

  // ── Circle
  const circle = document.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('cx', '0');
  circle.setAttribute('cy', '0');
  circle.setAttribute('r', String(r));
  circle.setAttribute('fill', `url(#${gradId})`);
  circle.setAttribute('stroke', color);
  circle.setAttribute('stroke-width', '2');
  innerG.appendChild(circle);

  // ── Lightning bolt (simplified path)
  const boltScale = r * 0.35;
  const boltPath = [
    `M 0 ${-boltScale}`,
    `L ${boltScale * 0.5} 0`,
    `L ${-boltScale * 0.3} ${boltScale * 0.3}`,
    `L ${boltScale * 0.2} ${boltScale}`,
    `L ${-boltScale * 0.5} ${boltScale * 0.2}`,
    `L 0 0`,
    'Z',
  ].join(' ');
  const bolt = document.createElementNS(SVG_NS, 'path');
  bolt.setAttribute('d', boltPath);
  bolt.setAttribute('fill', color);
  bolt.setAttribute('opacity', '0.9');
  innerG.appendChild(bolt);

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(r + 18));
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
