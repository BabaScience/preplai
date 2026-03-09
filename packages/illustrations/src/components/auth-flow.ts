/**
 * @preplai/illustrations — AuthFlow Component
 * Auth flow card: lock icon + flow type (OAuth/JWT/SSO) + steps
 * Metadata: { flowType?: string, steps?: string[] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  TYPOGRAPHY, SHAPES, STROKE,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderAuthFlow(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('AuthFlow');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-auth-${entity.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const flowType = (meta.flowType as string) ?? entity.label ?? 'OAuth';

  const w = s * 1.4;
  const h = s * 0.9;
  const hw = w / 2;
  const hh = h / 2;

  // Card
  const card = document.createElementNS(SVG_NS, 'rect');
  card.setAttribute('x', String(-hw));
  card.setAttribute('y', String(-hh));
  card.setAttribute('width', String(w));
  card.setAttribute('height', String(h));
  card.setAttribute('rx', String(SHAPES.borderRadius));
  card.setAttribute('fill', `url(#${gradId})`);
  card.setAttribute('stroke', color);
  card.setAttribute('stroke-width', String(getStrokeWidth('default', scale)));
  innerG.appendChild(card);

  // Lock icon (SVG path)
  const lockG = document.createElementNS(SVG_NS, 'g');
  lockG.setAttribute('transform', `translate(${-hw + 20}, 0)`);
  // Lock body
  const lockBody = document.createElementNS(SVG_NS, 'rect');
  lockBody.setAttribute('x', '-7');
  lockBody.setAttribute('y', '-3');
  lockBody.setAttribute('width', '14');
  lockBody.setAttribute('height', '10');
  lockBody.setAttribute('rx', '2');
  lockBody.setAttribute('fill', 'none');
  lockBody.setAttribute('stroke', color);
  lockBody.setAttribute('stroke-width', String(STROKE.default));
  lockG.appendChild(lockBody);
  // Lock shackle
  const shackle = document.createElementNS(SVG_NS, 'path');
  shackle.setAttribute('d', 'M -4,-3 L -4,-7 A 4,4 0 0 1 4,-7 L 4,-3');
  shackle.setAttribute('fill', 'none');
  shackle.setAttribute('stroke', color);
  shackle.setAttribute('stroke-width', String(STROKE.default));
  lockG.appendChild(shackle);
  // Keyhole
  const keyhole = document.createElementNS(SVG_NS, 'circle');
  keyhole.setAttribute('cx', '0');
  keyhole.setAttribute('cy', '2');
  keyhole.setAttribute('r', '2');
  keyhole.setAttribute('fill', color);
  keyhole.setAttribute('opacity', '0.5');
  lockG.appendChild(keyhole);
  innerG.appendChild(lockG);

  // Flow type label
  const typeText = document.createElementNS(SVG_NS, 'text');
  typeText.setAttribute('x', String(-hw + 38));
  typeText.setAttribute('y', String(-2));
  typeText.setAttribute('text-anchor', 'start');
  typeText.setAttribute('fill', color);
  typeText.setAttribute('font-size', String(getLabelFontSize('value', scale)));
  typeText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  typeText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  typeText.textContent = flowType;
  innerG.appendChild(typeText);

  // Subtitle
  const subtitle = document.createElementNS(SVG_NS, 'text');
  subtitle.setAttribute('x', String(-hw + 38));
  subtitle.setAttribute('y', String(12));
  subtitle.setAttribute('text-anchor', 'start');
  subtitle.setAttribute('fill', color);
  subtitle.setAttribute('font-size', String(getLabelFontSize('inline', scale)));
  subtitle.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  subtitle.setAttribute('opacity', '0.6');
  subtitle.textContent = 'Authentication Flow';
  innerG.appendChild(subtitle);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
