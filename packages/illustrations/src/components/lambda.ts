/**
 * @preplai/illustrations — Lambda Component (Cinematic 5-Pillar Depth)
 *
 * Rounded rectangle with centered λ character and execution dot.
 * Use for: serverless functions, AWS Lambda, cloud functions.
 *
 * 5-Pillar Cinematic Treatment:
 *   1. Directional Lighting — radial halo behind entity
 *   2. Ground Contact Shadow — small ellipse below body
 *   3. Ambient Occlusion — dark overlay on lower-right
 *   4. Specular Highlight — bright spot upper-left
 *   5. Micro-Life — body float, lambda breathe, exec dot pulse
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlassFilter, ensureGlowFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderLambda(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const w = s * 0.8;
  const h = s * 0.65;
  const hw = w / 2;
  const hh = h / 2;
  const rx = 10;

  const defs = ensureDefs(parentEl);

  // ── P1: Directional Lighting — radial halo behind entity ────────────
  const haloId = `lambda-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-hw * 0.15));
  halo.setAttribute('cy', String(-hh * 0.1));
  halo.setAttribute('rx', String(hw * 1.8));
  halo.setAttribute('ry', String(hh * 1.5));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── P2: Ground Contact Shadow ───────────────────────────────────────
  const gshadowId = `lambda-gshadow-${entityId}`;
  if (!defs.querySelector(`#${gshadowId}`)) {
    const gsg = document.createElementNS(SVG_NS, 'radialGradient');
    gsg.setAttribute('id', gshadowId);
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
  groundShadow.setAttribute('cy', String(hh + hh * 0.15));
  groundShadow.setAttribute('rx', String(hw * 0.9));
  groundShadow.setAttribute('ry', String(hh * 0.18));
  groundShadow.setAttribute('fill', `url(#${gshadowId})`);
  innerG.appendChild(groundShadow);

  // ── Highlight glow ring ─────────────────────────────────────────────
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

  // ── Body fill gradient ──────────────────────────────────────────────
  const bodyGradId = `lambda-body-${entityId}`;
  if (!defs.querySelector(`#${bodyGradId}`)) {
    const bodyGrad = document.createElementNS(SVG_NS, 'radialGradient');
    bodyGrad.setAttribute('id', bodyGradId);
    bodyGrad.setAttribute('cx', '38%');
    bodyGrad.setAttribute('cy', '38%');
    bodyGrad.setAttribute('r', '65%');
    const bs1 = document.createElementNS(SVG_NS, 'stop');
    bs1.setAttribute('offset', '0%');
    bs1.setAttribute('stop-color', color);
    bs1.setAttribute('stop-opacity', '0.35');
    const bs2 = document.createElementNS(SVG_NS, 'stop');
    bs2.setAttribute('offset', '100%');
    bs2.setAttribute('stop-color', color);
    bs2.setAttribute('stop-opacity', '0.08');
    bodyGrad.appendChild(bs1);
    bodyGrad.appendChild(bs2);
    defs.appendChild(bodyGrad);
  }

  // ── Body stroke gradient ────────────────────────────────────────────
  const strokeGradId = `lambda-stroke-${entityId}`;
  if (!defs.querySelector(`#${strokeGradId}`)) {
    const strokeGrad = document.createElementNS(SVG_NS, 'linearGradient');
    strokeGrad.setAttribute('id', strokeGradId);
    strokeGrad.setAttribute('x1', '0%');
    strokeGrad.setAttribute('y1', '0%');
    strokeGrad.setAttribute('x2', '100%');
    strokeGrad.setAttribute('y2', '100%');
    const ss1 = document.createElementNS(SVG_NS, 'stop');
    ss1.setAttribute('offset', '0%');
    ss1.setAttribute('stop-color', color);
    ss1.setAttribute('stop-opacity', '0.9');
    const ss2 = document.createElementNS(SVG_NS, 'stop');
    ss2.setAttribute('offset', '100%');
    ss2.setAttribute('stop-color', color);
    ss2.setAttribute('stop-opacity', '0.3');
    strokeGrad.appendChild(ss1);
    strokeGrad.appendChild(ss2);
    defs.appendChild(strokeGrad);
  }

  // ── Glow filter on body ─────────────────────────────────────────────
  const glowUrl = ensureGlowFilter(parentEl, color, `lambda-glow-${entityId}`);

  // ── Body rect ───────────────────────────────────────────────────────
  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x', String(-hw));
  rect.setAttribute('y', String(-hh));
  rect.setAttribute('width', String(w));
  rect.setAttribute('height', String(h));
  rect.setAttribute('rx', String(rx));
  rect.setAttribute('fill', `url(#${bodyGradId})`);
  rect.setAttribute('stroke', `url(#${strokeGradId})`);
  rect.setAttribute('stroke-width', '2');
  rect.setAttribute('filter', glowUrl);
  rect.setAttribute('data-morph-target', 'true');
  innerG.appendChild(rect);

  // ── Glass overlay ───────────────────────────────────────────────────
  const glassFilterUrl = ensureGlassFilter(parentEl);
  const glass = document.createElementNS(SVG_NS, 'rect');
  glass.setAttribute('x', String(-hw));
  glass.setAttribute('y', String(-hh));
  glass.setAttribute('width', String(w));
  glass.setAttribute('height', String(h));
  glass.setAttribute('rx', String(rx));
  glass.setAttribute('fill', 'none');
  glass.setAttribute('filter', glassFilterUrl);
  glass.setAttribute('pointer-events', 'none');
  innerG.appendChild(glass);

  // ── P3: Ambient Occlusion ───────────────────────────────────────────
  const aoId = `lambda-ao-${entityId}`;
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
  const ao = document.createElementNS(SVG_NS, 'rect');
  ao.setAttribute('x', String(-hw));
  ao.setAttribute('y', String(-hh));
  ao.setAttribute('width', String(w));
  ao.setAttribute('height', String(h));
  ao.setAttribute('rx', String(rx));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── P4: Specular Highlight ──────────────────────────────────────────
  const specId = `lambda-spec-${entityId}`;
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
  specular.setAttribute('cx', String(-hw * 0.25));
  specular.setAttribute('cy', String(-hh * 0.35));
  specular.setAttribute('rx', String(hw * 0.55));
  specular.setAttribute('ry', String(hh * 0.4));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Lambda "λ" character ────────────────────────────────────────────
  const lambda = document.createElementNS(SVG_NS, 'text');
  lambda.setAttribute('x', '0');
  lambda.setAttribute('y', String(h * 0.08));
  lambda.setAttribute('text-anchor', 'middle');
  lambda.setAttribute('dominant-baseline', 'central');
  lambda.setAttribute('fill', cc.textPrimary);
  lambda.setAttribute('font-size', String(Math.min(s * 0.5, h * 0.55)));
  lambda.setAttribute('font-weight', '300');
  lambda.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  lambda.classList.add(`lambda-breathe-${entityId}`);
  lambda.textContent = 'λ';
  innerG.appendChild(lambda);

  // ── Exec dot (top-right) ────────────────────────────────────────────
  const dotR = s * 0.045;
  const dotCx = hw - dotR * 1.5;
  const dotCy = -hh + dotR * 1.5;

  // Outer glow shadow for exec dot
  const dotGlow = document.createElementNS(SVG_NS, 'circle');
  dotGlow.setAttribute('cx', String(dotCx));
  dotGlow.setAttribute('cy', String(dotCy));
  dotGlow.setAttribute('r', String(dotR * 2.5));
  dotGlow.setAttribute('fill', colorWithAlpha(color, '0.25'));
  dotGlow.setAttribute('pointer-events', 'none');
  innerG.appendChild(dotGlow);

  // Exec dot solid fill
  const dot = document.createElementNS(SVG_NS, 'circle');
  dot.setAttribute('cx', String(dotCx));
  dot.setAttribute('cy', String(dotCy));
  dot.setAttribute('r', String(dotR));
  dot.setAttribute('fill', color);
  dot.classList.add(`lambda-dotpulse-${entityId}`);
  innerG.appendChild(dot);

  // ── P5: Micro-Life CSS animations ──────────────────────────────────
  const styleId = `lambda-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes lambdaFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes lambdaBreathe_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      @keyframes lambdaDotPulse_${entityId} {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.5); opacity: 0.7; }
      }
      .lambda-float-${entityId} {
        animation: lambdaFloat_${entityId} 3.5s ease-in-out infinite;
      }
      .lambda-breathe-${entityId} {
        animation: lambdaBreathe_${entityId} 2.5s ease-in-out infinite;
        transform-origin: center;
        transform-box: fill-box;
      }
      .lambda-dotpulse-${entityId} {
        animation: lambdaDotPulse_${entityId} 2s ease-in-out infinite;
        transform-origin: center;
        transform-box: fill-box;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`lambda-float-${entityId}`);

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
