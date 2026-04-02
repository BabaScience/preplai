/**
 * @preplai/illustrations — AuthFlow Component (Cinematic 5-Pillar)
 *
 * Lock body + flow arrows + key accent.
 * Use for: OAuth, JWT, SSO authentication flows.
 *
 * 5 Pillars: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (lock pulse, key shimmer, float).
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlassFilter } from '../visual-utils.js';import type { VisualEntity } from '@preplai/shared';

export function renderAuthFlow(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const w = size * 1.0;
  const h = size * 0.8;
  const hw = w / 2;
  const hh = h / 2;
  const rx = 6;

  const defs = ensureDefs(parentEl);

  // ── 1. Directional Lighting (radial halo) ──────────────────────────
  const haloId = `auth-halo-${entityId}`;
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
  const gsId = `auth-gshadow-${entityId}`;
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
  const bodyGradId = `auth-body-${entityId}`;
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

  // ── Body stroke gradient ───────────────────────────────────────────
  const strokeGradId = `auth-stroke-${entityId}`;
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
  const aoId = `auth-ao-${entityId}`;
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

  // ── Lock icon (center-left) ────────────────────────────────────────
  const lockScale = size * 0.012;
  const lockX = -hw * 0.35;
  const lockG = document.createElementNS(SVG_NS, 'g');
  lockG.setAttribute('transform', `translate(${lockX}, ${-hh * 0.1})`);

  // Lock body
  const lockBody = document.createElementNS(SVG_NS, 'rect');
  lockBody.setAttribute('x', String(-8 * lockScale));
  lockBody.setAttribute('y', String(-2 * lockScale));
  lockBody.setAttribute('width', String(16 * lockScale));
  lockBody.setAttribute('height', String(12 * lockScale));
  lockBody.setAttribute('rx', String(2 * lockScale));
  lockBody.setAttribute('fill', colorWithAlpha(color, '33'));
  lockBody.setAttribute('stroke', color);
  lockBody.setAttribute('stroke-width', String(STROKE.default));
  lockG.appendChild(lockBody);

  // Lock shackle
  const shackle = document.createElementNS(SVG_NS, 'path');
  const sh = lockScale;
  shackle.setAttribute('d', `M ${-5 * sh},-${2 * sh} L ${-5 * sh},-${7 * sh} A ${5 * sh},${5 * sh} 0 0 1 ${5 * sh},-${7 * sh} L ${5 * sh},-${2 * sh}`);
  shackle.setAttribute('fill', 'none');
  shackle.setAttribute('stroke', color);
  shackle.setAttribute('stroke-width', String(STROKE.emphasized));
  shackle.setAttribute('stroke-linecap', 'round');
  lockG.appendChild(shackle);

  // Keyhole
  const keyhole = document.createElementNS(SVG_NS, 'circle');
  keyhole.setAttribute('cx', '0');
  keyhole.setAttribute('cy', String(3 * lockScale));
  keyhole.setAttribute('r', String(2.5 * lockScale));
  keyhole.setAttribute('fill', color);
  keyhole.setAttribute('opacity', '0.6');
  lockG.appendChild(keyhole);
  innerG.appendChild(lockG);

  // ── Flow arrows (right side) ───────────────────────────────────────
  const arrowX = hw * 0.15;
  for (let i = 0; i < 3; i++) {
    const ay = -hh * 0.5 + i * hh * 0.5;
    const arrow = document.createElementNS(SVG_NS, 'path');
    arrow.setAttribute('d', `M ${arrowX} ${ay} L ${arrowX + hw * 0.25} ${ay}`);
    arrow.setAttribute('stroke', colorWithAlpha(color, '66'));
    arrow.setAttribute('stroke-width', String(STROKE.thin));
    arrow.setAttribute('stroke-linecap', 'round');
    innerG.appendChild(arrow);

    // Arrowhead
    const head = document.createElementNS(SVG_NS, 'path');
    const hx = arrowX + hw * 0.25;
    head.setAttribute('d', `M ${hx - 3} ${ay - 2.5} L ${hx} ${ay} L ${hx - 3} ${ay + 2.5}`);
    head.setAttribute('stroke', colorWithAlpha(color, '66'));
    head.setAttribute('stroke-width', String(STROKE.thin));
    head.setAttribute('fill', 'none');
    head.setAttribute('stroke-linecap', 'round');
    innerG.appendChild(head);
  }

  // ── Key accent (bottom-right) ──────────────────────────────────────
  const keyAccentG = document.createElementNS(SVG_NS, 'g');
  keyAccentG.setAttribute('transform', `translate(${hw * 0.45}, ${hh * 0.3})`);
  const ks = size * 0.008;
  const keyCircle = document.createElementNS(SVG_NS, 'circle');
  keyCircle.setAttribute('cx', '0'); keyCircle.setAttribute('cy', '0');
  keyCircle.setAttribute('r', String(4 * ks));
  keyCircle.setAttribute('fill', 'none');
  keyCircle.setAttribute('stroke', colorWithAlpha(color, 'aa'));
  keyCircle.setAttribute('stroke-width', String(STROKE.thin));
  keyAccentG.appendChild(keyCircle);
  const keyShaft = document.createElementNS(SVG_NS, 'line');
  keyShaft.setAttribute('x1', String(4 * ks)); keyShaft.setAttribute('y1', '0');
  keyShaft.setAttribute('x2', String(12 * ks)); keyShaft.setAttribute('y2', '0');
  keyShaft.setAttribute('stroke', colorWithAlpha(color, 'aa'));
  keyShaft.setAttribute('stroke-width', String(STROKE.thin));
  keyAccentG.appendChild(keyShaft);
  innerG.appendChild(keyAccentG);

  // ── 4. Specular Highlight ──────────────────────────────────────────
  const specId = `auth-spec-${entityId}`;
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
  specular.setAttribute('ry', String(hh * 0.35));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── 5. Micro-Life — lock pulse + key shimmer + float ───────────────
  const styleId = `auth-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes authLockPulse_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      @keyframes authKeyShimmer_${entityId} {
        0%, 100% { opacity: 0.6; transform: translateX(0); }
        50% { opacity: 1; transform: translateX(2px); }
      }
      @keyframes authFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .auth-lock-pulse-${entityId} {
        animation: authLockPulse_${entityId} 2.8s ease-in-out infinite;
      }
      .auth-key-shimmer-${entityId} {
        animation: authKeyShimmer_${entityId} 3s ease-in-out infinite;
      }
      .auth-float-${entityId} {
        animation: authFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  lockG.classList.add(`auth-lock-pulse-${entityId}`);
  keyAccentG.classList.add(`auth-key-shimmer-${entityId}`);
  innerG.classList.add(`auth-float-${entityId}`);

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
