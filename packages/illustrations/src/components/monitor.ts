/**
 * @preplai/illustrations — Monitor Component
 *
 * Clean rounded rectangle with a simple pulse-line icon inside.
 * Use for: monitoring dashboards, health checks, observability.
 *
 * Minimalist style matching the Composable engine aesthetic.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';
import { resolveColorCascade, applyShapeColors, applyGlowColors } from '../color-cascade.js';
import type { VisualEntity } from '@preplai/shared';

export function renderMonitor(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);

  const w = s * 0.9;
  const h = s * 0.7;
  const hw = w / 2;
  const hh = h / 2;
  const rx = 6;

  // Highlight glow
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

  // Body
  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x', String(-hw));
  body.setAttribute('y', String(-hh));
  body.setAttribute('width', String(w));
  body.setAttribute('height', String(h));
  body.setAttribute('rx', String(rx));
  body.setAttribute('stroke-width', String(STROKE.default));
  applyShapeColors(body, cc);
  innerG.appendChild(body);

  // Pulse-line icon (simple heartbeat: flat—peak—flat)
  const iconW = w * 0.4;
  const iconH = h * 0.2;
  const pulse = document.createElementNS(SVG_NS, 'polyline');
  pulse.setAttribute('points', [
    `${-iconW / 2},0`,
    `${-iconW / 6},0`,
    `${-iconW / 12},${-iconH}`,
    `${iconW / 12},${iconH}`,
    `${iconW / 6},0`,
    `${iconW / 2},0`,
  ].join(' '));
  pulse.setAttribute('fill', 'none');
  pulse.setAttribute('stroke', cc.stroke);
  pulse.setAttribute('stroke-width', String(STROKE.default));
  pulse.setAttribute('stroke-linecap', 'round');
  pulse.setAttribute('stroke-linejoin', 'round');
  innerG.appendChild(pulse);

  // Label below
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
