/**
 * @preplai/illustrations — ProcessState Component
 *
 * Process state diagram: Ready / Running / Blocked with transitions.
 * State-specific colors: ready=amber, running=green, blocked=red.
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

interface StateDef {
  name: string;
  type?: 'ready' | 'running' | 'blocked';
}

interface TransitionDef {
  from: string;
  to: string;
}

const STATE_COLORS: Record<string, string> = {
  ready: '#ffab00',
  running: '#00e676',
  blocked: '#ff5252',
};

function getStateColor(st: StateDef, defaultColor: string): string {
  const t = (st.type ?? '').toLowerCase();
  return STATE_COLORS[t] ?? defaultColor;
}

export function renderProcessState(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const strokeWidth = getStrokeWidth('default', scale);
  const stateFontSize = getLabelFontSize('value', scale);
  const defaultColor = entity.color ?? getCategoryColor('ProcessState');

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

  const defs = ensureDefs(parentEl);

  const r = s * 0.32;
  const spacing = s * 0.65;
  const positions: Record<string, { x: number; y: number }> = {};
  if (states.length === 3) {
    positions[states[0].name] = { x: -spacing, y: 0 };
    positions[states[1].name] = { x: 0, y: -spacing * 0.65 };
    positions[states[2].name] = { x: spacing, y: 0 };
  } else {
    states.forEach((st, i) => {
      const angle = (i / states.length) * Math.PI * 2 - Math.PI / 2;
      positions[st.name] = { x: Math.cos(angle) * spacing, y: Math.sin(angle) * spacing };
    });
  }

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
    poly.setAttribute('fill', colorWithAlpha(defaultColor, OPACITY.strokeSoft));
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
    const trim = r + 6;
    const x1 = p1.x + nx * trim;
    const y1 = p1.y + ny * trim;
    const x2 = p2.x - nx * trim;
    const y2 = p2.y - ny * trim;

    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(x1));
    line.setAttribute('y1', String(y1));
    line.setAttribute('x2', String(x2));
    line.setAttribute('y2', String(y2));
    line.setAttribute('stroke', colorWithAlpha(defaultColor, OPACITY.strokeSoft));
    line.setAttribute('stroke-width', String(strokeWidth));
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('marker-end', `url(#${markerId})`);
    innerG.appendChild(line);
  });

  states.forEach((st) => {
    const pos = positions[st.name] ?? { x: 0, y: 0 };
    const stateColor = getStateColor(st, defaultColor);
    const gradId = `grad-ps-${entity.id.replace(/[^a-z0-9]/gi, '')}-${st.name}`;
    if (!defs.querySelector(`#${gradId}`)) {
      createLinearGradient(gradId, stateColor, 'vertical', defs);
    }

    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(pos.x));
    circle.setAttribute('cy', String(pos.y));
    circle.setAttribute('r', String(r));
    circle.setAttribute('fill', `url(#${gradId})`);
    circle.setAttribute('stroke', stateColor);
    circle.setAttribute('stroke-width', String(strokeWidth));
    innerG.appendChild(circle);

    const dotR = r * 0.2;
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(pos.x));
    dot.setAttribute('cy', String(pos.y - r * 0.4));
    dot.setAttribute('r', String(dotR));
    if (st.type === 'running') {
      dot.setAttribute('fill', stateColor);
    } else {
      dot.setAttribute('fill', 'none');
      dot.setAttribute('stroke', stateColor);
      dot.setAttribute('stroke-width', String(strokeWidth * 0.6));
    }
    innerG.appendChild(dot);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(pos.x));
    text.setAttribute('y', String(pos.y + r * 0.5 + 4));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', stateColor);
    text.setAttribute('font-size', String(stateFontSize));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = st.name;
    innerG.appendChild(text);
  });

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
