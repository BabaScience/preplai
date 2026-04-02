/**
 * @preplai/illustrations — Pod Component (5-Pillar Cinematic)
 *
 * Rounded rectangle with a 2x2 container grid (3 cells: 2 top, 1 centered bottom).
 * Use for: Kubernetes pods, container groups, orchestrated workloads.
 *
 * 5 Pillars: Directional Lighting, Ground Shadow, Ambient Occlusion,
 * Specular Highlight, Micro-Life (float + status pulse + cell shimmer).
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlassFilter, ensureGlowFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderPod(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const w = s * 0.85;
  const h = s * 0.7;
  const hw = w / 2;
  const hh = h / 2;
  const rx = 12;

  const defs = ensureDefs(parentEl);

  // ── 1. Directional Lighting — radialGradient halo ──────────────────
  const haloId = `pod-halo-${entityId}`;
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
  halo.setAttribute('rx', String(hw * 2));
  halo.setAttribute('ry', String(hh * 1.6));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── 2. Ground Shadow ───────────────────────────────────────────────
  const gsId = `pod-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(hh + hh * 0.15));
  groundShadow.setAttribute('rx', String(hw * 0.9));
  groundShadow.setAttribute('ry', String(hh * 0.18));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Highlight glow ring ────────────────────────────────────────────
  if (entity.highlight) {
    const glowRect = document.createElementNS(SVG_NS, 'rect');
    glowRect.setAttribute('x', String(-hw - 3));
    glowRect.setAttribute('y', String(-hh - 3));
    glowRect.setAttribute('width', String(w + 6));
    glowRect.setAttribute('height', String(h + 6));
    glowRect.setAttribute('rx', String(rx + 2));
    glowRect.setAttribute('stroke-width', String(STROKE.default));
    glowRect.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glowRect, cc);
    innerG.appendChild(glowRect);
  }

  // ── Body fill gradient (radial, cx=38%, cy=38%) ────────────────────
  const bodyGradId = `pod-body-${entityId}`;
  if (!defs.querySelector(`#${bodyGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', bodyGradId);
    grad.setAttribute('cx', '38%'); grad.setAttribute('cy', '38%'); grad.setAttribute('r', '70%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.3');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.08');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // ── Body stroke gradient (135deg, color 0.9 → 0.3) ────────────────
  const strokeGradId = `pod-stroke-${entityId}`;
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

  // ── Glow + Glass filters ───────────────────────────────────────────
  const glowUrl = ensureGlowFilter(parentEl, color, `pod-glow-${entityId}`);
  const glassUrl = ensureGlassFilter(parentEl);

  // ── Body rect ──────────────────────────────────────────────────────
  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x', String(-hw));
  body.setAttribute('y', String(-hh));
  body.setAttribute('width', String(w));
  body.setAttribute('height', String(h));
  body.setAttribute('rx', String(rx));
  body.setAttribute('fill', `url(#${bodyGradId})`);
  body.setAttribute('stroke', `url(#${strokeGradId})`);
  body.setAttribute('stroke-width', '2');
  body.setAttribute('filter', `${glowUrl} ${glassUrl}`);
  body.setAttribute('data-morph-target', 'true');
  innerG.appendChild(body);

  // ── 3. Ambient Occlusion overlay ───────────────────────────────────
  const aoId = `pod-ao-${entityId}`;
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
  ao.setAttribute('x', String(-hw));
  ao.setAttribute('y', String(-hh));
  ao.setAttribute('width', String(w));
  ao.setAttribute('height', String(h));
  ao.setAttribute('rx', String(rx));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── 4. Specular highlight (upper-left) ─────────────────────────────
  const specId = `pod-spec-${entityId}`;
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
  specular.setAttribute('cx', String(-hw * 0.25));
  specular.setAttribute('cy', String(-hh * 0.4));
  specular.setAttribute('rx', String(hw * 0.6));
  specular.setAttribute('ry', String(hh * 0.45));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Container cells (3 cells: 2 top, 1 centered bottom) ───────────
  const cellW = w * 0.35;
  const cellH = h * 0.3;
  const cellRx = 4;
  const cellPadX = w * 0.07;
  const cellPadY = h * 0.1;
  const cellFill = colorWithAlpha(color, '33');
  const cellStroke = colorWithAlpha(color, '80');

  // Cell positions: [cx, cy] relative to body center
  const cellPositions: [number, number][] = [
    [-cellW / 2 - cellPadX / 2, -cellH / 2 - cellPadY / 2],        // top-left
    [cellW / 2 + cellPadX / 2, -cellH / 2 - cellPadY / 2],          // top-right
    [0, cellH / 2 + cellPadY / 2],                                    // bottom-center
  ];

  const cellElements: SVGRectElement[] = [];
  const dotElements: SVGCircleElement[] = [];

  cellPositions.forEach(([cx, cy], i) => {
    const cell = document.createElementNS(SVG_NS, 'rect');
    cell.setAttribute('x', String(cx - cellW / 2));
    cell.setAttribute('y', String(cy - cellH / 2));
    cell.setAttribute('width', String(cellW));
    cell.setAttribute('height', String(cellH));
    cell.setAttribute('rx', String(cellRx));
    cell.setAttribute('fill', cellFill);
    cell.setAttribute('stroke', cellStroke);
    cell.setAttribute('stroke-width', '1.5');
    cell.classList.add(`pod-cell-${entityId}`);
    innerG.appendChild(cell);
    cellElements.push(cell);

    // Status dot (top-right corner of each cell)
    const dotR = 3;
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(cx + cellW / 2 - dotR - 3));
    dot.setAttribute('cy', String(cy - cellH / 2 + dotR + 3));
    dot.setAttribute('r', String(dotR));
    dot.setAttribute('fill', color);
    dot.setAttribute('filter', glowUrl);
    dot.classList.add(`pod-dot-${entityId}`);
    dot.style.animationDelay = `${i * 0.66}s`;
    innerG.appendChild(dot);
    dotElements.push(dot);
  });

  // ── 5. Micro-Life animations ───────────────────────────────────────
  const styleId = `pod-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes podFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes podDotPulse_${entityId} {
        0%, 100% { transform: scale(1); opacity: 0.85; }
        50% { transform: scale(1.5); opacity: 1; }
      }
      @keyframes podCellShimmer_${entityId} {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.02); }
      }
      .pod-float-${entityId} {
        animation: podFloat_${entityId} 4s ease-in-out infinite;
      }
      .pod-dot-${entityId} {
        transform-origin: center;
        animation: podDotPulse_${entityId} 2s ease-in-out infinite;
      }
      .pod-cell-${entityId} {
        transform-origin: center;
        animation: podCellShimmer_${entityId} 3s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }

  // Apply float to whole entity
  innerG.classList.add(`pod-float-${entityId}`);

  // Stagger cell shimmer
  cellElements.forEach((cell, i) => {
    cell.style.animationDelay = `${i * 0.8}s`;
  });

  // ── Label below ────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(hh + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('fill', cc.textPrimary);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
