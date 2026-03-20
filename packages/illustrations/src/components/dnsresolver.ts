/**
 * @preplai/illustrations — DNS Resolver Component
 *
 * Clean rounded rectangle with a globe icon inside.
 * Use for: DNS lookups, nameservers, domain resolution, service discovery.
 *
 * Minimalist style matching the Composable engine aesthetic.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha, OPACITY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderDNSResolver(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('DNSResolver');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-dns-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

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
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    innerG.appendChild(glow);
  }

  // Body
  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x', String(-hw));
  body.setAttribute('y', String(-hh));
  body.setAttribute('width', String(w));
  body.setAttribute('height', String(h));
  body.setAttribute('rx', String(rx));
  body.setAttribute('fill', `url(#${gradId})`);
  body.setAttribute('stroke', color);
  body.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(body);

  // Globe icon (stroke-based): circle + horizontal line + vertical ellipse arc
  const globeR = Math.min(w, h) * 0.22;

  const globeCircle = document.createElementNS(SVG_NS, 'circle');
  globeCircle.setAttribute('cx', '0');
  globeCircle.setAttribute('cy', '0');
  globeCircle.setAttribute('r', String(globeR));
  globeCircle.setAttribute('fill', 'none');
  globeCircle.setAttribute('stroke', color);
  globeCircle.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(globeCircle);

  // Equator line
  const eq = document.createElementNS(SVG_NS, 'line');
  eq.setAttribute('x1', String(-globeR));
  eq.setAttribute('y1', '0');
  eq.setAttribute('x2', String(globeR));
  eq.setAttribute('y2', '0');
  eq.setAttribute('stroke', color);
  eq.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(eq);

  // Meridian (vertical ellipse)
  const meridian = document.createElementNS(SVG_NS, 'ellipse');
  meridian.setAttribute('cx', '0');
  meridian.setAttribute('cy', '0');
  meridian.setAttribute('rx', String(globeR * 0.45));
  meridian.setAttribute('ry', String(globeR));
  meridian.setAttribute('fill', 'none');
  meridian.setAttribute('stroke', color);
  meridian.setAttribute('stroke-width', String(STROKE.default));
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
