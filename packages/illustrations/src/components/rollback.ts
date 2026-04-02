/**
 * @preplai/illustrations — Rollback Component (Glassmorphic Depth)
 *
 * Rounded rectangle with circular undo arc arrow.
 * Use for: rollbacks, reverts, undo operations, version downgrades.
 *
 * 5-Pillar Cinematic Treatment:
 *  1. Radial depth halo — atmospheric glow behind entity
 *  2. Ground contact shadow — anchors entity to the scene
 *  3. Ambient occlusion — darkened inner corners for depth
 *  4. Glass + Glow filters — materiality on body
 *  5. Micro-Life animations — float, arc pulse, dot breathe
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlassFilter, ensureGlowFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderRollback(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const bw = s * 0.85;
  const bh = s * 0.7;
  const hw = bw / 2;
  const hh = bh / 2;
  const rx = 8;

  const defs = ensureDefs(parentEl);

  // ── 1. Radial depth halo ────────────────────────────────────────────
  const haloId = `rb-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', haloId);
    grad.setAttribute('cx', '38%'); grad.setAttribute('cy', '38%');
    grad.setAttribute('r', '50%');
    const hs1 = document.createElementNS(SVG_NS, 'stop');
    hs1.setAttribute('offset', '0%');
    hs1.setAttribute('stop-color', color);
    hs1.setAttribute('stop-opacity', '0.13');
    const hs2 = document.createElementNS(SVG_NS, 'stop');
    hs2.setAttribute('offset', '100%');
    hs2.setAttribute('stop-color', color);
    hs2.setAttribute('stop-opacity', '0');
    grad.appendChild(hs1); grad.appendChild(hs2);
    defs.appendChild(grad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', String(-hw * 0.15));
  halo.setAttribute('cy', String(-hh * 0.05));
  halo.setAttribute('rx', String(hw * 1.8));
  halo.setAttribute('ry', String(hh * 1.5));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── 2. Ground contact shadow ────────────────────────────────────────
  const gsId = `rb-gshadow-${entityId}`;
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
  groundShadow.setAttribute('rx', String(hw * 0.9));
  groundShadow.setAttribute('ry', String(hh * 0.2));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── 3. Ambient occlusion ────────────────────────────────────────────
  const aoId = `rb-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const aoGrad = document.createElementNS(SVG_NS, 'radialGradient');
    aoGrad.setAttribute('id', aoId);
    aoGrad.setAttribute('cx', '70%'); aoGrad.setAttribute('cy', '75%'); aoGrad.setAttribute('r', '60%');
    const ao1 = document.createElementNS(SVG_NS, 'stop');
    ao1.setAttribute('offset', '0%'); ao1.setAttribute('stop-color', '#000000'); ao1.setAttribute('stop-opacity', '0.12');
    const ao2 = document.createElementNS(SVG_NS, 'stop');
    ao2.setAttribute('offset', '100%'); ao2.setAttribute('stop-color', '#000000'); ao2.setAttribute('stop-opacity', '0');
    aoGrad.appendChild(ao1); aoGrad.appendChild(ao2);
    defs.appendChild(aoGrad);
  }
  const ao = document.createElementNS(SVG_NS, 'rect');
  ao.setAttribute('x', String(-hw));
  ao.setAttribute('y', String(-hh));
  ao.setAttribute('width', String(bw));
  ao.setAttribute('height', String(bh));
  ao.setAttribute('rx', String(rx));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Gradient IDs ────────────────────────────────────────────────────
  const bodyRadialId = `rb-bodyrad-${entityId}`;
  const bodyStrokeId = `rb-bodystk-${entityId}`;

  // Radial fill for body (white-ish center → color edge)
  if (!defs.querySelector(`#${bodyRadialId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', bodyRadialId);
    grad.setAttribute('cx', '38%'); grad.setAttribute('cy', '35%');
    grad.setAttribute('r', '65%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', color);
    s1.setAttribute('stop-opacity', '0.22');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', color);
    s2.setAttribute('stop-opacity', '0.08');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // Linear stroke gradient (top bright → bottom dim)
  if (!defs.querySelector(`#${bodyStrokeId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', bodyStrokeId);
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '0%'); grad.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', color);
    s1.setAttribute('stop-opacity', '0.9');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', color);
    s2.setAttribute('stop-opacity', '0.35');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // ── Highlight glow ring ─────────────────────────────────────────────
  if (entity.highlight) {
    const glowRect = document.createElementNS(SVG_NS, 'rect');
    glowRect.setAttribute('x', String(-hw - 3));
    glowRect.setAttribute('y', String(-hh - 3));
    glowRect.setAttribute('width', String(bw + 6));
    glowRect.setAttribute('height', String(bh + 6));
    glowRect.setAttribute('rx', String(rx + 2));
    glowRect.setAttribute('stroke-width', String(STROKE.default));
    glowRect.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glowRect, cc);
    innerG.appendChild(glowRect);
  }

  // ── 4. Body rect with GlowFilter + GlassFilter ─────────────────────
  const glowUrl = ensureGlowFilter(parentEl, color);
  const glassUrl = ensureGlassFilter(parentEl);

  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x', String(-hw));
  body.setAttribute('y', String(-hh));
  body.setAttribute('width', String(bw));
  body.setAttribute('height', String(bh));
  body.setAttribute('rx', String(rx));
  body.setAttribute('fill', `url(#${bodyRadialId})`);
  body.setAttribute('stroke', `url(#${bodyStrokeId})`);
  body.setAttribute('stroke-width', String(STROKE.default));
  body.setAttribute('filter', `${glowUrl.replace('url(', '').replace(')', '')} ${glassUrl.replace('url(', '').replace(')', '')}`);
  body.setAttribute('data-morph-target', 'true');
  // Apply both filters via a wrapper approach — SVG only allows one filter attr,
  // so we use glow on body, glass on an overlay
  body.setAttribute('filter', glowUrl);
  innerG.appendChild(body);

  // Glass overlay on body
  const glassOverlay = document.createElementNS(SVG_NS, 'rect');
  glassOverlay.setAttribute('x', String(-hw));
  glassOverlay.setAttribute('y', String(-hh));
  glassOverlay.setAttribute('width', String(bw));
  glassOverlay.setAttribute('height', String(bh));
  glassOverlay.setAttribute('rx', String(rx));
  glassOverlay.setAttribute('fill', 'transparent');
  glassOverlay.setAttribute('filter', glassUrl);
  glassOverlay.setAttribute('pointer-events', 'none');
  innerG.appendChild(glassOverlay);

  // ── Undo arc arrow (counter-clockwise circular arrow) ───────────────
  const arcR = s * 0.18;
  const arcCx = 0;
  const arcCy = -hh * 0.1;

  // Arc path: ~270 degree counter-clockwise arc
  // Start at top-right, sweep counter-clockwise to bottom-right
  const startAngle = -40;
  const endAngle = 200;
  const startRad = (startAngle * Math.PI) / 180;
  const endRad = (endAngle * Math.PI) / 180;
  const x1 = arcCx + arcR * Math.cos(startRad);
  const y1 = arcCy + arcR * Math.sin(startRad);
  const x2 = arcCx + arcR * Math.cos(endRad);
  const y2 = arcCy + arcR * Math.sin(endRad);

  const arcD = `M ${x1} ${y1} A ${arcR} ${arcR} 0 1 0 ${x2} ${y2}`;

  const undoArc = document.createElementNS(SVG_NS, 'path');
  undoArc.setAttribute('d', arcD);
  undoArc.setAttribute('fill', 'none');
  undoArc.setAttribute('stroke', colorWithAlpha(color, '0.7'));
  undoArc.setAttribute('stroke-width', String(STROKE.emphasized));
  undoArc.setAttribute('stroke-linecap', 'round');
  undoArc.setAttribute('class', `rbArc_${entityId}`);
  innerG.appendChild(undoArc);

  // Arrowhead triangle at the arc endpoint
  const _arrowAngle = endRad + 0.3; // Slightly past end for tangent direction
  const arrowSize = s * 0.06;
  // Tangent direction at the end of the arc (counter-clockwise)
  const tx = -Math.sin(endRad);
  const ty = Math.cos(endRad);
  // Perpendicular
  const px = -ty;
  const py = tx;

  const tipX = x2 + tx * arrowSize * 0.5;
  const tipY = y2 + ty * arrowSize * 0.5;
  const baseX1 = x2 - tx * arrowSize + px * arrowSize * 0.6;
  const baseY1 = y2 - ty * arrowSize + py * arrowSize * 0.6;
  const baseX2 = x2 - tx * arrowSize - px * arrowSize * 0.6;
  const baseY2 = y2 - ty * arrowSize - py * arrowSize * 0.6;

  const arrowhead = document.createElementNS(SVG_NS, 'polygon');
  arrowhead.setAttribute('points', `${tipX},${tipY} ${baseX1},${baseY1} ${baseX2},${baseY2}`);
  arrowhead.setAttribute('fill', colorWithAlpha(color, '0.7'));
  arrowhead.setAttribute('class', `rbArc_${entityId}`);
  innerG.appendChild(arrowhead);

  // ── Status dot (bottom-right of body) ───────────────────────────────
  const dotCx = hw - s * 0.12;
  const dotCy = hh - s * 0.12;
  const dotR = s * 0.04;

  const dotGlowId = `rb-dotglow-${entityId}`;
  if (!defs.querySelector(`#${dotGlowId}`)) {
    const filter = document.createElementNS(SVG_NS, 'filter');
    filter.setAttribute('id', dotGlowId);
    filter.setAttribute('x', '-200%'); filter.setAttribute('y', '-200%');
    filter.setAttribute('width', '500%'); filter.setAttribute('height', '500%');
    const ds = document.createElementNS(SVG_NS, 'feDropShadow');
    ds.setAttribute('dx', '0'); ds.setAttribute('dy', '0');
    ds.setAttribute('stdDeviation', '2.5');
    ds.setAttribute('flood-color', color);
    ds.setAttribute('flood-opacity', '0.8');
    filter.appendChild(ds);
    defs.appendChild(filter);
  }

  const statusDot = document.createElementNS(SVG_NS, 'circle');
  statusDot.setAttribute('cx', String(dotCx));
  statusDot.setAttribute('cy', String(dotCy));
  statusDot.setAttribute('r', String(dotR));
  statusDot.setAttribute('fill', color);
  statusDot.setAttribute('filter', `url(#${dotGlowId})`);
  statusDot.setAttribute('class', `rbDot_${entityId}`);
  innerG.appendChild(statusDot);

  // ── Specular highlight (top-left) ───────────────────────────────────
  const specId = `rb-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    const specGrad = document.createElementNS(SVG_NS, 'radialGradient');
    specGrad.setAttribute('id', specId);
    specGrad.setAttribute('cx', '30%'); specGrad.setAttribute('cy', '25%'); specGrad.setAttribute('r', '50%');
    const sp1 = document.createElementNS(SVG_NS, 'stop');
    sp1.setAttribute('offset', '0%'); sp1.setAttribute('stop-color', '#ffffff'); sp1.setAttribute('stop-opacity', '0.14');
    const sp2 = document.createElementNS(SVG_NS, 'stop');
    sp2.setAttribute('offset', '100%'); sp2.setAttribute('stop-color', '#ffffff'); sp2.setAttribute('stop-opacity', '0');
    specGrad.appendChild(sp1); specGrad.appendChild(sp2);
    defs.appendChild(specGrad);
  }
  const specular = document.createElementNS(SVG_NS, 'rect');
  specular.setAttribute('x', String(-hw));
  specular.setAttribute('y', String(-hh));
  specular.setAttribute('width', String(bw));
  specular.setAttribute('height', String(bh * 0.5));
  specular.setAttribute('rx', String(rx));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── 5. Micro-Life animations ────────────────────────────────────────
  const styleId = `rb-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes rbFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes rbArcPulse_${entityId} {
        0%, 100% { opacity: 0.7; transform: rotate(0deg); }
        50% { opacity: 1; transform: rotate(-8deg); }
      }
      @keyframes rbDotBreathe_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.4); }
      }
      .rbFloat_${entityId} {
        animation: rbFloat_${entityId} 4s ease-in-out infinite;
      }
      .rbArc_${entityId} {
        animation: rbArcPulse_${entityId} 3s ease-in-out infinite;
        transform-origin: ${arcCx}px ${arcCy}px;
      }
      .rbDot_${entityId} {
        animation: rbDotBreathe_${entityId} 2s ease-in-out infinite;
        transform-origin: ${dotCx}px ${dotCy}px;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`rbFloat_${entityId}`);

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
