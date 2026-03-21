/**
 * @preplai/illustrations — Decorator Component
 *
 * Clean dashed outer rect with solid inner rect (nesting pattern).
 * Use for: decorator pattern, wrapper functions, middleware.
 *
 * Minimalist style matching the Composable engine aesthetic.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES, STROKE, LABEL_DEFAULTS, colorWithAlpha, OPACITY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderDecorator(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Decorator');

  const outerW = s * 1.1;
  const outerH = s * 0.85;
  const innerW = outerW * 0.6;
  const innerH = outerH * 0.5;

  // Highlight glow
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-outerW / 2 - 3));
    glow.setAttribute('y', String(-outerH / 2 - 3));
    glow.setAttribute('width', String(outerW + 6));
    glow.setAttribute('height', String(outerH + 6));
    glow.setAttribute('rx', String(SHAPES.borderRadius + 2));
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    innerG.appendChild(glow);
  }

  // Outer wrapper (dashed)
  const outerRect = document.createElementNS(SVG_NS, 'rect');
  outerRect.setAttribute('x', String(-outerW / 2));
  outerRect.setAttribute('y', String(-outerH / 2));
  outerRect.setAttribute('width', String(outerW));
  outerRect.setAttribute('height', String(outerH));
  outerRect.setAttribute('rx', String(SHAPES.borderRadius));
  outerRect.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  outerRect.setAttribute('stroke', color);
  outerRect.setAttribute('stroke-width', String(STROKE.default));
  outerRect.setAttribute('stroke-dasharray', '6,4');
  innerG.appendChild(outerRect);

  // Inner function rect (solid)
  const innerRect = document.createElementNS(SVG_NS, 'rect');
  innerRect.setAttribute('x', String(-innerW / 2));
  innerRect.setAttribute('y', String(-innerH / 2));
  innerRect.setAttribute('width', String(innerW));
  innerRect.setAttribute('height', String(innerH));
  innerRect.setAttribute('rx', String(SHAPES.borderRadius - 2));
  innerRect.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  innerRect.setAttribute('stroke', color);
  innerRect.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(innerRect);

  // Label below
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(outerH / 2 + LABEL_DEFAULTS.offsetBelow));
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
