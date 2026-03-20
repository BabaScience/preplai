/**
 * @preplai/illustrations — Callout Component
 *
 * Clean rect with info circle icon inside.
 * Use for: tips, warnings, notes, important callouts.
 *
 * Minimalist style matching the Composable engine aesthetic.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES, STROKE, LABEL_DEFAULTS, colorWithAlpha, OPACITY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderCallout(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Callout');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-callout-${color.replace(/[^a-fA-F0-9]/g, '')}`;
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

  // Info circle icon (circle + "i")
  const ir = s * 0.09;
  const infoCircle = document.createElementNS(SVG_NS, 'circle');
  infoCircle.setAttribute('cx', '0');
  infoCircle.setAttribute('cy', '0');
  infoCircle.setAttribute('r', String(ir));
  infoCircle.setAttribute('fill', 'none');
  infoCircle.setAttribute('stroke', color);
  infoCircle.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(infoCircle);

  // "i" inside circle
  const iDot = document.createElementNS(SVG_NS, 'circle');
  iDot.setAttribute('cx', '0');
  iDot.setAttribute('cy', String(-ir * 0.3));
  iDot.setAttribute('r', '1');
  iDot.setAttribute('fill', color);
  innerG.appendChild(iDot);

  const iLine = document.createElementNS(SVG_NS, 'line');
  iLine.setAttribute('x1', '0');
  iLine.setAttribute('y1', String(ir * 0.05));
  iLine.setAttribute('x2', '0');
  iLine.setAttribute('y2', String(ir * 0.5));
  iLine.setAttribute('stroke', color);
  iLine.setAttribute('stroke-width', String(STROKE.default));
  iLine.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(iLine);

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
