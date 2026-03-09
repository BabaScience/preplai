/**
 * @preplai/illustrations — ErrorState Component
 * Error/exception: card with X icon + error type + message
 * Metadata: { errorType?: string, message?: string, code?: number }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  TYPOGRAPHY, SHAPES, STROKE,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderErrorState(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('ErrorState');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-err-${entity.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const errorType = (meta.errorType as string) ?? entity.label ?? 'TypeError';
  const message = (meta.message as string) ?? 'Cannot read property of undefined';
  const code = meta.code as number | undefined;

  const w = s * 1.6;
  const h = s * 0.7;
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

  // Left accent bar (red)
  const accent = document.createElementNS(SVG_NS, 'rect');
  accent.setAttribute('x', String(-hw));
  accent.setAttribute('y', String(-hh));
  accent.setAttribute('width', '3');
  accent.setAttribute('height', String(h));
  accent.setAttribute('rx', String(SHAPES.borderRadius));
  accent.setAttribute('fill', color);
  accent.setAttribute('opacity', '0.8');
  innerG.appendChild(accent);

  // X icon (circle + X)
  const iconG = document.createElementNS(SVG_NS, 'g');
  iconG.setAttribute('transform', `translate(${-hw + 18}, 0)`);
  const circle = document.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('cx', '0');
  circle.setAttribute('cy', '0');
  circle.setAttribute('r', '7');
  circle.setAttribute('fill', color);
  circle.setAttribute('opacity', '0.2');
  iconG.appendChild(circle);
  const x1 = document.createElementNS(SVG_NS, 'line');
  x1.setAttribute('x1', '-3'); x1.setAttribute('y1', '-3');
  x1.setAttribute('x2', '3'); x1.setAttribute('y2', '3');
  x1.setAttribute('stroke', color); x1.setAttribute('stroke-width', String(STROKE.emphasized));
  iconG.appendChild(x1);
  const x2 = document.createElementNS(SVG_NS, 'line');
  x2.setAttribute('x1', '3'); x2.setAttribute('y1', '-3');
  x2.setAttribute('x2', '-3'); x2.setAttribute('y2', '3');
  x2.setAttribute('stroke', color); x2.setAttribute('stroke-width', String(STROKE.emphasized));
  iconG.appendChild(x2);
  innerG.appendChild(iconG);

  // Error type + optional code
  const typeLabel = code ? `${errorType} (${code})` : errorType;
  const typeText = document.createElementNS(SVG_NS, 'text');
  typeText.setAttribute('x', String(-hw + 32));
  typeText.setAttribute('y', String(-3));
  typeText.setAttribute('text-anchor', 'start');
  typeText.setAttribute('fill', color);
  typeText.setAttribute('font-size', String(getLabelFontSize('value', scale)));
  typeText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  typeText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  typeText.textContent = typeLabel;
  innerG.appendChild(typeText);

  // Message
  const msgText = document.createElementNS(SVG_NS, 'text');
  msgText.setAttribute('x', String(-hw + 32));
  msgText.setAttribute('y', String(11));
  msgText.setAttribute('text-anchor', 'start');
  msgText.setAttribute('fill', color);
  msgText.setAttribute('font-size', String(getLabelFontSize('inline', scale)));
  msgText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  msgText.setAttribute('opacity', '0.6');
  msgText.textContent = message.length > 30 ? message.slice(0, 27) + '...' : message;
  innerG.appendChild(msgText);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
