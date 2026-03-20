/**
 * @preplai/illustrations — Event Component
 *
 * Clean hexagon with lightning bolt icon inside.
 * Use for: domain events, messages, signals.
 *
 * Minimalist style matching the Composable engine aesthetic.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha, OPACITY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderEvent(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Event');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-event-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const r = s * 0.38;

  // Highlight glow
  if (entity.highlight) {
    const glowHex = document.createElementNS(SVG_NS, 'polygon');
    const glowPts: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      glowPts.push(`${(r + 3) * Math.cos(angle)},${(r + 3) * Math.sin(angle)}`);
    }
    glowHex.setAttribute('points', glowPts.join(' '));
    glowHex.setAttribute('fill', 'none');
    glowHex.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    glowHex.setAttribute('stroke-width', String(STROKE.default));
    glowHex.setAttribute('stroke-dasharray', '4,4');
    innerG.appendChild(glowHex);
  }

  // Hexagon
  const hex = document.createElementNS(SVG_NS, 'polygon');
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 6;
    points.push(`${r * Math.cos(angle)},${r * Math.sin(angle)}`);
  }
  hex.setAttribute('points', points.join(' '));
  hex.setAttribute('fill', `url(#${gradId})`);
  hex.setAttribute('stroke', color);
  hex.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(hex);

  // Lightning bolt icon (stroke-based)
  const is = s * 0.08;
  const bolt = document.createElementNS(SVG_NS, 'path');
  bolt.setAttribute('d', `M ${is * 0.3} ${-is * 1.5} L ${-is * 0.5} ${is * 0.2} L ${is * 0.3} ${is * 0.2} L ${-is * 0.3} ${is * 1.5}`);
  bolt.setAttribute('fill', 'none');
  bolt.setAttribute('stroke', color);
  bolt.setAttribute('stroke-width', String(STROKE.default));
  bolt.setAttribute('stroke-linecap', 'round');
  bolt.setAttribute('stroke-linejoin', 'round');
  innerG.appendChild(bolt);

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
