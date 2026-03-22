/**
 * @preplai/illustrations — Lambda Component
 *
 * Clean rounded rectangle with λ character centered.
 * Use for: serverless functions, AWS Lambda, cloud functions.
 *
 * Minimalist style matching the Composable engine aesthetic.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';
import { resolveColorCascade, applyShapeColors, applyGlowColors } from '../color-cascade.js';
import type { VisualEntity } from '@preplai/shared';

export function renderLambda(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);

  const w = s * 0.8;
  const h = s * 0.65;
  const hw = w / 2;
  const hh = h / 2;
  const rx = 6;

  // Highlight glow
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-hw - 3));
    glow.setAttribute('y', String(-hh - 3));
    glow.setAttribute('width', String(w + 6));
    glow.setAttribute('height', String(h + 6));
    glow.setAttribute('rx', String(rx + 2));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // Body
  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x', String(-hw));
  rect.setAttribute('y', String(-hh));
  rect.setAttribute('width', String(w));
  rect.setAttribute('height', String(h));
  rect.setAttribute('rx', String(rx));
  rect.setAttribute('stroke-width', String(STROKE.default));
  rect.setAttribute('data-morph-target', 'true');
  applyShapeColors(rect, cc);
  innerG.appendChild(rect);

  // Lambda character
  const lambda = document.createElementNS(SVG_NS, 'text');
  lambda.setAttribute('x', '0');
  lambda.setAttribute('y', String(h * 0.08));
  lambda.setAttribute('text-anchor', 'middle');
  lambda.setAttribute('dominant-baseline', 'central');
  lambda.setAttribute('fill', cc.textPrimary);
  lambda.setAttribute('font-size', String(Math.min(s * 0.5, h * 0.55)));
  lambda.setAttribute('font-weight', '300');
  lambda.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  lambda.textContent = 'λ';
  innerG.appendChild(lambda);

  // Label below
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(hh + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('fill', cc.textPrimary);
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
