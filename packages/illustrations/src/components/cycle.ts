/**
 * @preplai/illustrations — Cycle Component (minimalist)
 *
 * Clean rotating dashed circle with label centered inside.
 * Use for: lifecycle diagrams, process loops, retry logic.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor,
  TYPOGRAPHY,
  STROKE,
  colorWithAlpha,
  OPACITY,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderCycle(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const r = s / 2;
  const color = entity.color ?? getCategoryColor('Cycle');

  // Highlight glow
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'circle');
    glow.setAttribute('cx', '0');
    glow.setAttribute('cy', '0');
    glow.setAttribute('r', String(r + 4));
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    innerG.appendChild(glow);
  }

  // Rotating dashed circle
  const circleG = document.createElementNS(SVG_NS, 'g');
  circleG.setAttribute('transform-origin', '0 0');

  const circle = document.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('cx', '0');
  circle.setAttribute('cy', '0');
  circle.setAttribute('r', String(r));
  circle.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  circle.setAttribute('stroke', color);
  circle.setAttribute('stroke-width', String(STROKE.default));
  circle.setAttribute('stroke-dasharray', '6,6');
  circleG.appendChild(circle);

  const animate = document.createElementNS(SVG_NS, 'animateTransform');
  animate.setAttribute('attributeName', 'transform');
  animate.setAttribute('type', 'rotate');
  animate.setAttribute('from', '0 0 0');
  animate.setAttribute('to', '360 0 0');
  animate.setAttribute('dur', '4s');
  animate.setAttribute('repeatCount', 'indefinite');
  circleG.appendChild(animate);

  innerG.appendChild(circleG);

  // Label centered
  if (entity.label) {
    const fontSize = Math.min(TYPOGRAPHY.fontSizeLabel, Math.max(10, s / 4));
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', '0');
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('dominant-baseline', 'central');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(fontSize));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
