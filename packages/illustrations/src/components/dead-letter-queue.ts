/**
 * @preplai/illustrations — DeadLetterQueue Component (Cinematic Depth)
 *
 * Queue cells + diagonal strikethrough + "DLQ" + dots. Directional lighting,
 * ground shadow, ambient occlusion, specular highlight, micro-life.
 * Use for: dead letter queues, failed message storage, poison queues.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';import type { VisualEntity } from '@preplai/shared';

export function renderDeadLetterQueue(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const w = size * 0.95;
  const h = size * 0.45;
  const hw = w / 2;
  const hh = h / 2;
  const rx = 5;

  const defs = ensureDefs(parentEl);

  // ── 1. Directional Lighting ─────────────────────────────────────────
  const haloId = `dlq-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-hw * 0.12));
  halo.setAttribute('cy', String(-hh * 0.1));
  halo.setAttribute('rx', String(hw * 1.6));
  halo.setAttribute('ry', String(hh * 2));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── 2. Ground Shadow ────────────────────────────────────────────────
  const gsId = `dlq-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(hh + hh * 0.25));
  groundShadow.setAttribute('rx', String(hw * 1.1));
  groundShadow.setAttribute('ry', String(hh * 0.3));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── 3. Ambient Occlusion ────────────────────────────────────────────
  const aoId = `dlq-ao-${entityId}`;
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

  // ── Highlight glow ring ─────────────────────────────────────────────
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-hw - 3));
    glow.setAttribute('y', String(-hh - 3));
    glow.setAttribute('width', String(w + 6));
    glow.setAttribute('height', String(h + 6));
    glow.setAttribute('rx', String(rx + 2));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Body fill gradient ──────────────────────────────────────────────
  const bodyFillId = `dlq-bfill-${entityId}`;
  if (!defs.querySelector(`#${bodyFillId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', bodyFillId);
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.3');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.08');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }
  const bodyStrokeId = `dlq-bstroke-${entityId}`;
  if (!defs.querySelector(`#${bodyStrokeId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', bodyStrokeId);
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.9');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.3');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // ── Queue body ──────────────────────────────────────────────────────
  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x', String(-hw));
  body.setAttribute('y', String(-hh));
  body.setAttribute('width', String(w));
  body.setAttribute('height', String(h));
  body.setAttribute('rx', String(rx));
  body.setAttribute('fill', `url(#${bodyFillId})`);
  body.setAttribute('stroke', `url(#${bodyStrokeId})`);
  body.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(body);

  // ── AO overlay ──────────────────────────────────────────────────────
  const aoRect = document.createElementNS(SVG_NS, 'rect');
  aoRect.setAttribute('x', String(-hw));
  aoRect.setAttribute('y', String(-hh));
  aoRect.setAttribute('width', String(w));
  aoRect.setAttribute('height', String(h));
  aoRect.setAttribute('rx', String(rx));
  aoRect.setAttribute('fill', `url(#${aoId})`);
  aoRect.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoRect);

  // ── Queue cells (4 vertical divisions) ──────────────────────────────
  const cellCount = 4;
  const cellW = w / cellCount;
  for (let i = 1; i < cellCount; i++) {
    const cx = -hw + cellW * i;
    const divider = document.createElementNS(SVG_NS, 'line');
    divider.setAttribute('x1', String(cx));
    divider.setAttribute('y1', String(-hh));
    divider.setAttribute('x2', String(cx));
    divider.setAttribute('y2', String(hh));
    divider.setAttribute('stroke', colorWithAlpha(color, '33'));
    divider.setAttribute('stroke-width', '0.7');
    innerG.appendChild(divider);
  }

  // Cell shimmer dots (one per cell)
  for (let i = 0; i < cellCount; i++) {
    const dotCx = -hw + cellW * i + cellW / 2;
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(dotCx));
    dot.setAttribute('cy', '0');
    dot.setAttribute('r', String(size * 0.02));
    dot.setAttribute('fill', colorWithAlpha(color, '55'));
    dot.classList.add(`dlq-cell-${entityId}`);
    dot.style.animationDelay = `${i * 0.2}s`;
    innerG.appendChild(dot);
  }

  // ── Diagonal strikethrough ──────────────────────────────────────────
  const strike = document.createElementNS(SVG_NS, 'line');
  strike.setAttribute('x1', String(-hw * 0.85));
  strike.setAttribute('y1', String(-hh * 0.85));
  strike.setAttribute('x2', String(hw * 0.85));
  strike.setAttribute('y2', String(hh * 0.85));
  strike.setAttribute('stroke', colorWithAlpha(color, '44'));
  strike.setAttribute('stroke-width', String(STROKE.emphasized));
  strike.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(strike);

  // ── "DLQ" text ──────────────────────────────────────────────────────
  const dlqText = document.createElementNS(SVG_NS, 'text');
  dlqText.setAttribute('x', String(hw * 0.55));
  dlqText.setAttribute('y', String(-hh - size * 0.06));
  dlqText.setAttribute('text-anchor', 'middle');
  dlqText.setAttribute('fill', color);
  dlqText.setAttribute('font-size', String(size * 0.1));
  dlqText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  dlqText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  dlqText.textContent = 'DLQ';
  dlqText.classList.add(`dlq-warn-${entityId}`);
  innerG.appendChild(dlqText);

  // ── 4. Specular Highlight ───────────────────────────────────────────
  const specId = `dlq-spec-${entityId}`;
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
  specular.setAttribute('cx', String(-hw * 0.2));
  specular.setAttribute('cy', String(-hh * 0.4));
  specular.setAttribute('rx', String(hw * 0.55));
  specular.setAttribute('ry', String(hh * 0.45));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── 5. Micro-Life — warning pulse, cell shimmer, float ──────────────
  const styleId = `dlq-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes dlqWarnPulse_${entityId} {
        0%, 100% { transform: scale(1); opacity: 0.6; }
        50% { transform: scale(1.12); opacity: 1; }
      }
      @keyframes dlqCellShimmer_${entityId} {
        0%, 100% { transform: scale(1); opacity: 0.4; }
        50% { transform: scale(1.8); opacity: 0.9; }
      }
      @keyframes dlqFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .dlq-warn-${entityId} {
        animation: dlqWarnPulse_${entityId} 2s ease-in-out infinite;
      }
      .dlq-cell-${entityId} {
        animation: dlqCellShimmer_${entityId} 2.6s ease-in-out infinite;
      }
      .dlq-float-${entityId} {
        animation: dlqFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`dlq-float-${entityId}`);

  // ── Label below ─────────────────────────────────────────────────────
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
