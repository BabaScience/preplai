/**
 * @preplai/illustrations — Stream Component (Cinematic 5-Pillar)
 *
 * Flow channel rect + data blocks + wave.
 * Use for: data streams, event streams, Kafka topics, SSE.
 *
 * 5 Pillars: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (stream flow translateX, block shimmer, float).
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlassFilter } from '../visual-utils.js';import type { VisualEntity } from '@preplai/shared';

export function renderStream(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const w = size * 1.2;
  const h = size * 0.45;
  const hw = w / 2;
  const hh = h / 2;
  const pillRx = h / 2;

  const defs = ensureDefs(parentEl);

  // ── 1. Directional Lighting ────────────────────────────────────────
  const haloId = `strm-halo-${entityId}`;
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
  halo.setAttribute('ry', String(hh * 1.8));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── 2. Ground Shadow ───────────────────────────────────────────────
  const gsId = `strm-gshadow-${entityId}`;
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
  groundShadow.setAttribute('rx', String(hw * 0.85));
  groundShadow.setAttribute('ry', String(hh * 0.2));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Highlight glow ring ────────────────────────────────────────────
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-hw - 3));
    glow.setAttribute('y', String(-hh - 3));
    glow.setAttribute('width', String(w + 6));
    glow.setAttribute('height', String(h + 6));
    glow.setAttribute('rx', String(pillRx + 2));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Body fill gradient ─────────────────────────────────────────────
  const bodyGradId = `strm-body-${entityId}`;
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

  const strokeGradId = `strm-stroke-${entityId}`;
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

  // ── Channel body ───────────────────────────────────────────────────
  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x', String(-hw));
  body.setAttribute('y', String(-hh));
  body.setAttribute('width', String(w));
  body.setAttribute('height', String(h));
  body.setAttribute('rx', String(pillRx));
  body.setAttribute('fill', `url(#${bodyGradId})`);
  body.setAttribute('stroke', `url(#${strokeGradId})`);
  body.setAttribute('stroke-width', String(STROKE.default));
  body.setAttribute('filter', ensureGlassFilter(parentEl));
  innerG.appendChild(body);

  // ── 3. Ambient Occlusion ───────────────────────────────────────────
  const aoId = `strm-ao-${entityId}`;
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
  ao.setAttribute('rx', String(pillRx));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Flow wave (dashed line + arrowhead) ────────────────────────────
  const flowLine = document.createElementNS(SVG_NS, 'line');
  flowLine.setAttribute('x1', String(-hw + 14));
  flowLine.setAttribute('y1', '0');
  flowLine.setAttribute('x2', String(hw - 18));
  flowLine.setAttribute('y2', '0');
  flowLine.setAttribute('stroke', colorWithAlpha(color, '44'));
  flowLine.setAttribute('stroke-width', String(STROKE.thin));
  flowLine.setAttribute('stroke-dasharray', '4,3');
  innerG.appendChild(flowLine);

  const arrow = document.createElementNS(SVG_NS, 'path');
  arrow.setAttribute('d', `M ${hw - 18} ${-3.5} L ${hw - 12} 0 L ${hw - 18} 3.5`);
  arrow.setAttribute('stroke', colorWithAlpha(color, '55'));
  arrow.setAttribute('stroke-width', String(STROKE.thin));
  arrow.setAttribute('fill', 'none');
  arrow.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(arrow);

  // ── Data blocks (flowing rectangles) ───────────────────────────────
  const blockG = document.createElementNS(SVG_NS, 'g');
  blockG.classList.add(`strm-flow-${entityId}`);
  for (let i = 0; i < 3; i++) {
    const bx = -hw + 18 + i * (w * 0.28);
    const bw = size * 0.06;
    const bh = size * 0.04;
    const block = document.createElementNS(SVG_NS, 'rect');
    block.setAttribute('x', String(bx));
    block.setAttribute('y', String(-bh / 2));
    block.setAttribute('width', String(bw));
    block.setAttribute('height', String(bh));
    block.setAttribute('rx', '1.5');
    block.setAttribute('fill', colorWithAlpha(color, '55'));
    block.classList.add(`strm-block-shimmer-${entityId}`);
    if (i > 0) block.style.animationDelay = `${i * 0.3}s`;
    blockG.appendChild(block);
  }
  innerG.appendChild(blockG);

  // ── 4. Specular Highlight ──────────────────────────────────────────
  const specId = `strm-spec-${entityId}`;
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
  specular.setAttribute('cx', String(-hw * 0.15));
  specular.setAttribute('cy', String(-hh * 0.3));
  specular.setAttribute('rx', String(hw * 0.45));
  specular.setAttribute('ry', String(hh * 0.35));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── 5. Micro-Life — stream flow + block shimmer + float ────────────
  const styleId = `strm-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes strmFlow_${entityId} {
        0% { transform: translateX(-6px); }
        100% { transform: translateX(6px); }
      }
      @keyframes strmBlockShimmer_${entityId} {
        0%, 100% { opacity: 0.4; transform: scale(1); }
        50% { opacity: 0.9; transform: scale(1.15); }
      }
      @keyframes strmFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .strm-flow-${entityId} {
        animation: strmFlow_${entityId} 2s ease-in-out infinite alternate;
      }
      .strm-block-shimmer-${entityId} {
        animation: strmBlockShimmer_${entityId} 2.2s ease-in-out infinite;
      }
      .strm-float-${entityId} {
        animation: strmFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`strm-float-${entityId}`);

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
