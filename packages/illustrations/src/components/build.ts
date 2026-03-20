/**
 * @preplai/illustrations — Build Component
 *
 * Clean rect with hammer icon inside.
 * Use for: CI/CD build steps, compilation.
 *
 * Minimalist style matching the Composable engine aesthetic.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES, STROKE, LABEL_DEFAULTS, colorWithAlpha, OPACITY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderBuild(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Build');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-build-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const w = s * 0.85;
  const h = s * 0.7;
  const hw = w / 2;
  const hh = h / 2;

  // Highlight glow
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-hw - 3));
    glow.setAttribute('y', String(-hh - 3));
    glow.setAttribute('width', String(w + 6));
    glow.setAttribute('height', String(h + 6));
    glow.setAttribute('rx', String(SHAPES.borderRadius + 2));
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    innerG.appendChild(glow);
  }

  // Body
  const card = document.createElementNS(SVG_NS, 'rect');
  card.setAttribute('x', String(-hw));
  card.setAttribute('y', String(-hh));
  card.setAttribute('width', String(w));
  card.setAttribute('height', String(h));
  card.setAttribute('rx', String(SHAPES.borderRadius));
  card.setAttribute('fill', `url(#${gradId})`);
  card.setAttribute('stroke', color);
  card.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(card);

  // Wrench icon (stroke-based)
  const is = s * 0.12;
  const wrench = document.createElementNS(SVG_NS, 'path');
  wrench.setAttribute('d', [
    `M ${-is * 0.8} ${is * 0.8}`,
    `L ${is * 0.8} ${-is * 0.8}`,
  ].join(' '));
  wrench.setAttribute('fill', 'none');
  wrench.setAttribute('stroke', color);
  wrench.setAttribute('stroke-width', String(STROKE.default));
  wrench.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(wrench);

  // Wrench head (small circle at top)
  const head = document.createElementNS(SVG_NS, 'circle');
  head.setAttribute('cx', String(is * 0.8));
  head.setAttribute('cy', String(-is * 0.8));
  head.setAttribute('r', String(is * 0.5));
  head.setAttribute('fill', 'none');
  head.setAttribute('stroke', color);
  head.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(head);

  // Label below
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(hh + LABEL_DEFAULTS.offsetBelow));
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
