/**
 * @preplai/illustrations — Service Component
 *
 * Clean hexagon with a simple gear icon inside.
 * Use for: microservices, service endpoints, APIs.
 *
 * Minimalist style matching the Composable engine aesthetic.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha, OPACITY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderService(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Service');

  const r = s * 0.45;

  // Highlight glow
  if (entity.highlight) {
    const glowR = r + 4;
    const glowPoints = [0, 1, 2, 3, 4, 5]
      .map(i => {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        return `${(Math.cos(angle) * glowR).toFixed(1)},${(Math.sin(angle) * glowR).toFixed(1)}`;
      })
      .join(' ');
    const glow = document.createElementNS(SVG_NS, 'polygon');
    glow.setAttribute('points', glowPoints);
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    innerG.appendChild(glow);
  }

  // Hexagon shape
  const hexPoints = [0, 1, 2, 3, 4, 5]
    .map(i => {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      return `${(Math.cos(angle) * r).toFixed(1)},${(Math.sin(angle) * r).toFixed(1)}`;
    })
    .join(' ');

  const polygon = document.createElementNS(SVG_NS, 'polygon');
  polygon.setAttribute('points', hexPoints);
  polygon.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  polygon.setAttribute('stroke', color);
  polygon.setAttribute('stroke-width', String(STROKE.default));
  polygon.setAttribute('stroke-linejoin', 'round');
  innerG.appendChild(polygon);

  // Gear icon (stroke-based): circle with 4 tick marks at N/E/S/W
  const gearR = r * 0.22;
  const tickLen = r * 0.12;

  const gearCircle = document.createElementNS(SVG_NS, 'circle');
  gearCircle.setAttribute('cx', '0');
  gearCircle.setAttribute('cy', '0');
  gearCircle.setAttribute('r', String(gearR));
  gearCircle.setAttribute('fill', 'none');
  gearCircle.setAttribute('stroke', color);
  gearCircle.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(gearCircle);

  for (let i = 0; i < 4; i++) {
    const angle = (Math.PI / 2) * i;
    const x1 = Math.cos(angle) * gearR;
    const y1 = Math.sin(angle) * gearR;
    const x2 = Math.cos(angle) * (gearR + tickLen);
    const y2 = Math.sin(angle) * (gearR + tickLen);
    const tick = document.createElementNS(SVG_NS, 'line');
    tick.setAttribute('x1', String(x1));
    tick.setAttribute('y1', String(y1));
    tick.setAttribute('x2', String(x2));
    tick.setAttribute('y2', String(y2));
    tick.setAttribute('stroke', color);
    tick.setAttribute('stroke-width', String(STROKE.default));
    tick.setAttribute('stroke-linecap', 'round');
    innerG.appendChild(tick);
  }

  // Label below
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(r + LABEL_DEFAULTS.offsetBelow));
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
