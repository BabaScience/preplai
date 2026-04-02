/**
 * @preplai/illustrations — Secret Component (Cinematic 5-Pillar)
 *
 * Padlock (shackle arc + body + keyhole).
 * Use for: env vars, vault secrets, credentials, sensitive data.
 *
 * 5 Pillars: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (lock breathe, mask dot pulse, float).
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlassFilter } from '../visual-utils.js';import type { VisualEntity } from '@preplai/shared';

export function renderSecret(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const _key = (meta.key as string) ?? entity.label ?? 'SECRET_KEY';

  // Padlock proportions
  const lockW = size * 0.5;
  const lockH = size * 0.35;
  const hlw = lockW / 2;
  const hlh = lockH / 2;
  const shackleR = lockW * 0.35;
  const rx = 4;

  const defs = ensureDefs(parentEl);

  // ── 1. Directional Lighting ────────────────────────────────────────
  const haloId = `sec-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-hlw * 0.15));
  halo.setAttribute('cy', String(-hlh * 0.1));
  halo.setAttribute('rx', String(hlw * 2.2));
  halo.setAttribute('ry', String(hlh * 2));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── 2. Ground Shadow ───────────────────────────────────────────────
  const gsId = `sec-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(hlh + 5));
  groundShadow.setAttribute('rx', String(hlw * 0.95));
  groundShadow.setAttribute('ry', String(hlh * 0.2));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Highlight glow ring ────────────────────────────────────────────
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-hlw - 3));
    glow.setAttribute('y', String(-hlh - shackleR - 3));
    glow.setAttribute('width', String(lockW + 6));
    glow.setAttribute('height', String(lockH + shackleR + 6));
    glow.setAttribute('rx', String(rx + 2));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Body fill gradient ─────────────────────────────────────────────
  const bodyGradId = `sec-body-${entityId}`;
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

  const strokeGradId = `sec-stroke-${entityId}`;
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

  // ── Shackle arc ────────────────────────────────────────────────────
  const shackle = document.createElementNS(SVG_NS, 'path');
  shackle.setAttribute('d', `M ${-hlw * 0.55},-${hlh} A ${shackleR},${shackleR} 0 0 1 ${hlw * 0.55},-${hlh}`);
  shackle.setAttribute('fill', 'none');
  shackle.setAttribute('stroke', `url(#${strokeGradId})`);
  shackle.setAttribute('stroke-width', String(STROKE.emphasized));
  shackle.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(shackle);

  // ── Lock body ──────────────────────────────────────────────────────
  const lockBody = document.createElementNS(SVG_NS, 'rect');
  lockBody.setAttribute('x', String(-hlw));
  lockBody.setAttribute('y', String(-hlh));
  lockBody.setAttribute('width', String(lockW));
  lockBody.setAttribute('height', String(lockH));
  lockBody.setAttribute('rx', String(rx));
  lockBody.setAttribute('fill', `url(#${bodyGradId})`);
  lockBody.setAttribute('stroke', `url(#${strokeGradId})`);
  lockBody.setAttribute('stroke-width', String(STROKE.default));
  lockBody.setAttribute('filter', ensureGlassFilter(parentEl));
  innerG.appendChild(lockBody);

  // ── 3. Ambient Occlusion ───────────────────────────────────────────
  const aoId = `sec-ao-${entityId}`;
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
  ao.setAttribute('x', String(-hlw));
  ao.setAttribute('y', String(-hlh));
  ao.setAttribute('width', String(lockW));
  ao.setAttribute('height', String(lockH));
  ao.setAttribute('rx', String(rx));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Keyhole ────────────────────────────────────────────────────────
  const khR = size * 0.035;
  const keyholeCircle = document.createElementNS(SVG_NS, 'circle');
  keyholeCircle.setAttribute('cx', '0');
  keyholeCircle.setAttribute('cy', String(-hlh * 0.05));
  keyholeCircle.setAttribute('r', String(khR));
  keyholeCircle.setAttribute('fill', colorWithAlpha(color, '66'));
  innerG.appendChild(keyholeCircle);

  // Keyhole slot
  const slot = document.createElementNS(SVG_NS, 'rect');
  slot.setAttribute('x', String(-khR * 0.35));
  slot.setAttribute('y', String(-hlh * 0.05 + khR * 0.5));
  slot.setAttribute('width', String(khR * 0.7));
  slot.setAttribute('height', String(khR * 1.2));
  slot.setAttribute('rx', String(khR * 0.15));
  slot.setAttribute('fill', colorWithAlpha(color, '66'));
  innerG.appendChild(slot);

  // ── Mask dots (hidden value indicator) ─────────────────────────────
  const dotCount = 4;
  const dotY = hlh * 0.55;
  for (let i = 0; i < dotCount; i++) {
    const dx = -hlw * 0.35 + i * (lockW * 0.22);
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(dx));
    dot.setAttribute('cy', String(dotY));
    dot.setAttribute('r', String(size * 0.015));
    dot.setAttribute('fill', colorWithAlpha(color, '55'));
    dot.classList.add(`sec-mask-dot-${entityId}`);
    innerG.appendChild(dot);
  }

  // ── 4. Specular Highlight ──────────────────────────────────────────
  const specId = `sec-spec-${entityId}`;
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
  specular.setAttribute('cx', String(-hlw * 0.2));
  specular.setAttribute('cy', String(-hlh * 0.35));
  specular.setAttribute('rx', String(hlw * 0.55));
  specular.setAttribute('ry', String(hlh * 0.3));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── 5. Micro-Life — lock breathe + mask dot pulse + float ──────────
  const styleId = `sec-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes secBreathe_${entityId} {
        0%, 100% { transform: scale(1); opacity: 0.85; }
        50% { transform: scale(1.05); opacity: 1; }
      }
      @keyframes secMaskDot_${entityId} {
        0%, 100% { transform: scale(1); opacity: 0.5; }
        50% { transform: scale(1.3); opacity: 0.9; }
      }
      @keyframes secFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .sec-breathe-${entityId} {
        animation: secBreathe_${entityId} 3s ease-in-out infinite;
      }
      .sec-mask-dot-${entityId} {
        animation: secMaskDot_${entityId} 2s ease-in-out infinite;
      }
      .sec-float-${entityId} {
        animation: secFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  lockBody.classList.add(`sec-breathe-${entityId}`);
  innerG.classList.add(`sec-float-${entityId}`);

  // ── Label below ────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(hlh + LABEL_DEFAULTS.offsetBelow));
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
