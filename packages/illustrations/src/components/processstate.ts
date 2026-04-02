/**
 * @preplai/illustrations — ProcessState Component (Cinematic Depth)
 *
 * State circles with transition arrows, cinematic lighting treatment.
 * Each state type (ready/running/blocked) gets its own color.
 *
 * 5 Cinematic Pillars: directional lighting, ground shadow,
 * ambient occlusion, specular highlight, micro-life animation.
 *
 * Metadata: { states: [{ name, type }], transitions?: [{ from, to }] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, LABEL_DEFAULTS } from '../design-tokens.js';
import { resolveColorCascade, resolveColorCascadeFromHex } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
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
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

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

  // ── Pillar 1: Directional Lighting ──────────────────────────────────
  const haloId = `pstate-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const haloGrad = document.createElementNS(SVG_NS, 'radialGradient');
    haloGrad.setAttribute('id', haloId);
    haloGrad.setAttribute('cx', '38%'); haloGrad.setAttribute('cy', '38%');
    haloGrad.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.13');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0');
    haloGrad.appendChild(s1); haloGrad.appendChild(s2);
    defs.appendChild(haloGrad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', '0');
  halo.setAttribute('cy', '0');
  halo.setAttribute('rx', String(spacing * 1.6));
  halo.setAttribute('ry', String(spacing * 1.2));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ─────────────────────────────────────────
  const gsId = `pstate-gshadow-${entityId}`;
  if (!defs.querySelector(`#${gsId}`)) {
    const gsg = document.createElementNS(SVG_NS, 'radialGradient');
    gsg.setAttribute('id', gsId);
    gsg.setAttribute('cx', '50%'); gsg.setAttribute('cy', '50%'); gsg.setAttribute('r', '50%');
    const g1 = document.createElementNS(SVG_NS, 'stop');
    g1.setAttribute('offset', '0%'); g1.setAttribute('stop-color', '#000000'); g1.setAttribute('stop-opacity', '0.18');
    const g2 = document.createElementNS(SVG_NS, 'stop');
    g2.setAttribute('offset', '100%'); g2.setAttribute('stop-color', '#000000'); g2.setAttribute('stop-opacity', '0');
    gsg.appendChild(g1); gsg.appendChild(g2);
    defs.appendChild(gsg);
  }
  const groundShadow = document.createElementNS(SVG_NS, 'ellipse');
  groundShadow.setAttribute('cx', '0');
  groundShadow.setAttribute('cy', String(spacing * 0.5));
  groundShadow.setAttribute('rx', String(spacing * 1.2));
  groundShadow.setAttribute('ry', String(r * 0.5));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ─────────────────────────────────────
  const aoId = `pstate-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const aoGrad = document.createElementNS(SVG_NS, 'radialGradient');
    aoGrad.setAttribute('id', aoId);
    aoGrad.setAttribute('cx', '70%'); aoGrad.setAttribute('cy', '75%'); aoGrad.setAttribute('r', '55%');
    const a1 = document.createElementNS(SVG_NS, 'stop');
    a1.setAttribute('offset', '0%'); a1.setAttribute('stop-color', '#000000'); a1.setAttribute('stop-opacity', '0.10');
    const a2 = document.createElementNS(SVG_NS, 'stop');
    a2.setAttribute('offset', '100%'); a2.setAttribute('stop-color', '#000000'); a2.setAttribute('stop-opacity', '0');
    aoGrad.appendChild(a1); aoGrad.appendChild(a2);
    defs.appendChild(aoGrad);
  }

  // Arrow marker
  const markerId = `arrow-ps-${entityId}`;
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
    poly.setAttribute('fill', cc.strokeMuted);
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
    line.setAttribute('stroke', cc.strokeMuted);
    line.setAttribute('stroke-width', '2.5');
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('marker-end', `url(#${markerId})`);
    innerG.appendChild(line);
  });

  // State circles
  states.forEach((st) => {
    const pos = positions[st.name] ?? { x: 0, y: 0 };
    const stateColor = STATE_COLORS[(st.type ?? '').toLowerCase()] ?? color;
    const stateCc = resolveColorCascadeFromHex(stateColor);

    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(pos.x));
    circle.setAttribute('cy', String(pos.y));
    circle.setAttribute('r', String(r));
    circle.setAttribute('fill', stateCc.fillMedium);
    circle.setAttribute('stroke', stateCc.stroke);
    circle.setAttribute('stroke-width', '2.5');
    innerG.appendChild(circle);

    // AO overlay per circle (use clipPath-free approach: just another circle)
    const aoCircle = document.createElementNS(SVG_NS, 'circle');
    aoCircle.setAttribute('cx', String(pos.x));
    aoCircle.setAttribute('cy', String(pos.y));
    aoCircle.setAttribute('r', String(r));
    aoCircle.setAttribute('fill', `url(#${aoId})`);
    aoCircle.setAttribute('pointer-events', 'none');
    innerG.appendChild(aoCircle);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(pos.x));
    text.setAttribute('y', String(pos.y + r + LABEL_DEFAULTS.offsetBelow * 0.7));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', stateCc.textPrimary);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeValue * scale));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = st.name;
    innerG.appendChild(text);
  });

  // ── Pillar 4: Specular Highlight ────────────────────────────────────
  const specId = `pstate-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    const specGrad = document.createElementNS(SVG_NS, 'radialGradient');
    specGrad.setAttribute('id', specId);
    specGrad.setAttribute('cx', '35%'); specGrad.setAttribute('cy', '25%'); specGrad.setAttribute('r', '40%');
    const sp1 = document.createElementNS(SVG_NS, 'stop');
    sp1.setAttribute('offset', '0%'); sp1.setAttribute('stop-color', '#ffffff'); sp1.setAttribute('stop-opacity', '0.18');
    const sp2 = document.createElementNS(SVG_NS, 'stop');
    sp2.setAttribute('offset', '100%'); sp2.setAttribute('stop-color', '#ffffff'); sp2.setAttribute('stop-opacity', '0');
    specGrad.appendChild(sp1); specGrad.appendChild(sp2);
    defs.appendChild(specGrad);
  }
  const specular = document.createElementNS(SVG_NS, 'rect');
  specular.setAttribute('x', String(-spacing - r));
  specular.setAttribute('y', String(-spacing * 0.6 - r));
  specular.setAttribute('width', String(spacing * 2 + r * 2));
  specular.setAttribute('height', String(spacing * 0.6 + r * 2 + spacing * 0.5));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Pillar 5: Micro-Life Animation ──────────────────────────────────
  const styleId = `pstate-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes pstateFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes pstateBreathe_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      .pstate-float-${entityId} {
        animation: pstateFloat_${entityId} 3.5s ease-in-out infinite;
      }
      .pstate-breathe-${entityId} {
        animation: pstateBreathe_${entityId} 2.8s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`pstate-float-${entityId}`);

  // Label below
  if (entity.label) {
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String(spacing + LABEL_DEFAULTS.offsetBelow));
    labelEl.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    labelEl.setAttribute('fill', cc.textPrimary);
    labelEl.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel * scale));
    labelEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    labelEl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    labelEl.textContent = entity.label;
    innerG.appendChild(labelEl);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
