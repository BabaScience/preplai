/**
 * @preplai/illustrations — Server Component
 *
 * Clean rounded rectangle with rack-line icon inside.
 * Use for: servers, hosts, compute instances, backend services.
 *
 * Visual depth: radial halo, gradient rack bars, LED dots, outer glow.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getEntityDimensions } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';
import { resolveColorCascade, applyShapeColors, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlowFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderServer(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const { width: w, height: h, halfW: hw, halfH: hh } = getEntityDimensions(entity);
  const rx = 6;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const defs = ensureDefs(parentEl);

  // ── Radial depth halo (atmospheric glow behind entity) ───────────────
  const haloId = `srv-halo-${entityId}`;
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
  halo.setAttribute('rx', String(hw * 1.6));
  halo.setAttribute('ry', String(hh * 1.6));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // Highlight glow (behind shape)
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

  // Server body with outer glow
  const glowUrl = ensureGlowFilter(parentEl, color);
  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x', String(-hw));
  body.setAttribute('y', String(-hh));
  body.setAttribute('width', String(w));
  body.setAttribute('height', String(h));
  body.setAttribute('rx', String(rx));
  body.setAttribute('stroke-width', String(STROKE.default));
  body.setAttribute('filter', glowUrl);
  body.setAttribute('data-morph-target', 'true');
  applyShapeColors(body, cc);
  innerG.appendChild(body);

  // Gradient rack bars (3 bars with LED dots, left to right brightness fade)
  const rackCount = 3;
  for (let i = 0; i < rackCount; i++) {
    const yPos = -hh + (h / (rackCount + 1)) * (i + 1);

    const gradId = `srvRack${i}_${entityId}`;
    if (!defs.querySelector(`#${gradId}`)) {
      const grad = document.createElementNS(SVG_NS, 'linearGradient');
      grad.setAttribute('id', gradId);
      grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
      grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '0%');
      const s1 = document.createElementNS(SVG_NS, 'stop');
      s1.setAttribute('offset', '0%');
      s1.setAttribute('stop-color', color);
      s1.setAttribute('stop-opacity', '0.9');
      const s2 = document.createElementNS(SVG_NS, 'stop');
      s2.setAttribute('offset', '100%');
      s2.setAttribute('stop-color', color);
      s2.setAttribute('stop-opacity', '0.2');
      grad.appendChild(s1); grad.appendChild(s2);
      defs.appendChild(grad);
    }

    const rack = document.createElementNS(SVG_NS, 'rect');
    rack.setAttribute('x', String(-hw + 8));
    rack.setAttribute('y', String(yPos - 3));
    rack.setAttribute('width', String(w - 28));
    rack.setAttribute('height', '5');
    rack.setAttribute('rx', '2.5');
    rack.setAttribute('fill', `url(#${gradId})`);
    innerG.appendChild(rack);

    // LED dot (far right)
    const ledGlowId = `srvLed${i}_${entityId}`;
    if (!defs.querySelector(`#${ledGlowId}`)) {
      const filter = document.createElementNS(SVG_NS, 'filter');
      filter.setAttribute('id', ledGlowId);
      filter.setAttribute('x', '-100%'); filter.setAttribute('y', '-100%');
      filter.setAttribute('width', '300%'); filter.setAttribute('height', '300%');
      const ds = document.createElementNS(SVG_NS, 'feDropShadow');
      ds.setAttribute('dx', '0'); ds.setAttribute('dy', '0');
      ds.setAttribute('stdDeviation', '3');
      ds.setAttribute('flood-color', color);
      ds.setAttribute('flood-opacity', '1');
      filter.appendChild(ds);
      defs.appendChild(filter);
    }
    const led = document.createElementNS(SVG_NS, 'circle');
    led.setAttribute('cx', String(hw - 10));
    led.setAttribute('cy', String(yPos));
    led.setAttribute('r', '2.5');
    led.setAttribute('fill', color);
    led.setAttribute('filter', `url(#${ledGlowId})`);
    innerG.appendChild(led);
  }

  // Label below
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
