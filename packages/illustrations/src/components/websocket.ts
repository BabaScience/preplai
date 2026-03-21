/**
 * @preplai/illustrations — WebSocket Component
 * Bidirectional connection indicator with pulse arrows
 * Metadata: { protocol?: string, status?: 'connected'|'disconnected' }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { ensureGlassFilter } from '../visual-utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  colorWithAlpha, OPACITY,
  TYPOGRAPHY, SHAPES, COLORS, STROKE,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderWebSocket(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('WebSocket');

  const meta = entity.metadata ?? {};
  const status = (meta.status as string) ?? 'connected';
  const isConnected = status !== 'disconnected';

  const w = s * 1.2;
  const h = s * 0.9;
  const hw = w / 2;
  const hh = h / 2;

  // Body
  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x', String(-hw));
  body.setAttribute('y', String(-hh));
  body.setAttribute('width', String(w));
  body.setAttribute('height', String(h));
  body.setAttribute('rx', String(SHAPES.borderRadius));
  body.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  body.setAttribute('stroke', color);
  body.setAttribute('stroke-width', String(getStrokeWidth('default', scale)));
  body.setAttribute('filter', ensureGlassFilter(parentEl));
  innerG.appendChild(body);

  // Bidirectional arrows icon (⇆)
  const arrowY = -4;
  // Left arrow
  const leftArrow = document.createElementNS(SVG_NS, 'path');
  leftArrow.setAttribute('d', `M ${-12} ${arrowY} L ${-4} ${arrowY - 5} M ${-12} ${arrowY} L ${-4} ${arrowY + 5} M ${-12} ${arrowY} L ${8} ${arrowY}`);
  leftArrow.setAttribute('stroke', color);
  leftArrow.setAttribute('stroke-width', String(STROKE.emphasized));
  leftArrow.setAttribute('fill', 'none');
  leftArrow.setAttribute('opacity', '0.7');
  innerG.appendChild(leftArrow);

  // Right arrow (below)
  const rightArrow = document.createElementNS(SVG_NS, 'path');
  rightArrow.setAttribute('d', `M ${12} ${arrowY + 10} L ${4} ${arrowY + 5} M ${12} ${arrowY + 10} L ${4} ${arrowY + 15} M ${12} ${arrowY + 10} L ${-8} ${arrowY + 10}`);
  rightArrow.setAttribute('stroke', color);
  rightArrow.setAttribute('stroke-width', String(STROKE.emphasized));
  rightArrow.setAttribute('fill', 'none');
  rightArrow.setAttribute('opacity', '0.7');
  innerG.appendChild(rightArrow);

  // Status dot
  const dotColor = isConnected ? COLORS.green : COLORS.red;
  const dot = document.createElementNS(SVG_NS, 'circle');
  dot.setAttribute('cx', String(hw - 10));
  dot.setAttribute('cy', String(-hh + 10));
  dot.setAttribute('r', '3');
  dot.setAttribute('fill', dotColor);
  dot.setAttribute('opacity', '0.9');
  innerG.appendChild(dot);

  // Label
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(hh + 18));
    text.setAttribute('text-anchor', 'middle');
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
