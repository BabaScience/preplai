/**
 * @pre/illustrations — Volume Component
 * Cylinder (like Database) with "persistent" cue — Docker named volume
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@pre/shared';

export function renderVolume(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const size = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Volume');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-volume-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const rx = size / 2.2;
  const ry = size / 6;
  const bodyH = size * 0.5;
  const topY = -size / 3;
  const botY = topY + bodyH;

  // ── Top ellipse (cap)
  const topEllipse = document.createElementNS(SVG_NS, 'ellipse');
  topEllipse.setAttribute('cx', '0');
  topEllipse.setAttribute('cy', String(topY));
  topEllipse.setAttribute('rx', String(rx));
  topEllipse.setAttribute('ry', String(ry));
  topEllipse.setAttribute('fill', `${color}25`);
  topEllipse.setAttribute('stroke', color);
  topEllipse.setAttribute('stroke-width', String(SHAPES.strokeWidth));
  innerG.appendChild(topEllipse);

  // ── Body fill with gradient
  const bodyFill = document.createElementNS(SVG_NS, 'rect');
  bodyFill.setAttribute('x', String(-rx));
  bodyFill.setAttribute('y', String(topY));
  bodyFill.setAttribute('width', String(rx * 2));
  bodyFill.setAttribute('height', String(bodyH));
  bodyFill.setAttribute('fill', `url(#${gradId})`);
  bodyFill.setAttribute('stroke', 'none');
  innerG.appendChild(bodyFill);

  // ── Bottom ellipse (base)
  const botEllipse = document.createElementNS(SVG_NS, 'ellipse');
  botEllipse.setAttribute('cx', '0');
  botEllipse.setAttribute('cy', String(botY));
  botEllipse.setAttribute('rx', String(rx));
  botEllipse.setAttribute('ry', String(ry));
  botEllipse.setAttribute('fill', `${color}15`);
  botEllipse.setAttribute('stroke', color);
  botEllipse.setAttribute('stroke-width', String(SHAPES.strokeWidth));
  innerG.appendChild(botEllipse);

  // ── Vertical side lines
  for (const xSign of [-1, 1]) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(xSign * rx));
    line.setAttribute('y1', String(topY));
    line.setAttribute('x2', String(xSign * rx));
    line.setAttribute('y2', String(botY));
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', String(SHAPES.strokeWidth));
    innerG.appendChild(line);
  }

  // ── Horizontal stripes (persistence / data layers)
  const stripeOffsets = [0.3, 0.6];
  for (const t of stripeOffsets) {
    const sy = topY + bodyH * t;
    const sw = rx * 0.8;
    const stripe = document.createElementNS(SVG_NS, 'line');
    stripe.setAttribute('x1', String(-sw));
    stripe.setAttribute('y1', String(sy));
    stripe.setAttribute('x2', String(sw));
    stripe.setAttribute('y2', String(sy));
    stripe.setAttribute('stroke', color);
    stripe.setAttribute('stroke-width', '1.5');
    stripe.setAttribute('opacity', '0.5');
    innerG.appendChild(stripe);
  }

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(botY + ry + 20));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeTitle));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
