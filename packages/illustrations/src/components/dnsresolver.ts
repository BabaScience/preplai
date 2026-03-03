/**
 * @preplai/illustrations — DNS Resolver Component
 * Cloud shape + magnifying glass / lookup icon (distinct from Cloud)
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createRadialGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderDNSResolver(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('DNSResolver');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-dns-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createRadialGradient(gradId, color, defs);

  // ── Cloud ellipses (like Cloud but slightly different proportions)
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

  // ── Magnifying glass (lookup icon) centered
  const magR = s / 5;
  const magCircle = document.createElementNS(SVG_NS, 'circle');
  magCircle.setAttribute('cx', String(s / 6));
  magCircle.setAttribute('cy', String(-s / 8));
  magCircle.setAttribute('r', String(magR));
  magCircle.setAttribute('fill', 'none');
  magCircle.setAttribute('stroke', color);
  magCircle.setAttribute('stroke-width', String(SHAPES.strokeWidthThin));
  innerG.appendChild(magCircle);

  const handleLen = magR * 1.2;
  const handleLine = document.createElementNS(SVG_NS, 'line');
  handleLine.setAttribute('x1', String(s / 6 + magR * 0.7));
  handleLine.setAttribute('y1', String(-s / 8 + magR * 0.7));
  handleLine.setAttribute('x2', String(s / 6 + magR * 0.7 + handleLen));
  handleLine.setAttribute('y2', String(-s / 8 + magR * 0.7 + handleLen));
  handleLine.setAttribute('stroke', color);
  handleLine.setAttribute('stroke-width', String(SHAPES.strokeWidthThin));
  innerG.appendChild(handleLine);

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
