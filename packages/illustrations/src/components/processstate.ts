/**
 * @preplai/illustrations — ProcessState Component
 * Process state diagram: Ready / Running / Blocked with transitions
 *
 * Metadata: { states: [{ name, type }], transitions?: [{ from, to }] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

interface StateDef {
  name: string;
  type?: 'ready' | 'running' | 'blocked';
}

interface TransitionDef {
  from: string;
  to: string;
}

export function renderProcessState(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity, 1.5);
  const color = entity.color ?? getCategoryColor('ProcessState');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-ps-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const statesData = meta.states as StateDef[] | undefined;
  const transitionsData = meta.transitions as TransitionDef[] | undefined;

  const states: StateDef[] = statesData ?? [
    { name: 'Ready', type: 'ready' },
    { name: 'Running', type: 'running' },
    { name: 'Blocked', type: 'blocked' },
  ];
  const transitions: TransitionDef[] = transitionsData ?? [
    { from: 'Ready', to: 'Running' },
    { from: 'Running', to: 'Ready' },
    { from: 'Running', to: 'Blocked' },
    { from: 'Blocked', to: 'Ready' },
  ];

  // Layout: three circles in a row or triangle
  const r = s * 0.35;
  const spacing = s * 0.6;
  const positions: Record<string, { x: number; y: number }> = {};
  if (states.length === 3) {
    positions[states[0].name] = { x: -spacing, y: 0 };
    positions[states[1].name] = { x: 0, y: -spacing * 0.6 };
    positions[states[2].name] = { x: spacing, y: 0 };
  } else {
    states.forEach((st, i) => {
      const angle = (i / states.length) * Math.PI * 2 - Math.PI / 2;
      positions[st.name] = { x: Math.cos(angle) * spacing, y: Math.sin(angle) * spacing };
    });
  }

  // Ensure arrow marker in defs
  const markerId = `arrow-ps-${entity.id.replace(/[^a-z0-9]/gi, '')}`;
  if (!defs.querySelector(`#${markerId}`)) {
    const marker = document.createElementNS(SVG_NS, 'marker');
    marker.setAttribute('id', markerId);
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '8');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '4');
    marker.setAttribute('orient', 'auto');
    const poly = document.createElementNS(SVG_NS, 'polygon');
    poly.setAttribute('points', '0 0, 10 4, 0 8');
    poly.setAttribute('fill', `${color}80`);
    marker.appendChild(poly);
    defs.appendChild(marker);
  }

  // Draw transition arrows
  transitions.forEach(({ from, to }) => {
    const p1 = positions[from];
    const p2 = positions[to];
    if (!p1 || !p2) return;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / len;
    const ny = dy / len;
    const trim = r + 4;
    const x1 = p1.x + nx * trim;
    const y1 = p1.y + ny * trim;
    const x2 = p2.x - nx * trim;
    const y2 = p2.y - ny * trim;

    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(x1));
    line.setAttribute('y1', String(y1));
    line.setAttribute('x2', String(x2));
    line.setAttribute('y2', String(y2));
    line.setAttribute('stroke', `${color}80`);
    line.setAttribute('stroke-width', '2');
    line.setAttribute('marker-end', `url(#${markerId})`);
    innerG.appendChild(line);
  });

  // Draw state circles
  states.forEach((st) => {
    const pos = positions[st.name] ?? { x: 0, y: 0 };
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(pos.x));
    circle.setAttribute('cy', String(pos.y));
    circle.setAttribute('r', String(r));
    circle.setAttribute('fill', `url(#${gradId})`);
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', String(SHAPES.strokeWidth));
    innerG.appendChild(circle);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(pos.x));
    text.setAttribute('y', String(pos.y + 4));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', '10');
    text.setAttribute('font-weight', '600');
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = st.name;
    innerG.appendChild(text);
  });

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(spacing + 24));
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
