/**
 * @preplai/illustrations — User Component
 *
 * Minimalist user icon: circle with person silhouette + gradient ring.
 * Clean, geometric style matching the Composable engine aesthetic.
 *
 * Visual depth: radial halo, outer gradient ring, glow on circle.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getStrokeWidth,
  getLabelFontSize,
  TYPOGRAPHY,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlowFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderUser(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity) * 0.9;
  const scale = s / 50;
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const strokeW = getStrokeWidth('default', scale);
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const r = s * 0.48;

  const defs = ensureDefs(parentEl);

  // ── Radial depth halo ────────────────────────────────────────────────
  const haloId = `usr-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', haloId);
    grad.setAttribute('cx', '50%'); grad.setAttribute('cy', '50%');
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
  halo.setAttribute('cx', '0');
  halo.setAttribute('cy', '0');
  halo.setAttribute('rx', String(r * 1.8));
  halo.setAttribute('ry', String(r * 1.8));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // Highlight glow
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'circle');
    glow.setAttribute('cx', '0');
    glow.setAttribute('cy', '0');
    glow.setAttribute('r', String(r + 4));
    glow.setAttribute('stroke-width', String(strokeW));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Outer gradient ring (premium "selected" feel) ─────────────────────
  const ringGradId = `userRing_${entityId}`;
  if (!defs.querySelector(`#${ringGradId}`)) {
    const ringGrad = document.createElementNS(SVG_NS, 'linearGradient');
    ringGrad.setAttribute('id', ringGradId);
    ringGrad.setAttribute('gradientTransform', 'rotate(135)');
    const rs1 = document.createElementNS(SVG_NS, 'stop');
    rs1.setAttribute('offset', '0%');
    rs1.setAttribute('stop-color', color);
    rs1.setAttribute('stop-opacity', '0.8');
    const rs2 = document.createElementNS(SVG_NS, 'stop');
    rs2.setAttribute('offset', '100%');
    rs2.setAttribute('stop-color', color);
    rs2.setAttribute('stop-opacity', '0.2');
    ringGrad.appendChild(rs1); ringGrad.appendChild(rs2);
    defs.appendChild(ringGrad);
  }

  const outerRing = document.createElementNS(SVG_NS, 'circle');
  outerRing.setAttribute('cx', '0');
  outerRing.setAttribute('cy', '0');
  outerRing.setAttribute('r', String(r * 1.12));
  outerRing.setAttribute('fill', 'none');
  outerRing.setAttribute('stroke', `url(#${ringGradId})`);
  outerRing.setAttribute('stroke-width', '1.5');
  outerRing.setAttribute('stroke-dasharray', '4 4');
  innerG.appendChild(outerRing);

  // Secondary inner ring
  const innerRing = document.createElementNS(SVG_NS, 'circle');
  innerRing.setAttribute('cx', '0');
  innerRing.setAttribute('cy', '0');
  innerRing.setAttribute('r', String(r * 1.04));
  innerRing.setAttribute('fill', 'none');
  innerRing.setAttribute('stroke', cc.strokeMuted);
  innerRing.setAttribute('stroke-width', '1');
  innerG.appendChild(innerRing);

  // Main circle with outer glow
  const glowUrl = ensureGlowFilter(parentEl, color);
  const circle = document.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('cx', '0');
  circle.setAttribute('cy', '0');
  circle.setAttribute('r', String(r));
  circle.setAttribute('fill', cc.fill);
  circle.setAttribute('stroke', cc.stroke);
  circle.setAttribute('stroke-width', String(strokeW));
  circle.setAttribute('filter', glowUrl);
  innerG.appendChild(circle);

  // Person icon (head circle + shoulders arc)
  const iconScale = r * 0.45;

  const head = document.createElementNS(SVG_NS, 'circle');
  head.setAttribute('cx', '0');
  head.setAttribute('cy', String(-iconScale * 0.45));
  head.setAttribute('r', String(iconScale * 0.38));
  head.setAttribute('fill', 'none');
  head.setAttribute('stroke', cc.stroke);
  head.setAttribute('stroke-width', String(Math.max(1.5, 2 / (iconScale / 12))));
  head.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(head);

  const bodyPath = document.createElementNS(SVG_NS, 'path');
  const bw = iconScale * 0.85;
  const by = iconScale * 0.2;
  bodyPath.setAttribute('d', `M ${-bw} ${by + iconScale * 0.55} A ${bw} ${bw * 0.8} 0 0 1 ${bw} ${by + iconScale * 0.55}`);
  bodyPath.setAttribute('fill', 'none');
  bodyPath.setAttribute('stroke', cc.stroke);
  bodyPath.setAttribute('stroke-width', String(Math.max(1.5, 2 / (iconScale / 12))));
  bodyPath.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(bodyPath);

  // Label below
  if (entity.label) {
    const labelY = r + LABEL_DEFAULTS.offsetBelow;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(labelY));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', cc.textPrimary);
    text.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
