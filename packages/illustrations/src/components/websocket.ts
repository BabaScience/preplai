/**
 * @preplai/illustrations — WebSocket Component (Cinematic 5-Pillar)
 *
 * Body rect + bi-directional arrows.
 * Use for: WebSocket connections, real-time bidirectional communication.
 *
 * 5 Pillars: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (arrow pulse translateY alternating, float).
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, COLORS } from '../design-tokens.js';import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlassFilter } from '../visual-utils.js';import type { VisualEntity } from '@preplai/shared';

export function renderWebSocket(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const status = (meta.status as string) ?? 'connected';
  const isConnected = status !== 'disconnected';

  const w = size * 0.9;
  const h = size * 0.7;
  const hw = w / 2;
  const hh = h / 2;
  const rx = 6;

  const defs = ensureDefs(parentEl);

  // ── 1. Directional Lighting ────────────────────────────────────────
  const haloId = `ws-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-hw * 0.15));
  halo.setAttribute('cy', String(-hh * 0.1));
  halo.setAttribute('rx', String(hw * 1.8));
  halo.setAttribute('ry', String(hh * 1.5));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── 2. Ground Shadow ───────────────────────────────────────────────
  const gsId = `ws-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(hh + 4));
  groundShadow.setAttribute('rx', String(hw * 0.9));
  groundShadow.setAttribute('ry', String(hh * 0.18));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Highlight glow ring ────────────────────────────────────────────
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-hw - 3));
    glow.setAttribute('y', String(-hh - 3));
    glow.setAttribute('width', String(w + 6));
    glow.setAttribute('height', String(h + 6));
    glow.setAttribute('rx', String(rx + 2));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Body fill gradient ─────────────────────────────────────────────
  const bodyGradId = `ws-body-${entityId}`;
  if (!defs.querySelector(`#${bodyGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', bodyGradId);
    grad.setAttribute('cx', '50%'); grad.setAttribute('cy', '50%'); grad.setAttribute('r', '60%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.3');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.08');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  const strokeGradId = `ws-stroke-${entityId}`;
  if (!defs.querySelector(`#${strokeGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', strokeGradId);
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.9');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.3');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // ── Body rect ──────────────────────────────────────────────────────
  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x', String(-hw));
  body.setAttribute('y', String(-hh));
  body.setAttribute('width', String(w));
  body.setAttribute('height', String(h));
  body.setAttribute('rx', String(rx));
  body.setAttribute('fill', `url(#${bodyGradId})`);
  body.setAttribute('stroke', `url(#${strokeGradId})`);
  body.setAttribute('stroke-width', String(STROKE.default));
  body.setAttribute('filter', ensureGlassFilter(parentEl));
  innerG.appendChild(body);

  // ── 3. Ambient Occlusion ───────────────────────────────────────────
  const aoId = `ws-ao-${entityId}`;
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
  const ao = document.createElementNS(SVG_NS, 'rect');
  ao.setAttribute('x', String(-hw));
  ao.setAttribute('y', String(-hh));
  ao.setAttribute('width', String(w));
  ao.setAttribute('height', String(h));
  ao.setAttribute('rx', String(rx));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Bi-directional arrows ──────────────────────────────────────────
  const arrowSpacing = hw * 0.35;

  // Up arrow (left side)
  const upArrow = document.createElementNS(SVG_NS, 'g');
  upArrow.classList.add(`ws-arrow-up-${entityId}`);
  const upLine = document.createElementNS(SVG_NS, 'line');
  upLine.setAttribute('x1', String(-arrowSpacing));
  upLine.setAttribute('y1', String(hh * 0.4));
  upLine.setAttribute('x2', String(-arrowSpacing));
  upLine.setAttribute('y2', String(-hh * 0.4));
  upLine.setAttribute('stroke', color);
  upLine.setAttribute('stroke-width', String(STROKE.emphasized));
  upLine.setAttribute('opacity', '0.7');
  upArrow.appendChild(upLine);

  const upHead = document.createElementNS(SVG_NS, 'path');
  upHead.setAttribute('d', `M ${-arrowSpacing - 4} ${-hh * 0.2} L ${-arrowSpacing} ${-hh * 0.45} L ${-arrowSpacing + 4} ${-hh * 0.2}`);
  upHead.setAttribute('stroke', color);
  upHead.setAttribute('stroke-width', String(STROKE.default));
  upHead.setAttribute('fill', 'none');
  upHead.setAttribute('stroke-linecap', 'round');
  upHead.setAttribute('opacity', '0.7');
  upArrow.appendChild(upHead);
  innerG.appendChild(upArrow);

  // Down arrow (right side)
  const downArrow = document.createElementNS(SVG_NS, 'g');
  downArrow.classList.add(`ws-arrow-down-${entityId}`);
  const downLine = document.createElementNS(SVG_NS, 'line');
  downLine.setAttribute('x1', String(arrowSpacing));
  downLine.setAttribute('y1', String(-hh * 0.4));
  downLine.setAttribute('x2', String(arrowSpacing));
  downLine.setAttribute('y2', String(hh * 0.4));
  downLine.setAttribute('stroke', color);
  downLine.setAttribute('stroke-width', String(STROKE.emphasized));
  downLine.setAttribute('opacity', '0.7');
  downArrow.appendChild(downLine);

  const downHead = document.createElementNS(SVG_NS, 'path');
  downHead.setAttribute('d', `M ${arrowSpacing - 4} ${hh * 0.2} L ${arrowSpacing} ${hh * 0.45} L ${arrowSpacing + 4} ${hh * 0.2}`);
  downHead.setAttribute('stroke', color);
  downHead.setAttribute('stroke-width', String(STROKE.default));
  downHead.setAttribute('fill', 'none');
  downHead.setAttribute('stroke-linecap', 'round');
  downHead.setAttribute('opacity', '0.7');
  downArrow.appendChild(downHead);
  innerG.appendChild(downArrow);

  // ── Status dot ─────────────────────────────────────────────────────
  const dotColor = isConnected ? COLORS.green : COLORS.red;
  const dot = document.createElementNS(SVG_NS, 'circle');
  dot.setAttribute('cx', String(hw - 8));
  dot.setAttribute('cy', String(-hh + 8));
  dot.setAttribute('r', '3');
  dot.setAttribute('fill', dotColor);
  dot.setAttribute('opacity', '0.9');
  innerG.appendChild(dot);

  // ── 4. Specular Highlight ──────────────────────────────────────────
  const specId = `ws-spec-${entityId}`;
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
  specular.setAttribute('rx', String(hw * 0.5));
  specular.setAttribute('ry', String(hh * 0.3));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── 5. Micro-Life — arrow pulse alternating + float ────────────────
  const styleId = `ws-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes wsArrowUp_${entityId} {
        0%, 100% { transform: translateY(0); opacity: 0.6; }
        50% { transform: translateY(-3px); opacity: 1; }
      }
      @keyframes wsArrowDown_${entityId} {
        0%, 100% { transform: translateY(0); opacity: 0.6; }
        50% { transform: translateY(3px); opacity: 1; }
      }
      @keyframes wsFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .ws-arrow-up-${entityId} {
        animation: wsArrowUp_${entityId} 2s ease-in-out infinite;
      }
      .ws-arrow-down-${entityId} {
        animation: wsArrowDown_${entityId} 2s ease-in-out infinite;
        animation-delay: 0.5s;
      }
      .ws-float-${entityId} {
        animation: wsFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`ws-float-${entityId}`);

  // ── Label below ────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(hh + LABEL_DEFAULTS.offsetBelow));
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
