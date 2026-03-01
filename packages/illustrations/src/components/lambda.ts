/**
 * @pre/illustrations — Lambda Component
 * Rounded rect with λ (lambda) character centered
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@pre/shared';

export function renderLambda(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Lambda');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-lambda-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const w = s * 1.4;
  const h = s;

  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x', String(-w / 2));
  rect.setAttribute('y', String(-h / 2));
  rect.setAttribute('width', String(w));
  rect.setAttribute('height', String(h));
  rect.setAttribute('rx', String(SHAPES.borderRadius));
  rect.setAttribute('fill', `url(#${gradId})`);
  rect.setAttribute('stroke', color);
  rect.setAttribute('stroke-width', String(SHAPES.strokeWidth));
  innerG.appendChild(rect);

  // ── Lambda character
  const lambda = document.createElementNS(SVG_NS, 'text');
  lambda.setAttribute('x', '0');
  lambda.setAttribute('y', '6');
  lambda.setAttribute('text-anchor', 'middle');
  lambda.setAttribute('fill', color);
  lambda.setAttribute('font-size', String(Math.min(36, s * 1.2)));
  lambda.setAttribute('font-weight', '600');
  lambda.setAttribute('font-family', 'JetBrains Mono, Geist Mono, monospace');
  lambda.textContent = 'λ';
  innerG.appendChild(lambda);

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(h / 2 + 18));
    text.setAttribute('text-anchor', 'middle');
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
