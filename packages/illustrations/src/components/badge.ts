/**
 * @preplai/illustrations — Badge Component
 *
 * Clean pill shape with monospace label inside.
 * Use for: status badges, tags, labels.
 *
 * Minimalist style matching the Composable engine aesthetic.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, STROKE, getLabelFontSize, getStrokeWidth, colorWithAlpha, OPACITY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderBadge(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity) * 0.9;
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Badge');

  const label = entity.label ?? entity.type;
  const padX = 14;
  const w = Math.max(label.length * 8 + padX * 2, s);
  const h = 24;

  // Highlight glow
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-w / 2 - 3));
    glow.setAttribute('y', String(-h / 2 - 3));
    glow.setAttribute('width', String(w + 6));
    glow.setAttribute('height', String(h + 6));
    glow.setAttribute('rx', String(h / 2 + 2));
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    innerG.appendChild(glow);
  }

  const pill = document.createElementNS(SVG_NS, 'rect');
  pill.setAttribute('x', String(-w / 2));
  pill.setAttribute('y', String(-h / 2));
  pill.setAttribute('width', String(w));
  pill.setAttribute('height', String(h));
  pill.setAttribute('rx', String(h / 2));
  pill.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  pill.setAttribute('stroke', color);
  pill.setAttribute('stroke-width', String(getStrokeWidth('default', scale)));
  innerG.appendChild(pill);

  const text = document.createElementNS(SVG_NS, 'text');
  text.setAttribute('x', '0');
  text.setAttribute('y', '5');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('fill', color);
  text.setAttribute('font-size', String(getLabelFontSize('value', scale)));
  text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  text.textContent = label;
  innerG.appendChild(text);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
