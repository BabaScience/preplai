/**
 * @preplai/illustrations — Webhook Component (Cinematic 5-Pillar)
 *
 * Hook path + endpoint rect.
 * Use for: webhooks, callbacks, event triggers, outbound notifications.
 *
 * 5 Pillars: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (hook swing rotate, endpoint pulse, float).
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlassFilter } from '../visual-utils.js';import type { VisualEntity } from '@preplai/shared';

export function renderWebhook(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const w = size * 0.85;
  const h = size * 0.7;
  const hw = w / 2;
  const hh = h / 2;
  const rx = 6;

  const defs = ensureDefs(parentEl);

  // ── 1. Directional Lighting ────────────────────────────────────────
  const haloId = `wh-halo-${entityId}`;
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
  const gsId = `wh-gshadow-${entityId}`;
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
  const bodyGradId = `wh-body-${entityId}`;
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

  const strokeGradId = `wh-stroke-${entityId}`;
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

  // ── Card body ──────────────────────────────────────────────────────
  const card = document.createElementNS(SVG_NS, 'rect');
  card.setAttribute('x', String(-hw));
  card.setAttribute('y', String(-hh));
  card.setAttribute('width', String(w));
  card.setAttribute('height', String(h));
  card.setAttribute('rx', String(rx));
  card.setAttribute('fill', `url(#${bodyGradId})`);
  card.setAttribute('stroke', `url(#${strokeGradId})`);
  card.setAttribute('stroke-width', String(STROKE.default));
  card.setAttribute('filter', ensureGlassFilter(parentEl));
  innerG.appendChild(card);

  // ── 3. Ambient Occlusion ───────────────────────────────────────────
  const aoId = `wh-ao-${entityId}`;
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

  // ── Hook path (curved hook shape) ──────────────────────────────────
  const hs = size * 0.15;
  const hookG = document.createElementNS(SVG_NS, 'g');
  const hook = document.createElementNS(SVG_NS, 'path');
  hook.setAttribute('d', [
    `M ${-hs * 0.3} ${-hs * 0.8}`,
    `L ${-hs * 0.3} ${hs * 0.2}`,
    `Q ${-hs * 0.3} ${hs * 0.7} ${hs * 0.1} ${hs * 0.7}`,
    `Q ${hs * 0.5} ${hs * 0.7} ${hs * 0.5} ${hs * 0.3}`,
  ].join(' '));
  hook.setAttribute('fill', 'none');
  hook.setAttribute('stroke', color);
  hook.setAttribute('stroke-width', String(STROKE.emphasized));
  hook.setAttribute('stroke-linecap', 'round');
  hookG.appendChild(hook);

  // Hook tip (small circle at top)
  const hookTip = document.createElementNS(SVG_NS, 'circle');
  hookTip.setAttribute('cx', String(-hs * 0.3));
  hookTip.setAttribute('cy', String(-hs * 0.8));
  hookTip.setAttribute('r', String(size * 0.02));
  hookTip.setAttribute('fill', color);
  hookG.appendChild(hookTip);
  hookG.classList.add(`wh-hook-swing-${entityId}`);
  innerG.appendChild(hookG);

  // ── Endpoint rect (small box to the right of hook) ─────────────────
  const epW = size * 0.12;
  const epH = size * 0.08;
  const epX = hs * 0.8;
  const endpoint = document.createElementNS(SVG_NS, 'rect');
  endpoint.setAttribute('x', String(epX));
  endpoint.setAttribute('y', String(-epH / 2));
  endpoint.setAttribute('width', String(epW));
  endpoint.setAttribute('height', String(epH));
  endpoint.setAttribute('rx', '2');
  endpoint.setAttribute('fill', colorWithAlpha(color, '44'));
  endpoint.setAttribute('stroke', colorWithAlpha(color, '77'));
  endpoint.setAttribute('stroke-width', String(STROKE.thin));
  endpoint.classList.add(`wh-endpoint-pulse-${entityId}`);
  innerG.appendChild(endpoint);

  // Arrow connecting hook to endpoint
  const connLine = document.createElementNS(SVG_NS, 'line');
  connLine.setAttribute('x1', String(hs * 0.5));
  connLine.setAttribute('y1', String(hs * 0.3));
  connLine.setAttribute('x2', String(epX));
  connLine.setAttribute('y2', '0');
  connLine.setAttribute('stroke', colorWithAlpha(color, '55'));
  connLine.setAttribute('stroke-width', String(STROKE.thin));
  connLine.setAttribute('stroke-dasharray', '3,2');
  innerG.appendChild(connLine);

  // ── 4. Specular Highlight ──────────────────────────────────────────
  const specId = `wh-spec-${entityId}`;
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

  // ── 5. Micro-Life — hook swing + endpoint pulse + float ────────────
  const styleId = `wh-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes whHookSwing_${entityId} {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(4deg); }
        75% { transform: rotate(-4deg); }
      }
      @keyframes whEndpointPulse_${entityId} {
        0%, 100% { transform: scale(1); opacity: 0.7; }
        50% { transform: scale(1.12); opacity: 1; }
      }
      @keyframes whFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .wh-hook-swing-${entityId} {
        animation: whHookSwing_${entityId} 3s ease-in-out infinite;
        transform-origin: ${-hs * 0.3}px ${-hs * 0.8}px;
      }
      .wh-endpoint-pulse-${entityId} {
        animation: whEndpointPulse_${entityId} 2.5s ease-in-out infinite;
      }
      .wh-float-${entityId} {
        animation: whFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`wh-float-${entityId}`);

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
