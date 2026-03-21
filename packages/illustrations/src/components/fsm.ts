/**
 * @preplai/illustrations — FSM Component
 * Finite state machine: circles (states) with arrows (transitions)
 *
 * Metadata: { states: [{ id, label }], transitions: [{ from, to }] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  TYPOGRAPHY,
  LABEL_DEFAULTS,
  colorWithAlpha,
  OPACITY,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

type StateDef = { id: string; label?: string };
type TransitionDef = { from: string; to: string };

export function renderFSM(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const strokeWidth = getStrokeWidth('minimal', scale);
  const fontSize = getLabelFontSize('value', scale);
  const color = entity.color ?? getCategoryColor('FSM');
  const defs = ensureDefs(parentEl);

  const meta = entity.metadata ?? {};
  const statesData = (meta.states as StateDef[] | undefined) ?? [
    { id: 'q0', label: 'q0' },
    { id: 'q1', label: 'q1' },
    { id: 'q2', label: 'q2' },
  ];
  const transitionsData = (meta.transitions as TransitionDef[] | undefined) ?? [
    { from: 'q0', to: 'q1' },
    { from: 'q1', to: 'q2' },
    { from: 'q2', to: 'q0' },
  ];

  const states: StateDef[] = Array.isArray(statesData)
    ? statesData.slice(0, 6).filter((st) => st && typeof st === 'object' && st.id)
    : [{ id: 'q0', label: 'q0' }];
  const transitions: TransitionDef[] = Array.isArray(transitionsData)
    ? transitionsData.filter((t) => t && t.from && t.to)
    : [];

  const r = s * 0.28;
  const spacing = s * 0.55;
  const positions: Record<string, { x: number; y: number }> = {};
  states.forEach((st, i) => {
    const angle = (i / Math.max(1, states.length)) * Math.PI * 2 - Math.PI / 2;
    positions[st.id] = { x: Math.cos(angle) * spacing, y: Math.sin(angle) * spacing };
  });

  const markerId = `arrow-fsm-${entity.id.replace(/[^a-z0-9]/gi, '')}`;
  if (!defs.querySelector(`#${markerId}`)) {
    const marker = document.createElementNS(SVG_NS, 'marker');
    marker.setAttribute('id', markerId);
    marker.setAttribute('markerWidth', '8');
    marker.setAttribute('markerHeight', '6');
    marker.setAttribute('refX', '7');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    const poly = document.createElementNS(SVG_NS, 'polygon');
    poly.setAttribute('points', '0 0, 8 3, 0 6');
    poly.setAttribute('fill', color);
    marker.appendChild(poly);
    defs.appendChild(marker);
  }

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
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', String(strokeWidth));
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('marker-end', `url(#${markerId})`);
    innerG.appendChild(line);
  });

  states.forEach((st) => {
    const pos = positions[st.id] ?? { x: 0, y: 0 };
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(pos.x));
    circle.setAttribute('cy', String(pos.y));
    circle.setAttribute('r', String(r));
    circle.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', String(strokeWidth));
    innerG.appendChild(circle);

    const label = st.label ?? st.id;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(pos.x));
    text.setAttribute('y', String(pos.y + 4));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(fontSize));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = label.length > 6 ? label.slice(0, 4) + '…' : label;
    innerG.appendChild(text);
  });

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(spacing + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
