/**
 * @preplai/illustrations — Dashboard Component (Cinematic Depth)
 *
 * Monitoring dashboard: screen rect with bar chart bars, trend line, and title.
 * Glassmorphic depth with directional lighting, ground shadow, ambient occlusion,
 * specular highlight, and micro-life animations.
 *
 * Micro-life: bar grow scaleY staggered, trend shimmer, float.
 * Metadata: { panels?: number }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';import type { VisualEntity } from '@preplai/shared';

export function renderDashboard(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const w = size * 1.6;
  const h = size * 1.2;
  const hw = w / 2;
  const hh = h / 2;
  const rx = 6;

  const defs = ensureDefs(parentEl);

  // ── 1. Directional Lighting (radial halo) ─────────────────────────────
  const haloId = `dash-halo-${entityId}`;
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
  const gsId = `dash-gshadow-${entityId}`;
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
  gShadow.setAttribute('cy', String(hh + 4));
  gShadow.setAttribute('rx', String(hw * 0.9));
  gShadow.setAttribute('ry', String(hh * 0.18));
  gShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(gShadow);

  // ── 3. Ambient Occlusion ──────────────────────────────────────────────
  const aoId = `dash-ao-${entityId}`;
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
  ao.setAttribute('x', String(-hw)); ao.setAttribute('y', String(-hh));
  ao.setAttribute('width', String(w)); ao.setAttribute('height', String(h));
  ao.setAttribute('rx', String(rx));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Body fill gradient ────────────────────────────────────────────────
  const bodyGradId = `dash-body-${entityId}`;
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
  const strokeGradId = `dash-stroke-${entityId}`;
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
    const glowRect = document.createElementNS(SVG_NS, 'rect');
    glowRect.setAttribute('x', String(-hw - 3));
    glowRect.setAttribute('y', String(-hh - 3));
    glowRect.setAttribute('width', String(w + 6));
    glowRect.setAttribute('height', String(h + 6));
    glowRect.setAttribute('rx', String(rx + 2));
    glowRect.setAttribute('fill', 'none');
    glowRect.setAttribute('stroke-width', String(STROKE.default));
    glowRect.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glowRect, cc);
    innerG.appendChild(glowRect);
  }

  // ── Screen body ───────────────────────────────────────────────────────
  const card = document.createElementNS(SVG_NS, 'rect');
  card.setAttribute('x', String(-hw)); card.setAttribute('y', String(-hh));
  card.setAttribute('width', String(w)); card.setAttribute('height', String(h));
  card.setAttribute('rx', String(rx));
  card.setAttribute('fill', `url(#${bodyGradId})`);
  card.setAttribute('stroke', `url(#${strokeGradId})`);
  card.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(card);

  // ── Title bar ─────────────────────────────────────────────────────────
  const titleBar = document.createElementNS(SVG_NS, 'rect');
  titleBar.setAttribute('x', String(-hw));
  titleBar.setAttribute('y', String(-hh));
  titleBar.setAttribute('width', String(w));
  titleBar.setAttribute('height', '18');
  titleBar.setAttribute('rx', String(rx));
  titleBar.setAttribute('fill', color);
  titleBar.setAttribute('opacity', '0.15');
  innerG.appendChild(titleBar);

  // Title text
  if (entity.label) {
    const titleText = document.createElementNS(SVG_NS, 'text');
    titleText.setAttribute('x', String(-hw + 8));
    titleText.setAttribute('y', String(-hh + 13));
    titleText.setAttribute('text-anchor', 'start');
    titleText.setAttribute('fill', cc.textPrimary);
    titleText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    titleText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    titleText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    titleText.textContent = entity.label;
    innerG.appendChild(titleText);
  }

  // ── Bar chart bars (staggered grow animation) ─────────────────────────
  const chartArea = { x: -hw + 10, y: -hh + 24, w: w * 0.55, h: h - 34 };
  const barCount = 5;
  const barW = (chartArea.w - (barCount - 1) * 3) / barCount;
  const barHeights = [0.6, 0.85, 0.45, 0.95, 0.7];

  for (let i = 0; i < barCount; i++) {
    const bh = chartArea.h * barHeights[i];
    const bx = chartArea.x + i * (barW + 3);
    const by = chartArea.y + chartArea.h - bh;
    const bar = document.createElementNS(SVG_NS, 'rect');
    bar.setAttribute('x', String(bx));
    bar.setAttribute('y', String(by));
    bar.setAttribute('width', String(barW));
    bar.setAttribute('height', String(bh));
    bar.setAttribute('rx', '2');
    bar.setAttribute('fill', colorWithAlpha(color, 'aa'));
    bar.classList.add(`dash-bar-${entityId}`);
    bar.style.animationDelay = `${i * 0.15}s`;
    bar.style.transformOrigin = `${bx + barW / 2}px ${chartArea.y + chartArea.h}px`;
    innerG.appendChild(bar);
  }

  // ── Trend line (right side) ───────────────────────────────────────────
  const trendArea = { x: hw - w * 0.38, y: -hh + 28, w: w * 0.33, h: h - 40 };
  const trendPoints: string[] = [];
  const trendSteps = 7;
  for (let i = 0; i <= trendSteps; i++) {
    const tx = trendArea.x + (i / trendSteps) * trendArea.w;
    const ty = trendArea.y + trendArea.h * 0.5 + Math.sin(i * 1.2) * (trendArea.h * 0.3);
    trendPoints.push(`${tx},${ty}`);
  }
  const trendLine = document.createElementNS(SVG_NS, 'polyline');
  trendLine.setAttribute('points', trendPoints.join(' '));
  trendLine.setAttribute('fill', 'none');
  trendLine.setAttribute('stroke', color);
  trendLine.setAttribute('stroke-width', String(STROKE.default));
  trendLine.setAttribute('stroke-linecap', 'round');
  trendLine.setAttribute('stroke-linejoin', 'round');
  trendLine.classList.add(`dash-trend-${entityId}`);
  innerG.appendChild(trendLine);

  // ── 4. Specular Highlight ─────────────────────────────────────────────
  const specId = `dash-spec-${entityId}`;
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
  specular.setAttribute('cx', String(-hw * 0.3));
  specular.setAttribute('cy', String(-hh * 0.4));
  specular.setAttribute('rx', String(hw * 0.5));
  specular.setAttribute('ry', String(hh * 0.35));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── 5. Micro-Life Animations ──────────────────────────────────────────
  const styleId = `dash-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes dashBarGrow_${entityId} {
        0%, 100% { transform: scaleY(1); }
        50% { transform: scaleY(1.08); }
      }
      @keyframes dashTrendShimmer_${entityId} {
        0%, 100% { transform: translateX(0); opacity: 0.7; }
        50% { transform: translateX(2px); opacity: 1; }
      }
      @keyframes dashFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .dash-bar-${entityId} {
        animation: dashBarGrow_${entityId} 2.2s ease-in-out infinite;
      }
      .dash-trend-${entityId} {
        animation: dashTrendShimmer_${entityId} 3s ease-in-out infinite;
      }
      .dash-float-${entityId} {
        animation: dashFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`dash-float-${entityId}`);

  // ── Label below ───────────────────────────────────────────────────────
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
