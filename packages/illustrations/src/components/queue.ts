/**
 * @preplai/illustrations — Queue Component
 *
 * Clean horizontal cells with values. No directional arrows.
 * Use for: message queues, task queues, FIFO buffers.
 *
 * Minimalist style matching the Composable engine aesthetic:
 * - Horizontal row of clean rounded cells
 * - Subtle gradient fill
 * - Thin stroke
 * - Label below
 * - Optional highlight glow
 *
 * Cinematic 5-pillar depth: offset halo, ground shadow, AO, glass filter,
 * shimmer overlay, flow shimmer animation, specular highlight.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, getLabelFontSize, getStrokeWidth } from '../design-tokens.js';import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlowFilter, ensureGlassFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderQueue(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const values = (meta.values as (string | number)[]) ?? [1, 2, 3];
  const visibleValues = values.slice(0, 5);

  const cellW = 26;
  const cellH = 22;
  const gap = 6;
  const totalW = visibleValues.length * cellW + (visibleValues.length - 1) * gap;
  const startX = -totalW / 2 + cellW / 2;

  const defs = ensureDefs(parentEl);
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);

  // ── 1. Offset radial halo ───────────────────────────────────────────
  const haloId = `queue-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const haloGrad = document.createElementNS(SVG_NS, 'radialGradient');
    haloGrad.setAttribute('id', haloId);
    haloGrad.setAttribute('cx', '38%'); haloGrad.setAttribute('cy', '38%');
    haloGrad.setAttribute('r', '50%');
    const hhs1 = document.createElementNS(SVG_NS, 'stop');
    hhs1.setAttribute('offset', '0%');
    hhs1.setAttribute('stop-color', color);
    hhs1.setAttribute('stop-opacity', '0.13');
    const hhs2 = document.createElementNS(SVG_NS, 'stop');
    hhs2.setAttribute('offset', '100%');
    hhs2.setAttribute('stop-color', color);
    hhs2.setAttribute('stop-opacity', '0');
    haloGrad.appendChild(hhs1); haloGrad.appendChild(hhs2);
    defs.appendChild(haloGrad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', String(-totalW * 0.06));
  halo.setAttribute('cy', String(-cellH * 0.12));
  halo.setAttribute('rx', String(totalW * 0.7));
  halo.setAttribute('ry', String(cellH * 1.5));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── 2. Ground contact shadow ────────────────────────────────────────
  const gndShadowId = `queue-gnd-${entityId}`;
  if (!defs.querySelector(`#${gndShadowId}`)) {
    const gndGrad = document.createElementNS(SVG_NS, 'radialGradient');
    gndGrad.setAttribute('id', gndShadowId);
    const gs1 = document.createElementNS(SVG_NS, 'stop');
    gs1.setAttribute('offset', '0%');
    gs1.setAttribute('stop-color', '#000000');
    gs1.setAttribute('stop-opacity', '0.18');
    const gs2 = document.createElementNS(SVG_NS, 'stop');
    gs2.setAttribute('offset', '100%');
    gs2.setAttribute('stop-color', '#000000');
    gs2.setAttribute('stop-opacity', '0');
    gndGrad.appendChild(gs1); gndGrad.appendChild(gs2);
    defs.appendChild(gndGrad);
  }
  const gndShadow = document.createElementNS(SVG_NS, 'ellipse');
  gndShadow.setAttribute('cx', '0');
  gndShadow.setAttribute('cy', String(cellH / 2 + 4));
  gndShadow.setAttribute('rx', String(totalW * 0.45));
  gndShadow.setAttribute('ry', String(cellH * 0.2));
  gndShadow.setAttribute('fill', `url(#${gndShadowId})`);
  innerG.appendChild(gndShadow);

  // ── 3. Ambient occlusion ────────────────────────────────────────────
  const aoId = `queue-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const aoGrad = document.createElementNS(SVG_NS, 'radialGradient');
    aoGrad.setAttribute('id', aoId);
    aoGrad.setAttribute('cx', '75%'); aoGrad.setAttribute('cy', '75%');
    aoGrad.setAttribute('r', '50%');
    const ao1 = document.createElementNS(SVG_NS, 'stop');
    ao1.setAttribute('offset', '0%');
    ao1.setAttribute('stop-color', '#000000');
    ao1.setAttribute('stop-opacity', '0.12');
    const ao2 = document.createElementNS(SVG_NS, 'stop');
    ao2.setAttribute('offset', '100%');
    ao2.setAttribute('stop-color', '#000000');
    ao2.setAttribute('stop-opacity', '0');
    aoGrad.appendChild(ao1); aoGrad.appendChild(ao2);
    defs.appendChild(aoGrad);
  }
  const ao = document.createElementNS(SVG_NS, 'ellipse');
  ao.setAttribute('cx', String(totalW * 0.15));
  ao.setAttribute('cy', String(cellH * 0.15));
  ao.setAttribute('rx', String(totalW * 0.5));
  ao.setAttribute('ry', String(cellH * 0.8));
  ao.setAttribute('fill', `url(#${aoId})`);
  innerG.appendChild(ao);

  // ── Cell gradient (per-color, shared across cells) ───────────────────
  const cellGradId = `queue-cell-${entityId}`;
  if (!defs.querySelector(`#${cellGradId}`)) {
    const cellGrad = document.createElementNS(SVG_NS, 'linearGradient');
    cellGrad.setAttribute('id', cellGradId);
    cellGrad.setAttribute('x1', '0%'); cellGrad.setAttribute('y1', '0%');
    cellGrad.setAttribute('x2', '0%'); cellGrad.setAttribute('y2', '100%');
    const cgs1 = document.createElementNS(SVG_NS, 'stop');
    cgs1.setAttribute('offset', '0%');
    cgs1.setAttribute('stop-color', color);
    cgs1.setAttribute('stop-opacity', '0.45');
    const cgs2 = document.createElementNS(SVG_NS, 'stop');
    cgs2.setAttribute('offset', '100%');
    cgs2.setAttribute('stop-color', color);
    cgs2.setAttribute('stop-opacity', '0.22');
    cellGrad.appendChild(cgs1); cellGrad.appendChild(cgs2);
    defs.appendChild(cellGrad);
  }

  // Highlight glow (behind cells)
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-totalW / 2 - 5));
    glow.setAttribute('y', String(-cellH / 2 - 5));
    glow.setAttribute('width', String(totalW + 10));
    glow.setAttribute('height', String(cellH + 10));
    glow.setAttribute('rx', '6');
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── 4. Glass filter on first cell ───────────────────────────────────
  const _glowUrl = ensureGlowFilter(parentEl, color);
  const glassUrl = ensureGlassFilter(parentEl);

  visibleValues.forEach((val, i) => {
    const x = startX + i * (cellW + gap);

    const cell = document.createElementNS(SVG_NS, 'rect');
    cell.setAttribute('x', String(x - cellW / 2));
    cell.setAttribute('y', String(-cellH / 2));
    cell.setAttribute('width', String(cellW));
    cell.setAttribute('height', String(cellH));
    cell.setAttribute('rx', '4');
    cell.setAttribute('fill', `url(#${cellGradId})`);
    cell.setAttribute('stroke', cc.stroke);
    cell.setAttribute('stroke-width', String(getStrokeWidth('thin', scale)));
    if (i === 0) {
      cell.setAttribute('filter', glassUrl);
    }
    innerG.appendChild(cell);

    const valueText = document.createElementNS(SVG_NS, 'text');
    valueText.setAttribute('x', String(x));
    valueText.setAttribute('y', String(4));
    valueText.setAttribute('text-anchor', 'middle');
    valueText.setAttribute('fill', cc.textPrimary);
    valueText.setAttribute('font-size', String(getLabelFontSize('value', scale)));
    valueText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    valueText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    valueText.textContent = String(val);
    innerG.appendChild(valueText);
  });

  // ── 5. Material texture — shimmer overlay gradient ──────────────────
  const shimmerId = `queue-shimmer-${entityId}`;
  if (!defs.querySelector(`#${shimmerId}`)) {
    const shimmerGrad = document.createElementNS(SVG_NS, 'linearGradient');
    shimmerGrad.setAttribute('id', shimmerId);
    shimmerGrad.setAttribute('x1', '0%'); shimmerGrad.setAttribute('y1', '0%');
    shimmerGrad.setAttribute('x2', '100%'); shimmerGrad.setAttribute('y2', '0%');
    [['0%', '0'], ['40%', '0'], ['50%', '0.06'], ['60%', '0'], ['100%', '0']].forEach(([off, op]) => {
      const st = document.createElementNS(SVG_NS, 'stop');
      st.setAttribute('offset', off);
      st.setAttribute('stop-color', '#ffffff');
      st.setAttribute('stop-opacity', op);
      shimmerGrad.appendChild(st);
    });
    defs.appendChild(shimmerGrad);
  }
  const shimmerRect = document.createElementNS(SVG_NS, 'rect');
  shimmerRect.setAttribute('x', String(-totalW / 2));
  shimmerRect.setAttribute('y', String(-cellH / 2));
  shimmerRect.setAttribute('width', String(totalW));
  shimmerRect.setAttribute('height', String(cellH));
  shimmerRect.setAttribute('rx', '4');
  shimmerRect.setAttribute('fill', `url(#${shimmerId})`);
  shimmerRect.setAttribute('pointer-events', 'none');
  innerG.appendChild(shimmerRect);

  // ── 6. Breathing micro-animation — flow shimmer ─────────────────────
  const styleId = `queue-style-${entityId}`;
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes queueFlowShimmer_${entityId} {
        0%   { opacity: 0.3; transform: translateX(-4px); }
        50%  { opacity: 1; transform: translateX(4px); }
        100% { opacity: 0.3; transform: translateX(-4px); }
      }
      @keyframes queueFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      .queue-float-${entityId} {
        animation: queueFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  shimmerRect.setAttribute('style', `animation: queueFlowShimmer_${entityId} 2.5s ease-in-out infinite`);
  innerG.classList.add(`queue-float-${entityId}`);

  // ── 7. Specular highlight ───────────────────────────────────────────
  const specId = `queue-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    const specGrad = document.createElementNS(SVG_NS, 'radialGradient');
    specGrad.setAttribute('id', specId);
    specGrad.setAttribute('cx', '30%'); specGrad.setAttribute('cy', '25%');
    specGrad.setAttribute('r', '40%');
    const sp1 = document.createElementNS(SVG_NS, 'stop');
    sp1.setAttribute('offset', '0%');
    sp1.setAttribute('stop-color', '#ffffff');
    sp1.setAttribute('stop-opacity', '0.18');
    const sp2 = document.createElementNS(SVG_NS, 'stop');
    sp2.setAttribute('offset', '100%');
    sp2.setAttribute('stop-color', '#ffffff');
    sp2.setAttribute('stop-opacity', '0');
    specGrad.appendChild(sp1); specGrad.appendChild(sp2);
    defs.appendChild(specGrad);
  }
  const specular = document.createElementNS(SVG_NS, 'ellipse');
  specular.setAttribute('cx', String(-totalW * 0.18));
  specular.setAttribute('cy', String(-cellH * 0.22));
  specular.setAttribute('rx', String(totalW * 0.28));
  specular.setAttribute('ry', String(cellH * 0.35));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // Label below
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(cellH / 2 + LABEL_DEFAULTS.offsetBelow));
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
