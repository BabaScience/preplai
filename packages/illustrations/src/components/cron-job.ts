/**
 * @preplai/illustrations — CronJob Component (Glassmorphic Depth)
 *
 * A luminous clock face with rotating hands and tick marks.
 * Radial fill gradient, linear stroke gradient, glass + glow filters,
 * 12 tick marks, hour/minute hands, center dot, optional cron expression.
 * Use for: scheduled tasks, cron jobs, timers, recurring jobs.
 *
 * Glassmorphic Depth: radial-gradient clock face, glow halo behind,
 * glass filter body, gradient stroke ring, micro-life animations.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlassFilter, ensureGlowFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderCronJob(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const clockR = s * 0.35;
  const defs = ensureDefs(parentEl);
  const glassRef = ensureGlassFilter(parentEl);
  const glowFilterId = `cron-glow-${entityId}`;
  const glowRef = ensureGlowFilter(parentEl, color, glowFilterId);

  // ── Radial depth halo ──────────────────────────────────────────────
  const haloId = `cron-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const haloGrad = document.createElementNS(SVG_NS, 'radialGradient');
    haloGrad.setAttribute('id', haloId);
    haloGrad.setAttribute('cx', '38%'); haloGrad.setAttribute('cy', '38%');
    haloGrad.setAttribute('r', '50%');
    const hs1 = document.createElementNS(SVG_NS, 'stop');
    hs1.setAttribute('offset', '0%'); hs1.setAttribute('stop-color', color); hs1.setAttribute('stop-opacity', '0.13');
    const hs2 = document.createElementNS(SVG_NS, 'stop');
    hs2.setAttribute('offset', '100%'); hs2.setAttribute('stop-color', color); hs2.setAttribute('stop-opacity', '0');
    haloGrad.appendChild(hs1); haloGrad.appendChild(hs2);
    defs.appendChild(haloGrad);
  }
  const halo = document.createElementNS(SVG_NS, 'circle');
  halo.setAttribute('cx', '0'); halo.setAttribute('cy', '0');
  halo.setAttribute('r', String(clockR * 2));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Ground contact shadow ──────────────────────────────────────────
  const gsId = `cron-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(clockR * 1.15));
  groundShadow.setAttribute('rx', String(clockR * 1.1));
  groundShadow.setAttribute('ry', String(clockR * 0.3));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Ambient occlusion ──────────────────────────────────────────────
  const aoId = `cron-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const aoGrad = document.createElementNS(SVG_NS, 'radialGradient');
    aoGrad.setAttribute('id', aoId);
    aoGrad.setAttribute('cx', '70%'); aoGrad.setAttribute('cy', '75%'); aoGrad.setAttribute('r', '60%');
    const ao1 = document.createElementNS(SVG_NS, 'stop');
    ao1.setAttribute('offset', '0%'); ao1.setAttribute('stop-color', '#000000'); ao1.setAttribute('stop-opacity', '0.10');
    const ao2 = document.createElementNS(SVG_NS, 'stop');
    ao2.setAttribute('offset', '100%'); ao2.setAttribute('stop-color', '#000000'); ao2.setAttribute('stop-opacity', '0');
    aoGrad.appendChild(ao1); aoGrad.appendChild(ao2);
    defs.appendChild(aoGrad);
  }
  const ao = document.createElementNS(SVG_NS, 'circle');
  ao.setAttribute('cx', '0'); ao.setAttribute('cy', '0');
  ao.setAttribute('r', String(clockR));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Clock face radial fill gradient ────────────────────────────────
  const faceGradId = `cron-face-${entityId}`;
  if (!defs.querySelector(`#${faceGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', faceGradId);
    grad.setAttribute('cx', '45%'); grad.setAttribute('cy', '40%'); grad.setAttribute('r', '55%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#ffffff'); s1.setAttribute('stop-opacity', '0.12');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '50%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.18');
    const s3 = document.createElementNS(SVG_NS, 'stop');
    s3.setAttribute('offset', '100%'); s3.setAttribute('stop-color', color); s3.setAttribute('stop-opacity', '0.06');
    grad.appendChild(s1); grad.appendChild(s2); grad.appendChild(s3);
    defs.appendChild(grad);
  }

  // ── Clock face stroke linear gradient ──────────────────────────────
  const strokeGradId = `cron-stroke-${entityId}`;
  if (!defs.querySelector(`#${strokeGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', strokeGradId);
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#ffffff'); s1.setAttribute('stop-opacity', '0.7');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '1');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // ── Highlight glow ring ────────────────────────────────────────────
  if (entity.highlight) {
    const glowRing = document.createElementNS(SVG_NS, 'circle');
    glowRing.setAttribute('cx', '0'); glowRing.setAttribute('cy', '0');
    glowRing.setAttribute('r', String(clockR + 4));
    glowRing.setAttribute('fill', 'none');
    glowRing.setAttribute('stroke-width', String(STROKE.default));
    glowRing.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glowRing, cc);
    innerG.appendChild(glowRing);
  }

  // ── Outer glow halo (behind clock face) ────────────────────────────
  const outerHalo = document.createElementNS(SVG_NS, 'circle');
  outerHalo.setAttribute('cx', '0'); outerHalo.setAttribute('cy', '0');
  outerHalo.setAttribute('r', String(clockR + 5));
  outerHalo.setAttribute('fill', colorWithAlpha(color, '0.08'));
  outerHalo.setAttribute('filter', glowRef);
  innerG.appendChild(outerHalo);

  // ── Clock face circle (radial fill + glass filter) ─────────────────
  const face = document.createElementNS(SVG_NS, 'circle');
  face.setAttribute('cx', '0'); face.setAttribute('cy', '0');
  face.setAttribute('r', String(clockR));
  face.setAttribute('fill', `url(#${faceGradId})`);
  face.setAttribute('filter', glassRef);
  innerG.appendChild(face);

  // ── Clock face stroke ring (gradient stroke) ───────────────────────
  const faceRing = document.createElementNS(SVG_NS, 'circle');
  faceRing.setAttribute('cx', '0'); faceRing.setAttribute('cy', '0');
  faceRing.setAttribute('r', String(clockR));
  faceRing.setAttribute('fill', 'none');
  faceRing.setAttribute('stroke', `url(#${strokeGradId})`);
  faceRing.setAttribute('stroke-width', String(STROKE.emphasized));
  innerG.appendChild(faceRing);

  // ── 12 tick marks around edge ──────────────────────────────────────
  const tickInner = clockR * 0.82;
  const tickOuter = clockR * 0.92;
  const tickColor = colorWithAlpha(color, '0.3');
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30) * (Math.PI / 180);
    const x1 = Math.cos(angle) * tickInner;
    const y1 = Math.sin(angle) * tickInner;
    const x2 = Math.cos(angle) * tickOuter;
    const y2 = Math.sin(angle) * tickOuter;
    const tick = document.createElementNS(SVG_NS, 'line');
    tick.setAttribute('x1', String(x1)); tick.setAttribute('y1', String(y1));
    tick.setAttribute('x2', String(x2)); tick.setAttribute('y2', String(y2));
    tick.setAttribute('stroke', tickColor);
    tick.setAttribute('stroke-width', '1');
    tick.setAttribute('stroke-linecap', 'round');
    innerG.appendChild(tick);
  }

  // ── Hour hand ──────────────────────────────────────────────────────
  const hourLen = clockR * 0.45;
  const hourAngle = -60 * (Math.PI / 180); // pointing ~10 o'clock
  const hourHand = document.createElementNS(SVG_NS, 'line');
  hourHand.setAttribute('x1', '0'); hourHand.setAttribute('y1', '0');
  hourHand.setAttribute('x2', String(Math.cos(hourAngle) * hourLen));
  hourHand.setAttribute('y2', String(Math.sin(hourAngle) * hourLen));
  hourHand.setAttribute('stroke', colorWithAlpha(color, '0.7'));
  hourHand.setAttribute('stroke-width', '2');
  hourHand.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(hourHand);

  // ── Minute hand (animated) ─────────────────────────────────────────
  const minuteLen = clockR * 0.65;
  const minuteG = document.createElementNS(SVG_NS, 'g');
  minuteG.setAttribute('class', `cron-minute-${entityId}`);
  const minuteHand = document.createElementNS(SVG_NS, 'line');
  minuteHand.setAttribute('x1', '0'); minuteHand.setAttribute('y1', '0');
  minuteHand.setAttribute('x2', '0'); minuteHand.setAttribute('y2', String(-minuteLen));
  minuteHand.setAttribute('stroke', colorWithAlpha(color, '0.5'));
  minuteHand.setAttribute('stroke-width', '1.5');
  minuteHand.setAttribute('stroke-linecap', 'round');
  minuteG.appendChild(minuteHand);
  innerG.appendChild(minuteG);

  // ── Center dot ─────────────────────────────────────────────────────
  const centerDot = document.createElementNS(SVG_NS, 'circle');
  centerDot.setAttribute('cx', '0'); centerDot.setAttribute('cy', '0');
  centerDot.setAttribute('r', String(clockR * 0.06));
  centerDot.setAttribute('fill', color);
  centerDot.setAttribute('class', `cron-center-${entityId}`);
  innerG.appendChild(centerDot);

  // ── Specular highlight on clock face ───────────────────────────────
  const specId = `cron-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    const specGrad = document.createElementNS(SVG_NS, 'radialGradient');
    specGrad.setAttribute('id', specId);
    specGrad.setAttribute('cx', '35%'); specGrad.setAttribute('cy', '30%'); specGrad.setAttribute('r', '45%');
    const sp1 = document.createElementNS(SVG_NS, 'stop');
    sp1.setAttribute('offset', '0%'); sp1.setAttribute('stop-color', '#ffffff'); sp1.setAttribute('stop-opacity', '0.15');
    const sp2 = document.createElementNS(SVG_NS, 'stop');
    sp2.setAttribute('offset', '100%'); sp2.setAttribute('stop-color', '#ffffff'); sp2.setAttribute('stop-opacity', '0');
    specGrad.appendChild(sp1); specGrad.appendChild(sp2);
    defs.appendChild(specGrad);
  }
  const specular = document.createElementNS(SVG_NS, 'circle');
  specular.setAttribute('cx', String(-clockR * 0.15));
  specular.setAttribute('cy', String(-clockR * 0.15));
  specular.setAttribute('r', String(clockR * 0.55));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Optional cron expression text ──────────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const expression = (entity as any).metadata?.expression as string | undefined;
  if (expression) {
    const exprText = document.createElementNS(SVG_NS, 'text');
    exprText.setAttribute('x', '0');
    exprText.setAttribute('y', String(clockR + 12));
    exprText.setAttribute('text-anchor', 'middle');
    exprText.setAttribute('fill', cc.textTertiary);
    exprText.setAttribute('font-size', String(Math.max(8, s * 0.065)));
    exprText.setAttribute('font-family', "'JetBrains Mono', monospace");
    exprText.setAttribute('font-weight', '400');
    exprText.textContent = expression;
    innerG.appendChild(exprText);
  }

  // ── Micro-life animations ──────────────────────────────────────────
  const styleId = `cron-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes cronFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      @keyframes cronMinuteRotate_${entityId} {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes cronCenterPulse_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.3); }
      }
      .cron-float-${entityId} {
        animation: cronFloat_${entityId} 4s ease-in-out infinite;
      }
      .cron-minute-${entityId} {
        transform-origin: 0 0;
        animation: cronMinuteRotate_${entityId} 8s linear infinite;
      }
      .cron-center-${entityId} {
        transform-origin: 0 0;
        animation: cronCenterPulse_${entityId} 3s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`cron-float-${entityId}`);

  // ── Label below ────────────────────────────────────────────────────
  if (entity.label) {
    const labelY = expression ? clockR + 26 : clockR + 14;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(labelY));
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
