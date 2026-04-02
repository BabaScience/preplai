/**
 * @preplai/illustrations — CPU Component (Cinematic Depth)
 *
 * Square chip with 2x2 grid icon, pin traces, and cinematic lighting.
 * Use for: processor diagrams, CPU vs GPU, instruction pipelines.
 *
 * 5 Cinematic Pillars: directional lighting, ground shadow,
 * ambient occlusion, specular highlight, micro-life animation.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, SHAPES, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderCPU(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const size = s * 0.7;
  const half = size / 2;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ──────────────────────────────────
  const haloId = `cpu-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-half * 0.15));
  halo.setAttribute('cy', String(-half * 0.05));
  halo.setAttribute('rx', String(half * 1.8));
  halo.setAttribute('ry', String(half * 1.4));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ─────────────────────────────────────────
  const gsId = `cpu-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(half + size * 0.12));
  groundShadow.setAttribute('rx', String(half * 1.1));
  groundShadow.setAttribute('ry', String(half * 0.25));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ─────────────────────────────────────
  const aoId = `cpu-ao-${entityId}`;
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
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-half - 3));
    glow.setAttribute('y', String(-half - 3));
    glow.setAttribute('width', String(size + 6));
    glow.setAttribute('height', String(size + 6));
    glow.setAttribute('rx', String(SHAPES.borderRadius + 2));
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Chip body ───────────────────────────────────────────────────────
  const die = document.createElementNS(SVG_NS, 'rect');
  die.setAttribute('x', String(-half));
  die.setAttribute('y', String(-half));
  die.setAttribute('width', String(size));
  die.setAttribute('height', String(size));
  die.setAttribute('rx', String(SHAPES.borderRadius));
  die.setAttribute('fill', cc.fill);
  die.setAttribute('stroke', cc.stroke);
  die.setAttribute('stroke-width', '2.5');
  innerG.appendChild(die);

  // Ambient occlusion overlay on body
  const aoRect = document.createElementNS(SVG_NS, 'rect');
  aoRect.setAttribute('x', String(-half));
  aoRect.setAttribute('y', String(-half));
  aoRect.setAttribute('width', String(size));
  aoRect.setAttribute('height', String(size));
  aoRect.setAttribute('rx', String(SHAPES.borderRadius));
  aoRect.setAttribute('fill', `url(#${aoId})`);
  aoRect.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoRect);

  // ── Pin traces (4 per side) ─────────────────────────────────────────
  const pinLen = size * 0.12;
  const pinCount = 4;
  for (let i = 0; i < pinCount; i++) {
    const t = -half + (size / (pinCount + 1)) * (i + 1);
    // Top pins
    const pt = document.createElementNS(SVG_NS, 'line');
    pt.setAttribute('x1', String(t)); pt.setAttribute('y1', String(-half));
    pt.setAttribute('x2', String(t)); pt.setAttribute('y2', String(-half - pinLen));
    pt.setAttribute('stroke', cc.strokeSoft); pt.setAttribute('stroke-width', '1.5');
    innerG.appendChild(pt);
    // Bottom pins
    const pb = document.createElementNS(SVG_NS, 'line');
    pb.setAttribute('x1', String(t)); pb.setAttribute('y1', String(half));
    pb.setAttribute('x2', String(t)); pb.setAttribute('y2', String(half + pinLen));
    pb.setAttribute('stroke', cc.strokeSoft); pb.setAttribute('stroke-width', '1.5');
    innerG.appendChild(pb);
    // Left pins
    const pl = document.createElementNS(SVG_NS, 'line');
    pl.setAttribute('x1', String(-half)); pl.setAttribute('y1', String(t));
    pl.setAttribute('x2', String(-half - pinLen)); pl.setAttribute('y2', String(t));
    pl.setAttribute('stroke', cc.strokeSoft); pl.setAttribute('stroke-width', '1.5');
    innerG.appendChild(pl);
    // Right pins
    const pr = document.createElementNS(SVG_NS, 'line');
    pr.setAttribute('x1', String(half)); pr.setAttribute('y1', String(t));
    pr.setAttribute('x2', String(half + pinLen)); pr.setAttribute('y2', String(t));
    pr.setAttribute('stroke', cc.strokeSoft); pr.setAttribute('stroke-width', '1.5');
    innerG.appendChild(pr);
  }

  // ── Grid icon (2x2 squares) inside ──────────────────────────────────
  const cellSize = size * 0.15;
  const gap = size * 0.06;
  const offsets = [-(cellSize + gap / 2), gap / 2];
  for (const ox of offsets) {
    for (const oy of offsets) {
      const cell = document.createElementNS(SVG_NS, 'rect');
      cell.setAttribute('x', String(ox));
      cell.setAttribute('y', String(oy));
      cell.setAttribute('width', String(cellSize));
      cell.setAttribute('height', String(cellSize));
      cell.setAttribute('rx', '1');
      cell.setAttribute('fill', 'none');
      cell.setAttribute('stroke', cc.stroke);
      cell.setAttribute('stroke-width', '2.5');
      innerG.appendChild(cell);
    }
  }

  // ── Pillar 4: Specular Highlight ────────────────────────────────────
  const specId = `cpu-spec-${entityId}`;
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
  specular.setAttribute('x', String(-half));
  specular.setAttribute('y', String(-half));
  specular.setAttribute('width', String(size));
  specular.setAttribute('height', String(size));
  specular.setAttribute('rx', String(SHAPES.borderRadius));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Pillar 5: Micro-Life Animation ──────────────────────────────────
  const styleId = `cpu-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes cpuFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes cpuPulse_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.04); }
      }
      .cpu-float-${entityId} {
        animation: cpuFloat_${entityId} 3.5s ease-in-out infinite;
      }
      .cpu-pulse-${entityId} {
        animation: cpuPulse_${entityId} 2.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`cpu-float-${entityId}`);
  die.classList.add(`cpu-pulse-${entityId}`);

  // ── Label below ─────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(half + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('fill', cc.textPrimary);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
