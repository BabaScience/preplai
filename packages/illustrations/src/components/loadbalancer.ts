/**
 * @preplai/illustrations — LoadBalancer Component (Glassmorphic Depth)
 *
 * A crystalline traffic routing hub. Gradient hexagon with glow border,
 * flow visualization: entry dot → branching lines → two output nodes.
 * Use for: load balancers, traffic distribution, reverse proxies.
 *
 * Glassmorphic Depth: radial gradient fill, luminous glow border,
 * glowing entry dot, branching flow with output nodes.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderLoadBalancer(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const r = s * 0.45;

  const defs = ensureDefs(parentEl);

  // ── Gradient IDs (unique per instance) ──────────────────────────────
  const hexFillGradId = `lb-fill-${entityId}`;
  const hexBorderGradId = `lb-border-${entityId}`;
  const glowFilterId = `lb-glow-${entityId}`;
  const nodeGlowFilterId = `lb-nodeglow-${entityId}`;

  // Hexagon fill: radial gradient (slightly lit center → dark edges)
  if (!defs.querySelector(`#${hexFillGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', hexFillGradId);
    grad.setAttribute('cx', '50%'); grad.setAttribute('cy', '40%');
    grad.setAttribute('r', '55%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', color);
    s1.setAttribute('stop-opacity', '0.25');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', color);
    s2.setAttribute('stop-opacity', '0.06');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // Border gradient (luminous diagonal — bright top-left → dim bottom-right)
  if (!defs.querySelector(`#${hexBorderGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', hexBorderGradId);
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', colorWithAlpha(color, 'ee'));
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', colorWithAlpha(color, '44'));
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // Outer glow filter (for highlight ring)
  if (!defs.querySelector(`#${glowFilterId}`)) {
    const filter = document.createElementNS(SVG_NS, 'filter');
    filter.setAttribute('id', glowFilterId);
    filter.setAttribute('x', '-30%'); filter.setAttribute('y', '-30%');
    filter.setAttribute('width', '160%'); filter.setAttribute('height', '160%');
    const fds = document.createElementNS(SVG_NS, 'feDropShadow');
    fds.setAttribute('dx', '0'); fds.setAttribute('dy', '0');
    fds.setAttribute('stdDeviation', '5');
    fds.setAttribute('flood-color', color);
    fds.setAttribute('flood-opacity', '0.7');
    filter.appendChild(fds);
    defs.appendChild(filter);
  }

  // Node glow filter (for entry dot)
  if (!defs.querySelector(`#${nodeGlowFilterId}`)) {
    const filter = document.createElementNS(SVG_NS, 'filter');
    filter.setAttribute('id', nodeGlowFilterId);
    filter.setAttribute('x', '-100%'); filter.setAttribute('y', '-100%');
    filter.setAttribute('width', '300%'); filter.setAttribute('height', '300%');
    const fds = document.createElementNS(SVG_NS, 'feDropShadow');
    fds.setAttribute('dx', '0'); fds.setAttribute('dy', '0');
    fds.setAttribute('stdDeviation', '3');
    fds.setAttribute('flood-color', color);
    fds.setAttribute('flood-opacity', '1');
    filter.appendChild(fds);
    defs.appendChild(filter);
  }

  // ── Helper: hexagon points ───────────────────────────────────────────
  const hexPts = (radius: number) =>
    [0, 1, 2, 3, 4, 5]
      .map(i => {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        return `${(Math.cos(angle) * radius).toFixed(2)},${(Math.sin(angle) * radius).toFixed(2)}`;
      })
      .join(' ');

  // ── Highlight glow ring ──────────────────────────────────────────────
  if (entity.highlight) {
    const glowR = r + 5;
    const glowHex = document.createElementNS(SVG_NS, 'polygon');
    glowHex.setAttribute('points', hexPts(glowR));
    glowHex.setAttribute('stroke-width', String(STROKE.default));
    glowHex.setAttribute('stroke-dasharray', '4,4');
    glowHex.setAttribute('filter', `url(#${glowFilterId})`);
    applyGlowColors(glowHex, cc);
    innerG.appendChild(glowHex);
  }

  // ── Hexagon fill (radial gradient glass) ─────────────────────────────
  const hexFill = document.createElementNS(SVG_NS, 'polygon');
  hexFill.setAttribute('points', hexPts(r));
  hexFill.setAttribute('fill', `url(#${hexFillGradId})`);
  hexFill.setAttribute('stroke', 'none');
  innerG.appendChild(hexFill);

  // ── Hexagon border (gradient stroke — luminous edge) ─────────────────
  // SVG polygons can't use gradient stroke directly — use a path with paint-order trick
  // Instead: overlay a slightly inset stroke with gradient via linearGradient on a rect clip
  // Simplest: use two polygon borders (bright top-left half, dim bottom-right half)
  // Practical approach: use a single stroke with gradient via gradientUnits=userSpaceOnUse
  const hexBorder = document.createElementNS(SVG_NS, 'polygon');
  hexBorder.setAttribute('points', hexPts(r));
  hexBorder.setAttribute('fill', 'none');
  hexBorder.setAttribute('stroke', `url(#${hexBorderGradId})`);
  hexBorder.setAttribute('stroke-width', String(STROKE.emphasized));
  hexBorder.setAttribute('stroke-linejoin', 'round');
  innerG.appendChild(hexBorder);

  // Top highlight glint (arc across top of hexagon)
  const topPt = { x: 0, y: -r };
  const topLPt = { x: Math.cos(Math.PI * 2 / 3 - Math.PI / 6) * r, y: Math.sin(Math.PI * 2 / 3 - Math.PI / 6) * r };
  const topRPt = { x: Math.cos(-Math.PI / 6) * r, y: Math.sin(-Math.PI / 6) * r };
  const glint = document.createElementNS(SVG_NS, 'line');
  glint.setAttribute('x1', String(topLPt.x + (topPt.x - topLPt.x) * 0.3));
  glint.setAttribute('y1', String(topLPt.y + (topPt.y - topLPt.y) * 0.3 + 1));
  glint.setAttribute('x2', String(topRPt.x + (topPt.x - topRPt.x) * 0.3));
  glint.setAttribute('y2', String(topRPt.y + (topPt.y - topRPt.y) * 0.3 + 1));
  glint.setAttribute('stroke', 'rgba(255,255,255,0.15)');
  glint.setAttribute('stroke-width', '1.5');
  glint.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(glint);

  // ── Flow visualization: entry dot → 2 branch lines → 2 output nodes ──
  const iconH = r * 0.52;
  const entryY = -iconH * 0.8;
  const forkY = -iconH * 0.05;
  const exitY = iconH * 0.8;
  const spread = r * 0.32;
  const nodeR = 3.5;

  // Entry dot (glowing)
  const entryDot = document.createElementNS(SVG_NS, 'circle');
  entryDot.setAttribute('cx', '0');
  entryDot.setAttribute('cy', String(entryY));
  entryDot.setAttribute('r', String(nodeR + 1));
  entryDot.setAttribute('fill', color);
  entryDot.setAttribute('filter', `url(#${nodeGlowFilterId})`);
  innerG.appendChild(entryDot);

  // Entry line (top down to fork point)
  const lineIn = document.createElementNS(SVG_NS, 'line');
  lineIn.setAttribute('x1', '0');
  lineIn.setAttribute('y1', String(entryY + nodeR + 1));
  lineIn.setAttribute('x2', '0');
  lineIn.setAttribute('y2', String(forkY));
  lineIn.setAttribute('stroke', cc.stroke);
  lineIn.setAttribute('stroke-width', String(STROKE.emphasized));
  lineIn.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(lineIn);

  // Left branch
  const lineL = document.createElementNS(SVG_NS, 'line');
  lineL.setAttribute('x1', '0');
  lineL.setAttribute('y1', String(forkY));
  lineL.setAttribute('x2', String(-spread));
  lineL.setAttribute('y2', String(exitY - nodeR));
  lineL.setAttribute('stroke', cc.strokeSoft);
  lineL.setAttribute('stroke-width', String(STROKE.default));
  lineL.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(lineL);

  // Right branch
  const lineR = document.createElementNS(SVG_NS, 'line');
  lineR.setAttribute('x1', '0');
  lineR.setAttribute('y1', String(forkY));
  lineR.setAttribute('x2', String(spread));
  lineR.setAttribute('y2', String(exitY - nodeR));
  lineR.setAttribute('stroke', cc.strokeSoft);
  lineR.setAttribute('stroke-width', String(STROKE.default));
  lineR.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(lineR);

  // Left output node (dim)
  const nodeL = document.createElementNS(SVG_NS, 'circle');
  nodeL.setAttribute('cx', String(-spread));
  nodeL.setAttribute('cy', String(exitY));
  nodeL.setAttribute('r', String(nodeR));
  nodeL.setAttribute('fill', colorWithAlpha(color, '44'));
  nodeL.setAttribute('stroke', cc.strokeSoft);
  nodeL.setAttribute('stroke-width', '1');
  innerG.appendChild(nodeL);

  // Right output node (dim)
  const nodeREl = document.createElementNS(SVG_NS, 'circle');
  nodeREl.setAttribute('cx', String(spread));
  nodeREl.setAttribute('cy', String(exitY));
  nodeREl.setAttribute('r', String(nodeR));
  nodeREl.setAttribute('fill', colorWithAlpha(color, '44'));
  nodeREl.setAttribute('stroke', cc.strokeSoft);
  nodeREl.setAttribute('stroke-width', '1');
  innerG.appendChild(nodeREl);

  // ── Label below ──────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(r + LABEL_DEFAULTS.offsetBelow));
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
