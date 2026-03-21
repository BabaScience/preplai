/**
 * @preplai/illustrations — HTTPRequest / HTTPResponse Component
 *
 * Clean rect with arrow icon inside (→ for request, ← for response).
 * Use for: HTTP requests, API calls, network requests.
 *
 * Minimalist style matching the Composable engine aesthetic.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES, STROKE, LABEL_DEFAULTS, colorWithAlpha, OPACITY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

function renderHTTP(entity: VisualEntity, parentEl: SVGElement, isResponse: boolean): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('HTTPRequest');

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
  card.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  card.setAttribute('stroke', color);
  card.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(card);

  // Arrow icon (→ or ←)
  const is = s * 0.1;
  const dir = isResponse ? -1 : 1;
  const arrow = document.createElementNS(SVG_NS, 'path');
  arrow.setAttribute('d', [
    `M ${-is * dir} 0`,
    `L ${is * dir} 0`,
    `M ${is * dir * 0.5} ${-is * 0.5}`,
    `L ${is * dir} 0`,
    `L ${is * dir * 0.5} ${is * 0.5}`,
  ].join(' '));
  arrow.setAttribute('fill', 'none');
  arrow.setAttribute('stroke', color);
  arrow.setAttribute('stroke-width', String(STROKE.default));
  arrow.setAttribute('stroke-linecap', 'round');
  arrow.setAttribute('stroke-linejoin', 'round');
  innerG.appendChild(arrow);

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

export function renderHTTPRequest(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  return renderHTTP(entity, parentEl, false);
}

export function renderHTTPResponse(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  return renderHTTP(entity, parentEl, true);
}
