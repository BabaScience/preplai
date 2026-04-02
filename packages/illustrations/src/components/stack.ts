/**
 * @preplai/illustrations — Stack Component (Cinematic Depth)
 *
 * Four stacked rects + TOP label + push arrow.
 * Cinematic depth: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (top element pulse + push arrow translateY + float).
 *
 * Metadata: { layers: Array<{ label: string, color?: string }> }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';import type { VisualEntity } from '@preplai/shared';

interface StackLayer {
  label: string;
  color?: string;
}

export function renderStack(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const scale = size / 50;
  const meta = entity.metadata ?? {};
  const layers: StackLayer[] = (meta.layers as StackLayer[]) ?? [
    { label: 'Application' },
    { label: 'Transport' },
    { label: 'Network' },
    { label: 'Link' },
  ];

  const blockW = size * 1.6;
  const blockH = 20 * scale;
  const gap = 4 * scale;
  const totalH = layers.length * blockH + (layers.length - 1) * gap;
  const startY = -totalH / 2 + blockH / 2;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ──────────────────────────────────
  const haloId = `stk-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const g = document.createElementNS(SVG_NS, 'radialGradient');
    g.setAttribute('id', haloId);
    g.setAttribute('cx', '38%'); g.setAttribute('cy', '38%'); g.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.13');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0');
    g.appendChild(s1); g.appendChild(s2);
    defs.appendChild(g);
  }
  const haloEl = document.createElementNS(SVG_NS, 'ellipse');
  haloEl.setAttribute('cx', String(-blockW * 0.08));
  haloEl.setAttribute('cy', String(-size * 0.05));
  haloEl.setAttribute('rx', String(blockW * 0.65));
  haloEl.setAttribute('ry', String(totalH * 0.55));
  haloEl.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(haloEl);

  // ── Pillar 2: Ground Shadow ─────────────────────────────────────────
  const gsId = `stk-gs-${entityId}`;
  if (!defs.querySelector(`#${gsId}`)) {
    const g = document.createElementNS(SVG_NS, 'radialGradient');
    g.setAttribute('id', gsId);
    g.setAttribute('cx', '50%'); g.setAttribute('cy', '50%'); g.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#000000'); s1.setAttribute('stop-opacity', '0.18');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#000000'); s2.setAttribute('stop-opacity', '0');
    g.appendChild(s1); g.appendChild(s2);
    defs.appendChild(g);
  }
  const gsEl = document.createElementNS(SVG_NS, 'ellipse');
  gsEl.setAttribute('cx', '0');
  gsEl.setAttribute('cy', String(totalH / 2 + blockH * 0.3));
  gsEl.setAttribute('rx', String(blockW * 0.55));
  gsEl.setAttribute('ry', String(blockH * 0.3));
  gsEl.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(gsEl);

  // ── Pillar 3: Ambient Occlusion ─────────────────────────────────────
  const aoId = `stk-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const g = document.createElementNS(SVG_NS, 'radialGradient');
    g.setAttribute('id', aoId);
    g.setAttribute('cx', '70%'); g.setAttribute('cy', '75%'); g.setAttribute('r', '55%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#000000'); s1.setAttribute('stop-opacity', '0.10');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#000000'); s2.setAttribute('stop-opacity', '0');
    g.appendChild(s1); g.appendChild(s2);
    defs.appendChild(g);
  }
  const aoEl = document.createElementNS(SVG_NS, 'rect');
  aoEl.setAttribute('x', String(-blockW / 2));
  aoEl.setAttribute('y', String(-totalH / 2));
  aoEl.setAttribute('width', String(blockW));
  aoEl.setAttribute('height', String(totalH));
  aoEl.setAttribute('fill', `url(#${aoId})`);
  aoEl.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoEl);

  // ── Body gradients ──────────────────────────────────────────────────
  const bodyFillId = `stk-bf-${entityId}`;
  if (!defs.querySelector(`#${bodyFillId}`)) {
    const g = document.createElementNS(SVG_NS, 'radialGradient');
    g.setAttribute('id', bodyFillId);
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.3');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.08');
    g.appendChild(s1); g.appendChild(s2);
    defs.appendChild(g);
  }
  const bodyStrokeId = `stk-bst-${entityId}`;
  if (!defs.querySelector(`#${bodyStrokeId}`)) {
    const g = document.createElementNS(SVG_NS, 'linearGradient');
    g.setAttribute('id', bodyStrokeId);
    g.setAttribute('x1', '0%'); g.setAttribute('y1', '0%'); g.setAttribute('x2', '100%'); g.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.9');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.3');
    g.appendChild(s1); g.appendChild(s2);
    defs.appendChild(g);
  }

  // ── Highlight glow ring ─────────────────────────────────────────────
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-blockW / 2 - 3));
    glow.setAttribute('y', String(-totalH / 2 - 3));
    glow.setAttribute('width', String(blockW + 6));
    glow.setAttribute('height', String(totalH + 6));
    glow.setAttribute('rx', '6');
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Layers ──────────────────────────────────────────────────────────
  layers.forEach((layer, i) => {
    const y = startY + i * (blockH + gap);

    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(-blockW / 2));
    rect.setAttribute('y', String(y - blockH / 2));
    rect.setAttribute('width', String(blockW));
    rect.setAttribute('height', String(blockH));
    rect.setAttribute('rx', String(3 * scale));
    rect.setAttribute('fill', `url(#${bodyFillId})`);
    rect.setAttribute('stroke', `url(#${bodyStrokeId})`);
    rect.setAttribute('stroke-width', String(STROKE.default));
    if (i === 0) rect.classList.add(`stk-top-${entityId}`);
    innerG.appendChild(rect);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(y + 4 * scale));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', cc.textPrimary);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel * 0.85));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = layer.label.slice(0, 20);
    innerG.appendChild(text);
  });

  // ── TOP label ───────────────────────────────────────────────────────
  const _topLabelY = startY - blockH / 2 - 6 * scale;
  const topLabel = document.createElementNS(SVG_NS, 'text');
  topLabel.setAttribute('x', String(blockW / 2 + 6 * scale));
  topLabel.setAttribute('y', String(startY));
  topLabel.setAttribute('text-anchor', 'start');
  topLabel.setAttribute('fill', cc.textSecondary);
  topLabel.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel * 0.7));
  topLabel.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
  topLabel.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  topLabel.textContent = 'TOP';
  innerG.appendChild(topLabel);

  // ── Push arrow ──────────────────────────────────────────────────────
  const arrowMarkerId = `stk-am-${entityId}`;
  if (!defs.querySelector(`#${arrowMarkerId}`)) {
    const marker = document.createElementNS(SVG_NS, 'marker');
    marker.setAttribute('id', arrowMarkerId);
    marker.setAttribute('markerWidth', '6'); marker.setAttribute('markerHeight', '4');
    marker.setAttribute('refX', '5'); marker.setAttribute('refY', '2');
    marker.setAttribute('orient', 'auto');
    const poly = document.createElementNS(SVG_NS, 'polygon');
    poly.setAttribute('points', '0 0, 6 2, 0 4');
    poly.setAttribute('fill', color);
    marker.appendChild(poly);
    defs.appendChild(marker);
  }
  const pushArrowX = -blockW / 2 - 10 * scale;
  const pushArrow = document.createElementNS(SVG_NS, 'line');
  pushArrow.setAttribute('x1', String(pushArrowX));
  pushArrow.setAttribute('y1', String(startY + blockH));
  pushArrow.setAttribute('x2', String(pushArrowX));
  pushArrow.setAttribute('y2', String(startY - blockH / 2 + 2 * scale));
  pushArrow.setAttribute('stroke', color);
  pushArrow.setAttribute('stroke-width', String(STROKE.default * 0.8));
  pushArrow.setAttribute('marker-end', `url(#${arrowMarkerId})`);
  pushArrow.classList.add(`stk-push-${entityId}`);
  innerG.appendChild(pushArrow);

  // Push label
  const pushLabel = document.createElementNS(SVG_NS, 'text');
  pushLabel.setAttribute('x', String(pushArrowX - 4 * scale));
  pushLabel.setAttribute('y', String(startY + blockH * 0.4));
  pushLabel.setAttribute('text-anchor', 'end');
  pushLabel.setAttribute('fill', cc.textSecondary);
  pushLabel.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel * 0.6));
  pushLabel.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  pushLabel.textContent = 'push';
  innerG.appendChild(pushLabel);

  // ── Pillar 4: Specular Highlight ────────────────────────────────────
  const specId = `stk-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    const g = document.createElementNS(SVG_NS, 'radialGradient');
    g.setAttribute('id', specId);
    g.setAttribute('cx', '35%'); g.setAttribute('cy', '25%'); g.setAttribute('r', '40%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#ffffff'); s1.setAttribute('stop-opacity', '0.18');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#ffffff'); s2.setAttribute('stop-opacity', '0');
    g.appendChild(s1); g.appendChild(s2);
    defs.appendChild(g);
  }
  const specEl = document.createElementNS(SVG_NS, 'ellipse');
  specEl.setAttribute('cx', String(-blockW * 0.1));
  specEl.setAttribute('cy', String(-totalH * 0.3));
  specEl.setAttribute('rx', String(blockW * 0.3));
  specEl.setAttribute('ry', String(totalH * 0.2));
  specEl.setAttribute('fill', `url(#${specId})`);
  specEl.setAttribute('pointer-events', 'none');
  innerG.appendChild(specEl);

  // ── Pillar 5: Micro-Life ────────────────────────────────────────────
  const styleId = `stk-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes stkTopPulse_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.04); }
      }
      @keyframes stkPushArrow_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
      }
      @keyframes stkFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .stk-top-${entityId} {
        animation: stkTopPulse_${entityId} 2.5s ease-in-out infinite;
      }
      .stk-push-${entityId} {
        animation: stkPushArrow_${entityId} 2s ease-in-out infinite;
      }
      .stk-float-${entityId} {
        animation: stkFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`stk-float-${entityId}`);

  // ── Label below ─────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(totalH / 2 + LABEL_DEFAULTS.offsetBelow));
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
