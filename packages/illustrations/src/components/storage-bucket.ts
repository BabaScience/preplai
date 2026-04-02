/**
 * @preplai/illustrations — StorageBucket Component (Cinematic Depth)
 *
 * Bucket shape with rim, fill level indicator, and file icons.
 * Use for: cloud storage buckets, S3, GCS, Azure Blob, object storage.
 *
 * Micro-life: fill shimmer, icon pulse, float.
 * Metadata: { provider?: string, bucketName?: string }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';import type { VisualEntity } from '@preplai/shared';

export function renderStorageBucket(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const w = size * 0.9;
  const h = size * 1.0;
  const hw = w / 2;
  const hh = h / 2;

  // Bucket trapezoid dimensions (wider at top)
  const topW = hw;
  const botW = hw * 0.7;
  const topY = -hh;
  const botY = hh * 0.75;
  const rimH = size * 0.06;

  const defs = ensureDefs(parentEl);

  // ── 1. Directional Lighting ───────────────────────────────────────────
  const haloId = `sbkt-halo-${entityId}`;
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
  halo.setAttribute('rx', String(hw * 1.6));
  halo.setAttribute('ry', String(hh * 1.3));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── 2. Ground Shadow ──────────────────────────────────────────────────
  const gsId = `sbkt-gshadow-${entityId}`;
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
  const gShadow = document.createElementNS(SVG_NS, 'ellipse');
  gShadow.setAttribute('cx', '0');
  gShadow.setAttribute('cy', String(botY + 6));
  gShadow.setAttribute('rx', String(botW * 1.1));
  gShadow.setAttribute('ry', String(hh * 0.12));
  gShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(gShadow);

  // ── 3. Ambient Occlusion ──────────────────────────────────────────────
  const aoId = `sbkt-ao-${entityId}`;
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
  // AO overlay matching bucket bounding box
  const aoRect = document.createElementNS(SVG_NS, 'rect');
  aoRect.setAttribute('x', String(-topW)); aoRect.setAttribute('y', String(topY));
  aoRect.setAttribute('width', String(topW * 2)); aoRect.setAttribute('height', String(botY - topY));
  aoRect.setAttribute('fill', `url(#${aoId})`);
  aoRect.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoRect);

  // ── Body fill gradient ────────────────────────────────────────────────
  const bodyGradId = `sbkt-body-${entityId}`;
  if (!defs.querySelector(`#${bodyGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', bodyGradId);
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.3');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.08');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // ── Body stroke gradient ──────────────────────────────────────────────
  const strokeGradId = `sbkt-stroke-${entityId}`;
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

  // ── Highlight glow ring ───────────────────────────────────────────────
  if (entity.highlight) {
    const glowPath = document.createElementNS(SVG_NS, 'path');
    glowPath.setAttribute('d', `M ${-topW - 3} ${topY - 3} L ${topW + 3} ${topY - 3} L ${botW + 3} ${botY + 3} L ${-botW - 3} ${botY + 3} Z`);
    glowPath.setAttribute('fill', 'none');
    glowPath.setAttribute('stroke-width', String(STROKE.default));
    glowPath.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glowPath, cc);
    innerG.appendChild(glowPath);
  }

  // ── Bucket body (trapezoid) ───────────────────────────────────────────
  const bucket = document.createElementNS(SVG_NS, 'path');
  bucket.setAttribute('d', `M ${-topW} ${topY} L ${topW} ${topY} L ${botW} ${botY} L ${-botW} ${botY} Z`);
  bucket.setAttribute('fill', `url(#${bodyGradId})`);
  bucket.setAttribute('stroke', `url(#${strokeGradId})`);
  bucket.setAttribute('stroke-width', String(STROKE.default));
  bucket.setAttribute('stroke-linejoin', 'round');
  innerG.appendChild(bucket);

  // ── Top rim (thick line) ──────────────────────────────────────────────
  const rim = document.createElementNS(SVG_NS, 'rect');
  rim.setAttribute('x', String(-topW - 2));
  rim.setAttribute('y', String(topY - rimH / 2));
  rim.setAttribute('width', String((topW + 2) * 2));
  rim.setAttribute('height', String(rimH));
  rim.setAttribute('rx', '2');
  rim.setAttribute('fill', colorWithAlpha(color, '55'));
  rim.setAttribute('stroke', `url(#${strokeGradId})`);
  rim.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(rim);

  // ── Fill level indicator (partial fill inside bucket) ─────────────────
  const fillPct = 0.6;
  const fillTopY = topY + (botY - topY) * (1 - fillPct);
  // Interpolate width at fill level
  const fillTopW = topW + (botW - topW) * (1 - fillPct);
  const fillPath = document.createElementNS(SVG_NS, 'path');
  fillPath.setAttribute('d', `M ${-fillTopW} ${fillTopY} L ${fillTopW} ${fillTopY} L ${botW} ${botY} L ${-botW} ${botY} Z`);
  fillPath.setAttribute('fill', colorWithAlpha(color, '22'));
  fillPath.classList.add(`sbkt-fill-${entityId}`);
  innerG.appendChild(fillPath);

  // ── File icons inside bucket ──────────────────────────────────────────
  const iconPositions = [
    { x: -botW * 0.35, y: fillTopY + (botY - fillTopY) * 0.35 },
    { x: botW * 0.1, y: fillTopY + (botY - fillTopY) * 0.45 },
    { x: botW * 0.45, y: fillTopY + (botY - fillTopY) * 0.3 },
  ];

  for (let ii = 0; ii < iconPositions.length; ii++) {
    const ip = iconPositions[ii];
    const ig = document.createElementNS(SVG_NS, 'g');
    ig.setAttribute('transform', `translate(${ip.x}, ${ip.y})`);

    // Small file rectangle
    const fr = document.createElementNS(SVG_NS, 'rect');
    fr.setAttribute('x', '-4'); fr.setAttribute('y', '-5');
    fr.setAttribute('width', '8'); fr.setAttribute('height', '10');
    fr.setAttribute('rx', '1');
    fr.setAttribute('fill', 'none');
    fr.setAttribute('stroke', colorWithAlpha(color, '88'));
    fr.setAttribute('stroke-width', '0.8');
    ig.appendChild(fr);

    // Folded corner
    const fc = document.createElementNS(SVG_NS, 'path');
    fc.setAttribute('d', 'M 1.5 -5 L 4 -2.5');
    fc.setAttribute('stroke', colorWithAlpha(color, '88'));
    fc.setAttribute('stroke-width', '0.8');
    ig.appendChild(fc);

    ig.classList.add(`sbkt-icon-${entityId}`);
    ig.style.animationDelay = `${ii * 0.25}s`;
    innerG.appendChild(ig);
  }

  // ── 4. Specular Highlight ─────────────────────────────────────────────
  const specId = `sbkt-spec-${entityId}`;
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
  specular.setAttribute('cx', String(-topW * 0.3));
  specular.setAttribute('cy', String(topY + (botY - topY) * 0.2));
  specular.setAttribute('rx', String(topW * 0.45));
  specular.setAttribute('ry', String(hh * 0.3));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── 5. Micro-Life Animations ──────────────────────────────────────────
  const styleId = `sbkt-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes sbktFillShimmer_${entityId} {
        0%, 100% { transform: translateY(0); opacity: 0.5; }
        50% { transform: translateY(-1.5px); opacity: 0.8; }
      }
      @keyframes sbktIconPulse_${entityId} {
        0%, 100% { transform: scale(1); opacity: 0.6; }
        50% { transform: scale(1.15); opacity: 1; }
      }
      @keyframes sbktFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .sbkt-fill-${entityId} {
        animation: sbktFillShimmer_${entityId} 3s ease-in-out infinite;
      }
      .sbkt-icon-${entityId} {
        animation: sbktIconPulse_${entityId} 2.2s ease-in-out infinite;
      }
      .sbkt-float-${entityId} {
        animation: sbktFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`sbkt-float-${entityId}`);

  // ── Label below ───────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(botY + LABEL_DEFAULTS.offsetBelow));
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
