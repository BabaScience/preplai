/**
 * @preplai/illustrations — Goal Component
 * Target/bullseye icon + "Goal" label + body text
 * Use for learning objectives, session goals, target outcomes.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderGoal(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Goal');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-goal-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const body = (meta.label as string) ?? entity.textContent ?? entity.label ?? 'Define your goal here.';

  const w = s * 2;
  const h = s * 1.2;

  const card = document.createElementNS(SVG_NS, 'rect');
  card.setAttribute('x', String(-w / 2));
  card.setAttribute('y', String(-h / 2));
  card.setAttribute('width', String(w));
  card.setAttribute('height', String(h));
  card.setAttribute('rx', String(SHAPES.borderRadius));
  card.setAttribute('fill', `url(#${gradId})`);
  card.setAttribute('stroke', color);
  card.setAttribute('stroke-width', '2');
  innerG.appendChild(card);

  // Target/bullseye icon (concentric circles)
  const iconG = document.createElementNS(SVG_NS, 'g');
  iconG.setAttribute('transform', `translate(${-w / 2 + 20}, ${-h / 2 + 22})`);
  const r1 = document.createElementNS(SVG_NS, 'circle');
  r1.setAttribute('cx', '0');
  r1.setAttribute('cy', '0');
  r1.setAttribute('r', '12');
  r1.setAttribute('fill', 'none');
  r1.setAttribute('stroke', color);
  r1.setAttribute('stroke-width', '2');
  iconG.appendChild(r1);
  const r2 = document.createElementNS(SVG_NS, 'circle');
  r2.setAttribute('cx', '0');
  r2.setAttribute('cy', '0');
  r2.setAttribute('r', '7');
  r2.setAttribute('fill', 'none');
  r2.setAttribute('stroke', color);
  r2.setAttribute('stroke-width', '2');
  iconG.appendChild(r2);
  const r3 = document.createElementNS(SVG_NS, 'circle');
  r3.setAttribute('cx', '0');
  r3.setAttribute('cy', '0');
  r3.setAttribute('r', '2');
  r3.setAttribute('fill', color);
  r3.setAttribute('stroke', 'none');
  iconG.appendChild(r3);
  innerG.appendChild(iconG);

  const typeLabel = document.createElementNS(SVG_NS, 'text');
  typeLabel.setAttribute('x', String(-w / 2 + 52));
  typeLabel.setAttribute('y', String(-h / 2 + 22));
  typeLabel.setAttribute('fill', color);
  typeLabel.setAttribute('font-size', String(TYPOGRAPHY.fontSizeBadge + 1));
  typeLabel.setAttribute('font-weight', '600');
  typeLabel.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  typeLabel.textContent = 'Goal';
  innerG.appendChild(typeLabel);

  if (body) {
    const bodyText = document.createElementNS(SVG_NS, 'text');
    bodyText.setAttribute('x', String(-w / 2 + 20));
    bodyText.setAttribute('y', String(-h / 2 + 44));
    bodyText.setAttribute('fill', `${color}dd`);
    bodyText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeBadge));
    bodyText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    bodyText.textContent = body.length > 35 ? body.slice(0, 35) + '…' : body;
    innerG.appendChild(bodyText);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
