/**
 * @pre/illustrations — Server Component
 * Rack server: rect body + horizontal stripe lines + LED dots + label
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import type { VisualEntity } from '@pre/shared';

export function renderServer(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const size = getSizeParam(entity);
  const color = entity.color ?? '#00e5ff';

  const w = size * 1.4;
  const h = size;

  // ── Server body
  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x', String(-w / 2));
  body.setAttribute('y', String(-h / 2));
  body.setAttribute('width', String(w));
  body.setAttribute('height', String(h * 0.8));
  body.setAttribute('rx', '4');
  body.setAttribute('fill', `${color}15`);
  body.setAttribute('stroke', color);
  body.setAttribute('stroke-width', '2');
  innerG.appendChild(body);

  // ── Rack stripe lines (3 divisions)
  const lineOffsets = [-size / 6, 0, size / 6];
  for (const oy of lineOffsets) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(-w / 2));
    line.setAttribute('x2', String(w / 2));
    line.setAttribute('y1', String(oy));
    line.setAttribute('y2', String(oy));
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', '1');
    line.setAttribute('opacity', '0.5');
    innerG.appendChild(line);
  }

  // ── LED status dots
  const dotPositions = [
    { cx: -w / 3, cy: -size / 3 },
    { cx: -w / 6, cy: -size / 3 },
  ];
  for (const { cx, cy } of dotPositions) {
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(cx));
    dot.setAttribute('cy', String(cy));
    dot.setAttribute('r', '3');
    dot.setAttribute('fill', color);
    dot.setAttribute('opacity', '0.8');
    innerG.appendChild(dot);
  }

  // ── Label
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(h / 2 + 20));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', '14');
    text.setAttribute('font-weight', '500');
    text.setAttribute('font-family', 'Inter, DM Sans, sans-serif');
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
