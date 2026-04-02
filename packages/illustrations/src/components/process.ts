/**
 * @preplai/illustrations — Process Component (Cinematic 5-Pillar)
 *
 * A glowing circle with an upward arrow icon and status dot.
 * Use for: processes, workflow steps, execution nodes, running tasks.
 *
 * 5 Pillars:
 *   1. Directional Lighting — radial halo cx=38% cy=38%
 *   2. Ground Shadow — radial black ellipse below
 *   3. Ambient Occlusion — radial cx=70% cy=75% overlay
 *   4. Specular Highlight — radial white cx=35% cy=25% upper-left
 *   5. Micro-Life — float 3.5s whole entity, arrow pulse 2.5s, status dot pulse 2s
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlassFilter, ensureGlowFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderProcess(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const r = s * 0.42;

  const defs = ensureDefs(parentEl);

  // ── 1. Directional Lighting — radial halo behind entity ──────────────
  const haloId = `proc-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', haloId);
    grad.setAttribute('cx', '38%'); grad.setAttribute('cy', '38%');
    grad.setAttribute('r', '50%');
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
  halo.setAttribute('cx', String(-r * 0.15));
  halo.setAttribute('cy', String(-r * 0.15));
  halo.setAttribute('rx', String(r * 2));
  halo.setAttribute('ry', String(r * 1.6));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── 2. Ground Shadow — ellipse below ─────────────────────────────────
  const gsId = `proc-gshadow-${entityId}`;
  if (!defs.querySelector(`#${gsId}`)) {
    const gsg = document.createElementNS(SVG_NS, 'radialGradient');
    gsg.setAttribute('id', gsId);
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
  groundShadow.setAttribute('cy', String(r + r * 0.15));
  groundShadow.setAttribute('rx', String(r * 0.9));
  groundShadow.setAttribute('ry', String(r * 0.22));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Highlight glow ring (behind shape) ───────────────────────────────
  if (entity.highlight) {
    const glowRing = document.createElementNS(SVG_NS, 'ellipse');
    glowRing.setAttribute('cx', '0');
    glowRing.setAttribute('cy', '0');
    glowRing.setAttribute('rx', String(r + 3));
    glowRing.setAttribute('ry', String(r + 3));
    glowRing.setAttribute('stroke-width', String(STROKE.default));
    glowRing.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glowRing, cc);
    innerG.appendChild(glowRing);
  }

  // ── Main circle body — radial gradient fill + stroke gradient ────────
  const fillGradId = `proc-fill-${entityId}`;
  if (!defs.querySelector(`#${fillGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', fillGradId);
    grad.setAttribute('cx', '38%'); grad.setAttribute('cy', '38%');
    grad.setAttribute('r', '60%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', color);
    s1.setAttribute('stop-opacity', '0.3');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', color);
    s2.setAttribute('stop-opacity', '0.08');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  const strokeGradId = `proc-stroke-${entityId}`;
  if (!defs.querySelector(`#${strokeGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', strokeGradId);
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', color);
    s1.setAttribute('stop-opacity', '0.9');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', color);
    s2.setAttribute('stop-opacity', '0.3');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // GlowFilter + GlassFilter on body
  const glowUrl = ensureGlowFilter(parentEl, color);
  const glassUrl = ensureGlassFilter(parentEl);

  const body = document.createElementNS(SVG_NS, 'ellipse');
  body.setAttribute('cx', '0');
  body.setAttribute('cy', '0');
  body.setAttribute('rx', String(r));
  body.setAttribute('ry', String(r));
  body.setAttribute('fill', `url(#${fillGradId})`);
  body.setAttribute('stroke', `url(#${strokeGradId})`);
  body.setAttribute('stroke-width', '2');
  body.setAttribute('filter', `${glowUrl.replace('url(', '').replace(')', '')} ${glassUrl.replace('url(', '').replace(')', '')}`);
  // SVG only supports one filter reference — layer them via a combined approach
  body.setAttribute('filter', glassUrl);
  body.setAttribute('data-morph-target', 'true');
  innerG.appendChild(body);

  // Glow ring behind body for the colored glow effect
  const bodyGlow = document.createElementNS(SVG_NS, 'ellipse');
  bodyGlow.setAttribute('cx', '0');
  bodyGlow.setAttribute('cy', '0');
  bodyGlow.setAttribute('rx', String(r + 1));
  bodyGlow.setAttribute('ry', String(r + 1));
  bodyGlow.setAttribute('fill', 'none');
  bodyGlow.setAttribute('stroke', colorWithAlpha(color, '4d'));
  bodyGlow.setAttribute('stroke-width', '1');
  bodyGlow.setAttribute('filter', glowUrl);
  bodyGlow.setAttribute('pointer-events', 'none');
  innerG.insertBefore(bodyGlow, body);

  // ── 3. Ambient Occlusion — bottom-right darkening overlay ────────────
  const aoId = `proc-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const aoGrad = document.createElementNS(SVG_NS, 'radialGradient');
    aoGrad.setAttribute('id', aoId);
    aoGrad.setAttribute('cx', '70%'); aoGrad.setAttribute('cy', '75%');
    aoGrad.setAttribute('r', '55%');
    const ao1 = document.createElementNS(SVG_NS, 'stop');
    ao1.setAttribute('offset', '0%'); ao1.setAttribute('stop-color', '#000000'); ao1.setAttribute('stop-opacity', '0.10');
    const ao2 = document.createElementNS(SVG_NS, 'stop');
    ao2.setAttribute('offset', '100%'); ao2.setAttribute('stop-color', '#000000'); ao2.setAttribute('stop-opacity', '0');
    aoGrad.appendChild(ao1); aoGrad.appendChild(ao2);
    defs.appendChild(aoGrad);
  }
  const ao = document.createElementNS(SVG_NS, 'ellipse');
  ao.setAttribute('cx', '0');
  ao.setAttribute('cy', '0');
  ao.setAttribute('rx', String(r));
  ao.setAttribute('ry', String(r));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── 4. Specular Highlight — upper-left white gleam ───────────────────
  const specId = `proc-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    const specGrad = document.createElementNS(SVG_NS, 'radialGradient');
    specGrad.setAttribute('id', specId);
    specGrad.setAttribute('cx', '35%'); specGrad.setAttribute('cy', '25%');
    specGrad.setAttribute('r', '40%');
    const sp1 = document.createElementNS(SVG_NS, 'stop');
    sp1.setAttribute('offset', '0%'); sp1.setAttribute('stop-color', '#ffffff'); sp1.setAttribute('stop-opacity', '0.18');
    const sp2 = document.createElementNS(SVG_NS, 'stop');
    sp2.setAttribute('offset', '100%'); sp2.setAttribute('stop-color', '#ffffff'); sp2.setAttribute('stop-opacity', '0');
    specGrad.appendChild(sp1); specGrad.appendChild(sp2);
    defs.appendChild(specGrad);
  }
  const specular = document.createElementNS(SVG_NS, 'ellipse');
  specular.setAttribute('cx', String(-r * 0.15));
  specular.setAttribute('cy', String(-r * 0.2));
  specular.setAttribute('rx', String(r * 0.7));
  specular.setAttribute('ry', String(r * 0.6));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Upward arrow icon (filled, centered in circle) ───────────────────
  const arrowS = r * 0.55;
  const arrowD = [
    // Arrow shaft
    `M 0 ${arrowS * 0.5}`,
    `L 0 ${-arrowS * 0.25}`,
    // Arrow head
    `M ${-arrowS * 0.35} ${-arrowS * 0.05}`,
    `L 0 ${-arrowS * 0.5}`,
    `L ${arrowS * 0.35} ${-arrowS * 0.05}`,
  ].join(' ');

  const arrow = document.createElementNS(SVG_NS, 'path');
  arrow.setAttribute('d', arrowD);
  arrow.setAttribute('fill', 'none');
  arrow.setAttribute('stroke', colorWithAlpha(color, 'b3'));
  arrow.setAttribute('stroke-width', String(Math.max(2, r * 0.08)));
  arrow.setAttribute('stroke-linecap', 'round');
  arrow.setAttribute('stroke-linejoin', 'round');
  arrow.setAttribute('class', `procArrow_${entityId}`);
  innerG.appendChild(arrow);

  // ── Status dot — small circle top-right, solid color + glow ──────────
  const dotR = r * 0.12;
  const dotX = r * 0.6;
  const dotY = -r * 0.6;

  const statusDot = document.createElementNS(SVG_NS, 'circle');
  statusDot.setAttribute('cx', String(dotX));
  statusDot.setAttribute('cy', String(dotY));
  statusDot.setAttribute('r', String(dotR));
  statusDot.setAttribute('fill', color);
  statusDot.setAttribute('filter', glowUrl);
  statusDot.setAttribute('class', `procDot_${entityId}`);
  innerG.appendChild(statusDot);

  // ── 5. Micro-Life — float + arrow pulse + status dot pulse ───────────
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  const styleId = `proc-style-${entityId}`;
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes procFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      @keyframes procArrowPulse_${entityId} {
        0%, 100% { transform: scale(1); opacity: 0.7; }
        50% { transform: scale(1.08); opacity: 1; }
      }
      @keyframes procDotPulse_${entityId} {
        0%, 100% { transform: scale(1); opacity: 0.9; }
        50% { transform: scale(1.5); opacity: 1; }
      }
      .procFloat_${entityId} {
        animation: procFloat_${entityId} 3.5s ease-in-out infinite;
      }
      .procArrow_${entityId} {
        transform-origin: center;
        animation: procArrowPulse_${entityId} 2.5s ease-in-out infinite;
      }
      .procDot_${entityId} {
        transform-origin: ${dotX}px ${dotY}px;
        animation: procDotPulse_${entityId} 2s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`procFloat_${entityId}`);

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
