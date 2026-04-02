/**
 * @preplai/illustrations — Firewall Component (Cinematic 5-Pillar)
 *
 * A glowing shield shape with internal flame icon and status indicator.
 * Use for: firewalls, WAFs, security boundaries, network barriers, DDoS protection.
 *
 * 5-Pillar Cinematic Depth:
 *   1. Directional Lighting — radial halo behind shield
 *   2. Ground Contact Shadow — soft ellipse below
 *   3. Ambient Occlusion — darkened lower-right interior
 *   4. Material Texture — specular highlight upper-left
 *   5. Micro-Life — body float, flame pulse, status dot pulse
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlassFilter, ensureGlowFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderFirewall(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const defs = ensureDefs(parentEl);

  // Shield dimensions
  const shieldW = s * 0.8;
  const shieldH = s * 0.9;
  const hw = shieldW / 2;
  const hh = shieldH / 2;

  // Shield path: curved top, pointed bottom
  const shieldD = [
    `M 0 ${-hh}`,                              // top center
    `C ${hw * 0.15} ${-hh} ${hw} ${-hh * 0.85} ${hw} ${-hh * 0.55}`, // top-right curve
    `L ${hw} ${hh * 0.15}`,                    // right side down
    `C ${hw} ${hh * 0.5} ${hw * 0.3} ${hh * 0.85} 0 ${hh}`,  // bottom-right to point
    `C ${-hw * 0.3} ${hh * 0.85} ${-hw} ${hh * 0.5} ${-hw} ${hh * 0.15}`, // point to bottom-left
    `L ${-hw} ${-hh * 0.55}`,                  // left side up
    `C ${-hw} ${-hh * 0.85} ${-hw * 0.15} ${-hh} 0 ${-hh}`,  // top-left curve
    'Z',
  ].join(' ');

  // ── Pillar 1: Directional Lighting (radial halo behind shield) ──────
  const haloId = `fw-halo-${entityId}`;
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

  // ── Pillar 2: Ground Contact Shadow ─────────────────────────────────
  const gshadowId = `fw-gshadow-${entityId}`;
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

  // ── Highlight glow ring ─────────────────────────────────────────────
  if (entity.highlight) {
    const glowPath = document.createElementNS(SVG_NS, 'path');
    glowPath.setAttribute('d', shieldD);
    glowPath.setAttribute('fill', 'none');
    glowPath.setAttribute('stroke-width', String(STROKE.default));
    glowPath.setAttribute('stroke-dasharray', '4,4');
    glowPath.setAttribute('transform', 'scale(1.08)');
    applyGlowColors(glowPath, cc);
    innerG.appendChild(glowPath);
  }

  // ── Shield fill gradient (radial: center bright → edge dim) ─────────
  const shieldFillId = `fw-fill-${entityId}`;
  if (!defs.querySelector(`#${shieldFillId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', shieldFillId);
    grad.setAttribute('cx', '50%'); grad.setAttribute('cy', '45%'); grad.setAttribute('r', '55%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.4');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.1');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // ── Shield stroke gradient (top bright → bottom dim) ────────────────
  const shieldStrokeId = `fw-stroke-${entityId}`;
  if (!defs.querySelector(`#${shieldStrokeId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', shieldStrokeId);
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '0%'); grad.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '1');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.4');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // ── Glow filter for shield ──────────────────────────────────────────
  const glowUrl = ensureGlowFilter(parentEl, color, `fw-glow-${entityId}`);

  // ── Main shield shape ───────────────────────────────────────────────
  const shieldBody = document.createElementNS(SVG_NS, 'path');
  shieldBody.setAttribute('d', shieldD);
  shieldBody.setAttribute('fill', `url(#${shieldFillId})`);
  shieldBody.setAttribute('stroke', `url(#${shieldStrokeId})`);
  shieldBody.setAttribute('stroke-width', '2');
  shieldBody.setAttribute('stroke-linejoin', 'round');
  shieldBody.setAttribute('filter', glowUrl);
  innerG.appendChild(shieldBody);

  // ── Glass overlay (same shape, fill=none, glass filter) ─────────────
  const glassUrl = ensureGlassFilter(parentEl);
  const glassOverlay = document.createElementNS(SVG_NS, 'path');
  glassOverlay.setAttribute('d', shieldD);
  glassOverlay.setAttribute('fill', 'none');
  glassOverlay.setAttribute('stroke', 'none');
  glassOverlay.setAttribute('filter', glassUrl);
  innerG.appendChild(glassOverlay);

  // ── Pillar 3: Ambient Occlusion ─────────────────────────────────────
  const aoId = `fw-ao-${entityId}`;
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
  const aoOverlay = document.createElementNS(SVG_NS, 'path');
  aoOverlay.setAttribute('d', shieldD);
  aoOverlay.setAttribute('fill', `url(#${aoId})`);
  aoOverlay.setAttribute('stroke', 'none');
  aoOverlay.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoOverlay);

  // ── Internal detail: Flame icon (two overlapping ellipses) ──────────
  const flameCY = -hh * 0.05;
  const flameOuterRX = hw * 0.28;
  const flameOuterRY = hh * 0.32;
  const flameInnerRX = hw * 0.16;
  const flameInnerRY = hh * 0.2;

  const flameG = document.createElementNS(SVG_NS, 'g');
  flameG.classList.add(`fw-flame-${entityId}`);

  // Outer flame (larger, dimmer)
  const flameOuter = document.createElementNS(SVG_NS, 'ellipse');
  flameOuter.setAttribute('cx', '0');
  flameOuter.setAttribute('cy', String(flameCY));
  flameOuter.setAttribute('rx', String(flameOuterRX));
  flameOuter.setAttribute('ry', String(flameOuterRY));
  flameOuter.setAttribute('fill', colorWithAlpha(color, '80'));
  flameG.appendChild(flameOuter);

  // Inner flame (smaller, brighter)
  const flameInner = document.createElementNS(SVG_NS, 'ellipse');
  flameInner.setAttribute('cx', '0');
  flameInner.setAttribute('cy', String(flameCY - hh * 0.04));
  flameInner.setAttribute('rx', String(flameInnerRX));
  flameInner.setAttribute('ry', String(flameInnerRY));
  flameInner.setAttribute('fill', colorWithAlpha(color, 'CC'));
  flameG.appendChild(flameInner);

  innerG.appendChild(flameG);

  // ── Status dot (small circle with glow shadow) ──────────────────────
  const dotCY = hh * 0.45;
  const dotR = s * 0.035;

  const statusDot = document.createElementNS(SVG_NS, 'circle');
  statusDot.setAttribute('cx', '0');
  statusDot.setAttribute('cy', String(dotCY));
  statusDot.setAttribute('r', String(dotR));
  statusDot.setAttribute('fill', color);
  statusDot.setAttribute('filter', glowUrl);
  statusDot.classList.add(`fw-dot-${entityId}`);
  innerG.appendChild(statusDot);

  // ── Pillar 4: Material Texture — Specular highlight (upper-left) ────
  const specId = `fw-spec-${entityId}`;
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

  // ── Pillar 5: Micro-Life — CSS animations ───────────────────────────
  const styleId = `fw-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes fwFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      @keyframes fwFlamePulse_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.4); }
      }
      @keyframes fwDotPulse_${entityId} {
        0%, 100% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.5); opacity: 1; }
      }
      .fw-float-${entityId} {
        animation: fwFloat_${entityId} 4s ease-in-out infinite;
      }
      .fw-flame-${entityId} {
        transform-origin: center;
        animation: fwFlamePulse_${entityId} 2s ease-in-out infinite;
      }
      .fw-dot-${entityId} {
        transform-origin: center;
        animation: fwDotPulse_${entityId} 2.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`fw-float-${entityId}`);

  // ── Label below ─────────────────────────────────────────────────────
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
