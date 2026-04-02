/**
 * @preplai/illustrations — Cloud Component (Volumetric Depth)
 *
 * Volumetric cloud with internal data nodes, connecting lines, sparkle dots,
 * and rich directional-lit bumps. Ground shadow, glass overlay, specular highlight.
 * Use for: cloud computing, SaaS, AWS/GCP/Azure, distributed systems.
 *
 * Visual depth: offset radial halo, per-bump directional gradients, data node
 * twinkle animation, glass material on first bump, specular highlight on top bump.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlowFilter, ensureGlassFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

/* ── Bump geometry (relative to size) ──────────────────────────────────── */
const CLOUD_BUMPS = [
  { cx: -0.15, cy: -0.05, rx: 0.28, ry: 0.26, gradCx: '35%', gradCy: '30%' }, // left
  { cx:  0.05, cy: -0.15, rx: 0.36, ry: 0.30, gradCx: '45%', gradCy: '25%' }, // center-top (largest)
  { cx:  0.20, cy: -0.03, rx: 0.25, ry: 0.22, gradCx: '55%', gradCy: '30%' }, // right
];
const CLOUD_BASE = { cx: 0.02, cy: 0.14, rx: 0.40, ry: 0.10 };

/* ── Data node positions (relative to size, inside the cloud body) ───── */
const DATA_NODES = [
  { cx: -0.10, cy: -0.02, r: 3.5 },
  { cx:  0.08, cy: -0.08, r: 3.0 },
  { cx:  0.16, cy:  0.02, r: 3.0 },
];

/* ── Lines connecting data nodes (indices into DATA_NODES) ────────────── */
const DATA_LINES: [number, number][] = [[0, 1], [1, 2]];

/* ── Sparkle dot positions ────────────────────────────────────────────── */
const SPARKLE_DOTS = [
  { cx: -0.06, cy: -0.12, r: 1.8, opacity: 0.9 },
  { cx:  0.14, cy: -0.10, r: 1.5, opacity: 0.7 },
  { cx: -0.02, cy:  0.04, r: 2.0, opacity: 0.6 },
];

export function renderCloud(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const defs = ensureDefs(parentEl);

  // ── Radial depth halo (directional lighting, offset center) ─────────
  const haloId = `cloud-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', haloId);
    grad.setAttribute('cx', '38%'); grad.setAttribute('cy', '38%');
    grad.setAttribute('r', '55%');
    const hs1 = document.createElementNS(SVG_NS, 'stop');
    hs1.setAttribute('offset', '0%');
    hs1.setAttribute('stop-color', color);
    hs1.setAttribute('stop-opacity', '0.13');
    const hs2 = document.createElementNS(SVG_NS, 'stop');
    hs2.setAttribute('offset', '100%');
    hs2.setAttribute('stop-color', color);
    hs2.setAttribute('stop-opacity', '0');
    grad.appendChild(hs1); grad.appendChild(hs2);
    defs.appendChild(grad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', String(-s * 0.06));
  halo.setAttribute('cy', String(-s * 0.04));
  halo.setAttribute('rx', String(s * 0.75));
  halo.setAttribute('ry', String(s * 0.55));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Ground contact shadow ───────────────────────────────────────────
  const groundShadowId = `cloud-gshadow-${entityId}`;
  if (!defs.querySelector(`#${groundShadowId}`)) {
    const gsg = document.createElementNS(SVG_NS, 'radialGradient');
    gsg.setAttribute('id', groundShadowId);
    gsg.setAttribute('cx', '50%'); gsg.setAttribute('cy', '50%'); gsg.setAttribute('r', '50%');
    const gs1 = document.createElementNS(SVG_NS, 'stop');
    gs1.setAttribute('offset', '0%'); gs1.setAttribute('stop-color', '#000000'); gs1.setAttribute('stop-opacity', '0.18');
    const gs2 = document.createElementNS(SVG_NS, 'stop');
    gs2.setAttribute('offset', '100%'); gs2.setAttribute('stop-color', '#000000'); gs2.setAttribute('stop-opacity', '0');
    gsg.appendChild(gs1); gsg.appendChild(gs2);
    defs.appendChild(gsg);
  }
  const groundShadow = document.createElementNS(SVG_NS, 'ellipse');
  groundShadow.setAttribute('cx', String(CLOUD_BASE.cx * s));
  groundShadow.setAttribute('cy', String((CLOUD_BASE.cy + CLOUD_BASE.ry + 0.06) * s));
  groundShadow.setAttribute('rx', String(CLOUD_BASE.rx * s * 0.95));
  groundShadow.setAttribute('ry', String(s * 0.04));
  groundShadow.setAttribute('fill', `url(#${groundShadowId})`);
  innerG.appendChild(groundShadow);

  // ── Ambient occlusion ───────────────────────────────────────────────
  const aoId = `cloud-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const aoGrad = document.createElementNS(SVG_NS, 'radialGradient');
    aoGrad.setAttribute('id', aoId);
    aoGrad.setAttribute('cx', '70%'); aoGrad.setAttribute('cy', '75%'); aoGrad.setAttribute('r', '55%');
    const ao1 = document.createElementNS(SVG_NS, 'stop');
    ao1.setAttribute('offset', '0%'); ao1.setAttribute('stop-color', '#000000'); ao1.setAttribute('stop-opacity', '0.10');
    const ao2 = document.createElementNS(SVG_NS, 'stop');
    ao2.setAttribute('offset', '100%'); ao2.setAttribute('stop-color', '#000000'); ao2.setAttribute('stop-opacity', '0');
    aoGrad.appendChild(ao1); aoGrad.appendChild(ao2);
    defs.appendChild(aoGrad);
  }
  const ao = document.createElementNS(SVG_NS, 'ellipse');
  ao.setAttribute('cx', String(CLOUD_BASE.cx * s));
  ao.setAttribute('cy', String(CLOUD_BASE.cy * s));
  ao.setAttribute('rx', String(CLOUD_BASE.rx * s));
  ao.setAttribute('ry', String(CLOUD_BASE.ry * s * 1.2));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Per-bump directional radial gradients ────────────────────────────
  const bumpGradIds: string[] = [];
  for (let i = 0; i < CLOUD_BUMPS.length; i++) {
    const bgId = `cloudBump${i}_${entityId}`;
    bumpGradIds.push(bgId);
    if (!defs.querySelector(`#${bgId}`)) {
      const bump = CLOUD_BUMPS[i];
      const grad = document.createElementNS(SVG_NS, 'radialGradient');
      grad.setAttribute('id', bgId);
      grad.setAttribute('cx', bump.gradCx); grad.setAttribute('cy', bump.gradCy);
      grad.setAttribute('r', '60%');
      const s1 = document.createElementNS(SVG_NS, 'stop');
      s1.setAttribute('offset', '0%');
      s1.setAttribute('stop-color', color);
      s1.setAttribute('stop-opacity', '0.60');
      const s2 = document.createElementNS(SVG_NS, 'stop');
      s2.setAttribute('offset', '100%');
      s2.setAttribute('stop-color', color);
      s2.setAttribute('stop-opacity', '0.20');
      grad.appendChild(s1); grad.appendChild(s2);
      defs.appendChild(grad);
    }
  }

  // ── Outer glow filter ───────────────────────────────────────────────
  const glowUrl = ensureGlowFilter(parentEl, color);

  // ── Outer glow shadow filter for bumps ──────────────────────────────
  const outerGlowId = `cloud-outerglow-${entityId}`;
  if (!defs.querySelector(`#${outerGlowId}`)) {
    const filter = document.createElementNS(SVG_NS, 'filter');
    filter.setAttribute('id', outerGlowId);
    filter.setAttribute('x', '-30%'); filter.setAttribute('y', '-30%');
    filter.setAttribute('width', '160%'); filter.setAttribute('height', '160%');
    const fds = document.createElementNS(SVG_NS, 'feDropShadow');
    fds.setAttribute('dx', '0'); fds.setAttribute('dy', '0');
    fds.setAttribute('stdDeviation', '3');
    fds.setAttribute('flood-color', color);
    fds.setAttribute('flood-opacity', '0.35');
    filter.appendChild(fds);
    defs.appendChild(filter);
  }

  // ── Glass filter ─────────────────────────────────────────────────────
  const glassUrl = ensureGlassFilter(parentEl);

  // ── Highlight glow (if highlighted) ──────────────────────────────────
  if (entity.highlight) {
    for (const bump of CLOUD_BUMPS) {
      const el = document.createElementNS(SVG_NS, 'ellipse');
      el.setAttribute('cx', String(bump.cx * s));
      el.setAttribute('cy', String(bump.cy * s));
      el.setAttribute('rx', String((bump.rx + 0.04) * s));
      el.setAttribute('ry', String((bump.ry + 0.04) * s));
      el.setAttribute('stroke-width', String(STROKE.default));
      el.setAttribute('stroke-dasharray', '4,4');
      applyGlowColors(el, cc);
      innerG.appendChild(el);
    }
  }

  // ── Cloud base ellipse (wider, flatter) ─────────────────────────────
  const base = document.createElementNS(SVG_NS, 'ellipse');
  base.setAttribute('cx', String(CLOUD_BASE.cx * s));
  base.setAttribute('cy', String(CLOUD_BASE.cy * s));
  base.setAttribute('rx', String(CLOUD_BASE.rx * s));
  base.setAttribute('ry', String(CLOUD_BASE.ry * s));
  base.setAttribute('fill', `url(#${bumpGradIds[1]})`);
  base.setAttribute('stroke', 'none');
  innerG.appendChild(base);

  // ── Cloud bumps with per-bump directional gradients + outer glow ────
  for (let i = 0; i < CLOUD_BUMPS.length; i++) {
    const bump = CLOUD_BUMPS[i];
    const el = document.createElementNS(SVG_NS, 'ellipse');
    el.setAttribute('cx', String(bump.cx * s));
    el.setAttribute('cy', String(bump.cy * s));
    el.setAttribute('rx', String(bump.rx * s));
    el.setAttribute('ry', String(bump.ry * s));
    el.setAttribute('fill', `url(#${bumpGradIds[i]})`);
    el.setAttribute('stroke', cc.strokeSoft);
    el.setAttribute('stroke-width', '1.5');
    if (i === 0) {
      el.setAttribute('data-morph-target', 'true');
      el.setAttribute('filter', glowUrl);
    } else {
      el.setAttribute('filter', `url(#${outerGlowId})`);
    }
    innerG.appendChild(el);
  }

  // ── Glass overlay on first bump (material texture) ──────────────────
  const firstBump = CLOUD_BUMPS[0];
  const glassEl = document.createElementNS(SVG_NS, 'ellipse');
  glassEl.setAttribute('cx', String(firstBump.cx * s));
  glassEl.setAttribute('cy', String(firstBump.cy * s));
  glassEl.setAttribute('rx', String(firstBump.rx * s));
  glassEl.setAttribute('ry', String(firstBump.ry * s));
  glassEl.setAttribute('fill', 'rgba(255,255,255,0.03)');
  glassEl.setAttribute('filter', glassUrl);
  glassEl.setAttribute('pointer-events', 'none');
  innerG.appendChild(glassEl);

  // ── Material texture — 3 subtle scan lines ──────────────────────────
  for (let i = 0; i < 3; i++) {
    const scanY = (CLOUD_BASE.cy - 0.06 + i * 0.04) * s;
    const scanLine = document.createElementNS(SVG_NS, 'line');
    scanLine.setAttribute('x1', String(-CLOUD_BASE.rx * s * 0.6));
    scanLine.setAttribute('y1', String(scanY));
    scanLine.setAttribute('x2', String(CLOUD_BASE.rx * s * 0.6));
    scanLine.setAttribute('y2', String(scanY));
    scanLine.setAttribute('stroke', 'rgba(255,255,255,0.05)');
    scanLine.setAttribute('stroke-width', '0.5');
    scanLine.setAttribute('pointer-events', 'none');
    innerG.appendChild(scanLine);
  }

  // ── Specular highlight on top-center bump ───────────────────────────
  const specId = `cloud-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    const specGrad = document.createElementNS(SVG_NS, 'radialGradient');
    specGrad.setAttribute('id', specId);
    specGrad.setAttribute('cx', '35%'); specGrad.setAttribute('cy', '30%'); specGrad.setAttribute('r', '45%');
    const sp1 = document.createElementNS(SVG_NS, 'stop');
    sp1.setAttribute('offset', '0%'); sp1.setAttribute('stop-color', '#ffffff'); sp1.setAttribute('stop-opacity', '0.22');
    const sp2 = document.createElementNS(SVG_NS, 'stop');
    sp2.setAttribute('offset', '100%'); sp2.setAttribute('stop-color', '#ffffff'); sp2.setAttribute('stop-opacity', '0');
    specGrad.appendChild(sp1); specGrad.appendChild(sp2);
    defs.appendChild(specGrad);
  }
  const topBump = CLOUD_BUMPS[1]; // center-top bump
  const specular = document.createElementNS(SVG_NS, 'ellipse');
  specular.setAttribute('cx', String((topBump.cx - topBump.rx * 0.2) * s));
  specular.setAttribute('cy', String((topBump.cy - topBump.ry * 0.4) * s));
  specular.setAttribute('rx', String(s * 0.12));
  specular.setAttribute('ry', String(s * 0.06));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Data node connecting lines (subtle) ─────────────────────────────
  for (const [fromIdx, toIdx] of DATA_LINES) {
    const from = DATA_NODES[fromIdx];
    const to = DATA_NODES[toIdx];
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(from.cx * s));
    line.setAttribute('y1', String(from.cy * s));
    line.setAttribute('x2', String(to.cx * s));
    line.setAttribute('y2', String(to.cy * s));
    line.setAttribute('stroke', colorWithAlpha(color, '0.35'));
    line.setAttribute('stroke-width', '0.5');
    line.setAttribute('pointer-events', 'none');
    innerG.appendChild(line);
  }

  // ── Data node glow gradient ─────────────────────────────────────────
  const nodeGlowId = `cloud-nodeglow-${entityId}`;
  if (!defs.querySelector(`#${nodeGlowId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', nodeGlowId);
    grad.setAttribute('cx', '50%'); grad.setAttribute('cy', '50%'); grad.setAttribute('r', '50%');
    const ng1 = document.createElementNS(SVG_NS, 'stop');
    ng1.setAttribute('offset', '0%'); ng1.setAttribute('stop-color', '#ffffff'); ng1.setAttribute('stop-opacity', '0.9');
    const ng2 = document.createElementNS(SVG_NS, 'stop');
    ng2.setAttribute('offset', '50%'); ng2.setAttribute('stop-color', color); ng2.setAttribute('stop-opacity', '0.7');
    const ng3 = document.createElementNS(SVG_NS, 'stop');
    ng3.setAttribute('offset', '100%'); ng3.setAttribute('stop-color', color); ng3.setAttribute('stop-opacity', '0');
    grad.appendChild(ng1); grad.appendChild(ng2); grad.appendChild(ng3);
    defs.appendChild(grad);
  }

  // ── Internal data nodes (glowing circles) ───────────────────────────
  const dataNodeEls: SVGElement[] = [];
  for (let i = 0; i < DATA_NODES.length; i++) {
    const node = DATA_NODES[i];
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(node.cx * s));
    circle.setAttribute('cy', String(node.cy * s));
    circle.setAttribute('r', String(node.r));
    circle.setAttribute('fill', `url(#${nodeGlowId})`);
    circle.setAttribute('pointer-events', 'none');
    innerG.appendChild(circle);
    dataNodeEls.push(circle);
  }

  // ── Sparkle dots (tiny white circles) ───────────────────────────────
  for (const dot of SPARKLE_DOTS) {
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', String(dot.cx * s));
    circle.setAttribute('cy', String(dot.cy * s));
    circle.setAttribute('r', String(dot.r));
    circle.setAttribute('fill', '#ffffff');
    circle.setAttribute('opacity', String(dot.opacity));
    circle.setAttribute('pointer-events', 'none');
    innerG.appendChild(circle);
  }

  // ── Animations: cloud drift + data node twinkle ─────────────────────
  const styleId = `cloud-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes cloudDrift_${entityId} {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(${-s * 0.045}px) scale(1.015); }
      }
      .cloud-drift-${entityId} {
        animation: cloudDrift_${entityId} 3.5s ease-in-out infinite;
      }
      @keyframes cloudTwinkle_${entityId} {
        0%, 100% { opacity: 1; transform: scale(1); }
        33% { opacity: 0.2; transform: scale(0.6); }
        66% { opacity: 1; transform: scale(1.3); }
      }
      .cloud-twinkle-${entityId} {
        animation: cloudTwinkle_${entityId} 2.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`cloud-drift-${entityId}`);

  // Apply twinkle to data nodes with staggered delays
  for (let i = 0; i < dataNodeEls.length; i++) {
    dataNodeEls[i].classList.add(`cloud-twinkle-${entityId}`);
    (dataNodeEls[i] as SVGElement).style.animationDelay = `${i * 0.6}s`;
  }

  // ── Label below ─────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(s / 2 + LABEL_DEFAULTS.offsetBelow));
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
