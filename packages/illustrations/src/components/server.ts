/**
 * @preplai/illustrations — Server Component
 *
 * Clean rounded rectangle with minimal rack-line icon inside.
 * Use for: servers, hosts, compute instances, backend services.
 *
 * Minimalist style matching the Composable engine aesthetic:
 * - Single clean shape with subtle gradient
 * - Thin stroke
 * - Stroke-based rack icon (3 horizontal lines)
 * - Label below
 * - Optional highlight glow
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha, OPACITY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderServer(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Server');

  const w = s * 0.9;
  const h = s * 0.7;
  const hw = w / 2;
  const hh = h / 2;
  const rx = 6;

  // Highlight glow (behind shape)
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-hw - 3));
    glow.setAttribute('y', String(-hh - 3));
    glow.setAttribute('width', String(w + 6));
    glow.setAttribute('height', String(h + 6));
    glow.setAttribute('rx', String(rx + 2));
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    innerG.appendChild(glow);
  }

  // Server body
  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x', String(-hw));
  body.setAttribute('y', String(-hh));
  body.setAttribute('width', String(w));
  body.setAttribute('height', String(h));
  body.setAttribute('rx', String(rx));
  body.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  body.setAttribute('stroke', color);
  body.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(body);

  // Rack icon: 3 horizontal lines (stroke-based, centered)
  const iconW = w * 0.35;
  const lineSpacing = h * 0.16;
  for (let i = -1; i <= 1; i++) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(-iconW / 2));
    line.setAttribute('y1', String(i * lineSpacing));
    line.setAttribute('x2', String(iconW / 2));
    line.setAttribute('y2', String(i * lineSpacing));
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', String(STROKE.default));
    line.setAttribute('stroke-linecap', 'round');
    innerG.appendChild(line);
  }

  // Label below
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(hh + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('fill', color);
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
