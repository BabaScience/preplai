/**
 * @preplai/illustrations — Set Component
 * Venn-like overlapping circles; "unique" visual
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createRadialGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderSet(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Set');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-set-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createRadialGradient(gradId, color, defs);

  const r = s / 3;
  const overlap = r * 0.4;

  // ── Three overlapping circles (Venn diagram style)
  const circles = [
    { cx: -overlap, cy: -r * 0.3, r },
    { cx: overlap, cy: -r * 0.3, r },
    { cx: 0, cy: r * 0.5, r },
  ];

  for (const c of circles) {
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(c.cx));
    circle.setAttribute('cy', String(c.cy));
    circle.setAttribute('r', String(c.r));
    circle.setAttribute('fill', `${color}20`);
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', '2');
    innerG.appendChild(circle);
  }

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(r * 2 + 18));
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
