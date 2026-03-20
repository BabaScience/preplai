/**
 * @preplai/illustrations — User Component
 *
 * Minimalist user icon: circle with a simple person silhouette inside.
 * Clean, geometric style matching the Composable engine aesthetic.
 *
 * Uses design tokens for stroke, typography, and optional highlight glow.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createRadialGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
  TYPOGRAPHY,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderUser(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity) * 0.9;
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('User');
  const strokeW = getStrokeWidth('default', scale);
  const defs = ensureDefs(parentEl);
  const gradId = `grad-user-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createRadialGradient(gradId, color, defs);

  const r = s * 0.48;

  // Highlight glow
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'circle');
    glow.setAttribute('cx', '0');
    glow.setAttribute('cy', '0');
    glow.setAttribute('r', String(r + 4));
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    glow.setAttribute('stroke-width', String(strokeW));
    glow.setAttribute('stroke-dasharray', '4,4');
    innerG.appendChild(glow);
  }

  // Main circle
  const circle = document.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('cx', '0');
  circle.setAttribute('cy', '0');
  circle.setAttribute('r', String(r));
  circle.setAttribute('fill', `url(#${gradId})`);
  circle.setAttribute('stroke', color);
  circle.setAttribute('stroke-width', String(strokeW));
  innerG.appendChild(circle);

  // Person icon (simplified: small head circle + shoulders arc)
  const iconScale = r * 0.45;

  // Head
  const head = document.createElementNS(SVG_NS, 'circle');
  head.setAttribute('cx', '0');
  head.setAttribute('cy', String(-iconScale * 0.45));
  head.setAttribute('r', String(iconScale * 0.38));
  head.setAttribute('fill', 'none');
  head.setAttribute('stroke', color);
  head.setAttribute('stroke-width', String(Math.max(1.5, 2 / (iconScale / 12))));
  head.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(head);

  // Shoulders/body arc
  const bodyPath = document.createElementNS(SVG_NS, 'path');
  const bw = iconScale * 0.85;
  const by = iconScale * 0.2;
  bodyPath.setAttribute('d', `M ${-bw} ${by + iconScale * 0.55} A ${bw} ${bw * 0.8} 0 0 1 ${bw} ${by + iconScale * 0.55}`);
  bodyPath.setAttribute('fill', 'none');
  bodyPath.setAttribute('stroke', color);
  bodyPath.setAttribute('stroke-width', String(Math.max(1.5, 2 / (iconScale / 12))));
  bodyPath.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(bodyPath);

  // Label below
  if (entity.label) {
    const labelY = r + LABEL_DEFAULTS.offsetBelow;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(labelY));
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
