/**
 * @preplai/illustrations — GitCommit Component (Cinematic 5-Pillar)
 *
 * Three commit circles on a horizontal timeline with hash labels.
 * Glassmorphic depth: radial halo, ground shadow, ambient occlusion,
 * specular highlights, micro-life float + scale twinkle.
 *
 * Use for: git commits, version history, commit timelines.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlassFilter } from '../visual-utils.js';import type { VisualEntity } from '@preplai/shared';

export function renderGitCommit(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const defs = ensureDefs(parentEl);

  // ── Dimensions ────────────────────────────────────────────────────────
  const lineW = s * 0.9;
  const halfW = lineW / 2;
  const dotR = s * 0.06;
  const lineY = 0;
  const hashes = ['a1b2', 'c3d4', 'e5f6'];
  const dotXs = [-halfW + lineW * 0.2, 0, halfW - lineW * 0.2];

  // ── 1. Radial depth halo ──────────────────────────────────────────────
  const haloId = `gc-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const haloGrad = document.createElementNS(SVG_NS, 'radialGradient');
    haloGrad.setAttribute('id', haloId);
    haloGrad.setAttribute('cx', '38%');
    haloGrad.setAttribute('cy', '38%');
    haloGrad.setAttribute('r', '50%');
    const hs1 = document.createElementNS(SVG_NS, 'stop');
    hs1.setAttribute('offset', '0%');
    hs1.setAttribute('stop-color', color);
    hs1.setAttribute('stop-opacity', '0.13');
    const hs2 = document.createElementNS(SVG_NS, 'stop');
    hs2.setAttribute('offset', '100%');
    hs2.setAttribute('stop-color', color);
    hs2.setAttribute('stop-opacity', '0');
    haloGrad.appendChild(hs1);
    haloGrad.appendChild(hs2);
    defs.appendChild(haloGrad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', '0');
  halo.setAttribute('cy', '0');
  halo.setAttribute('rx', String(halfW * 1.3));
  halo.setAttribute('ry', String(s * 0.35));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── 2. Ground contact shadow ──────────────────────────────────────────
  const gsId = `gc-gshadow-${entityId}`;
  if (!defs.querySelector(`#${gsId}`)) {
    const gsg = document.createElementNS(SVG_NS, 'radialGradient');
    gsg.setAttribute('id', gsId);
    gsg.setAttribute('cx', '50%');
    gsg.setAttribute('cy', '50%');
    gsg.setAttribute('r', '50%');
    const gs1 = document.createElementNS(SVG_NS, 'stop');
    gs1.setAttribute('offset', '0%');
    gs1.setAttribute('stop-color', '#000000');
    gs1.setAttribute('stop-opacity', '0.18');
    const gs2 = document.createElementNS(SVG_NS, 'stop');
    gs2.setAttribute('offset', '100%');
    gs2.setAttribute('stop-color', '#000000');
    gs2.setAttribute('stop-opacity', '0');
    gsg.appendChild(gs1);
    gsg.appendChild(gs2);
    defs.appendChild(gsg);
  }
  const groundShadow = document.createElementNS(SVG_NS, 'ellipse');
  groundShadow.setAttribute('cx', '0');
  groundShadow.setAttribute('cy', String(s * 0.22));
  groundShadow.setAttribute('rx', String(halfW * 0.9));
  groundShadow.setAttribute('ry', String(s * 0.06));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── 3. Ambient occlusion ──────────────────────────────────────────────
  const aoId = `gc-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const aoGrad = document.createElementNS(SVG_NS, 'radialGradient');
    aoGrad.setAttribute('id', aoId);
    aoGrad.setAttribute('cx', '70%');
    aoGrad.setAttribute('cy', '75%');
    aoGrad.setAttribute('r', '60%');
    const ao1 = document.createElementNS(SVG_NS, 'stop');
    ao1.setAttribute('offset', '0%');
    ao1.setAttribute('stop-color', '#000000');
    ao1.setAttribute('stop-opacity', '0.10');
    const ao2 = document.createElementNS(SVG_NS, 'stop');
    ao2.setAttribute('offset', '100%');
    ao2.setAttribute('stop-color', '#000000');
    ao2.setAttribute('stop-opacity', '0');
    aoGrad.appendChild(ao1);
    aoGrad.appendChild(ao2);
    defs.appendChild(aoGrad);
  }
  const ao = document.createElementNS(SVG_NS, 'rect');
  ao.setAttribute('x', String(-halfW));
  ao.setAttribute('y', String(-s * 0.15));
  ao.setAttribute('width', String(lineW));
  ao.setAttribute('height', String(s * 0.3));
  ao.setAttribute('rx', String(s * 0.03));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Glow filter ───────────────────────────────────────────────────────
  const glowFilterId = `gc-glow-${entityId}`;
  if (!defs.querySelector(`#${glowFilterId}`)) {
    const filter = document.createElementNS(SVG_NS, 'filter');
    filter.setAttribute('id', glowFilterId);
    filter.setAttribute('x', '-50%');
    filter.setAttribute('y', '-50%');
    filter.setAttribute('width', '200%');
    filter.setAttribute('height', '200%');
    const fds = document.createElementNS(SVG_NS, 'feDropShadow');
    fds.setAttribute('dx', '0');
    fds.setAttribute('dy', '0');
    fds.setAttribute('stdDeviation', '3');
    fds.setAttribute('flood-color', color);
    fds.setAttribute('flood-opacity', '0.8');
    filter.appendChild(fds);
    defs.appendChild(filter);
  }

  // ── Glass filter ──────────────────────────────────────────────────────
  const _glassUrl = ensureGlassFilter(parentEl);

  // ── Highlight glow ring ───────────────────────────────────────────────
  if (entity.highlight) {
    const glowRect = document.createElementNS(SVG_NS, 'rect');
    glowRect.setAttribute('x', String(-halfW - 4));
    glowRect.setAttribute('y', String(-s * 0.18));
    glowRect.setAttribute('width', String(lineW + 8));
    glowRect.setAttribute('height', String(s * 0.36));
    glowRect.setAttribute('rx', String(s * 0.06));
    glowRect.setAttribute('fill', 'none');
    glowRect.setAttribute('stroke-width', String(STROKE.default));
    glowRect.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glowRect, cc);
    innerG.appendChild(glowRect);
  }

  // ── Horizontal timeline line ──────────────────────────────────────────
  const timeline = document.createElementNS(SVG_NS, 'line');
  timeline.setAttribute('x1', String(-halfW));
  timeline.setAttribute('y1', String(lineY));
  timeline.setAttribute('x2', String(halfW));
  timeline.setAttribute('y2', String(lineY));
  timeline.setAttribute('stroke', colorWithAlpha(color, '66'));
  timeline.setAttribute('stroke-width', '2');
  timeline.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(timeline);

  // ── 3 Commit dots with glow + hash labels ─────────────────────────────
  for (let i = 0; i < 3; i++) {
    const cx = dotXs[i];

    // Glow halo behind dot
    const dotHalo = document.createElementNS(SVG_NS, 'circle');
    dotHalo.setAttribute('cx', String(cx));
    dotHalo.setAttribute('cy', String(lineY));
    dotHalo.setAttribute('r', String(dotR * 2.2));
    dotHalo.setAttribute('fill', colorWithAlpha(color, '22'));
    dotHalo.setAttribute('filter', `url(#${glowFilterId})`);
    innerG.appendChild(dotHalo);

    // Solid commit circle
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(cx));
    dot.setAttribute('cy', String(lineY));
    dot.setAttribute('r', String(dotR));
    dot.setAttribute('fill', color);
    dot.setAttribute('stroke', cc.stroke);
    dot.setAttribute('stroke-width', String(STROKE.default));
    dot.setAttribute('filter', `url(#${glowFilterId})`);
    dot.classList.add(`gc-twinkle-${entityId}`);
    dot.style.transformOrigin = `${cx}px ${lineY}px`;
    dot.style.animationDelay = `${i * 0.65}s`;
    innerG.appendChild(dot);

    // Hash text below dot
    const hashText = document.createElementNS(SVG_NS, 'text');
    hashText.setAttribute('x', String(cx));
    hashText.setAttribute('y', String(lineY + dotR + s * 0.08));
    hashText.setAttribute('text-anchor', 'middle');
    hashText.setAttribute('fill', cc.textPrimary);
    hashText.setAttribute('font-size', String(Math.max(7, s * 0.04)));
    hashText.setAttribute('font-family', "'JetBrains Mono', monospace");
    hashText.setAttribute('opacity', '0.7');
    hashText.textContent = hashes[i];
    innerG.appendChild(hashText);
  }

  // ── 4. Specular highlight ─────────────────────────────────────────────
  const specId = `gc-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    const specGrad = document.createElementNS(SVG_NS, 'radialGradient');
    specGrad.setAttribute('id', specId);
    specGrad.setAttribute('cx', '35%');
    specGrad.setAttribute('cy', '30%');
    specGrad.setAttribute('r', '45%');
    const sp1 = document.createElementNS(SVG_NS, 'stop');
    sp1.setAttribute('offset', '0%');
    sp1.setAttribute('stop-color', '#ffffff');
    sp1.setAttribute('stop-opacity', '0.15');
    const sp2 = document.createElementNS(SVG_NS, 'stop');
    sp2.setAttribute('offset', '100%');
    sp2.setAttribute('stop-color', '#ffffff');
    sp2.setAttribute('stop-opacity', '0');
    specGrad.appendChild(sp1);
    specGrad.appendChild(sp2);
    defs.appendChild(specGrad);
  }
  // Specular on each dot
  for (let i = 0; i < 3; i++) {
    const specDot = document.createElementNS(SVG_NS, 'circle');
    specDot.setAttribute('cx', String(dotXs[i] - dotR * 0.2));
    specDot.setAttribute('cy', String(lineY - dotR * 0.2));
    specDot.setAttribute('r', String(dotR * 0.55));
    specDot.setAttribute('fill', `url(#${specId})`);
    specDot.setAttribute('pointer-events', 'none');
    innerG.appendChild(specDot);
  }

  // ── 5. Micro-life animations — float 3.5s + twinkle scale 2s ─────────
  const styleId = `gc-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes gcFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      @keyframes gcTwinkle_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.4); }
      }
      .gc-float-${entityId} {
        animation: gcFloat_${entityId} 3.5s ease-in-out infinite;
      }
      .gc-twinkle-${entityId} {
        animation: gcTwinkle_${entityId} 2s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`gc-float-${entityId}`);

  // ── Label below ───────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(s * 0.28));
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
