/**
 * @preplai/illustrations — MessageBroker Component
 * Message broker / queue system: card with exchange arrows
 * Metadata: { protocol?: string, queues?: number }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  TYPOGRAPHY, SHAPES, STROKE,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderMessageBroker(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('MessageBroker');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-broker-${entity.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const label = entity.label ?? 'Broker';

  const w = s * 1.2;
  const h = s * 0.8;
  const hw = w / 2;
  const hh = h / 2;

  // Card
  const card = document.createElementNS(SVG_NS, 'rect');
  card.setAttribute('x', String(-hw));
  card.setAttribute('y', String(-hh));
  card.setAttribute('width', String(w));
  card.setAttribute('height', String(h));
  card.setAttribute('rx', String(SHAPES.borderRadius));
  card.setAttribute('fill', `url(#${gradId})`);
  card.setAttribute('stroke', color);
  card.setAttribute('stroke-width', String(getStrokeWidth('default', scale)));
  innerG.appendChild(card);

  // Exchange icon: input arrow → box → output arrows (fan-out pattern)
  // Input arrow
  const inArrow = document.createElementNS(SVG_NS, 'path');
  inArrow.setAttribute('d', `M ${-hw * 0.6} 0 L ${-4} 0 M ${-8} ${-3} L ${-4} 0 L ${-8} 3`);
  inArrow.setAttribute('stroke', color);
  inArrow.setAttribute('stroke-width', String(STROKE.default));
  inArrow.setAttribute('fill', 'none');
  inArrow.setAttribute('opacity', '0.6');
  innerG.appendChild(inArrow);

  // Center exchange box
  const exchangeBox = document.createElementNS(SVG_NS, 'rect');
  exchangeBox.setAttribute('x', '-4');
  exchangeBox.setAttribute('y', '-6');
  exchangeBox.setAttribute('width', '8');
  exchangeBox.setAttribute('height', '12');
  exchangeBox.setAttribute('rx', '2');
  exchangeBox.setAttribute('fill', color);
  exchangeBox.setAttribute('opacity', '0.3');
  innerG.appendChild(exchangeBox);

  // Output arrows (fan out to 3 queues)
  const outYs = [-8, 0, 8];
  for (const oy of outYs) {
    const outArrow = document.createElementNS(SVG_NS, 'path');
    outArrow.setAttribute('d', `M 4 0 L ${hw * 0.5} ${oy} M ${hw * 0.5 - 4} ${oy - 2} L ${hw * 0.5} ${oy} L ${hw * 0.5 - 4} ${oy + 2}`);
    outArrow.setAttribute('stroke', color);
    outArrow.setAttribute('stroke-width', String(STROKE.thin));
    outArrow.setAttribute('fill', 'none');
    outArrow.setAttribute('opacity', '0.5');
    innerG.appendChild(outArrow);
  }

  // Label below
  if (label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(hh + 18));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
