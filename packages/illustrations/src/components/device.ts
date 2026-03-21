/**
 * @preplai/illustrations — Device Component
 *
 * Clean laptop silhouette: screen rectangle + thin base.
 * Use for: laptops, desktops, client devices, workstations.
 *
 * Minimalist style matching the Composable engine aesthetic.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha, OPACITY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderDevice(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Device');

  const screenW = s * 0.9;
  const screenH = s * 0.6;
  const baseW = screenW * 1.15;
  const baseH = s * 0.06;
  const gap = 2;

  const screenTop = -(screenH + gap + baseH) / 2;
  const baseTop = screenTop + screenH + gap;

  // Highlight glow
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-baseW / 2 - 3));
    glow.setAttribute('y', String(screenTop - 3));
    glow.setAttribute('width', String(baseW + 6));
    glow.setAttribute('height', String(screenH + gap + baseH + 6));
    glow.setAttribute('rx', '6');
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    innerG.appendChild(glow);
  }

  // Screen
  const screen = document.createElementNS(SVG_NS, 'rect');
  screen.setAttribute('x', String(-screenW / 2));
  screen.setAttribute('y', String(screenTop));
  screen.setAttribute('width', String(screenW));
  screen.setAttribute('height', String(screenH));
  screen.setAttribute('rx', '4');
  screen.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  screen.setAttribute('stroke', color);
  screen.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(screen);

  // Base (thin bar)
  const base = document.createElementNS(SVG_NS, 'rect');
  base.setAttribute('x', String(-baseW / 2));
  base.setAttribute('y', String(baseTop));
  base.setAttribute('width', String(baseW));
  base.setAttribute('height', String(baseH));
  base.setAttribute('rx', '2');
  base.setAttribute('fill', color);
  base.setAttribute('opacity', '0.4');
  innerG.appendChild(base);

  // Label below
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(baseTop + baseH + LABEL_DEFAULTS.offsetBelow));
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
