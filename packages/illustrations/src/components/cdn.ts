/**
 * @preplai/illustrations — CDN Component
 *
 * Clean rect with globe icon inside (circle + cross lines).
 * Use for: CDNs, content delivery, edge networks.
 *
 * Minimalist style matching the Composable engine aesthetic.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES, STROKE, LABEL_DEFAULTS, colorWithAlpha, OPACITY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderCDN(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('CDN');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-cdn-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const w = s * 0.85;
  const h = s * 0.7;
  const hw = w / 2;
  const hh = h / 2;

  // Highlight glow
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-hw - 3));
    glow.setAttribute('y', String(-hh - 3));
    glow.setAttribute('width', String(w + 6));
    glow.setAttribute('height', String(h + 6));
    glow.setAttribute('rx', String(SHAPES.borderRadius + 2));
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    innerG.appendChild(glow);
  }

  // Body
  const card = document.createElementNS(SVG_NS, 'rect');
  card.setAttribute('x', String(-hw));
  card.setAttribute('y', String(-hh));
  card.setAttribute('width', String(w));
  card.setAttribute('height', String(h));
  card.setAttribute('rx', String(SHAPES.borderRadius));
  card.setAttribute('fill', `url(#${gradId})`);
  card.setAttribute('stroke', color);
  card.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(card);

  // Globe icon (circle + horizontal ellipse + vertical ellipse)
  const ir = s * 0.1;
  const globe = document.createElementNS(SVG_NS, 'circle');
  globe.setAttribute('cx', '0');
  globe.setAttribute('cy', '0');
  globe.setAttribute('r', String(ir));
  globe.setAttribute('fill', 'none');
  globe.setAttribute('stroke', color);
  globe.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(globe);

  // Horizontal line
  const hLine = document.createElementNS(SVG_NS, 'line');
  hLine.setAttribute('x1', String(-ir));
  hLine.setAttribute('y1', '0');
  hLine.setAttribute('x2', String(ir));
  hLine.setAttribute('y2', '0');
  hLine.setAttribute('stroke', color);
  hLine.setAttribute('stroke-width', String(STROKE.thin));
  innerG.appendChild(hLine);

  // Vertical ellipse (meridian)
  const meridian = document.createElementNS(SVG_NS, 'ellipse');
  meridian.setAttribute('cx', '0');
  meridian.setAttribute('cy', '0');
  meridian.setAttribute('rx', String(ir * 0.4));
  meridian.setAttribute('ry', String(ir));
  meridian.setAttribute('fill', 'none');
  meridian.setAttribute('stroke', color);
  meridian.setAttribute('stroke-width', String(STROKE.thin));
  innerG.appendChild(meridian);

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
