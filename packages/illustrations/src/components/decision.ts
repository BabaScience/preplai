/**
 * @preplai/illustrations — Decision Component
 *
 * Clean diamond shape with a centered question mark icon.
 * Minimalist style matching the Composable engine aesthetic.
 * Used for: decision points, branch conditions, yes/no gates.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, STROKE, colorWithAlpha, OPACITY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderDecision(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Decision');

  const d = s * 0.52;

  // Highlight glow
  if (entity.highlight) {
    const glowD = d + 4;
    const glow = document.createElementNS(SVG_NS, 'polygon');
    glow.setAttribute('points', `0,${-glowD} ${glowD},0 0,${glowD} ${-glowD},0`);
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    innerG.appendChild(glow);
  }

  // Diamond shape
  const polygon = document.createElementNS(SVG_NS, 'polygon');
  polygon.setAttribute('points', `0,${-d} ${d},0 0,${d} ${-d},0`);
  polygon.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  polygon.setAttribute('stroke', color);
  polygon.setAttribute('stroke-width', String(STROKE.default));
  polygon.setAttribute('stroke-linejoin', 'round');
  innerG.appendChild(polygon);

  // Question mark icon (centered, stroke-based)
  const iconSize = d * 0.55;
  const iconG = document.createElementNS(SVG_NS, 'text');
  iconG.setAttribute('x', '0');
  iconG.setAttribute('y', String(iconSize * 0.15));
  iconG.setAttribute('text-anchor', 'middle');
  iconG.setAttribute('dominant-baseline', 'central');
  iconG.setAttribute('fill', color);
  iconG.setAttribute('font-size', String(iconSize));
  iconG.setAttribute('font-weight', '300');
  iconG.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  iconG.textContent = '?';
  innerG.appendChild(iconG);

  // Label below
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(d + 18));
    text.setAttribute('text-anchor', 'middle');
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
