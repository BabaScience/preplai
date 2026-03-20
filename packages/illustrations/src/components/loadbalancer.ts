/**
 * @preplai/illustrations — LoadBalancer Component
 *
 * Clean hexagon with a minimal fork icon inside.
 * Use for: load balancers, traffic distribution, reverse proxies.
 *
 * Minimalist style matching the Composable engine aesthetic:
 * - Clean hexagon shape with subtle gradient
 * - Thin stroke
 * - Simple stroke-based fork icon (1 line splits into 2)
 * - Label below
 * - Optional highlight glow
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha, OPACITY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderLoadBalancer(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('LoadBalancer');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-lb-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const r = s * 0.45;

  // Highlight glow (behind shape)
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
  polygon.setAttribute('fill', `url(#${gradId})`);
  polygon.setAttribute('stroke', color);
  polygon.setAttribute('stroke-width', String(STROKE.default));
  polygon.setAttribute('stroke-linejoin', 'round');
  innerG.appendChild(polygon);

  // Fork icon (stroke-based): single line from top splits into two at bottom
  const iconH = r * 0.5;
  const forkY = -iconH * 0.1;
  const forkSpread = r * 0.3;

  // Input line (top to fork point)
  const lineIn = document.createElementNS(SVG_NS, 'line');
  lineIn.setAttribute('x1', '0');
  lineIn.setAttribute('y1', String(-iconH));
  lineIn.setAttribute('x2', '0');
  lineIn.setAttribute('y2', String(forkY));
  lineIn.setAttribute('stroke', color);
  lineIn.setAttribute('stroke-width', String(STROKE.default));
  lineIn.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(lineIn);

  // Left branch
  const lineL = document.createElementNS(SVG_NS, 'line');
  lineL.setAttribute('x1', '0');
  lineL.setAttribute('y1', String(forkY));
  lineL.setAttribute('x2', String(-forkSpread));
  lineL.setAttribute('y2', String(iconH));
  lineL.setAttribute('stroke', color);
  lineL.setAttribute('stroke-width', String(STROKE.default));
  lineL.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(lineL);

  // Right branch
  const lineR = document.createElementNS(SVG_NS, 'line');
  lineR.setAttribute('x1', '0');
  lineR.setAttribute('y1', String(forkY));
  lineR.setAttribute('x2', String(forkSpread));
  lineR.setAttribute('y2', String(iconH));
  lineR.setAttribute('stroke', color);
  lineR.setAttribute('stroke-width', String(STROKE.default));
  lineR.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(lineR);

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
