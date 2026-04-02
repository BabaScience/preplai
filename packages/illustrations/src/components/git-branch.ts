/**
 * @preplai/illustrations — GitBranch Component (Cinematic 5-Pillar)
 *
 * Vertical main trunk with diverging branch + commit nodes.
 * Line-based entity — no outer body rect.
 *
 * 5 Pillars:
 *   1. Directional lighting halo (upper-left radial glow)
 *   2. Ground contact shadow (ellipse below)
 *   3. Glassmorphic depth (glass filter on node halos)
 *   4. Glow filter on commit nodes
 *   5. Micro-Life animations (float, node twinkle, branch pulse)
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlassFilter, ensureGlowFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderGitBranch(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const defs = ensureDefs(parentEl);

  // ── Geometry ────────────────────────────────────────────────────────
  const trunkH = s * 0.7;
  const trunkTop = -trunkH / 2;
  const trunkBot = trunkH / 2;
  const trunkMidY = 0;
  const nodeR = s * 0.04;

  // Trunk commit positions (top, mid, bottom)
  const trunkNodes = [
    { x: 0, y: trunkTop },
    { x: 0, y: trunkMidY },
    { x: 0, y: trunkBot },
  ];

  // Branch diverges from trunk midpoint to upper-right
  const branchEndX = s * 0.25;
  const branchEndY = trunkTop + trunkH * 0.15;

  // ── 1. Directional lighting halo ───────────────────────────────────
  const haloId = `gitbr-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const haloGrad = document.createElementNS(SVG_NS, 'radialGradient');
    haloGrad.setAttribute('id', haloId);
    haloGrad.setAttribute('cx', '35%');
    haloGrad.setAttribute('cy', '30%');
    haloGrad.setAttribute('r', '55%');
    const hs1 = document.createElementNS(SVG_NS, 'stop');
    hs1.setAttribute('offset', '0%');
    hs1.setAttribute('stop-color', color);
    hs1.setAttribute('stop-opacity', '0.14');
    const hs2 = document.createElementNS(SVG_NS, 'stop');
    hs2.setAttribute('offset', '100%');
    hs2.setAttribute('stop-color', color);
    hs2.setAttribute('stop-opacity', '0');
    haloGrad.appendChild(hs1);
    haloGrad.appendChild(hs2);
    defs.appendChild(haloGrad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', String(-s * 0.05));
  halo.setAttribute('cy', String(-s * 0.05));
  halo.setAttribute('rx', String(s * 0.5));
  halo.setAttribute('ry', String(s * 0.45));
  halo.setAttribute('fill', `url(#${haloId})`);
  halo.setAttribute('pointer-events', 'none');
  innerG.appendChild(halo);

  // ── 2. Ground contact shadow ───────────────────────────────────────
  const gsId = `gitbr-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(trunkBot + s * 0.06));
  groundShadow.setAttribute('rx', String(s * 0.22));
  groundShadow.setAttribute('ry', String(s * 0.04));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  groundShadow.setAttribute('pointer-events', 'none');
  innerG.appendChild(groundShadow);

  // ── 3. Glow filter for commit nodes ────────────────────────────────
  const glowId = `gitbr-glow-${entityId}`;
  ensureGlowFilter(parentEl, color, glowId);

  // ── 4. Glass filter (for node halo shimmer) ────────────────────────
  const glassUrl = ensureGlassFilter(parentEl);

  // ── Highlight glow ring ────────────────────────────────────────────
  if (entity.highlight) {
    const hlEllipse = document.createElementNS(SVG_NS, 'ellipse');
    hlEllipse.setAttribute('cx', String(s * 0.06));
    hlEllipse.setAttribute('cy', '0');
    hlEllipse.setAttribute('rx', String(s * 0.4));
    hlEllipse.setAttribute('ry', String(trunkH * 0.55));
    hlEllipse.setAttribute('fill', 'none');
    hlEllipse.setAttribute('stroke-width', String(STROKE.default));
    hlEllipse.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(hlEllipse, cc);
    innerG.appendChild(hlEllipse);
  }

  // ── Main trunk line ────────────────────────────────────────────────
  const trunk = document.createElementNS(SVG_NS, 'line');
  trunk.setAttribute('x1', '0');
  trunk.setAttribute('y1', String(trunkTop));
  trunk.setAttribute('x2', '0');
  trunk.setAttribute('y2', String(trunkBot));
  trunk.setAttribute('stroke', colorWithAlpha(color, '0.6'));
  trunk.setAttribute('stroke-width', '2');
  trunk.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(trunk);

  // ── Branch line (diagonal from midpoint) ───────────────────────────
  const branchLine = document.createElementNS(SVG_NS, 'line');
  branchLine.setAttribute('x1', '0');
  branchLine.setAttribute('y1', String(trunkMidY));
  branchLine.setAttribute('x2', String(branchEndX));
  branchLine.setAttribute('y2', String(branchEndY));
  branchLine.setAttribute('stroke', colorWithAlpha(color, '0.4'));
  branchLine.setAttribute('stroke-width', '1.5');
  branchLine.setAttribute('stroke-linecap', 'round');
  branchLine.classList.add(`gitbr-branch-${entityId}`);
  innerG.appendChild(branchLine);

  // ── Commit nodes on trunk (3 nodes with glow) ─────────────────────
  trunkNodes.forEach((pos, i) => {
    // Glow halo behind each node
    const nodeHalo = document.createElementNS(SVG_NS, 'circle');
    nodeHalo.setAttribute('cx', String(pos.x));
    nodeHalo.setAttribute('cy', String(pos.y));
    nodeHalo.setAttribute('r', String(nodeR * 3));
    nodeHalo.setAttribute('fill', colorWithAlpha(color, '0.12'));
    nodeHalo.setAttribute('filter', `url(#${glowId})`);
    nodeHalo.setAttribute('pointer-events', 'none');
    innerG.appendChild(nodeHalo);

    // Solid commit node
    const node = document.createElementNS(SVG_NS, 'circle');
    node.setAttribute('cx', String(pos.x));
    node.setAttribute('cy', String(pos.y));
    node.setAttribute('r', String(nodeR));
    node.setAttribute('fill', color);
    node.setAttribute('filter', `url(#${glowId})`);
    node.classList.add(`gitbr-node-${entityId}`);
    node.style.animationDelay = `${i * 0.6}s`;
    innerG.appendChild(node);
  });

  // ── Branch tip node (lighter fill) ─────────────────────────────────
  const branchHalo = document.createElementNS(SVG_NS, 'circle');
  branchHalo.setAttribute('cx', String(branchEndX));
  branchHalo.setAttribute('cy', String(branchEndY));
  branchHalo.setAttribute('r', String(nodeR * 2.5));
  branchHalo.setAttribute('fill', colorWithAlpha(color, '0.10'));
  branchHalo.setAttribute('filter', glassUrl);
  branchHalo.setAttribute('pointer-events', 'none');
  innerG.appendChild(branchHalo);

  const branchNode = document.createElementNS(SVG_NS, 'circle');
  branchNode.setAttribute('cx', String(branchEndX));
  branchNode.setAttribute('cy', String(branchEndY));
  branchNode.setAttribute('r', String(nodeR));
  branchNode.setAttribute('fill', colorWithAlpha(color, '0.7'));
  branchNode.setAttribute('filter', `url(#${glowId})`);
  branchNode.classList.add(`gitbr-node-${entityId}`);
  branchNode.style.animationDelay = '1.8s';
  innerG.appendChild(branchNode);

  // ── 5. Micro-Life animations ───────────────────────────────────────
  const styleId = `gitbr-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes gitbrFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes gitbrTwinkle_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.4); }
      }
      @keyframes gitbrBranchPulse_${entityId} {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 0.7; }
      }
      .gitbr-float-${entityId} {
        animation: gitbrFloat_${entityId} 3.5s ease-in-out infinite;
      }
      .gitbr-node-${entityId} {
        animation: gitbrTwinkle_${entityId} 2s ease-in-out infinite;
        transform-origin: center;
        transform-box: fill-box;
      }
      .gitbr-branch-${entityId} {
        animation: gitbrBranchPulse_${entityId} 3s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`gitbr-float-${entityId}`);

  // ── Label below ────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(trunkBot + s * 0.18));
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
