/**
 * @preplai/illustrations — Metric Component (Cinematic Depth)
 *
 * Number card with large value display and progress bar.
 * Use for: KPIs, dashboard metrics, performance counters.
 *
 * Micro-life: value breathe, bar pulse scaleX, float.
 * Metadata: { value, unit?, trend?: 'up'|'down'|'flat' }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';import type { VisualEntity } from '@preplai/shared';

export function renderMetric(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const value = String(meta.value ?? entity.label ?? '0');
  const unit = (meta.unit as string) ?? '';
  const trend = (meta.trend as 'up' | 'down' | 'flat') ?? 'flat';

  const w = size * 1.2;
  const h = size * 0.75;
  const hw = w / 2;
  const hh = h / 2;
  const rx = 6;

  const defs = ensureDefs(parentEl);

  // ── 1. Directional Lighting ───────────────────────────────────────────
  const haloId = `metric-halo-${entityId}`;
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
  halo.setAttribute('rx', String(hw * 1.5));
  halo.setAttribute('ry', String(hh * 1.4));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── 2. Ground Shadow ──────────────────────────────────────────────────
  const gsId = `metric-gshadow-${entityId}`;
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
  gShadow.setAttribute('rx', String(hw * 0.85));
  gShadow.setAttribute('ry', String(hh * 0.18));
  gShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(gShadow);

  // ── 3. Ambient Occlusion ──────────────────────────────────────────────
  const aoId = `metric-ao-${entityId}`;
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
  const bodyGradId = `metric-body-${entityId}`;
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
  const strokeGradId = `metric-stroke-${entityId}`;
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

  // ── Card body ─────────────────────────────────────────────────────────
  const card = document.createElementNS(SVG_NS, 'rect');
  card.setAttribute('x', String(-hw)); card.setAttribute('y', String(-hh));
  card.setAttribute('width', String(w)); card.setAttribute('height', String(h));
  card.setAttribute('rx', String(rx));
  card.setAttribute('fill', `url(#${bodyGradId})`);
  card.setAttribute('stroke', `url(#${strokeGradId})`);
  card.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(card);

  // ── Value display (centered) ──────────────────────────────────────────
  const valueEl = document.createElementNS(SVG_NS, 'text');
  valueEl.setAttribute('x', '0');
  valueEl.setAttribute('y', String(-2));
  valueEl.setAttribute('text-anchor', 'middle');
  valueEl.setAttribute('dominant-baseline', 'central');
  valueEl.setAttribute('fill', cc.textPrimary);
  valueEl.setAttribute('font-size', String(Math.min(size * 0.35, 22)));
  valueEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  valueEl.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  valueEl.textContent = value + (unit ? ` ${unit}` : '');
  valueEl.classList.add(`metric-value-${entityId}`);
  innerG.appendChild(valueEl);

  // ── Trend indicator ───────────────────────────────────────────────────
  if (trend !== 'flat') {
    const trendColor = trend === 'up' ? '#4ade80' : '#f87171';
    const tx = hw - 12;
    const ty = -hh + 10;
    const tri = document.createElementNS(SVG_NS, 'polygon');
    tri.setAttribute('points', trend === 'up'
      ? `${tx},${ty - 3} ${tx + 3},${ty + 2} ${tx - 3},${ty + 2}`
      : `${tx},${ty + 3} ${tx + 3},${ty - 2} ${tx - 3},${ty - 2}`);
    tri.setAttribute('fill', trendColor);
    innerG.appendChild(tri);
  }

  // ── Progress bar at bottom ────────────────────────────────────────────
  const barY = hh - 10;
  const barW = w - 20;
  const barH = 4;
  // Background bar
  const barBg = document.createElementNS(SVG_NS, 'rect');
  barBg.setAttribute('x', String(-barW / 2));
  barBg.setAttribute('y', String(barY));
  barBg.setAttribute('width', String(barW));
  barBg.setAttribute('height', String(barH));
  barBg.setAttribute('rx', '2');
  barBg.setAttribute('fill', colorWithAlpha(color, '22'));
  innerG.appendChild(barBg);
  // Fill bar
  const fillPct = 0.65;
  const barFill = document.createElementNS(SVG_NS, 'rect');
  barFill.setAttribute('x', String(-barW / 2));
  barFill.setAttribute('y', String(barY));
  barFill.setAttribute('width', String(barW * fillPct));
  barFill.setAttribute('height', String(barH));
  barFill.setAttribute('rx', '2');
  barFill.setAttribute('fill', colorWithAlpha(color, 'aa'));
  barFill.classList.add(`metric-bar-${entityId}`);
  barFill.style.transformOrigin = `${-barW / 2}px ${barY + barH / 2}px`;
  innerG.appendChild(barFill);

  // ── 4. Specular Highlight ─────────────────────────────────────────────
  const specId = `metric-spec-${entityId}`;
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
  const styleId = `metric-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes metricBreathe_${entityId} {
        0%, 100% { transform: scale(1); opacity: 0.9; }
        50% { transform: scale(1.04); opacity: 1; }
      }
      @keyframes metricBarPulse_${entityId} {
        0%, 100% { transform: scaleX(1); }
        50% { transform: scaleX(1.06); }
      }
      @keyframes metricFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .metric-value-${entityId} {
        animation: metricBreathe_${entityId} 2.5s ease-in-out infinite;
      }
      .metric-bar-${entityId} {
        animation: metricBarPulse_${entityId} 3s ease-in-out infinite;
      }
      .metric-float-${entityId} {
        animation: metricFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`metric-float-${entityId}`);

  // ── Label below ───────────────────────────────────────────────────────
  if (entity.label && entity.label !== value) {
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
