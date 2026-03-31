/**
 * @preplai/illustrations — Cache Component (Glassmorphic Depth)
 *
 * An electric storage vessel. Brilliant glowing top cap, dark glass body,
 * gradient lightning bolt with electric glow — semantically distinct from Database.
 * Use for: caches, Redis, Memcached, fast storage layers.
 *
 * Glassmorphic Depth: glowing top cap (radial gradient), dark glass tube body,
 * gradient lightning bolt (white-to-color), glow filter on bolt and cap.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import { getCylinderLabelY } from '../cylinder-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderCache(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const rx = size / 2;
  const ry = size / 6;
  const topY = -size / 3;
  const bodyH = size * 0.55;
  const botY = topY + bodyH;

  const defs = ensureDefs(parentEl);

  // ── Gradient IDs (unique per instance) ──────────────────────────────
  const capGradId = `cache-cap-${entityId}`;
  const bodyGradId = `cache-body-${entityId}`;
  const boltGradId = `cache-bolt-${entityId}`;
  const glowFilterId = `cache-glow-${entityId}`;

  // Top cap radial gradient (white center → color → transparent edge)
  if (!defs.querySelector(`#${capGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', capGradId);
    grad.setAttribute('cx', '50%'); grad.setAttribute('cy', '50%');
    grad.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', '#ffffff');
    s1.setAttribute('stop-opacity', '0.9');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '40%');
    s2.setAttribute('stop-color', color);
    s2.setAttribute('stop-opacity', '0.85');
    const s3 = document.createElementNS(SVG_NS, 'stop');
    s3.setAttribute('offset', '100%');
    s3.setAttribute('stop-color', color);
    s3.setAttribute('stop-opacity', '0.4');
    grad.appendChild(s1); grad.appendChild(s2); grad.appendChild(s3);
    defs.appendChild(grad);
  }

  // Body linear gradient (dark glass tube: slightly lit top → very dark bottom)
  if (!defs.querySelector(`#${bodyGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', bodyGradId);
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '0%'); grad.setAttribute('y2', '100%');
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

  // Lightning bolt gradient (white top → color bottom — lit from above)
  if (!defs.querySelector(`#${boltGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', boltGradId);
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '0%'); grad.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', '#ffffff');
    s1.setAttribute('stop-opacity', '0.95');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', color);
    s2.setAttribute('stop-opacity', '1');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // Glow filter (for top cap and bolt — electric halo)
  if (!defs.querySelector(`#${glowFilterId}`)) {
    const filter = document.createElementNS(SVG_NS, 'filter');
    filter.setAttribute('id', glowFilterId);
    filter.setAttribute('x', '-50%'); filter.setAttribute('y', '-50%');
    filter.setAttribute('width', '200%'); filter.setAttribute('height', '200%');
    const fds = document.createElementNS(SVG_NS, 'feDropShadow');
    fds.setAttribute('dx', '0'); fds.setAttribute('dy', '0');
    fds.setAttribute('stdDeviation', '4');
    fds.setAttribute('flood-color', color);
    fds.setAttribute('flood-opacity', '0.9');
    filter.appendChild(fds);
    defs.appendChild(filter);
  }

  // ── Highlight glow ring ──────────────────────────────────────────────
  if (entity.highlight) {
    const hRx = rx + 3;
    const hRy = ry + 2;
    const hTopY = topY - 3;
    const hBotY = botY + 3;
    const glowPath = document.createElementNS(SVG_NS, 'path');
    glowPath.setAttribute('d', [
      `M ${-hRx} ${hTopY}`,
      `A ${hRx} ${hRy} 0 0 1 ${hRx} ${hTopY}`,
      `L ${hRx} ${hBotY}`,
      `A ${hRx} ${hRy} 0 0 1 ${-hRx} ${hBotY}`,
      'Z',
    ].join(' '));
    glowPath.setAttribute('stroke-width', String(STROKE.default));
    glowPath.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glowPath, cc);
    innerG.appendChild(glowPath);
  }

  // ── Cylinder body (dark glass tube) ─────────────────────────────────
  const bodyFill = document.createElementNS(SVG_NS, 'rect');
  bodyFill.setAttribute('x', String(-rx));
  bodyFill.setAttribute('y', String(topY));
  bodyFill.setAttribute('width', String(rx * 2));
  bodyFill.setAttribute('height', String(bodyH));
  bodyFill.setAttribute('fill', `url(#${bodyGradId})`);
  innerG.appendChild(bodyFill);

  // Vertical side lines
  for (const xSign of [-1, 1]) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(xSign * rx));
    line.setAttribute('y1', String(topY));
    line.setAttribute('x2', String(xSign * rx));
    line.setAttribute('y2', String(botY));
    line.setAttribute('stroke', cc.stroke);
    line.setAttribute('stroke-width', String(STROKE.default));
    innerG.appendChild(line);
  }

  // ── Bottom cap (dim, fading) ─────────────────────────────────────────
  const botEllipse = document.createElementNS(SVG_NS, 'ellipse');
  botEllipse.setAttribute('cx', '0');
  botEllipse.setAttribute('cy', String(botY));
  botEllipse.setAttribute('rx', String(rx));
  botEllipse.setAttribute('ry', String(ry));
  botEllipse.setAttribute('fill', `${color}10`);
  botEllipse.setAttribute('stroke', cc.strokeSoft);
  botEllipse.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(botEllipse);

  // ── Top cap (bright, glowing — under electrical load) ────────────────
  // Outer glow halo (behind cap)
  const capHalo = document.createElementNS(SVG_NS, 'ellipse');
  capHalo.setAttribute('cx', '0');
  capHalo.setAttribute('cy', String(topY));
  capHalo.setAttribute('rx', String(rx + 4));
  capHalo.setAttribute('ry', String(ry + 3));
  capHalo.setAttribute('fill', `${color}22`);
  capHalo.setAttribute('filter', `url(#${glowFilterId})`);
  innerG.appendChild(capHalo);

  // Cap fill (radial gradient — bright center)
  const capFill = document.createElementNS(SVG_NS, 'ellipse');
  capFill.setAttribute('cx', '0');
  capFill.setAttribute('cy', String(topY));
  capFill.setAttribute('rx', String(rx));
  capFill.setAttribute('ry', String(ry));
  capFill.setAttribute('fill', `url(#${capGradId})`);
  innerG.appendChild(capFill);

  // Cap ring stroke (bright, emphasized)
  const capRing = document.createElementNS(SVG_NS, 'ellipse');
  capRing.setAttribute('cx', '0');
  capRing.setAttribute('cy', String(topY));
  capRing.setAttribute('rx', String(rx));
  capRing.setAttribute('ry', String(ry));
  capRing.setAttribute('fill', 'none');
  capRing.setAttribute('stroke', cc.stroke);
  capRing.setAttribute('stroke-width', String(STROKE.emphasized));
  innerG.appendChild(capRing);

  // ── Lightning bolt (gradient fill, glow — centered in body) ──────────
  const boltCY = topY + bodyH * 0.5;
  const bs = rx * 0.38;

  const boltD = [
    `M ${-bs * 0.12} ${boltCY - bs}`,
    `L ${bs * 0.42} ${boltCY - bs * 0.08}`,
    `L ${bs * 0.02} ${boltCY - bs * 0.08}`,
    `L ${bs * 0.12} ${boltCY + bs}`,
    `L ${-bs * 0.42} ${boltCY + bs * 0.08}`,
    `L ${-bs * 0.02} ${boltCY + bs * 0.08}`,
    'Z',
  ].join(' ');

  // Glow halo behind bolt
  const boltHalo = document.createElementNS(SVG_NS, 'path');
  boltHalo.setAttribute('d', boltD);
  boltHalo.setAttribute('fill', `${color}55`);
  boltHalo.setAttribute('filter', `url(#${glowFilterId})`);
  innerG.appendChild(boltHalo);

  // Bolt with gradient fill
  const bolt = document.createElementNS(SVG_NS, 'path');
  bolt.setAttribute('d', boltD);
  bolt.setAttribute('fill', `url(#${boltGradId})`);
  innerG.appendChild(bolt);

  // ── Label below ──────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(getCylinderLabelY(size)));
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
