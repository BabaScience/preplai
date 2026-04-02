/**
 * @preplai/illustrations — DeadlockGraph Component (Cinematic Depth)
 *
 * Resource allocation / wait-for graph: nodes (processes/resources) and directed edges.
 * A cycle indicates deadlock. Full cinematic lighting treatment.
 *
 * 5 Cinematic Pillars: directional lighting, ground shadow,
 * ambient occlusion, specular highlight, micro-life animation.
 *
 * Metadata:
 *   nodes: Array<{ id, label }> — processes or resources
 *   edges: Array<{ from, to }> — "waits for" relationships (from -> to)
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

interface NodeDef { id: string; label?: string; }
interface EdgeDef { from: string; to: string; }

export function renderDeadlockGraph(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const s = getSizeParam(entity);
  const scale = s / 50;
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const nodesData = meta.nodes as NodeDef[] | undefined;
  const edgesData = meta.edges as EdgeDef[] | undefined;

  const nodes: NodeDef[] = nodesData ?? [
    { id: 'P1', label: 'P1' },
    { id: 'R1', label: 'R1' },
    { id: 'P2', label: 'P2' },
    { id: 'R2', label: 'R2' },
  ];
  const edges: EdgeDef[] = edgesData ?? [
    { from: 'P1', to: 'R1' },
    { from: 'R1', to: 'P2' },
    { from: 'P2', to: 'R2' },
    { from: 'R2', to: 'P1' },
  ];

  const r = s * 0.28;
  const spacing = s * 0.55;
  const positions: Record<string, { x: number; y: number }> = {};
  nodes.forEach((n, i) => {
    const angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
    positions[n.id] = { x: Math.cos(angle) * spacing, y: Math.sin(angle) * spacing };
  });

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ──────────────────────────────────
  const haloId = `dlgraph-halo-${entityId}`;
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
  halo.setAttribute('rx', String((spacing + r) * 1.5));
  halo.setAttribute('ry', String((spacing + r) * 1.2));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ─────────────────────────────────────────
  const gsId = `dlgraph-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(spacing + r * 0.5));
  groundShadow.setAttribute('rx', String(spacing * 1.1));
  groundShadow.setAttribute('ry', String(r * 0.4));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ─────────────────────────────────────
  const aoId = `dlgraph-ao-${entityId}`;
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

  // ── Highlight glow ──────────────────────────────────────────────────
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'circle');
    glow.setAttribute('cx', '0');
    glow.setAttribute('cy', '0');
    glow.setAttribute('r', String(spacing + r + 6));
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // Arrow markers
  const markerId = `arrow-dg-${entityId}`;
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
    poly.setAttribute('fill', cc.strokeSoft);
    marker.appendChild(poly);
    defs.appendChild(marker);
  }

  // Edges
  for (const { from, to } of edges) {
    const p1 = positions[from];
    const p2 = positions[to];
    if (!p1 || !p2) continue;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / len;
    const ny = dy / len;
    const trim = r + 4;

    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(p1.x + nx * trim));
    line.setAttribute('y1', String(p1.y + ny * trim));
    line.setAttribute('x2', String(p2.x - nx * trim));
    line.setAttribute('y2', String(p2.y - ny * trim));
    line.setAttribute('stroke', cc.strokeSoft);
    line.setAttribute('stroke-width', '2.5');
    line.setAttribute('marker-end', `url(#${markerId})`);
    innerG.appendChild(line);
  }

  // Nodes
  for (const node of nodes) {
    const pos = positions[node.id] ?? { x: 0, y: 0 };
    const label = node.label ?? node.id;

    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(pos.x));
    circle.setAttribute('cy', String(pos.y));
    circle.setAttribute('r', String(r));
    circle.setAttribute('fill', cc.fillMedium);
    circle.setAttribute('stroke', cc.stroke);
    circle.setAttribute('stroke-width', '2.5');
    innerG.appendChild(circle);

    // AO overlay
    const aoCircle = document.createElementNS(SVG_NS, 'circle');
    aoCircle.setAttribute('cx', String(pos.x));
    aoCircle.setAttribute('cy', String(pos.y));
    aoCircle.setAttribute('r', String(r));
    aoCircle.setAttribute('fill', `url(#${aoId})`);
    aoCircle.setAttribute('pointer-events', 'none');
    innerG.appendChild(aoCircle);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(pos.x));
    text.setAttribute('y', String(pos.y + 4));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', cc.textPrimary);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeValue * scale));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = label;
    innerG.appendChild(text);
  }

  // ── Pillar 4: Specular Highlight ────────────────────────────────────
  const specId = `dlgraph-spec-${entityId}`;
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
  specular.setAttribute('y', String(-spacing - r));
  specular.setAttribute('width', String((spacing + r) * 2));
  specular.setAttribute('height', String((spacing + r) * 2));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Pillar 5: Micro-Life Animation ──────────────────────────────────
  const styleId = `dlgraph-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes dlgraphFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes dlgraphPulse_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.03); }
      }
      .dlgraph-float-${entityId} {
        animation: dlgraphFloat_${entityId} 3.5s ease-in-out infinite;
      }
      .dlgraph-pulse-${entityId} {
        animation: dlgraphPulse_${entityId} 2.8s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`dlgraph-float-${entityId}`);

  // ── Label below ─────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(spacing + r + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('fill', cc.textPrimary);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel * scale));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
