/**
 * @preplai/illustrations — Service Component
 *
 * Glassmorphic hexagon with glowing gear center.
 * Use for: microservices, service endpoints, APIs.
 *
 * Visual depth: radial halo, outer glow, glowing gear center, block ticks.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';
import { resolveColorCascade, applyShapeColors, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlowFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderService(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const r = s * 0.45;

  const defs = ensureDefs(parentEl);

  // ── Radial depth halo ────────────────────────────────────────────────
  const haloId = `svc-halo-${entityId}`;
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
    const glowR = r + 4;
    const glowPoints = [0, 1, 2, 3, 4, 5]
      .map(i => {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        return `${(Math.cos(angle) * glowR).toFixed(1)},${(Math.sin(angle) * glowR).toFixed(1)}`;
      })
      .join(' ');
    const glow = document.createElementNS(SVG_NS, 'polygon');
    glow.setAttribute('points', glowPoints);
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // Hexagon shape with outer glow
  const glowUrl = ensureGlowFilter(parentEl, color);
  const hexPoints = [0, 1, 2, 3, 4, 5]
    .map(i => {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      return `${(Math.cos(angle) * r).toFixed(1)},${(Math.sin(angle) * r).toFixed(1)}`;
    })
    .join(' ');

  const polygon = document.createElementNS(SVG_NS, 'polygon');
  polygon.setAttribute('points', hexPoints);
  polygon.setAttribute('stroke-width', String(STROKE.default));
  polygon.setAttribute('stroke-linejoin', 'round');
  polygon.setAttribute('filter', glowUrl);
  polygon.setAttribute('data-morph-target', 'true');
  applyShapeColors(polygon, cc);
  innerG.appendChild(polygon);

  // ── Enhanced gear: ring + glowing center + block ticks ──────────────
  const gearR = r * 0.22;
  const gearCenterR = gearR * 0.65;
  const tickLen = gearR * 0.55;
  const tickW = Math.max(3, gearR * 0.22);

  // Gear ring (hollow)
  const gearRing = document.createElementNS(SVG_NS, 'circle');
  gearRing.setAttribute('cx', '0');
  gearRing.setAttribute('cy', '0');
  gearRing.setAttribute('r', String(gearR));
  gearRing.setAttribute('fill', 'none');
  gearRing.setAttribute('stroke', cc.strokeSoft);
  gearRing.setAttribute('stroke-width', '1.5');
  innerG.appendChild(gearRing);

  // Glowing center dot
  const centerGradId = `msCenter_${entityId}`;
  if (!defs.querySelector(`#${centerGradId}`)) {
    const centerGrad = document.createElementNS(SVG_NS, 'radialGradient');
    centerGrad.setAttribute('id', centerGradId);
    const sc1 = document.createElementNS(SVG_NS, 'stop');
    sc1.setAttribute('offset', '0%');
    sc1.setAttribute('stop-color', color);
    sc1.setAttribute('stop-opacity', '0.9');
    const sc2 = document.createElementNS(SVG_NS, 'stop');
    sc2.setAttribute('offset', '100%');
    sc2.setAttribute('stop-color', color);
    sc2.setAttribute('stop-opacity', '0.5');
    centerGrad.appendChild(sc1); centerGrad.appendChild(sc2);
    defs.appendChild(centerGrad);
  }

  const cgId = `msGlow_${entityId}`;
  if (!defs.querySelector(`#${cgId}`)) {
    const cgFilter = document.createElementNS(SVG_NS, 'filter');
    cgFilter.setAttribute('id', cgId);
    cgFilter.setAttribute('x', '-100%'); cgFilter.setAttribute('y', '-100%');
    cgFilter.setAttribute('width', '300%'); cgFilter.setAttribute('height', '300%');
    const ds = document.createElementNS(SVG_NS, 'feDropShadow');
    ds.setAttribute('dx', '0'); ds.setAttribute('dy', '0');
    ds.setAttribute('stdDeviation', '4');
    ds.setAttribute('flood-color', color);
    ds.setAttribute('flood-opacity', '0.9');
    cgFilter.appendChild(ds);
    defs.appendChild(cgFilter);
  }

  const center = document.createElementNS(SVG_NS, 'circle');
  center.setAttribute('cx', '0');
  center.setAttribute('cy', '0');
  center.setAttribute('r', String(gearCenterR));
  center.setAttribute('fill', `url(#${centerGradId})`);
  center.setAttribute('filter', `url(#${cgId})`);
  innerG.appendChild(center);

  // Block ticks (N, S, E, W)
  [0, 90, 180, 270].forEach(angleDeg => {
    const rad = (angleDeg * Math.PI) / 180;
    const tx = Math.round(Math.sin(rad) * (gearR + tickLen * 0.5));
    const ty = -Math.round(Math.cos(rad) * (gearR + tickLen * 0.5));
    const isVertical = angleDeg % 180 === 0;
    const tick = document.createElementNS(SVG_NS, 'rect');
    tick.setAttribute('x', String(tx - (isVertical ? tickW / 2 : tickLen / 2)));
    tick.setAttribute('y', String(ty - (isVertical ? tickLen / 2 : tickW / 2)));
    tick.setAttribute('width', String(isVertical ? tickW : tickLen));
    tick.setAttribute('height', String(isVertical ? tickLen : tickW));
    tick.setAttribute('rx', '1.5');
    tick.setAttribute('fill', cc.stroke);
    innerG.appendChild(tick);
  });

  // Label below
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(r + LABEL_DEFAULTS.offsetBelow));
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
