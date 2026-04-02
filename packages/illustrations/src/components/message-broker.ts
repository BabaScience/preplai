/**
 * @preplai/illustrations — MessageBroker Component (Cinematic 5-Pillar)
 *
 * Hub rect + fan-out lines + endpoint dots.
 * Use for: message brokers, pub/sub systems, event buses, RabbitMQ, Kafka.
 *
 * 5 Pillars: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (message flow translateX, hub pulse, float).
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlassFilter } from '../visual-utils.js';import type { VisualEntity } from '@preplai/shared';

export function renderMessageBroker(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
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
  const haloId = `mb-halo-${entityId}`;
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
  const gsId = `mb-gshadow-${entityId}`;
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
  const bodyGradId = `mb-body-${entityId}`;
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

  const strokeGradId = `mb-stroke-${entityId}`;
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

  // ── Hub body ───────────────────────────────────────────────────────
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
  const aoId = `mb-ao-${entityId}`;
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

  // ── Hub center dot ─────────────────────────────────────────────────
  const hubDot = document.createElementNS(SVG_NS, 'circle');
  hubDot.setAttribute('cx', String(-hw * 0.15));
  hubDot.setAttribute('cy', '0');
  hubDot.setAttribute('r', String(size * 0.04));
  hubDot.setAttribute('fill', color);
  hubDot.setAttribute('opacity', '0.8');
  innerG.appendChild(hubDot);

  // ── Input line ─────────────────────────────────────────────────────
  const inLine = document.createElementNS(SVG_NS, 'line');
  inLine.setAttribute('x1', String(-hw * 0.7));
  inLine.setAttribute('y1', '0');
  inLine.setAttribute('x2', String(-hw * 0.25));
  inLine.setAttribute('y2', '0');
  inLine.setAttribute('stroke', colorWithAlpha(color, '77'));
  inLine.setAttribute('stroke-width', String(STROKE.default));
  inLine.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(inLine);

  // ── Fan-out lines + endpoint dots ──────────────────────────────────
  const outAngles = [-0.5, 0, 0.5];
  const fanOutG = document.createElementNS(SVG_NS, 'g');
  for (const angle of outAngles) {
    const endX = hw * 0.65;
    const endY = hh * angle * 1.2;

    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(-hw * 0.05));
    line.setAttribute('y1', '0');
    line.setAttribute('x2', String(endX));
    line.setAttribute('y2', String(endY));
    line.setAttribute('stroke', colorWithAlpha(color, '55'));
    line.setAttribute('stroke-width', String(STROKE.thin));
    line.setAttribute('stroke-linecap', 'round');
    fanOutG.appendChild(line);

    // Endpoint dot
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(endX));
    dot.setAttribute('cy', String(endY));
    dot.setAttribute('r', String(size * 0.02));
    dot.setAttribute('fill', color);
    dot.setAttribute('opacity', '0.7');
    fanOutG.appendChild(dot);
  }
  innerG.appendChild(fanOutG);

  // ── Message flow particles ─────────────────────────────────────────
  const msgG = document.createElementNS(SVG_NS, 'g');
  for (let i = 0; i < 2; i++) {
    const particle = document.createElementNS(SVG_NS, 'circle');
    particle.setAttribute('cx', String(-hw * 0.4 + i * hw * 0.3));
    particle.setAttribute('cy', '0');
    particle.setAttribute('r', String(size * 0.015));
    particle.setAttribute('fill', color);
    particle.setAttribute('opacity', '0.6');
    msgG.appendChild(particle);
  }
  msgG.classList.add(`mb-msg-flow-${entityId}`);
  innerG.appendChild(msgG);

  // ── 4. Specular Highlight ──────────────────────────────────────────
  const specId = `mb-spec-${entityId}`;
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

  // ── 5. Micro-Life — message flow + hub pulse + float ───────────────
  const styleId = `mb-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes mbMsgFlow_${entityId} {
        0% { transform: translateX(-4px); opacity: 0.4; }
        100% { transform: translateX(8px); opacity: 0.9; }
      }
      @keyframes mbHubPulse_${entityId} {
        0%, 100% { transform: scale(1); opacity: 0.7; }
        50% { transform: scale(1.25); opacity: 1; }
      }
      @keyframes mbFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .mb-msg-flow-${entityId} {
        animation: mbMsgFlow_${entityId} 1.8s ease-in-out infinite alternate;
      }
      .mb-hub-pulse-${entityId} {
        animation: mbHubPulse_${entityId} 2.5s ease-in-out infinite;
      }
      .mb-float-${entityId} {
        animation: mbFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  hubDot.classList.add(`mb-hub-pulse-${entityId}`);
  innerG.classList.add(`mb-float-${entityId}`);

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
