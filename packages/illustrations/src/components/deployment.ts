/**
 * @preplai/illustrations — Deployment Component (Cinematic 5-Pillar)
 *
 * A rounded rectangle with an upward arrow icon — signifying release/deploy.
 * Use for: deployment targets, releases, environments, CI/CD outputs.
 *
 * 5-Pillar Cinematic Depth:
 *   1. Directional Lighting — radial halo behind body
 *   2. Ground Contact Shadow — soft ellipse below
 *   3. Ambient Occlusion — darkened lower-right interior
 *   4. Material Texture — specular highlight upper-left
 *   5. Micro-Life — body float, arrow translateY pulse, status dot scale pulse
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlassFilter, ensureGlowFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderDeployment(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const defs = ensureDefs(parentEl);

  // Body dimensions
  const w = s * 0.85;
  const h = s * 0.7;
  const hw = w / 2;
  const hh = h / 2;
  const rx = 8;

  // ── Pillar 1: Directional Lighting (radial halo behind body) ──────
  const haloId = `dep-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const haloGrad = document.createElementNS(SVG_NS, 'radialGradient');
    haloGrad.setAttribute('id', haloId);
    haloGrad.setAttribute('cx', '38%'); haloGrad.setAttribute('cy', '38%');
    haloGrad.setAttribute('r', '50%');
    const hs1 = document.createElementNS(SVG_NS, 'stop');
    hs1.setAttribute('offset', '0%');
    hs1.setAttribute('stop-color', color);
    hs1.setAttribute('stop-opacity', '0.13');
    const hs2 = document.createElementNS(SVG_NS, 'stop');
    hs2.setAttribute('offset', '100%');
    hs2.setAttribute('stop-color', color);
    hs2.setAttribute('stop-opacity', '0');
    haloGrad.appendChild(hs1); haloGrad.appendChild(hs2);
    defs.appendChild(haloGrad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', String(-hw * 0.15));
  halo.setAttribute('cy', String(-hh * 0.05));
  halo.setAttribute('rx', String(hw * 2));
  halo.setAttribute('ry', String(hh * 1.4));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Contact Shadow ────────────────────────────────
  const gshadowId = `dep-gshadow-${entityId}`;
  if (!defs.querySelector(`#${gshadowId}`)) {
    const gsg = document.createElementNS(SVG_NS, 'radialGradient');
    gsg.setAttribute('id', gshadowId);
    gsg.setAttribute('cx', '50%'); gsg.setAttribute('cy', '50%'); gsg.setAttribute('r', '50%');
    const gs1 = document.createElementNS(SVG_NS, 'stop');
    gs1.setAttribute('offset', '0%'); gs1.setAttribute('stop-color', '#000000'); gs1.setAttribute('stop-opacity', '0.18');
    const gs2 = document.createElementNS(SVG_NS, 'stop');
    gs2.setAttribute('offset', '100%'); gs2.setAttribute('stop-color', '#000000'); gs2.setAttribute('stop-opacity', '0');
    gsg.appendChild(gs1); gsg.appendChild(gs2);
    defs.appendChild(gsg);
  }
  const groundShadow = document.createElementNS(SVG_NS, 'ellipse');
  groundShadow.setAttribute('cx', '0');
  groundShadow.setAttribute('cy', String(hh + s * 0.06));
  groundShadow.setAttribute('rx', String(hw * 0.9));
  groundShadow.setAttribute('ry', String(hh * 0.18));
  groundShadow.setAttribute('fill', `url(#${gshadowId})`);
  innerG.appendChild(groundShadow);

  // ── Highlight glow ring ────────────────────────────────────────────
  if (entity.highlight) {
    const glowRect = document.createElementNS(SVG_NS, 'rect');
    glowRect.setAttribute('x', String(-hw - 3));
    glowRect.setAttribute('y', String(-hh - 3));
    glowRect.setAttribute('width', String(w + 6));
    glowRect.setAttribute('height', String(h + 6));
    glowRect.setAttribute('rx', String(rx + 2));
    glowRect.setAttribute('stroke-width', String(STROKE.default));
    glowRect.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glowRect, cc);
    innerG.appendChild(glowRect);
  }

  // ── Body fill gradient (radial: center bright → edge dim) ──────────
  const fillGradId = `dep-fill-${entityId}`;
  if (!defs.querySelector(`#${fillGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', fillGradId);
    grad.setAttribute('cx', '50%'); grad.setAttribute('cy', '45%'); grad.setAttribute('r', '55%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.4');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.1');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // ── Body stroke gradient (top bright → bottom dim) ─────────────────
  const strokeGradId = `dep-stroke-${entityId}`;
  if (!defs.querySelector(`#${strokeGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', strokeGradId);
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '0%'); grad.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '1');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.4');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // ── Glow + Glass filters ───────────────────────────────────────────
  const glowUrl = ensureGlowFilter(parentEl, color, `dep-glow-${entityId}`);
  const glassUrl = ensureGlassFilter(parentEl);

  // ── Main body rect ─────────────────────────────────────────────────
  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x', String(-hw));
  body.setAttribute('y', String(-hh));
  body.setAttribute('width', String(w));
  body.setAttribute('height', String(h));
  body.setAttribute('rx', String(rx));
  body.setAttribute('fill', `url(#${fillGradId})`);
  body.setAttribute('stroke', `url(#${strokeGradId})`);
  body.setAttribute('stroke-width', '2');
  body.setAttribute('filter', glowUrl);
  body.setAttribute('data-morph-target', 'true');
  innerG.appendChild(body);

  // ── Glass overlay ──────────────────────────────────────────────────
  const glassOverlay = document.createElementNS(SVG_NS, 'rect');
  glassOverlay.setAttribute('x', String(-hw));
  glassOverlay.setAttribute('y', String(-hh));
  glassOverlay.setAttribute('width', String(w));
  glassOverlay.setAttribute('height', String(h));
  glassOverlay.setAttribute('rx', String(rx));
  glassOverlay.setAttribute('fill', 'none');
  glassOverlay.setAttribute('stroke', 'none');
  glassOverlay.setAttribute('filter', glassUrl);
  innerG.appendChild(glassOverlay);

  // ── Pillar 3: Ambient Occlusion ────────────────────────────────────
  const aoId = `dep-ao-${entityId}`;
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
  const aoOverlay = document.createElementNS(SVG_NS, 'rect');
  aoOverlay.setAttribute('x', String(-hw));
  aoOverlay.setAttribute('y', String(-hh));
  aoOverlay.setAttribute('width', String(w));
  aoOverlay.setAttribute('height', String(h));
  aoOverlay.setAttribute('rx', String(rx));
  aoOverlay.setAttribute('fill', `url(#${aoId})`);
  aoOverlay.setAttribute('stroke', 'none');
  aoOverlay.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoOverlay);

  // ── Upward arrow (shaft rect + triangle head) ──────────────────────
  const arrowG = document.createElementNS(SVG_NS, 'g');
  arrowG.classList.add(`dep-arrow-${entityId}`);

  // Arrow shaft (rect)
  const shaftW = s * 0.06;
  const shaftH = s * 0.2;
  const shaft = document.createElementNS(SVG_NS, 'rect');
  shaft.setAttribute('x', String(-shaftW / 2));
  shaft.setAttribute('y', String(-shaftH * 0.3));
  shaft.setAttribute('width', String(shaftW));
  shaft.setAttribute('height', String(shaftH));
  shaft.setAttribute('rx', String(shaftW / 4));
  shaft.setAttribute('fill', colorWithAlpha(color, 'B3'));
  arrowG.appendChild(shaft);

  // Arrow triangle head
  const triW = s * 0.16;
  const triH = s * 0.12;
  const triTop = -shaftH * 0.3 - triH * 0.4;
  const triD = [
    `M 0 ${triTop}`,
    `L ${triW / 2} ${triTop + triH}`,
    `L ${-triW / 2} ${triTop + triH}`,
    'Z',
  ].join(' ');
  const triHead = document.createElementNS(SVG_NS, 'path');
  triHead.setAttribute('d', triD);
  triHead.setAttribute('fill', colorWithAlpha(color, 'B3'));
  arrowG.appendChild(triHead);

  innerG.appendChild(arrowG);

  // ── Status dot (small circle with glow) ────────────────────────────
  const dotCY = hh * 0.55;
  const dotR = s * 0.035;

  const statusDot = document.createElementNS(SVG_NS, 'circle');
  statusDot.setAttribute('cx', '0');
  statusDot.setAttribute('cy', String(dotCY));
  statusDot.setAttribute('r', String(dotR));
  statusDot.setAttribute('fill', color);
  statusDot.setAttribute('filter', glowUrl);
  statusDot.classList.add(`dep-dot-${entityId}`);
  innerG.appendChild(statusDot);

  // ── Pillar 4: Material Texture — Specular highlight (upper-left) ───
  const specId = `dep-spec-${entityId}`;
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
  const specular = document.createElementNS(SVG_NS, 'ellipse');
  specular.setAttribute('cx', String(-hw * 0.2));
  specular.setAttribute('cy', String(-hh * 0.3));
  specular.setAttribute('rx', String(hw * 0.55));
  specular.setAttribute('ry', String(hh * 0.35));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Pillar 5: Micro-Life — CSS animations ──────────────────────────
  const styleId = `dep-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes depFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      @keyframes depArrowPulse_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes depDotPulse_${entityId} {
        0%, 100% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.5); opacity: 1; }
      }
      .dep-float-${entityId} {
        animation: depFloat_${entityId} 3.5s ease-in-out infinite;
      }
      .dep-arrow-${entityId} {
        transform-origin: center;
        animation: depArrowPulse_${entityId} 2s ease-in-out infinite;
      }
      .dep-dot-${entityId} {
        transform-origin: center;
        animation: depDotPulse_${entityId} 2s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`dep-float-${entityId}`);

  // ── Label below ────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(hh + LABEL_DEFAULTS.offsetBelow));
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
