/**
 * @preplai/illustrations — CircuitBreaker Component (Cinematic Depth)
 *
 * Broken ring + inner circle + "CB" text. Directional lighting,
 * ground shadow, ambient occlusion, specular highlight, micro-life.
 * Use for: circuit breakers, fault tolerance, resilience patterns.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';import type { VisualEntity } from '@preplai/shared';

export function renderCircuitBreaker(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const outerR = size * 0.38;
  const innerR = size * 0.18;
  const breakGap = 25; // degrees of gap in the ring

  const defs = ensureDefs(parentEl);

  // ── 1. Directional Lighting ─────────────────────────────────────────
  const haloId = `cb-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', haloId);
    grad.setAttribute('cx', '38%'); grad.setAttribute('cy', '38%'); grad.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.13');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', String(-outerR * 0.1));
  halo.setAttribute('cy', String(-outerR * 0.1));
  halo.setAttribute('rx', String(outerR * 2));
  halo.setAttribute('ry', String(outerR * 1.7));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── 2. Ground Shadow ────────────────────────────────────────────────
  const gsId = `cb-gshadow-${entityId}`;
  if (!defs.querySelector(`#${gsId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', gsId);
    grad.setAttribute('cx', '50%'); grad.setAttribute('cy', '50%'); grad.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#000000'); s1.setAttribute('stop-opacity', '0.18');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#000000'); s2.setAttribute('stop-opacity', '0');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }
  const groundShadow = document.createElementNS(SVG_NS, 'ellipse');
  groundShadow.setAttribute('cx', '0');
  groundShadow.setAttribute('cy', String(outerR + outerR * 0.15));
  groundShadow.setAttribute('rx', String(outerR * 1.1));
  groundShadow.setAttribute('ry', String(outerR * 0.2));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── 3. Ambient Occlusion ────────────────────────────────────────────
  const aoId = `cb-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', aoId);
    grad.setAttribute('cx', '70%'); grad.setAttribute('cy', '75%'); grad.setAttribute('r', '55%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#000000'); s1.setAttribute('stop-opacity', '0.10');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#000000'); s2.setAttribute('stop-opacity', '0');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // ── Highlight glow ring ─────────────────────────────────────────────
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'circle');
    glow.setAttribute('cx', '0');
    glow.setAttribute('cy', '0');
    glow.setAttribute('r', String(outerR + 4));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Body fill gradient ──────────────────────────────────────────────
  const bodyFillId = `cb-bfill-${entityId}`;
  if (!defs.querySelector(`#${bodyFillId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', bodyFillId);
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.3');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.08');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // ── Broken ring (two arcs with gap at top) ──────────────────────────
  const startAngle1 = (90 + breakGap / 2) * (Math.PI / 180);
  const endAngle1 = (90 + 360 - breakGap / 2) * (Math.PI / 180);
  const x1s = outerR * Math.cos(startAngle1);
  const y1s = outerR * Math.sin(startAngle1);
  const x1e = outerR * Math.cos(endAngle1);
  const y1e = outerR * Math.sin(endAngle1);

  const ring = document.createElementNS(SVG_NS, 'path');
  ring.setAttribute('d', `M ${x1s} ${y1s} A ${outerR} ${outerR} 0 1 1 ${x1e} ${y1e}`);
  ring.setAttribute('fill', 'none');
  ring.setAttribute('stroke', `url(#${bodyFillId})`);
  ring.setAttribute('stroke-width', String(outerR - innerR));
  ring.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(ring);

  // Ring outline stroke
  const ringStrokeId = `cb-rstroke-${entityId}`;
  if (!defs.querySelector(`#${ringStrokeId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', ringStrokeId);
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.9');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.3');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // Outer ring outline
  const ringOutline = document.createElementNS(SVG_NS, 'path');
  ringOutline.setAttribute('d', `M ${x1s} ${y1s} A ${outerR} ${outerR} 0 1 1 ${x1e} ${y1e}`);
  ringOutline.setAttribute('fill', 'none');
  ringOutline.setAttribute('stroke', `url(#${ringStrokeId})`);
  ringOutline.setAttribute('stroke-width', String(STROKE.default));
  ringOutline.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(ringOutline);

  // ── Inner circle ────────────────────────────────────────────────────
  const innerCircle = document.createElementNS(SVG_NS, 'circle');
  innerCircle.setAttribute('cx', '0');
  innerCircle.setAttribute('cy', '0');
  innerCircle.setAttribute('r', String(innerR));
  innerCircle.setAttribute('fill', `url(#${bodyFillId})`);
  innerCircle.setAttribute('stroke', colorWithAlpha(color, '66'));
  innerCircle.setAttribute('stroke-width', String(STROKE.thin));
  innerCircle.classList.add(`cb-reconnect-${entityId}`);
  innerG.appendChild(innerCircle);

  // ── AO overlay ──────────────────────────────────────────────────────
  const aoCircle = document.createElementNS(SVG_NS, 'circle');
  aoCircle.setAttribute('cx', String(outerR * 0.15));
  aoCircle.setAttribute('cy', String(outerR * 0.2));
  aoCircle.setAttribute('r', String(outerR * 0.8));
  aoCircle.setAttribute('fill', `url(#${aoId})`);
  aoCircle.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoCircle);

  // ── "CB" text ───────────────────────────────────────────────────────
  const cbText = document.createElementNS(SVG_NS, 'text');
  cbText.setAttribute('x', '0');
  cbText.setAttribute('y', '2');
  cbText.setAttribute('text-anchor', 'middle');
  cbText.setAttribute('dominant-baseline', 'central');
  cbText.setAttribute('fill', color);
  cbText.setAttribute('font-size', String(size * 0.12));
  cbText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  cbText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  cbText.textContent = 'CB';
  innerG.appendChild(cbText);

  // ── Break flash indicators (small dots at gap ends) ─────────────────
  for (const angle of [startAngle1, endAngle1]) {
    const bx = outerR * Math.cos(angle);
    const by = outerR * Math.sin(angle);
    const flashDot = document.createElementNS(SVG_NS, 'circle');
    flashDot.setAttribute('cx', String(bx));
    flashDot.setAttribute('cy', String(by));
    flashDot.setAttribute('r', String(size * 0.02));
    flashDot.setAttribute('fill', color);
    flashDot.classList.add(`cb-flash-${entityId}`);
    innerG.appendChild(flashDot);
  }

  // ── 4. Specular Highlight ───────────────────────────────────────────
  const specId = `cb-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', specId);
    grad.setAttribute('cx', '35%'); grad.setAttribute('cy', '25%'); grad.setAttribute('r', '40%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#ffffff'); s1.setAttribute('stop-opacity', '0.18');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#ffffff'); s2.setAttribute('stop-opacity', '0');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }
  const specular = document.createElementNS(SVG_NS, 'ellipse');
  specular.setAttribute('cx', String(-outerR * 0.25));
  specular.setAttribute('cy', String(-outerR * 0.3));
  specular.setAttribute('rx', String(outerR * 0.5));
  specular.setAttribute('ry', String(outerR * 0.4));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── 5. Micro-Life — break flash, reconnect pulse scale, float ───────
  const styleId = `cb-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes cbFlash_${entityId} {
        0%, 100% { transform: scale(1); opacity: 0.5; }
        50% { transform: scale(2); opacity: 1; }
      }
      @keyframes cbReconnect_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.08); }
      }
      @keyframes cbFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .cb-flash-${entityId} {
        animation: cbFlash_${entityId} 1.8s ease-in-out infinite;
      }
      .cb-reconnect-${entityId} {
        animation: cbReconnect_${entityId} 2.5s ease-in-out infinite;
      }
      .cb-float-${entityId} {
        animation: cbFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`cb-float-${entityId}`);

  // ── Label below ─────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(outerR + LABEL_DEFAULTS.offsetBelow));
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
