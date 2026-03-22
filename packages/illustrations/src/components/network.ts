/**
 * @preplai/illustrations — Network Component
 *
 * Clean circle with a minimal network icon (3 dots connected in a triangle).
 * Use for: networks, mesh topologies, network segments.
 *
 * Minimalist style matching the Composable engine aesthetic.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import type { VisualEntity } from '@preplai/shared';

export function renderNetwork(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);

  const r = s * 0.42;

  // Highlight glow
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'circle');
    glow.setAttribute('cx', '0');
    glow.setAttribute('cy', '0');
    glow.setAttribute('r', String(r + 4));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // Circle shape
  const circle = document.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('cx', '0');
  circle.setAttribute('cy', '0');
  circle.setAttribute('r', String(r));
  circle.setAttribute('fill', cc.fill);
  circle.setAttribute('stroke', cc.stroke);
  circle.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(circle);

  // Network icon: 3 dots in a triangle connected by lines
  const iconR = r * 0.45;
  const dotR = iconR * 0.18;
  const nodes = [
    { x: 0, y: -iconR * 0.7 },                    // top
    { x: -iconR * 0.6, y: iconR * 0.5 },           // bottom-left
    { x: iconR * 0.6, y: iconR * 0.5 },             // bottom-right
  ];

  // Lines connecting nodes
  for (let i = 0; i < nodes.length; i++) {
    const j = (i + 1) % nodes.length;
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(nodes[i].x));
    line.setAttribute('y1', String(nodes[i].y));
    line.setAttribute('x2', String(nodes[j].x));
    line.setAttribute('y2', String(nodes[j].y));
    line.setAttribute('stroke', cc.stroke);
    line.setAttribute('stroke-width', String(STROKE.default));
    line.setAttribute('stroke-linecap', 'round');
    innerG.appendChild(line);
  }

  // Dots at each node
  for (const n of nodes) {
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(n.x));
    dot.setAttribute('cy', String(n.y));
    dot.setAttribute('r', String(dotR));
    dot.setAttribute('fill', cc.stroke);
    innerG.appendChild(dot);
  }

  // Label below
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(r + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('fill', cc.textPrimary);
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
