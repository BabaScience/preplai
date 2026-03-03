/**
 * @preplai/illustrations — Cloud Component
 * Cloud shape: overlapping ellipses with subtle gradient per ellipse for depth
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createRadialGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderCloud(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Cloud');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-cloud-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createRadialGradient(gradId, color, defs);

  const ellipses = [
    { cx: -s / 4, cy: 0, rx: s / 3, ry: s / 4 },
    { cx: s / 6, cy: 0, rx: s / 2.5, ry: s / 3.5 },
    { cx: 0, cy: -s / 6, rx: s / 3.5, ry: s / 3 },
  ];

  for (const e of ellipses) {
    const el = document.createElementNS(SVG_NS, 'ellipse');
    el.setAttribute('cx', String(e.cx));
    el.setAttribute('cy', String(e.cy));
    el.setAttribute('rx', String(e.rx));
    el.setAttribute('ry', String(e.ry));
    el.setAttribute('fill', `url(#${gradId})`);
    el.setAttribute('stroke', color);
    el.setAttribute('stroke-width', String(SHAPES.strokeWidth));
    innerG.appendChild(el);
  }

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
