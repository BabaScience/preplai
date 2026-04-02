/**
 * @preplai/illustrations — PullRequest Component (Cinematic 5-Pillar)
 *
 * Two branch lines merging with a curved arrow. Source node (left) and
 * destination node (right) connected by a cinematic merge arc with arrowhead.
 * Glassmorphic depth, directional lighting halo, ground shadow, glow filter.
 *
 * Micro-Life: Float 4s. Merge arrow translateX shimmer 2.5s.
 * Nodes scale pulse 1→1.3 staggered 2s.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlassFilter, ensureGlowFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderPullRequest(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const defs = ensureDefs(parentEl);
  const glassUrl = ensureGlassFilter(parentEl);
  const glowUrl = ensureGlowFilter(parentEl, color, `pr-glow-${entityId}`);

  // ── Dimensions ──────────────────────────────────────────────────────
  const nodeR = size * 0.12;
  const spacing = size * 0.55;         // horizontal distance between nodes
  const lineH = size * 0.35;           // vertical branch line half-height
  const srcX = -spacing;
  const destX = spacing;
  const nodeY = 0;

  // ── 1. Directional lighting halo ────────────────────────────────────
  const haloId = `pr-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const haloGrad = document.createElementNS(SVG_NS, 'radialGradient');
    haloGrad.setAttribute('id', haloId);
    haloGrad.setAttribute('cx', '38%');
    haloGrad.setAttribute('cy', '38%');
    haloGrad.setAttribute('r', '50%');
    const hs1 = document.createElementNS(SVG_NS, 'stop');
    hs1.setAttribute('offset', '0%');
    hs1.setAttribute('stop-color', color);
    hs1.setAttribute('stop-opacity', '0.13');
    const hs2 = document.createElementNS(SVG_NS, 'stop');
    hs2.setAttribute('offset', '100%');
    hs2.setAttribute('stop-color', color);
    hs2.setAttribute('stop-opacity', '0');
    haloGrad.appendChild(hs1);
    haloGrad.appendChild(hs2);
    defs.appendChild(haloGrad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', '0');
  halo.setAttribute('cy', String(-size * 0.05));
  halo.setAttribute('rx', String(size * 0.9));
  halo.setAttribute('ry', String(size * 0.6));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── 2. Ground contact shadow ────────────────────────────────────────
  const gsId = `pr-gshadow-${entityId}`;
  if (!defs.querySelector(`#${gsId}`)) {
    const gsg = document.createElementNS(SVG_NS, 'radialGradient');
    gsg.setAttribute('id', gsId);
    gsg.setAttribute('cx', '50%');
    gsg.setAttribute('cy', '50%');
    gsg.setAttribute('r', '50%');
    const gs1 = document.createElementNS(SVG_NS, 'stop');
    gs1.setAttribute('offset', '0%');
    gs1.setAttribute('stop-color', '#000000');
    gs1.setAttribute('stop-opacity', '0.18');
    const gs2 = document.createElementNS(SVG_NS, 'stop');
    gs2.setAttribute('offset', '100%');
    gs2.setAttribute('stop-color', '#000000');
    gs2.setAttribute('stop-opacity', '0');
    gsg.appendChild(gs1);
    gsg.appendChild(gs2);
    defs.appendChild(gsg);
  }
  const groundShadow = document.createElementNS(SVG_NS, 'ellipse');
  groundShadow.setAttribute('cx', '0');
  groundShadow.setAttribute('cy', String(lineH + nodeR + size * 0.08));
  groundShadow.setAttribute('rx', String(spacing * 1.2));
  groundShadow.setAttribute('ry', String(size * 0.06));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── 3. Highlight glow ring ──────────────────────────────────────────
  if (entity.highlight) {
    const glowRing = document.createElementNS(SVG_NS, 'ellipse');
    glowRing.setAttribute('cx', '0');
    glowRing.setAttribute('cy', '0');
    glowRing.setAttribute('rx', String(spacing + nodeR + 6));
    glowRing.setAttribute('ry', String(lineH + nodeR + 6));
    glowRing.setAttribute('fill', 'none');
    glowRing.setAttribute('stroke-width', String(STROKE.default));
    glowRing.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glowRing, cc);
    innerG.appendChild(glowRing);
  }

  // ── 4. Source branch line (left, vertical) ──────────────────────────
  const srcLineGradId = `pr-srcline-${entityId}`;
  if (!defs.querySelector(`#${srcLineGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', srcLineGradId);
    grad.setAttribute('x1', '0%');
    grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '0%');
    grad.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', color);
    s1.setAttribute('stop-opacity', '0.15');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', color);
    s2.setAttribute('stop-opacity', '0.5');
    grad.appendChild(s1);
    grad.appendChild(s2);
    defs.appendChild(grad);
  }
  const srcLine = document.createElementNS(SVG_NS, 'line');
  srcLine.setAttribute('x1', String(srcX));
  srcLine.setAttribute('y1', String(-lineH));
  srcLine.setAttribute('x2', String(srcX));
  srcLine.setAttribute('y2', String(lineH));
  srcLine.setAttribute('stroke', `url(#${srcLineGradId})`);
  srcLine.setAttribute('stroke-width', String(STROKE.emphasized));
  srcLine.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(srcLine);

  // ── 5. Dest branch line (right, vertical) ───────────────────────────
  const destLineGradId = `pr-destline-${entityId}`;
  if (!defs.querySelector(`#${destLineGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', destLineGradId);
    grad.setAttribute('x1', '0%');
    grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '0%');
    grad.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', color);
    s1.setAttribute('stop-opacity', '0.2');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', color);
    s2.setAttribute('stop-opacity', '0.6');
    grad.appendChild(s1);
    grad.appendChild(s2);
    defs.appendChild(grad);
  }
  const destLine = document.createElementNS(SVG_NS, 'line');
  destLine.setAttribute('x1', String(destX));
  destLine.setAttribute('y1', String(-lineH));
  destLine.setAttribute('x2', String(destX));
  destLine.setAttribute('y2', String(lineH));
  destLine.setAttribute('stroke', `url(#${destLineGradId})`);
  destLine.setAttribute('stroke-width', String(STROKE.emphasized));
  destLine.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(destLine);

  // ── 6. Merge arrow (curved path from source to dest) ────────────────
  const arrowGradId = `pr-arrow-${entityId}`;
  if (!defs.querySelector(`#${arrowGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', arrowGradId);
    grad.setAttribute('x1', '0%');
    grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%');
    grad.setAttribute('y2', '0%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', color);
    s1.setAttribute('stop-opacity', '0.5');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', color);
    s2.setAttribute('stop-opacity', '0.85');
    grad.appendChild(s1);
    grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // Arrowhead marker
  const markerId = `pr-arrowhead-${entityId}`;
  if (!defs.querySelector(`#${markerId}`)) {
    const marker = document.createElementNS(SVG_NS, 'marker');
    marker.setAttribute('id', markerId);
    marker.setAttribute('viewBox', '0 0 10 10');
    marker.setAttribute('refX', '8');
    marker.setAttribute('refY', '5');
    marker.setAttribute('markerWidth', '6');
    marker.setAttribute('markerHeight', '6');
    marker.setAttribute('orient', 'auto-start-reverse');
    const arrowPath = document.createElementNS(SVG_NS, 'path');
    arrowPath.setAttribute('d', 'M 0 0 L 10 5 L 0 10 Z');
    arrowPath.setAttribute('fill', color);
    arrowPath.setAttribute('opacity', '0.85');
    marker.appendChild(arrowPath);
    defs.appendChild(marker);
  }

  // Curved merge path
  const cpYOffset = -size * 0.25;
  const mergeArrowD = `M ${srcX} ${nodeY} C ${srcX + spacing * 0.5} ${cpYOffset}, ${destX - spacing * 0.5} ${cpYOffset}, ${destX - nodeR * 1.5} ${nodeY}`;
  const mergeArrow = document.createElementNS(SVG_NS, 'path');
  mergeArrow.setAttribute('d', mergeArrowD);
  mergeArrow.setAttribute('fill', 'none');
  mergeArrow.setAttribute('stroke', `url(#${arrowGradId})`);
  mergeArrow.setAttribute('stroke-width', String(STROKE.emphasized));
  mergeArrow.setAttribute('stroke-linecap', 'round');
  mergeArrow.setAttribute('marker-end', `url(#${markerId})`);
  mergeArrow.setAttribute('filter', glowUrl);
  mergeArrow.classList.add(`pr-arrow-shimmer-${entityId}`);
  innerG.appendChild(mergeArrow);

  // ── 7. Source node (circle, glass, color at 0.5) ────────────────────
  // Ambient occlusion ring behind source node
  const srcAO = document.createElementNS(SVG_NS, 'circle');
  srcAO.setAttribute('cx', String(srcX));
  srcAO.setAttribute('cy', String(nodeY));
  srcAO.setAttribute('r', String(nodeR + 3));
  srcAO.setAttribute('fill', colorWithAlpha(color, '0.08'));
  innerG.appendChild(srcAO);

  const srcNode = document.createElementNS(SVG_NS, 'circle');
  srcNode.setAttribute('cx', String(srcX));
  srcNode.setAttribute('cy', String(nodeY));
  srcNode.setAttribute('r', String(nodeR));
  srcNode.setAttribute('fill', colorWithAlpha(color, '0.5'));
  srcNode.setAttribute('stroke', cc.stroke);
  srcNode.setAttribute('stroke-width', String(STROKE.default));
  srcNode.setAttribute('filter', glassUrl);
  srcNode.classList.add(`pr-pulse-src-${entityId}`);
  innerG.appendChild(srcNode);

  // Specular highlight on source node
  const srcSpec = document.createElementNS(SVG_NS, 'circle');
  srcSpec.setAttribute('cx', String(srcX - nodeR * 0.25));
  srcSpec.setAttribute('cy', String(nodeY - nodeR * 0.25));
  srcSpec.setAttribute('r', String(nodeR * 0.35));
  srcSpec.setAttribute('fill', 'rgba(255,255,255,0.18)');
  srcSpec.setAttribute('pointer-events', 'none');
  innerG.appendChild(srcSpec);

  // ── 8. Dest node (circle, solid with glow) ──────────────────────────
  // Glow halo behind dest node
  const destGlow = document.createElementNS(SVG_NS, 'circle');
  destGlow.setAttribute('cx', String(destX));
  destGlow.setAttribute('cy', String(nodeY));
  destGlow.setAttribute('r', String(nodeR + 5));
  destGlow.setAttribute('fill', colorWithAlpha(color, '0.15'));
  destGlow.setAttribute('filter', glowUrl);
  innerG.appendChild(destGlow);

  const destNode = document.createElementNS(SVG_NS, 'circle');
  destNode.setAttribute('cx', String(destX));
  destNode.setAttribute('cy', String(nodeY));
  destNode.setAttribute('r', String(nodeR));
  destNode.setAttribute('fill', color);
  destNode.setAttribute('stroke', cc.stroke);
  destNode.setAttribute('stroke-width', String(STROKE.default));
  destNode.setAttribute('filter', glowUrl);
  destNode.classList.add(`pr-pulse-dest-${entityId}`);
  innerG.appendChild(destNode);

  // Luminous center dot on dest node
  const destDotGradId = `pr-destdot-${entityId}`;
  if (!defs.querySelector(`#${destDotGradId}`)) {
    const dotGrad = document.createElementNS(SVG_NS, 'radialGradient');
    dotGrad.setAttribute('id', destDotGradId);
    [['0%', '#ffffff', '0.95'], ['60%', color, '0.7'], ['100%', color, '0']].forEach(([off, col, op]) => {
      const st = document.createElementNS(SVG_NS, 'stop');
      st.setAttribute('offset', off);
      st.setAttribute('stop-color', col);
      st.setAttribute('stop-opacity', op);
      dotGrad.appendChild(st);
    });
    defs.appendChild(dotGrad);
  }
  const destDot = document.createElementNS(SVG_NS, 'circle');
  destDot.setAttribute('cx', String(destX));
  destDot.setAttribute('cy', String(nodeY));
  destDot.setAttribute('r', String(nodeR * 0.4));
  destDot.setAttribute('fill', `url(#${destDotGradId})`);
  destDot.setAttribute('pointer-events', 'none');
  innerG.appendChild(destDot);

  // Specular highlight on dest node
  const destSpec = document.createElementNS(SVG_NS, 'circle');
  destSpec.setAttribute('cx', String(destX - nodeR * 0.25));
  destSpec.setAttribute('cy', String(nodeY - nodeR * 0.25));
  destSpec.setAttribute('r', String(nodeR * 0.35));
  destSpec.setAttribute('fill', 'rgba(255,255,255,0.22)');
  destSpec.setAttribute('pointer-events', 'none');
  innerG.appendChild(destSpec);

  // ── 9. Micro-Life animations ────────────────────────────────────────
  const styleId = `pr-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes prFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      @keyframes prArrowShimmer_${entityId} {
        0%, 100% { transform: translateX(0); opacity: 0.7; }
        50% { transform: translateX(2px); opacity: 1; }
      }
      @keyframes prPulseSrc_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.03); }
      }
      @keyframes prPulseDest_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.03); }
      }
      .pr-float-${entityId} {
        animation: prFloat_${entityId} 4s ease-in-out infinite;
      }
      .pr-arrow-shimmer-${entityId} {
        animation: prArrowShimmer_${entityId} 2.5s ease-in-out infinite;
        transform-origin: center;
      }
      .pr-pulse-src-${entityId} {
        animation: prPulseSrc_${entityId} 2s ease-in-out infinite;
        transform-origin: ${srcX}px ${nodeY}px;
      }
      .pr-pulse-dest-${entityId} {
        animation: prPulseDest_${entityId} 2s ease-in-out infinite 0.5s;
        transform-origin: ${destX}px ${nodeY}px;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`pr-float-${entityId}`);

  // ── 10. Label below ─────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(lineH + nodeR + size * 0.22));
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
