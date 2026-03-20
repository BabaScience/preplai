/**
 * @preplai/illustrations — MessageBroker Component
 *
 * Clean rect with exchange/fan-out icon inside.
 * Use for: message brokers, pub/sub systems, event buses.
 *
 * Minimalist style matching the Composable engine aesthetic.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES, STROKE, LABEL_DEFAULTS, colorWithAlpha, OPACITY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderMessageBroker(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('MessageBroker');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-broker-${color.replace(/[^a-fA-F0-9]/g, '')}`;
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

  // Fan-out icon (input arrow → center dot → 3 output arrows)
  const is = s * 0.1;

  // Input line
  const inLine = document.createElementNS(SVG_NS, 'line');
  inLine.setAttribute('x1', String(-is));
  inLine.setAttribute('y1', '0');
  inLine.setAttribute('x2', String(-is * 0.2));
  inLine.setAttribute('y2', '0');
  inLine.setAttribute('stroke', color);
  inLine.setAttribute('stroke-width', String(STROKE.default));
  inLine.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(inLine);

  // Center dot
  const dot = document.createElementNS(SVG_NS, 'circle');
  dot.setAttribute('cx', '0');
  dot.setAttribute('cy', '0');
  dot.setAttribute('r', String(is * 0.15));
  dot.setAttribute('fill', color);
  innerG.appendChild(dot);

  // Output lines (fan to 3)
  const outAngles = [-0.6, 0, 0.6];
  for (const angle of outAngles) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(is * 0.2));
    line.setAttribute('y1', '0');
    line.setAttribute('x2', String(is));
    line.setAttribute('y2', String(is * angle));
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', String(STROKE.thin));
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
