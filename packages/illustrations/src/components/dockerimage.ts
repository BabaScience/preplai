/**
 * @preplai/illustrations — Docker Image Component (5-Pillar Cinematic)
 *
 * Three stacked layer rectangles representing Docker image layers,
 * with progressive lightening from bottom to top. `:latest` tag text,
 * radial fills, linear stroke gradients, glow on bottom layer.
 *
 * Micro-Life: Float 3.5s, layer shimmer opacity staggered 3s,
 * tag text opacity breathe 2.5s.
 *
 * Use for: Docker images, container images, OCI images.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlassFilter, ensureGlowFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderDockerImage(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const defs = ensureDefs(parentEl);

  // ── Dimensions ──────────────────────────────────────────────────────
  const layerW = s * 0.7;
  const layerH = s * 0.12;
  const rx = 4;
  const gap = s * 0.04;
  const totalH = layerH * 3 + gap * 2;
  const startY = -totalH / 2;

  // Layer opacities: bottom darkest, top lightest
  const _layerFillAlphas = ['4D', '33', '26']; // 0.3, 0.2, 0.15 in hex
  const _layerStrokeAlpha = '80'; // 0.5

  // ── Radial depth halo ───────────────────────────────────────────────
  const haloId = `dimg-halo-${entityId}`;
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
  halo.setAttribute('cx', '0');
  halo.setAttribute('cy', '0');
  halo.setAttribute('rx', String(layerW * 0.9));
  halo.setAttribute('ry', String(totalH * 1.1));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Ground contact shadow ───────────────────────────────────────────
  const gsId = `dimg-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(startY + totalH + s * 0.04));
  groundShadow.setAttribute('rx', String(layerW * 0.55));
  groundShadow.setAttribute('ry', String(s * 0.03));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Ambient occlusion ───────────────────────────────────────────────
  const aoId = `dimg-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const aoGrad = document.createElementNS(SVG_NS, 'radialGradient');
    aoGrad.setAttribute('id', aoId);
    aoGrad.setAttribute('cx', '70%'); aoGrad.setAttribute('cy', '75%'); aoGrad.setAttribute('r', '60%');
    const ao1 = document.createElementNS(SVG_NS, 'stop');
    ao1.setAttribute('offset', '0%'); ao1.setAttribute('stop-color', '#000000'); ao1.setAttribute('stop-opacity', '0.10');
    const ao2 = document.createElementNS(SVG_NS, 'stop');
    ao2.setAttribute('offset', '100%'); ao2.setAttribute('stop-color', '#000000'); ao2.setAttribute('stop-opacity', '0');
    aoGrad.appendChild(ao1); aoGrad.appendChild(ao2);
    defs.appendChild(aoGrad);
  }
  const ao = document.createElementNS(SVG_NS, 'rect');
  ao.setAttribute('x', String(-layerW / 2));
  ao.setAttribute('y', String(startY));
  ao.setAttribute('width', String(layerW));
  ao.setAttribute('height', String(totalH));
  ao.setAttribute('rx', String(rx));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Gradient IDs ────────────────────────────────────────────────────
  const glassFilter = ensureGlassFilter(parentEl);
  const glowFilter = ensureGlowFilter(parentEl, color, `dimg-glow-${entityId}`);

  // Per-layer radial fill gradients
  for (let i = 0; i < 3; i++) {
    const radId = `dimg-radfill-${entityId}-${i}`;
    if (!defs.querySelector(`#${radId}`)) {
      const grad = document.createElementNS(SVG_NS, 'radialGradient');
      grad.setAttribute('id', radId);
      grad.setAttribute('cx', '40%'); grad.setAttribute('cy', '40%'); grad.setAttribute('r', '60%');
      const rs1 = document.createElementNS(SVG_NS, 'stop');
      rs1.setAttribute('offset', '0%'); rs1.setAttribute('stop-color', '#ffffff'); rs1.setAttribute('stop-opacity', '0.12');
      const rs2 = document.createElementNS(SVG_NS, 'stop');
      rs2.setAttribute('offset', '50%'); rs2.setAttribute('stop-color', color); rs2.setAttribute('stop-opacity', i === 0 ? '0.35' : i === 1 ? '0.25' : '0.18');
      const rs3 = document.createElementNS(SVG_NS, 'stop');
      rs3.setAttribute('offset', '100%'); rs3.setAttribute('stop-color', color); rs3.setAttribute('stop-opacity', i === 0 ? '0.20' : i === 1 ? '0.12' : '0.08');
      grad.appendChild(rs1); grad.appendChild(rs2); grad.appendChild(rs3);
      defs.appendChild(grad);
    }
  }

  // Linear stroke gradient (top lighter, bottom darker)
  const strokeGradId = `dimg-strokegrad-${entityId}`;
  if (!defs.querySelector(`#${strokeGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', strokeGradId);
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '0%'); grad.setAttribute('y2', '100%');
    const ss1 = document.createElementNS(SVG_NS, 'stop');
    ss1.setAttribute('offset', '0%'); ss1.setAttribute('stop-color', color); ss1.setAttribute('stop-opacity', '0.7');
    const ss2 = document.createElementNS(SVG_NS, 'stop');
    ss2.setAttribute('offset', '100%'); ss2.setAttribute('stop-color', color); ss2.setAttribute('stop-opacity', '0.35');
    grad.appendChild(ss1); grad.appendChild(ss2);
    defs.appendChild(grad);
  }

  // ── Highlight glow ring ─────────────────────────────────────────────
  if (entity.highlight) {
    const hRect = document.createElementNS(SVG_NS, 'rect');
    hRect.setAttribute('x', String(-layerW / 2 - 4));
    hRect.setAttribute('y', String(startY - 4));
    hRect.setAttribute('width', String(layerW + 8));
    hRect.setAttribute('height', String(totalH + 8));
    hRect.setAttribute('rx', String(rx + 2));
    hRect.setAttribute('stroke-width', String(STROKE.default));
    hRect.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(hRect, cc);
    innerG.appendChild(hRect);
  }

  // ── Draw 3 stacked layers ──────────────────────────────────────────
  const layerEls: SVGRectElement[] = [];
  for (let i = 0; i < 3; i++) {
    const ly = startY + i * (layerH + gap);
    const radId = `dimg-radfill-${entityId}-${i}`;

    const layerRect = document.createElementNS(SVG_NS, 'rect');
    layerRect.setAttribute('x', String(-layerW / 2));
    layerRect.setAttribute('y', String(ly));
    layerRect.setAttribute('width', String(layerW));
    layerRect.setAttribute('height', String(layerH));
    layerRect.setAttribute('rx', String(rx));
    layerRect.setAttribute('fill', `url(#${radId})`);
    layerRect.setAttribute('stroke', `url(#${strokeGradId})`);
    layerRect.setAttribute('stroke-width', '1.5');
    layerRect.setAttribute('filter', glassFilter);

    // Apply glow filter on bottom layer only
    if (i === 0) {
      layerRect.setAttribute('filter', glowFilter);
    }

    innerG.appendChild(layerRect);
    layerEls.push(layerRect);

    // ── Specular highlight on each layer ──────────────────────────
    const specId = `dimg-spec-${entityId}-${i}`;
    if (!defs.querySelector(`#${specId}`)) {
      const specGrad = document.createElementNS(SVG_NS, 'radialGradient');
      specGrad.setAttribute('id', specId);
      specGrad.setAttribute('cx', '30%'); specGrad.setAttribute('cy', '25%'); specGrad.setAttribute('r', '50%');
      const sp1 = document.createElementNS(SVG_NS, 'stop');
      sp1.setAttribute('offset', '0%'); sp1.setAttribute('stop-color', '#ffffff'); sp1.setAttribute('stop-opacity', '0.14');
      const sp2 = document.createElementNS(SVG_NS, 'stop');
      sp2.setAttribute('offset', '100%'); sp2.setAttribute('stop-color', '#ffffff'); sp2.setAttribute('stop-opacity', '0');
      specGrad.appendChild(sp1); specGrad.appendChild(sp2);
      defs.appendChild(specGrad);
    }
    const spec = document.createElementNS(SVG_NS, 'rect');
    spec.setAttribute('x', String(-layerW / 2));
    spec.setAttribute('y', String(ly));
    spec.setAttribute('width', String(layerW));
    spec.setAttribute('height', String(layerH));
    spec.setAttribute('rx', String(rx));
    spec.setAttribute('fill', `url(#${specId})`);
    spec.setAttribute('pointer-events', 'none');
    innerG.appendChild(spec);
  }

  // ── `:latest` tag text ──────────────────────────────────────────────
  const tagText = document.createElementNS(SVG_NS, 'text');
  const tagX = layerW / 2 + s * 0.06;
  const tagY = startY + layerH * 0.5 + gap * 0.5;
  tagText.setAttribute('x', String(tagX));
  tagText.setAttribute('y', String(tagY));
  tagText.setAttribute('text-anchor', 'start');
  tagText.setAttribute('dominant-baseline', 'central');
  tagText.setAttribute('fill', cc.textTertiary);
  tagText.setAttribute('font-size', String(Math.max(8, s * 0.08)));
  tagText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  tagText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  tagText.textContent = ':latest';
  innerG.appendChild(tagText);

  // ── Micro-Life animations ──────────────────────────────────────────
  const styleId = `dimg-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes dimgFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      @keyframes dimgShimmer_${entityId} {
        0%, 100% { opacity: 0.85; }
        50% { opacity: 1; }
      }
      @keyframes dimgTagBreathe_${entityId} {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 0.75; }
      }
      .dimg-float-${entityId} {
        animation: dimgFloat_${entityId} 3.5s ease-in-out infinite;
      }
      .dimg-shimmer-${entityId} {
        animation: dimgShimmer_${entityId} 3s ease-in-out infinite;
      }
      .dimg-tag-breathe-${entityId} {
        animation: dimgTagBreathe_${entityId} 2.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }

  // Float on innerG
  innerG.classList.add(`dimg-float-${entityId}`);

  // Shimmer on layers with staggered delays
  layerEls.forEach((el, i) => {
    el.classList.add(`dimg-shimmer-${entityId}`);
    el.style.animationDelay = `${i * 0.4}s`;
  });

  // Tag text breathe
  tagText.classList.add(`dimg-tag-breathe-${entityId}`);

  // ── Label below ─────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(startY + totalH + LABEL_DEFAULTS.offsetBelow));
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
