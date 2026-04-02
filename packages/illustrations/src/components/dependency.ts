/**
 * @preplai/illustrations — Dependency Component (Cinematic Depth)
 *
 * Two boxes A->B + arrow + dashed curve. Directional lighting,
 * ground shadow, ambient occlusion, specular highlight, micro-life.
 * Use for: package dependencies, npm/pip packages, A depends on B.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';import type { VisualEntity } from '@preplai/shared';

export function renderDependency(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const boxW = size * 0.32;
  const boxH = size * 0.28;
  const gap = size * 0.28;
  const totalW = boxW * 2 + gap;
  const hw = totalW / 2;
  const hh = boxH / 2;
  const rx = 4;

  const defs = ensureDefs(parentEl);

  // ── 1. Directional Lighting ─────────────────────────────────────────
  const haloId = `dep-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-hw * 0.1));
  halo.setAttribute('cy', '0');
  halo.setAttribute('rx', String(hw * 1.6));
  halo.setAttribute('ry', String(hh * 2.2));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── 2. Ground Shadow ────────────────────────────────────────────────
  const gsId = `dep-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(hh + hh * 0.5));
  groundShadow.setAttribute('rx', String(hw * 1.1));
  groundShadow.setAttribute('ry', String(hh * 0.3));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── 3. Ambient Occlusion ────────────────────────────────────────────
  const aoId = `dep-ao-${entityId}`;
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
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-hw - 3));
    glow.setAttribute('y', String(-hh - 3));
    glow.setAttribute('width', String(totalW + 6));
    glow.setAttribute('height', String(boxH + 6));
    glow.setAttribute('rx', String(rx + 2));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Body fill gradient (shared) ─────────────────────────────────────
  const bodyFillId = `dep-bfill-${entityId}`;
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
  const bodyStrokeId = `dep-bstroke-${entityId}`;
  if (!defs.querySelector(`#${bodyStrokeId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', bodyStrokeId);
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.9');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.3');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // ── Box A (left) ────────────────────────────────────────────────────
  const axL = -hw;
  const boxA = document.createElementNS(SVG_NS, 'rect');
  boxA.setAttribute('x', String(axL));
  boxA.setAttribute('y', String(-hh));
  boxA.setAttribute('width', String(boxW));
  boxA.setAttribute('height', String(boxH));
  boxA.setAttribute('rx', String(rx));
  boxA.setAttribute('fill', `url(#${bodyFillId})`);
  boxA.setAttribute('stroke', `url(#${bodyStrokeId})`);
  boxA.setAttribute('stroke-width', String(STROKE.default));
  boxA.classList.add(`dep-box-${entityId}`);
  innerG.appendChild(boxA);

  const labelA = document.createElementNS(SVG_NS, 'text');
  labelA.setAttribute('x', String(axL + boxW / 2));
  labelA.setAttribute('y', '2');
  labelA.setAttribute('text-anchor', 'middle');
  labelA.setAttribute('dominant-baseline', 'central');
  labelA.setAttribute('fill', color);
  labelA.setAttribute('font-size', String(size * 0.14));
  labelA.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  labelA.setAttribute('font-family', TYPOGRAPHY.fontCode);
  labelA.textContent = 'A';
  innerG.appendChild(labelA);

  // ── Box B (right) ───────────────────────────────────────────────────
  const bxL = hw - boxW;
  const boxB = document.createElementNS(SVG_NS, 'rect');
  boxB.setAttribute('x', String(bxL));
  boxB.setAttribute('y', String(-hh));
  boxB.setAttribute('width', String(boxW));
  boxB.setAttribute('height', String(boxH));
  boxB.setAttribute('rx', String(rx));
  boxB.setAttribute('fill', `url(#${bodyFillId})`);
  boxB.setAttribute('stroke', `url(#${bodyStrokeId})`);
  boxB.setAttribute('stroke-width', String(STROKE.default));
  boxB.classList.add(`dep-box-${entityId}`);
  boxB.style.animationDelay = '0.3s';
  innerG.appendChild(boxB);

  const labelB = document.createElementNS(SVG_NS, 'text');
  labelB.setAttribute('x', String(bxL + boxW / 2));
  labelB.setAttribute('y', '2');
  labelB.setAttribute('text-anchor', 'middle');
  labelB.setAttribute('dominant-baseline', 'central');
  labelB.setAttribute('fill', color);
  labelB.setAttribute('font-size', String(size * 0.14));
  labelB.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  labelB.setAttribute('font-family', TYPOGRAPHY.fontCode);
  labelB.textContent = 'B';
  innerG.appendChild(labelB);

  // ── AO overlay on boxes ─────────────────────────────────────────────
  for (const bx of [axL, bxL]) {
    const ao = document.createElementNS(SVG_NS, 'rect');
    ao.setAttribute('x', String(bx));
    ao.setAttribute('y', String(-hh));
    ao.setAttribute('width', String(boxW));
    ao.setAttribute('height', String(boxH));
    ao.setAttribute('rx', String(rx));
    ao.setAttribute('fill', `url(#${aoId})`);
    ao.setAttribute('pointer-events', 'none');
    innerG.appendChild(ao);
  }

  // ── Arrow A -> B ────────────────────────────────────────────────────
  const arrowX1 = axL + boxW + 3;
  const arrowX2 = bxL - 3;
  const arrowLine = document.createElementNS(SVG_NS, 'line');
  arrowLine.setAttribute('x1', String(arrowX1));
  arrowLine.setAttribute('y1', '0');
  arrowLine.setAttribute('x2', String(arrowX2));
  arrowLine.setAttribute('y2', '0');
  arrowLine.setAttribute('stroke', color);
  arrowLine.setAttribute('stroke-width', String(STROKE.default));
  arrowLine.setAttribute('marker-end', 'none');
  arrowLine.classList.add(`dep-arrow-${entityId}`);
  innerG.appendChild(arrowLine);

  // Arrow head
  const ah = size * 0.04;
  const arrowHead = document.createElementNS(SVG_NS, 'path');
  arrowHead.setAttribute('d', `M ${arrowX2} 0 L ${arrowX2 - ah * 2} ${-ah} L ${arrowX2 - ah * 2} ${ah} Z`);
  arrowHead.setAttribute('fill', color);
  arrowHead.classList.add(`dep-arrow-${entityId}`);
  innerG.appendChild(arrowHead);

  // ── Dashed dependency curve (below) ─────────────────────────────────
  const curveY = hh * 0.8;
  const curvePath = document.createElementNS(SVG_NS, 'path');
  curvePath.setAttribute('d', `M ${axL + boxW / 2} ${hh} Q 0 ${hh + curveY} ${bxL + boxW / 2} ${hh}`);
  curvePath.setAttribute('fill', 'none');
  curvePath.setAttribute('stroke', colorWithAlpha(color, '55'));
  curvePath.setAttribute('stroke-width', '1');
  curvePath.setAttribute('stroke-dasharray', '4,3');
  innerG.appendChild(curvePath);

  // ── 4. Specular Highlight ───────────────────────────────────────────
  const specId = `dep-spec-${entityId}`;
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
  specular.setAttribute('cx', String(-hw * 0.3));
  specular.setAttribute('cy', String(-hh * 0.5));
  specular.setAttribute('rx', String(hw * 0.5));
  specular.setAttribute('ry', String(hh * 0.5));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── 5. Micro-Life — arrow pulse translateX, box breathe, float ──────
  const styleId = `dep-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes depArrowPulse_${entityId} {
        0%, 100% { transform: translateX(0); opacity: 0.8; }
        50% { transform: translateX(3px); opacity: 1; }
      }
      @keyframes depBoxBreathe_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.03); }
      }
      @keyframes depFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .dep-arrow-${entityId} {
        animation: depArrowPulse_${entityId} 2s ease-in-out infinite;
      }
      .dep-box-${entityId} {
        animation: depBoxBreathe_${entityId} 2.8s ease-in-out infinite;
      }
      .dep-float-${entityId} {
        animation: depFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`dep-float-${entityId}`);

  // ── Label below ─────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(hh + hh * 0.8 + LABEL_DEFAULTS.offsetBelow));
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
