/**
 * @preplai/illustrations — Cycle Component
 *
 * Rotating dashed circle with label centered inside. Animated (4s per revolution).
 * Use for: lifecycle diagrams, process loops, retry logic, iterative processes.
 *
 * @see METADATA_SCHEMAS.md#cycle
 * @see ILLUSTRATIONS_AGENT_GUIDE.md
 *
 * No metadata required. Use entity.label (e.g. "loop", "retry", "lifecycle").
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createRadialGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderCycle(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const r = s / 2;
  const color = entity.color ?? getCategoryColor('Cycle');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-cycle-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createRadialGradient(gradId, color, defs);

  // Rotating dashed circle — wrap in group for SMIL animateTransform
  const circleG = document.createElementNS(SVG_NS, 'g');
  circleG.setAttribute('transform-origin', '0 0');

  const circle = document.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('cx', '0');
  circle.setAttribute('cy', '0');
  circle.setAttribute('r', String(r));
  circle.setAttribute('fill', `url(#${gradId})`);
  circle.setAttribute('stroke', color);
  circle.setAttribute('stroke-width', String(SHAPES.strokeWidth));
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

  // Label centered in the circle
  if (entity.label) {
    const fontSize = Math.min(TYPOGRAPHY.fontSizeLabel, Math.max(10, s / 4));
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', '0');
    text.setAttribute('text-anchor', 'middle');
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
