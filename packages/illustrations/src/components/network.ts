/**
 * @preplai/illustrations — Network Component (Cinematic 5-Pillar)
 *
 * Hub-and-spoke network topology rendered as a central hub circle
 * with 5 satellite node dots connected by lines.
 * Use for: networks, mesh topologies, network segments, distributed systems.
 *
 * 5 Pillars:
 *   1. Directional Lighting — radial halo behind, cx=38% cy=38%
 *   2. Ground Shadow — radial black ellipse below
 *   3. Ambient Occlusion — dark overlay bottom-right
 *   4. Specular Highlight — white radial upper-left
 *   5. Micro-Life — float on entity, node twinkle, hub glow pulse
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlassFilter, ensureGlowFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderNetwork(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const r = s * 0.42;

  const defs = ensureDefs(parentEl);

  // ── 1. Directional Lighting — radial halo behind entity ──────────────
  const haloId = `net-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const haloGrad = document.createElementNS(SVG_NS, 'radialGradient');
    haloGrad.setAttribute('id', haloId);
    haloGrad.setAttribute('cx', '38%');
    haloGrad.setAttribute('cy', '38%');
    haloGrad.setAttribute('r', '50%');
    const hs1 = document.createElementNS(SVG_NS, 'stop');
    hs1.setAttribute('offset', '0%');
    hs1.setAttribute('stop-color', color);
    hs1.setAttribute('stop-opacity', '0.13');
    const hs2 = document.createElementNS(SVG_NS, 'stop');
    hs2.setAttribute('offset', '100%');
    hs2.setAttribute('stop-color', color);
    hs2.setAttribute('stop-opacity', '0');
    haloGrad.appendChild(hs1);
    haloGrad.appendChild(hs2);
    defs.appendChild(haloGrad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', String(-r * 0.15));
  halo.setAttribute('cy', String(-r * 0.1));
  halo.setAttribute('rx', String(r * 2));
  halo.setAttribute('ry', String(r * 1.4));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── 2. Ground Shadow — radial black ellipse below ────────────────────
  const gsId = `net-gshadow-${entityId}`;
  if (!defs.querySelector(`#${gsId}`)) {
    const gsg = document.createElementNS(SVG_NS, 'radialGradient');
    gsg.setAttribute('id', gsId);
    gsg.setAttribute('cx', '50%');
    gsg.setAttribute('cy', '50%');
    gsg.setAttribute('r', '50%');
    const gs1 = document.createElementNS(SVG_NS, 'stop');
    gs1.setAttribute('offset', '0%');
    gs1.setAttribute('stop-color', '#000000');
    gs1.setAttribute('stop-opacity', '0.18');
    const gs2 = document.createElementNS(SVG_NS, 'stop');
    gs2.setAttribute('offset', '100%');
    gs2.setAttribute('stop-color', '#000000');
    gs2.setAttribute('stop-opacity', '0');
    gsg.appendChild(gs1);
    gsg.appendChild(gs2);
    defs.appendChild(gsg);
  }
  const groundShadow = document.createElementNS(SVG_NS, 'ellipse');
  groundShadow.setAttribute('cx', '0');
  groundShadow.setAttribute('cy', String(r + r * 0.25));
  groundShadow.setAttribute('rx', String(r * 1.1));
  groundShadow.setAttribute('ry', String(r * 0.25));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Highlight glow (behind shape) ────────────────────────────────────
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'circle');
    glow.setAttribute('cx', '0');
    glow.setAttribute('cy', '0');
    glow.setAttribute('r', String(r + 4));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Main circle — radial gradient fill + linear gradient stroke ──────
  const fillGradId = `net-fill-${entityId}`;
  if (!defs.querySelector(`#${fillGradId}`)) {
    const fg = document.createElementNS(SVG_NS, 'radialGradient');
    fg.setAttribute('id', fillGradId);
    fg.setAttribute('cx', '50%');
    fg.setAttribute('cy', '50%');
    fg.setAttribute('r', '50%');
    const fs1 = document.createElementNS(SVG_NS, 'stop');
    fs1.setAttribute('offset', '0%');
    fs1.setAttribute('stop-color', color);
    fs1.setAttribute('stop-opacity', '0.25');
    const fs2 = document.createElementNS(SVG_NS, 'stop');
    fs2.setAttribute('offset', '100%');
    fs2.setAttribute('stop-color', color);
    fs2.setAttribute('stop-opacity', '0.06');
    fg.appendChild(fs1);
    fg.appendChild(fs2);
    defs.appendChild(fg);
  }

  const strokeGradId = `net-stroke-${entityId}`;
  if (!defs.querySelector(`#${strokeGradId}`)) {
    const sg = document.createElementNS(SVG_NS, 'linearGradient');
    sg.setAttribute('id', strokeGradId);
    sg.setAttribute('x1', '0%');
    sg.setAttribute('y1', '0%');
    sg.setAttribute('x2', '100%');
    sg.setAttribute('y2', '100%');
    const ss1 = document.createElementNS(SVG_NS, 'stop');
    ss1.setAttribute('offset', '0%');
    ss1.setAttribute('stop-color', color);
    ss1.setAttribute('stop-opacity', '0.9');
    const ss2 = document.createElementNS(SVG_NS, 'stop');
    ss2.setAttribute('offset', '100%');
    ss2.setAttribute('stop-color', color);
    ss2.setAttribute('stop-opacity', '0.3');
    sg.appendChild(ss1);
    sg.appendChild(ss2);
    defs.appendChild(sg);
  }

  // GlowFilter + GlassFilter on main circle
  const glowUrl = ensureGlowFilter(parentEl, color, `net-glow-${entityId}`);
  const glassUrl = ensureGlassFilter(parentEl);

  const mainCircle = document.createElementNS(SVG_NS, 'circle');
  mainCircle.setAttribute('cx', '0');
  mainCircle.setAttribute('cy', '0');
  mainCircle.setAttribute('r', String(r));
  mainCircle.setAttribute('fill', `url(#${fillGradId})`);
  mainCircle.setAttribute('stroke', `url(#${strokeGradId})`);
  mainCircle.setAttribute('stroke-width', '2');
  mainCircle.setAttribute('filter', `${glowUrl.replace('url(', '').replace(')', '')} ${glassUrl.replace('url(', '').replace(')', '')}`);
  mainCircle.setAttribute('filter', glassUrl);
  mainCircle.setAttribute('data-morph-target', 'true');
  innerG.appendChild(mainCircle);

  // Apply glow as a second filter layer via a duplicate circle behind
  const glowCircle = document.createElementNS(SVG_NS, 'circle');
  glowCircle.setAttribute('cx', '0');
  glowCircle.setAttribute('cy', '0');
  glowCircle.setAttribute('r', String(r));
  glowCircle.setAttribute('fill', 'none');
  glowCircle.setAttribute('stroke', 'none');
  glowCircle.setAttribute('filter', glowUrl);
  glowCircle.setAttribute('opacity', '0.5');
  // Insert behind the main circle
  innerG.insertBefore(glowCircle, mainCircle);

  // ── 3. Ambient Occlusion — dark overlay bottom-right ─────────────────
  const aoId = `net-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const aoGrad = document.createElementNS(SVG_NS, 'radialGradient');
    aoGrad.setAttribute('id', aoId);
    aoGrad.setAttribute('cx', '70%');
    aoGrad.setAttribute('cy', '75%');
    aoGrad.setAttribute('r', '55%');
    const ao1 = document.createElementNS(SVG_NS, 'stop');
    ao1.setAttribute('offset', '0%');
    ao1.setAttribute('stop-color', '#000000');
    ao1.setAttribute('stop-opacity', '0.10');
    const ao2 = document.createElementNS(SVG_NS, 'stop');
    ao2.setAttribute('offset', '100%');
    ao2.setAttribute('stop-color', '#000000');
    ao2.setAttribute('stop-opacity', '0');
    aoGrad.appendChild(ao1);
    aoGrad.appendChild(ao2);
    defs.appendChild(aoGrad);
  }
  const aoOverlay = document.createElementNS(SVG_NS, 'circle');
  aoOverlay.setAttribute('cx', '0');
  aoOverlay.setAttribute('cy', '0');
  aoOverlay.setAttribute('r', String(r));
  aoOverlay.setAttribute('fill', `url(#${aoId})`);
  aoOverlay.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoOverlay);

  // ── Connection lines from hub to each node ───────────────────────────
  const nodeRadius = r * 0.65;
  const dotR = r * 0.08;
  const nodePositions: { x: number; y: number }[] = [];
  for (let i = 0; i < 5; i++) {
    // Start from top (-90deg) and go clockwise, evenly spaced 72deg apart
    const angle = (-90 + i * 72) * (Math.PI / 180);
    nodePositions.push({
      x: Math.cos(angle) * nodeRadius,
      y: Math.sin(angle) * nodeRadius,
    });
  }

  // Lines: hub center (0,0) to each node
  for (const node of nodePositions) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', '0');
    line.setAttribute('y1', '0');
    line.setAttribute('x2', String(node.x));
    line.setAttribute('y2', String(node.y));
    line.setAttribute('stroke', colorWithAlpha(color, '66'));
    line.setAttribute('stroke-width', '1.5');
    line.setAttribute('stroke-linecap', 'round');
    innerG.appendChild(line);
  }

  // ── Central hub — smaller circle with radial gradient + glow ─────────
  const hubR = r * 0.2;
  const hubGradId = `net-hub-${entityId}`;
  if (!defs.querySelector(`#${hubGradId}`)) {
    const hg = document.createElementNS(SVG_NS, 'radialGradient');
    hg.setAttribute('id', hubGradId);
    hg.setAttribute('cx', '50%');
    hg.setAttribute('cy', '50%');
    hg.setAttribute('r', '50%');
    const hgs1 = document.createElementNS(SVG_NS, 'stop');
    hgs1.setAttribute('offset', '0%');
    hgs1.setAttribute('stop-color', '#ffffff');
    hgs1.setAttribute('stop-opacity', '0.95');
    const hgs2 = document.createElementNS(SVG_NS, 'stop');
    hgs2.setAttribute('offset', '100%');
    hgs2.setAttribute('stop-color', color);
    hgs2.setAttribute('stop-opacity', '0.85');
    hg.appendChild(hgs1);
    hg.appendChild(hgs2);
    defs.appendChild(hg);
  }

  const hubGlow = document.createElementNS(SVG_NS, 'circle');
  hubGlow.setAttribute('cx', '0');
  hubGlow.setAttribute('cy', '0');
  hubGlow.setAttribute('r', String(hubR * 1.8));
  hubGlow.setAttribute('fill', colorWithAlpha(color, '26'));
  hubGlow.setAttribute('filter', glowUrl);
  hubGlow.setAttribute('class', `netHubGlow_${entityId}`);
  innerG.appendChild(hubGlow);

  const hub = document.createElementNS(SVG_NS, 'circle');
  hub.setAttribute('cx', '0');
  hub.setAttribute('cy', '0');
  hub.setAttribute('r', String(hubR));
  hub.setAttribute('fill', `url(#${hubGradId})`);
  hub.setAttribute('stroke', colorWithAlpha(color, 'E6'));
  hub.setAttribute('stroke-width', '1.5');
  innerG.appendChild(hub);

  // ── 5 node dots around hub ───────────────────────────────────────────
  nodePositions.forEach((node, i) => {
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(node.x));
    dot.setAttribute('cy', String(node.y));
    dot.setAttribute('r', String(dotR));
    dot.setAttribute('fill', colorWithAlpha(color, '99'));
    dot.setAttribute('stroke', colorWithAlpha(color, 'E6'));
    dot.setAttribute('stroke-width', '1.5');
    dot.setAttribute('class', `netNode_${entityId}`);
    dot.style.animationDelay = `${i * 0.4}s`;
    innerG.appendChild(dot);
  });

  // ── 4. Specular Highlight — white radial upper-left ──────────────────
  const specId = `net-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    const specGrad = document.createElementNS(SVG_NS, 'radialGradient');
    specGrad.setAttribute('id', specId);
    specGrad.setAttribute('cx', '35%');
    specGrad.setAttribute('cy', '25%');
    specGrad.setAttribute('r', '40%');
    const sp1 = document.createElementNS(SVG_NS, 'stop');
    sp1.setAttribute('offset', '0%');
    sp1.setAttribute('stop-color', '#ffffff');
    sp1.setAttribute('stop-opacity', '0.18');
    const sp2 = document.createElementNS(SVG_NS, 'stop');
    sp2.setAttribute('offset', '100%');
    sp2.setAttribute('stop-color', '#ffffff');
    sp2.setAttribute('stop-opacity', '0');
    specGrad.appendChild(sp1);
    specGrad.appendChild(sp2);
    defs.appendChild(specGrad);
  }
  const specular = document.createElementNS(SVG_NS, 'ellipse');
  specular.setAttribute('cx', String(-r * 0.15));
  specular.setAttribute('cy', String(-r * 0.2));
  specular.setAttribute('rx', String(r * 0.7));
  specular.setAttribute('ry', String(r * 0.5));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── 5. Micro-Life — float, node twinkle, hub glow pulse ─────────────
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  const styleId = `net-style-${entityId}`;
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes netFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes netNodeTwinkle_${entityId} {
        0%, 100% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.5); opacity: 1; }
      }
      @keyframes netHubPulse_${entityId} {
        0%, 100% { opacity: 0.6; transform: scale(1); }
        50% { opacity: 1; transform: scale(1.15); }
      }
      .netFloat_${entityId} {
        animation: netFloat_${entityId} 3.5s ease-in-out infinite;
      }
      .netNode_${entityId} {
        animation: netNodeTwinkle_${entityId} 2s ease-in-out infinite;
      }
      .netHubGlow_${entityId} {
        animation: netHubPulse_${entityId} 3s ease-in-out infinite;
      }
    `;
    svg.prepend(style);
  }
  innerG.classList.add(`netFloat_${entityId}`);

  // ── Label below ──────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(r + LABEL_DEFAULTS.offsetBelow));
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
