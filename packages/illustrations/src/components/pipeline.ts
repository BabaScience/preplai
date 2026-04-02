/**
 * @preplai/illustrations — Pipeline Component (Cinematic 5-Pillar Depth)
 *
 * Three connected stage rectangles with arrow connectors between them.
 * Glassmorphic depth with directional lighting, ground shadow, ambient
 * occlusion, specular highlight, and micro-life transform animations.
 * Use for: CI/CD pipelines, data pipelines, processing stages.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlassFilter, ensureGlowFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderPipeline(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const defs = ensureDefs(parentEl);

  // ── Dimensions ──────────────────────────────────────────────────────
  const totalW = s * 1.2;
  const totalH = s * 0.5;
  const stageW = s * 0.3;
  const stageH = s * 0.35;
  const stageRx = 6;
  const gap = (totalW - stageW * 3) / 2;                // space between stages
  const arrowSize = gap * 0.35;

  // Stage center-X positions (3 stages evenly spaced)
  const stageCxs = [
    -totalW / 2 + stageW / 2,
    0,
    totalW / 2 - stageW / 2,
  ];

  // ── Filters ─────────────────────────────────────────────────────────
  const glowFilterUrl = ensureGlowFilter(parentEl, color, `pipe-glow-${entityId}`);
  const glassFilterUrl = ensureGlassFilter(parentEl);

  // ── 1. Directional Lighting (radialGradient cx=38% cy=38% r=50%) ───
  const haloId = `pipe-halo-${entityId}`;
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
  halo.setAttribute('cx', '0');
  halo.setAttribute('cy', String(-totalH * 0.1));
  halo.setAttribute('rx', String(totalW * 0.65));
  halo.setAttribute('ry', String(totalH * 0.9));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── 2. Ground Shadow (black radial 0.18→0) ─────────────────────────
  const gsId = `pipe-gshadow-${entityId}`;
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
  const groundShadow = document.createElementNS(SVG_NS, 'ellipse');
  groundShadow.setAttribute('cx', '0');
  groundShadow.setAttribute('cy', String(stageH / 2 + stageH * 0.15));
  groundShadow.setAttribute('rx', String(totalW * 0.55));
  groundShadow.setAttribute('ry', String(stageH * 0.12));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Highlight glow ──────────────────────────────────────────────────
  if (entity.highlight) {
    const glowRect = document.createElementNS(SVG_NS, 'rect');
    glowRect.setAttribute('x', String(-totalW / 2 - 5));
    glowRect.setAttribute('y', String(-stageH / 2 - 5));
    glowRect.setAttribute('width', String(totalW + 10));
    glowRect.setAttribute('height', String(stageH + 10));
    glowRect.setAttribute('rx', '8');
    glowRect.setAttribute('stroke-width', String(STROKE.default));
    glowRect.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glowRect, cc);
    innerG.appendChild(glowRect);
  }

  // ── Stage fill gradient (radial, color 0.25→0.06) ──────────────────
  const stageFillId = `pipe-sfill-${entityId}`;
  if (!defs.querySelector(`#${stageFillId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', stageFillId);
    grad.setAttribute('cx', '50%'); grad.setAttribute('cy', '50%'); grad.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.25');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.06');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // ── Stage stroke gradient (linear 135deg, color 0.9→0.3) ───────────
  const stageStrokeId = `pipe-sstroke-${entityId}`;
  if (!defs.querySelector(`#${stageStrokeId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', stageStrokeId);
    // 135deg → x1=0 y1=0 x2=100% y2=100%
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.9');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.3');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // ── Main wrapper group (glass + glow filters) ──────────────────────
  const mainWrap = document.createElementNS(SVG_NS, 'g');
  mainWrap.setAttribute('filter', glassFilterUrl);
  mainWrap.classList.add(`pipe-float-${entityId}`);

  // ── Render 3 stages ─────────────────────────────────────────────────
  for (let i = 0; i < 3; i++) {
    const cx = stageCxs[i];
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(cx - stageW / 2));
    rect.setAttribute('y', String(-stageH / 2));
    rect.setAttribute('width', String(stageW));
    rect.setAttribute('height', String(stageH));
    rect.setAttribute('rx', String(stageRx));
    rect.setAttribute('fill', `url(#${stageFillId})`);
    rect.setAttribute('stroke', `url(#${stageStrokeId})`);
    rect.setAttribute('stroke-width', '2');
    rect.classList.add(`pipe-shimmer-${entityId}`);
    if (i > 0) rect.style.animationDelay = `${i * 0.3}s`;
    mainWrap.appendChild(rect);
  }

  // ── Arrow connectors between stages ─────────────────────────────────
  for (let i = 0; i < 2; i++) {
    const fromCx = stageCxs[i];
    const toCx = stageCxs[i + 1];
    const _midX = (fromCx + stageW / 2 + toCx - stageW / 2) / 2;

    // Arrow line
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(fromCx + stageW / 2 + 2));
    line.setAttribute('y1', '0');
    line.setAttribute('x2', String(toCx - stageW / 2 - 2 - arrowSize));
    line.setAttribute('y2', '0');
    line.setAttribute('stroke', colorWithAlpha(color, '80'));
    line.setAttribute('stroke-width', '2');
    mainWrap.appendChild(line);

    // Arrow triangle
    const arrow = document.createElementNS(SVG_NS, 'polygon');
    const tipX = toCx - stageW / 2 - 2;
    const baseX = tipX - arrowSize;
    arrow.setAttribute('points', [
      `${tipX},0`,
      `${baseX},${-arrowSize * 0.6}`,
      `${baseX},${arrowSize * 0.6}`,
    ].join(' '));
    arrow.setAttribute('fill', colorWithAlpha(color, '80'));
    arrow.classList.add(`pipe-pulse-${entityId}`);
    if (i > 0) arrow.style.animationDelay = '0.4s';
    mainWrap.appendChild(arrow);
  }

  innerG.appendChild(mainWrap);

  // ── 3. Ambient Occlusion (cx=70% cy=75% r=55%, black 0.10→0) ──────
  const aoId = `pipe-ao-${entityId}`;
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
  const ao = document.createElementNS(SVG_NS, 'rect');
  ao.setAttribute('x', String(-totalW / 2));
  ao.setAttribute('y', String(-stageH / 2));
  ao.setAttribute('width', String(totalW));
  ao.setAttribute('height', String(stageH));
  ao.setAttribute('rx', String(stageRx));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── 4. Specular (cx=35% cy=25% r=40%, white 0.18→0) ───────────────
  const specId = `pipe-spec-${entityId}`;
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
  specular.setAttribute('cx', String(-totalW * 0.12));
  specular.setAttribute('cy', String(-stageH * 0.25));
  specular.setAttribute('rx', String(totalW * 0.35));
  specular.setAttribute('ry', String(stageH * 0.3));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Status dot (top-right, solid color with glow) ──────────────────
  const dotR = s * 0.03;
  const dot = document.createElementNS(SVG_NS, 'circle');
  dot.setAttribute('cx', String(totalW / 2 - dotR * 2));
  dot.setAttribute('cy', String(-stageH / 2 - dotR * 2));
  dot.setAttribute('r', String(dotR));
  dot.setAttribute('fill', color);
  dot.setAttribute('filter', glowFilterUrl);
  innerG.appendChild(dot);

  // ── 5. Micro-Life CSS animations (transforms, not just opacity) ────
  const styleId = `pipe-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes pipeFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes pipeShimmer_${entityId} {
        0%, 100% { transform: translateX(0); }
        50% { transform: translateX(1.5px); }
      }
      @keyframes pipePulse_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.3); }
      }
      .pipe-float-${entityId} {
        animation: pipeFloat_${entityId} 3.5s ease-in-out infinite;
      }
      .pipe-shimmer-${entityId} {
        animation: pipeShimmer_${entityId} 2.5s ease-in-out infinite;
      }
      .pipe-pulse-${entityId} {
        animation: pipePulse_${entityId} 2s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }

  // ── Label below ─────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(stageH / 2 + LABEL_DEFAULTS.offsetBelow));
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
