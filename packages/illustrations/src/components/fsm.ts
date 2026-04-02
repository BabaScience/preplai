/**
 * @preplai/illustrations — FSM Component (Cinematic Depth)
 *
 * Finite state machine: circles (states) with arrows (transitions).
 * Cinematic depth: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (state breathe + float).
 *
 * Metadata: { states: [{ id, label }], transitions: [{ from, to }] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, LABEL_DEFAULTS } from '../design-tokens.js';import { resolveColorCascade } from '../color-cascade.js';import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

type StateDef = { id: string; label?: string };
type TransitionDef = { from: string; to: string };

export function renderFSM(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const _scale = size / 50;
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

  const r = size * 0.28;
  const spacing = size * 0.55;
  const positions: Record<string, { x: number; y: number }> = {};
  states.forEach((st, i) => {
    const angle = (i / Math.max(1, states.length)) * Math.PI * 2 - Math.PI / 2;
    positions[st.id] = { x: Math.cos(angle) * spacing, y: Math.sin(angle) * spacing };
  });

  // Bounding box
  const allPos = Object.values(positions);
  const bbMinX = Math.min(...allPos.map(p => p.x)) - r - 15;
  const bbMaxX = Math.max(...allPos.map(p => p.x)) + r + 15;
  const bbMinY = Math.min(...allPos.map(p => p.y)) - r - 15;
  const bbMaxY = Math.max(...allPos.map(p => p.y)) + r + 15;
  const bbW = bbMaxX - bbMinX;
  const bbH = bbMaxY - bbMinY;

  // ── Pillar 1: Directional Lighting ─────────────────────────────────
  const haloId = `fsm-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const g = document.createElementNS(SVG_NS, 'radialGradient');
    g.setAttribute('id', haloId);
    g.setAttribute('cx', '38%'); g.setAttribute('cy', '38%'); g.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.13');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0');
    g.appendChild(s1); g.appendChild(s2);
    defs.appendChild(g);
  }
  const halo = document.createElementNS(SVG_NS, 'rect');
  halo.setAttribute('x', String(bbMinX)); halo.setAttribute('y', String(bbMinY));
  halo.setAttribute('width', String(bbW)); halo.setAttribute('height', String(bbH));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ────────────────────────────────────────
  const gsId = `fsm-gs-${entityId}`;
  if (!defs.querySelector(`#${gsId}`)) {
    const g = document.createElementNS(SVG_NS, 'radialGradient');
    g.setAttribute('id', gsId);
    g.setAttribute('cx', '50%'); g.setAttribute('cy', '50%'); g.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#000000'); s1.setAttribute('stop-opacity', '0.18');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#000000'); s2.setAttribute('stop-opacity', '0');
    g.appendChild(s1); g.appendChild(s2);
    defs.appendChild(g);
  }
  const gs = document.createElementNS(SVG_NS, 'ellipse');
  gs.setAttribute('cx', '0');
  gs.setAttribute('cy', String(bbMaxY + 4));
  gs.setAttribute('rx', String(bbW * 0.35));
  gs.setAttribute('ry', String(bbH * 0.06));
  gs.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(gs);

  // ── Pillar 3: Ambient Occlusion ────────────────────────────────────
  const aoId = `fsm-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const g = document.createElementNS(SVG_NS, 'radialGradient');
    g.setAttribute('id', aoId);
    g.setAttribute('cx', '70%'); g.setAttribute('cy', '75%'); g.setAttribute('r', '55%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#000000'); s1.setAttribute('stop-opacity', '0.10');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#000000'); s2.setAttribute('stop-opacity', '0');
    g.appendChild(s1); g.appendChild(s2);
    defs.appendChild(g);
  }
  const ao = document.createElementNS(SVG_NS, 'rect');
  ao.setAttribute('x', String(bbMinX)); ao.setAttribute('y', String(bbMinY));
  ao.setAttribute('width', String(bbW)); ao.setAttribute('height', String(bbH));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Arrow marker ───────────────────────────────────────────────────
  const markerId = `fsm-arrow-${entityId}`;
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

  // ── Transitions ────────────────────────────────────────────────────
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
    line.setAttribute('x1', String(x1)); line.setAttribute('y1', String(y1));
    line.setAttribute('x2', String(x2)); line.setAttribute('y2', String(y2));
    line.setAttribute('stroke', cc.stroke);
    line.setAttribute('stroke-width', '2.5');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('marker-end', `url(#${markerId})`);
    innerG.appendChild(line);
  });

  // ── Pillar 4: Specular Highlight ───────────────────────────────────
  const specId = `fsm-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    const g = document.createElementNS(SVG_NS, 'radialGradient');
    g.setAttribute('id', specId);
    g.setAttribute('cx', '35%'); g.setAttribute('cy', '25%'); g.setAttribute('r', '40%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#ffffff'); s1.setAttribute('stop-opacity', '0.18');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#ffffff'); s2.setAttribute('stop-opacity', '0');
    g.appendChild(s1); g.appendChild(s2);
    defs.appendChild(g);
  }

  // ── States ─────────────────────────────────────────────────────────
  states.forEach((st) => {
    const pos = positions[st.id] ?? { x: 0, y: 0 };
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(pos.x));
    circle.setAttribute('cy', String(pos.y));
    circle.setAttribute('r', String(r));
    circle.setAttribute('fill', cc.fill);
    circle.setAttribute('stroke', cc.stroke);
    circle.setAttribute('stroke-width', '2.5');
    innerG.appendChild(circle);

    // Specular on each state circle
    const specCircle = document.createElementNS(SVG_NS, 'ellipse');
    specCircle.setAttribute('cx', String(pos.x - r * 0.15));
    specCircle.setAttribute('cy', String(pos.y - r * 0.2));
    specCircle.setAttribute('rx', String(r * 0.6));
    specCircle.setAttribute('ry', String(r * 0.4));
    specCircle.setAttribute('fill', `url(#${specId})`);
    specCircle.setAttribute('pointer-events', 'none');
    innerG.appendChild(specCircle);

    const label = st.label ?? st.id;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(pos.x));
    text.setAttribute('y', String(pos.y + 4));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', cc.textPrimary);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeValue));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = label.length > 6 ? label.slice(0, 4) + '\u2026' : label;
    innerG.appendChild(text);
  });

  // ── Pillar 5: Micro-Life ───────────────────────────────────────────
  const styleId = `fsm-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes fsmFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes fsmPulse_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.03); }
      }
      .fsm-float-${entityId} {
        animation: fsmFloat_${entityId} 3.5s ease-in-out infinite;
      }
      .fsm-pulse-${entityId} {
        animation: fsmPulse_${entityId} 2.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`fsm-float-${entityId}`);

  // ── Label below ────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(bbMaxY + LABEL_DEFAULTS.offsetBelow));
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
