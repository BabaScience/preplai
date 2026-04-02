/**
 * @preplai/illustrations — SagaStep Component (Cinematic Depth)
 *
 * A numbered step in a distributed transaction with action and compensation boxes.
 * 5 Cinematic Pillars: directional lighting, ground shadow,
 * ambient occlusion, specular highlight, micro-life animations.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, COLORS, colorWithAlpha, OPACITY } from '../design-tokens.js';
import { resolveColorCascade } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderSagaStep(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const step = (meta.step as string) ?? 'Reserve Inventory';
  const action = (meta.action as string) ?? 'reserveItems()';
  const compensation = (meta.compensation as string) ?? 'releaseItems()';

  const scale = size / 50;
  const boxW = 100 * scale;
  const boxH = 35 * scale;
  const gap = 12 * scale;
  const rx = 4 * scale;

  const actionColor = COLORS.green;
  const compColor = COLORS.red;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ─────────────────────────────────
  const haloId = `sagaStep-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-boxW * 0.1));
  halo.setAttribute('cy', '0');
  halo.setAttribute('rx', String(boxW * 1.0));
  halo.setAttribute('ry', String(boxH * 1.8));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ────────────────────────────────────────
  const gsId = `sagaStep-gshadow-${entityId}`;
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
  const compY = gap / 2;
  const groundShadow = document.createElementNS(SVG_NS, 'ellipse');
  groundShadow.setAttribute('cx', '0');
  groundShadow.setAttribute('cy', String(compY + boxH + 6));
  groundShadow.setAttribute('rx', String(boxW * 0.5));
  groundShadow.setAttribute('ry', String(4 * scale));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ────────────────────────────────────
  const aoId = `sagaStep-ao-${entityId}`;
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
  const actionY = -boxH - gap / 2;
  const aoRect = document.createElementNS(SVG_NS, 'rect');
  aoRect.setAttribute('x', String(-boxW / 2));
  aoRect.setAttribute('y', String(actionY));
  aoRect.setAttribute('width', String(boxW));
  aoRect.setAttribute('height', String(boxH * 2 + gap));
  aoRect.setAttribute('rx', String(rx));
  aoRect.setAttribute('fill', `url(#${aoId})`);
  aoRect.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoRect);

  // ── Action box (top, green-tinted) ─────────────────────────────────
  const actionRect = document.createElementNS(SVG_NS, 'rect');
  actionRect.setAttribute('x', String(-boxW / 2));
  actionRect.setAttribute('y', String(actionY));
  actionRect.setAttribute('width', String(boxW));
  actionRect.setAttribute('height', String(boxH));
  actionRect.setAttribute('rx', String(rx));
  actionRect.setAttribute('fill', colorWithAlpha(actionColor, OPACITY.fillLight));
  actionRect.setAttribute('stroke', actionColor);
  actionRect.setAttribute('stroke-width', '2.5');
  innerG.appendChild(actionRect);

  const actionText = document.createElementNS(SVG_NS, 'text');
  actionText.setAttribute('x', '0');
  actionText.setAttribute('y', String(actionY + boxH / 2 + 4 * scale));
  actionText.setAttribute('text-anchor', 'middle');
  actionText.setAttribute('fill', actionColor);
  actionText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeInline * scale));
  actionText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
  actionText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  actionText.textContent = action;
  innerG.appendChild(actionText);

  // ── Compensation box (bottom, red-tinted) ──────────────────────────
  const compRect = document.createElementNS(SVG_NS, 'rect');
  compRect.setAttribute('x', String(-boxW / 2));
  compRect.setAttribute('y', String(compY));
  compRect.setAttribute('width', String(boxW));
  compRect.setAttribute('height', String(boxH));
  compRect.setAttribute('rx', String(rx));
  compRect.setAttribute('fill', colorWithAlpha(compColor, OPACITY.fillLight));
  compRect.setAttribute('stroke', compColor);
  compRect.setAttribute('stroke-width', '2.5');
  innerG.appendChild(compRect);

  const compText = document.createElementNS(SVG_NS, 'text');
  compText.setAttribute('x', '0');
  compText.setAttribute('y', String(compY + boxH / 2 + 4 * scale));
  compText.setAttribute('text-anchor', 'middle');
  compText.setAttribute('fill', compColor);
  compText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeInline * scale));
  compText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
  compText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  compText.textContent = compensation;
  innerG.appendChild(compText);

  // ── Arrow from action to compensation (rollback) ───────────────────
  const arrowX = boxW / 2 + 10 * scale;
  const arrowTopY = actionY + boxH / 2;
  const arrowBottomY = compY + boxH / 2;

  const arrowLine = document.createElementNS(SVG_NS, 'line');
  arrowLine.setAttribute('x1', String(arrowX));
  arrowLine.setAttribute('y1', String(arrowTopY));
  arrowLine.setAttribute('x2', String(arrowX));
  arrowLine.setAttribute('y2', String(arrowBottomY));
  arrowLine.setAttribute('stroke', cc.strokeSoft);
  arrowLine.setAttribute('stroke-width', String(STROKE.thin));
  arrowLine.setAttribute('stroke-dasharray', '3,2');
  innerG.appendChild(arrowLine);

  const ahSize = 4 * scale;
  const arrowHead = document.createElementNS(SVG_NS, 'polygon');
  arrowHead.setAttribute('points', [
    `${arrowX - ahSize},${arrowBottomY - ahSize}`,
    `${arrowX + ahSize},${arrowBottomY - ahSize}`,
    `${arrowX},${arrowBottomY}`,
  ].join(' '));
  arrowHead.setAttribute('fill', cc.stroke);
  arrowHead.setAttribute('opacity', '0.7');
  innerG.appendChild(arrowHead);

  const rollbackText = document.createElementNS(SVG_NS, 'text');
  rollbackText.setAttribute('x', String(arrowX + 6 * scale));
  rollbackText.setAttribute('y', String((arrowTopY + arrowBottomY) / 2 + 3 * scale));
  rollbackText.setAttribute('text-anchor', 'start');
  rollbackText.setAttribute('fill', cc.textSecondary);
  rollbackText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeIndex * scale));
  rollbackText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  rollbackText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  rollbackText.textContent = 'rollback';
  innerG.appendChild(rollbackText);

  // ── Numbered circle (top-left corner of action box) ────────────────
  const circR = 10 * scale;
  const circX = -boxW / 2 - 2 * scale;
  const circY = actionY - 2 * scale;

  const stepCircle = document.createElementNS(SVG_NS, 'circle');
  stepCircle.setAttribute('cx', String(circX));
  stepCircle.setAttribute('cy', String(circY));
  stepCircle.setAttribute('r', String(circR));
  stepCircle.setAttribute('fill', cc.stroke);
  stepCircle.setAttribute('opacity', '0.9');
  innerG.appendChild(stepCircle);

  const stepNum = document.createElementNS(SVG_NS, 'text');
  stepNum.setAttribute('x', String(circX));
  stepNum.setAttribute('y', String(circY + 4 * scale));
  stepNum.setAttribute('text-anchor', 'middle');
  stepNum.setAttribute('fill', '#ffffff');
  stepNum.setAttribute('font-size', String(TYPOGRAPHY.fontSizeBadge * scale));
  stepNum.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  stepNum.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  stepNum.textContent = step.charAt(0).toUpperCase();
  innerG.appendChild(stepNum);

  // ── Step name as small text above action box ───────────────────────
  const stepText = document.createElementNS(SVG_NS, 'text');
  stepText.setAttribute('x', String(circX + circR + 6 * scale));
  stepText.setAttribute('y', String(circY + 3 * scale));
  stepText.setAttribute('text-anchor', 'start');
  stepText.setAttribute('fill', cc.textPrimary);
  stepText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeInline * scale));
  stepText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  stepText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  stepText.setAttribute('opacity', '0.8');
  stepText.textContent = step;
  innerG.appendChild(stepText);

  // ── Pillar 4: Specular Highlight ───────────────────────────────────
  const specId = `sagaStep-spec-${entityId}`;
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
  specular.setAttribute('cx', String(-boxW * 0.15));
  specular.setAttribute('cy', String(actionY + boxH * 0.3));
  specular.setAttribute('rx', String(boxW * 0.35));
  specular.setAttribute('ry', String(boxH * 0.4));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Pillar 5: Micro-Life Animations ────────────────────────────────
  const styleId = `sagaStep-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const styleEl = document.createElementNS(SVG_NS, 'style');
    styleEl.setAttribute('id', styleId);
    styleEl.textContent = `
      @keyframes sagaStepFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes sagaStepPulse_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.03); }
      }
      .sagaStep-float-${entityId} {
        animation: sagaStepFloat_${entityId} 3.5s ease-in-out infinite;
      }
      .sagaStep-pulse-${entityId} {
        animation: sagaStepPulse_${entityId} 2.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(styleEl, svg.firstChild);
  }
  innerG.classList.add(`sagaStep-float-${entityId}`);

  // ── Entity label below ─────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(compY + boxH + 18));
    text.setAttribute('text-anchor', 'middle');
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
