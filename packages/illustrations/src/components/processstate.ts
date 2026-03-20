/**
 * @preplai/illustrations — ProcessState Component
 *
 * Process state diagram with clean circles and transition arrows.
 * Use for: Ready/Running/Blocked diagrams, state machines.
 *
 * Metadata: { states: [{ name, type }], transitions?: [{ from, to }] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
  TYPOGRAPHY,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

interface StateDef { name: string; type?: 'ready' | 'running' | 'blocked'; }
interface TransitionDef { from: string; to: string; }

const STATE_COLORS: Record<string, string> = {
  ready: '#ffab00',
  running: '#00e676',
  blocked: '#ff5252',
};

export function renderProcessState(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const strokeWidth = getStrokeWidth('thin', scale);
  const defaultColor = entity.color ?? getCategoryColor('ProcessState');

  const meta = entity.metadata ?? {};
  const states: StateDef[] = (meta.states as StateDef[]) ?? [
    { name: 'Ready', type: 'ready' },
    { name: 'Running', type: 'running' },
    { name: 'Blocked', type: 'blocked' },
  ];
  const transitions: TransitionDef[] = (meta.transitions as TransitionDef[]) ?? [
    { from: 'Ready', to: 'Running' },
    { from: 'Running', to: 'Ready' },
    { from: 'Running', to: 'Blocked' },
    { from: 'Blocked', to: 'Ready' },
  ];

  const defs = ensureDefs(parentEl);
  const r = s * 0.28;
  const spacing = s * 0.6;

  // Position states
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

  // Arrow marker
  const markerId = `arrow-ps-${entity.id.replace(/[^a-z0-9]/gi, '')}`;
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
    poly.setAttribute('fill', colorWithAlpha(defaultColor, OPACITY.strokeMuted));
    marker.appendChild(poly);
    defs.appendChild(marker);
  }

  // Transition lines
  transitions.forEach(({ from, to }) => {
    const p1 = positions[from];
    const p2 = positions[to];
    if (!p1 || !p2) return;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / len;
    const ny = dy / len;
    const trim = r + 5;

    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(p1.x + nx * trim));
    line.setAttribute('y1', String(p1.y + ny * trim));
    line.setAttribute('x2', String(p2.x - nx * trim));
    line.setAttribute('y2', String(p2.y - ny * trim));
    line.setAttribute('stroke', colorWithAlpha(defaultColor, OPACITY.strokeMuted));
    line.setAttribute('stroke-width', String(strokeWidth));
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('marker-end', `url(#${markerId})`);
    innerG.appendChild(line);
  });

  // State circles
  states.forEach((st) => {
    const pos = positions[st.name] ?? { x: 0, y: 0 };
    const stateColor = STATE_COLORS[(st.type ?? '').toLowerCase()] ?? defaultColor;
    const gId = `grad-ps-${entity.id.replace(/[^a-z0-9]/gi, '')}-${st.name}`;
    if (!defs.querySelector(`#${gId}`)) {
      createLinearGradient(gId, stateColor, 'vertical', defs);
    }

    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(pos.x));
    circle.setAttribute('cy', String(pos.y));
    circle.setAttribute('r', String(r));
    circle.setAttribute('fill', `url(#${gId})`);
    circle.setAttribute('stroke', stateColor);
    circle.setAttribute('stroke-width', String(strokeWidth));
    innerG.appendChild(circle);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(pos.x));
    text.setAttribute('y', String(pos.y + r + LABEL_DEFAULTS.offsetBelow * 0.7));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', stateColor);
    text.setAttribute('font-size', String(getLabelFontSize('value', scale)));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = st.name;
    innerG.appendChild(text);
  });

  // Label below
  if (entity.label) {
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String(spacing + LABEL_DEFAULTS.offsetBelow));
    labelEl.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    labelEl.setAttribute('fill', defaultColor);
    labelEl.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    labelEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    labelEl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    labelEl.textContent = entity.label;
    innerG.appendChild(labelEl);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
