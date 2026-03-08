/**
 * @preplai/illustrations — DNS Resolver Component
 *
 * Server rack with globe icon and domain→IP flow. Use for: DNS lookups, nameservers,
 * domain resolution, service discovery, resolver chains.
 *
 * @see METADATA_SCHEMAS.md#dnsresolver
 * @see ILLUSTRATIONS_AGENT_GUIDE.md
 *
 * No metadata required. Visual conveys "domain name → IP address" resolution.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  TYPOGRAPHY,
  SHAPES,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderDNSResolver(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const strokeThin = getStrokeWidth('thin', scale);
  const strokeDefault = getStrokeWidth('default', scale);
  const strokeEmphasized = getStrokeWidth('emphasized', scale);
  const color = entity.color ?? getCategoryColor('DNSResolver');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-dns-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const w = s * 1.4;
  const h = s;

  // ── Server body (rack) with gradient
  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x', String(-w / 2));
  body.setAttribute('y', String(-h / 2));
  body.setAttribute('width', String(w));
  body.setAttribute('height', String(h * 0.8));
  body.setAttribute('rx', String(SHAPES.borderRadius - 2));
  body.setAttribute('fill', `url(#${gradId})`);
  body.setAttribute('stroke', color);
  body.setAttribute('stroke-width', String(SHAPES.strokeWidth));
  innerG.appendChild(body);

  // ── Rack stripe lines
  const lineOffsets = [-s / 6, 0, s / 6];
  for (const oy of lineOffsets) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(-w / 2));
    line.setAttribute('x2', String(w / 2));
    line.setAttribute('y1', String(oy));
    line.setAttribute('y2', String(oy));
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', String(strokeDefault));
    line.setAttribute('opacity', '0.6');
    innerG.appendChild(line);
  }

  // ── LED status dots (server registration active)
  const dotConfig = [
    { cx: -w / 3, cy: -s / 3, fill: color, glow: true },
    { cx: -w / 6, cy: -s / 3, fill: color, glow: true },
    { cx: w / 6, cy: -s / 3, fill: '#28c840', glow: false },
  ];
  for (const { cx, cy, fill, glow } of dotConfig) {
    if (glow) {
      const glowCircle = document.createElementNS(SVG_NS, 'circle');
      glowCircle.setAttribute('cx', String(cx));
      glowCircle.setAttribute('cy', String(cy));
      glowCircle.setAttribute('r', '5');
      glowCircle.setAttribute('fill', 'none');
      glowCircle.setAttribute('stroke', fill);
      glowCircle.setAttribute('stroke-width', String(strokeThin));
      glowCircle.setAttribute('opacity', '0.4');
      innerG.appendChild(glowCircle);
    }
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(cx));
    dot.setAttribute('cy', String(cy));
    dot.setAttribute('r', '3');
    dot.setAttribute('fill', fill);
    dot.setAttribute('opacity', '0.9');
    innerG.appendChild(dot);
  }

  // ── DNS registration icon: globe + domain→IP flow (centered below LEDs)
  const iconY = s * 0.08;
  const globeR = s * 0.18;

  const globe = document.createElementNS(SVG_NS, 'circle');
  globe.setAttribute('cx', String(-w / 6));
  globe.setAttribute('cy', String(iconY));
  globe.setAttribute('r', String(globeR));
  globe.setAttribute('fill', 'none');
  globe.setAttribute('stroke', color);
  globe.setAttribute('stroke-width', String(strokeThin));
  globe.setAttribute('opacity', '0.9');
  innerG.appendChild(globe);

  const eq = document.createElementNS(SVG_NS, 'line');
  eq.setAttribute('x1', String(-w / 6 - globeR));
  eq.setAttribute('y1', String(iconY));
  eq.setAttribute('x2', String(-w / 6 + globeR));
  eq.setAttribute('y2', String(iconY));
  eq.setAttribute('stroke', color);
  eq.setAttribute('stroke-width', String(strokeThin));
  eq.setAttribute('opacity', '0.6');
  innerG.appendChild(eq);

  const meridianPath = document.createElementNS(SVG_NS, 'path');
  meridianPath.setAttribute(
    'd',
    `M ${-w / 6 - globeR} ${iconY} A ${globeR} ${globeR} 0 0 1 ${-w / 6 + globeR} ${iconY}`,
  );
  meridianPath.setAttribute('fill', 'none');
  meridianPath.setAttribute('stroke', color);
  meridianPath.setAttribute('stroke-width', String(strokeThin));
  meridianPath.setAttribute('opacity', '0.5');
  innerG.appendChild(meridianPath);

  // Arrow: domain → IP (registration lookup)
  const ax1 = -w / 6 + globeR + 4;
  const ax2 = w / 4;
  const line = document.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1', String(ax1));
  line.setAttribute('y1', String(iconY));
  line.setAttribute('x2', String(ax2 - 5));
  line.setAttribute('y2', String(iconY));
  line.setAttribute('stroke', color);
  line.setAttribute('stroke-width', String(strokeEmphasized));
  line.setAttribute('opacity', '0.8');
  innerG.appendChild(line);

  const head = document.createElementNS(SVG_NS, 'polygon');
  head.setAttribute(
    'points',
    `${ax2},${iconY} ${ax2 - 6},${iconY - 4} ${ax2 - 6},${iconY + 4}`,
  );
  head.setAttribute('fill', color);
  head.setAttribute('opacity', '0.9');
  innerG.appendChild(head);

  // IP dots (resolved address)
  const ipDots = [
    { x: ax2 + 8, y: iconY - 5 },
    { x: ax2 + 14, y: iconY - 5 },
    { x: ax2 + 8, y: iconY + 5 },
    { x: ax2 + 14, y: iconY + 5 },
  ];
  for (const d of ipDots) {
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(d.x));
    dot.setAttribute('cy', String(d.y));
    dot.setAttribute('r', '2');
    dot.setAttribute('fill', color);
    dot.setAttribute('opacity', '0.9');
    innerG.appendChild(dot);
  }

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(h / 2 + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
