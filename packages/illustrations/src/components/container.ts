/**
 * @preplai/illustrations — Container Component
 *
 * Clean dashed-border rectangle with no interior decorations.
 * Use for: Docker containers, pods, isolated environments.
 *
 * Minimalist style matching the Composable engine aesthetic:
 * - Rounded rectangle with dashed stroke (meaningful: containment boundary)
 * - Subtle gradient fill
 * - Thin stroke
 * - Label below
 * - Optional highlight glow
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, SHAPES, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';
import { resolveColorCascade, applyShapeColors, applyGlowColors } from '../color-cascade.js';
import type { VisualEntity } from '@preplai/shared';

export function renderContainer(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);

  const w = s * 1.1;
  const h = s * 0.75;
  const hw = w / 2;
  const hh = h / 2;

  // Highlight glow (behind shape)
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-hw - 3));
    glow.setAttribute('y', String(-hh - 3));
    glow.setAttribute('width', String(w + 6));
    glow.setAttribute('height', String(h + 6));
    glow.setAttribute('rx', String(SHAPES.borderRadius + 2));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // Container body (dashed border)
  const border = document.createElementNS(SVG_NS, 'rect');
  border.setAttribute('x', String(-hw));
  border.setAttribute('y', String(-hh));
  border.setAttribute('width', String(w));
  border.setAttribute('height', String(h));
  border.setAttribute('rx', String(SHAPES.borderRadius));
  border.setAttribute('stroke-width', String(STROKE.default));
  border.setAttribute('stroke-dasharray', '6,4');
  border.setAttribute('data-morph-target', 'true');
  applyShapeColors(border, cc);
  innerG.appendChild(border);

  // Label below
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(hh + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('fill', cc.textPrimary);
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
