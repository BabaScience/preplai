/**
 * @preplai/illustrations — Event Component (Cinematic 5-Pillar)
 *
 * Lightning bolt path + ring accents.
 * Use for: domain events, messages, signals, triggers.
 *
 * 5 Pillars: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (lightning flash, ring pulse scale, float).
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlassFilter } from '../visual-utils.js';import type { VisualEntity } from '@preplai/shared';

export function renderEvent(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const r = size * 0.38;

  const defs = ensureDefs(parentEl);

  // ── 1. Directional Lighting ────────────────────────────────────────
  const haloId = `evt-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-r * 0.15));
  halo.setAttribute('cy', String(-r * 0.1));
  halo.setAttribute('rx', String(r * 1.8));
  halo.setAttribute('ry', String(r * 1.5));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── 2. Ground Shadow ───────────────────────────────────────────────
  const gsId = `evt-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(r + 4));
  groundShadow.setAttribute('rx', String(r * 0.8));
  groundShadow.setAttribute('ry', String(r * 0.15));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Highlight glow ring ────────────────────────────────────────────
  if (entity.highlight) {
    const glowHex = document.createElementNS(SVG_NS, 'polygon');
    const glowPts: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      glowPts.push(`${(r + 3) * Math.cos(angle)},${(r + 3) * Math.sin(angle)}`);
    }
    glowHex.setAttribute('points', glowPts.join(' '));
    glowHex.setAttribute('stroke-width', String(STROKE.default));
    glowHex.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glowHex, cc);
    innerG.appendChild(glowHex);
  }

  // ── Body fill gradient ─────────────────────────────────────────────
  const bodyGradId = `evt-body-${entityId}`;
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

  const strokeGradId = `evt-stroke-${entityId}`;
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

  // ── Hexagon body ───────────────────────────────────────────────────
  const hex = document.createElementNS(SVG_NS, 'polygon');
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    points.push(`${r * Math.cos(angle)},${r * Math.sin(angle)}`);
  }
  hex.setAttribute('points', points.join(' '));
  hex.setAttribute('fill', `url(#${bodyGradId})`);
  hex.setAttribute('stroke', `url(#${strokeGradId})`);
  hex.setAttribute('stroke-width', String(STROKE.default));
  hex.setAttribute('filter', ensureGlassFilter(parentEl));
  innerG.appendChild(hex);

  // ── 3. Ambient Occlusion ───────────────────────────────────────────
  const aoId = `evt-ao-${entityId}`;
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
  const aoEl = document.createElementNS(SVG_NS, 'circle');
  aoEl.setAttribute('cx', String(r * 0.15));
  aoEl.setAttribute('cy', String(r * 0.2));
  aoEl.setAttribute('r', String(r * 0.7));
  aoEl.setAttribute('fill', `url(#${aoId})`);
  aoEl.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoEl);

  // ── Lightning bolt ─────────────────────────────────────────────────
  const bs = r * 0.55;
  const boltD = [
    `M ${bs * 0.15} ${-bs}`,
    `L ${-bs * 0.35} ${-bs * 0.05}`,
    `L ${bs * 0.1} ${-bs * 0.05}`,
    `L ${-bs * 0.15} ${bs}`,
  ].join(' ');

  const boltGradId = `evt-bolt-${entityId}`;
  if (!defs.querySelector(`#${boltGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', boltGradId);
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '0%'); grad.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#ffffff'); s1.setAttribute('stop-opacity', '0.95');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '1');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  const bolt = document.createElementNS(SVG_NS, 'path');
  bolt.setAttribute('d', boltD);
  bolt.setAttribute('fill', 'none');
  bolt.setAttribute('stroke', `url(#${boltGradId})`);
  bolt.setAttribute('stroke-width', String(STROKE.emphasized));
  bolt.setAttribute('stroke-linecap', 'round');
  bolt.setAttribute('stroke-linejoin', 'round');
  innerG.appendChild(bolt);

  // ── Ring accents ───────────────────────────────────────────────────
  const ring1 = document.createElementNS(SVG_NS, 'circle');
  ring1.setAttribute('cx', '0'); ring1.setAttribute('cy', '0');
  ring1.setAttribute('r', String(r * 0.65));
  ring1.setAttribute('fill', 'none');
  ring1.setAttribute('stroke', colorWithAlpha(color, '22'));
  ring1.setAttribute('stroke-width', '0.5');
  ring1.classList.add(`evt-ring-pulse-${entityId}`);
  innerG.appendChild(ring1);

  const ring2 = document.createElementNS(SVG_NS, 'circle');
  ring2.setAttribute('cx', '0'); ring2.setAttribute('cy', '0');
  ring2.setAttribute('r', String(r * 0.85));
  ring2.setAttribute('fill', 'none');
  ring2.setAttribute('stroke', colorWithAlpha(color, '15'));
  ring2.setAttribute('stroke-width', '0.5');
  ring2.classList.add(`evt-ring-pulse-${entityId}`);
  ring2.style.animationDelay = '0.4s';
  innerG.appendChild(ring2);

  // ── 4. Specular Highlight ──────────────────────────────────────────
  const specId = `evt-spec-${entityId}`;
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
  specular.setAttribute('cx', String(-r * 0.2));
  specular.setAttribute('cy', String(-r * 0.25));
  specular.setAttribute('rx', String(r * 0.4));
  specular.setAttribute('ry', String(r * 0.3));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── 5. Micro-Life — lightning flash + ring pulse + float ───────────
  const styleId = `evt-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes evtFlash_${entityId} {
        0%, 70%, 100% { opacity: 0.7; }
        75% { opacity: 1; }
        80% { opacity: 0.4; }
        85% { opacity: 1; }
      }
      @keyframes evtRingPulse_${entityId} {
        0%, 100% { transform: scale(1); opacity: 0.3; }
        50% { transform: scale(1.12); opacity: 0.6; }
      }
      @keyframes evtFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .evt-flash-${entityId} {
        animation: evtFlash_${entityId} 3s ease-in-out infinite;
      }
      .evt-ring-pulse-${entityId} {
        animation: evtRingPulse_${entityId} 2.5s ease-in-out infinite;
      }
      .evt-float-${entityId} {
        animation: evtFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  bolt.classList.add(`evt-flash-${entityId}`);
  innerG.classList.add(`evt-float-${entityId}`);

  // ── Label below ────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(r + LABEL_DEFAULTS.offsetBelow));
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
