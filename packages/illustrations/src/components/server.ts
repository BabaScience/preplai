/**
 * @preplai/illustrations — Server Component
 * Rack server: gradient body + rack stripes + LED dots with glow + label
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderServer(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const size = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Server');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-server-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const w = size * 1.4;
  const h = size;

  // ── Server body with gradient (top lighter)
  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x', String(-w / 2));
  body.setAttribute('y', String(-h / 2));
  body.setAttribute('width', String(w));
  body.setAttribute('height', String(h * 0.8));
  body.setAttribute('rx', String(SHAPES.borderRadius - 2));
  body.setAttribute('fill', `url(#${gradId})`);
  body.setAttribute('stroke', color);
  body.setAttribute('stroke-width', String(SHAPES.strokeWidth));
  innerG.appendChild(body);

  // ── Rack stripe lines (more pronounced)
  const lineOffsets = [-size / 6, 0, size / 6];
  for (const oy of lineOffsets) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(-w / 2));
    line.setAttribute('x2', String(w / 2));
    line.setAttribute('y1', String(oy));
    line.setAttribute('y2', String(oy));
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '1.5');
    line.setAttribute('opacity', '0.6');
    innerG.appendChild(line);
  }

  // ── LED status dots (green, amber, power) with subtle glow
  const dotConfig = [
    { cx: -w / 3, cy: -size / 3, fill: color, glow: true },
    { cx: -w / 6, cy: -size / 3, fill: color, glow: true },
    { cx: w / 6, cy: -size / 3, fill: '#28c840', glow: false },
  ];
  for (const { cx, cy, fill, glow } of dotConfig) {
    if (glow) {
      const glowCircle = document.createElementNS(SVG_NS, 'circle');
      glowCircle.setAttribute('cx', String(cx));
      glowCircle.setAttribute('cy', String(cy));
      glowCircle.setAttribute('r', '5');
      glowCircle.setAttribute('fill', 'none');
      glowCircle.setAttribute('stroke', fill);
      glowCircle.setAttribute('stroke-width', '1');
      glowCircle.setAttribute('opacity', '0.4');
      innerG.appendChild(glowCircle);
    }
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(cx));
    dot.setAttribute('cy', String(cy));
    dot.setAttribute('r', '3');
    dot.setAttribute('fill', fill);
    dot.setAttribute('opacity', '0.9');
    innerG.appendChild(dot);
  }

  // ── Label
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(h / 2 + 20));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeTitle));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
