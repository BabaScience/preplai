/**
 * @preplai/illustrations — Definition Component
 * Term + definition card with left accent bar
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderDefinition(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Definition');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-def-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const term = (meta.term as string) ?? entity.label ?? 'Term';
  const definition = (meta.definition as string) ?? entity.textContent ?? 'Definition goes here.';

  const w = s * 2.2;
  const h = s * 1.6;

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

  const accentBar = document.createElementNS(SVG_NS, 'rect');
  accentBar.setAttribute('x', String(-w / 2));
  accentBar.setAttribute('y', String(-h / 2));
  accentBar.setAttribute('width', '4');
  accentBar.setAttribute('height', String(h));
  accentBar.setAttribute('rx', '2');
  accentBar.setAttribute('fill', color);
  accentBar.setAttribute('opacity', '0.8');
  innerG.appendChild(accentBar);

  const termText = document.createElementNS(SVG_NS, 'text');
  termText.setAttribute('x', String(-w / 2 + 16));
  termText.setAttribute('y', String(-h / 2 + 22));
  termText.setAttribute('fill', color);
  termText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeTitle));
  termText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
  termText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  termText.textContent = term;
  innerG.appendChild(termText);

  const defText = document.createElementNS(SVG_NS, 'text');
  defText.setAttribute('x', String(-w / 2 + 16));
  defText.setAttribute('y', String(-h / 2 + 44));
  defText.setAttribute('fill', `${color}dd`);
  defText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeBadge + 1));
  defText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  defText.setAttribute('font-weight', '400');
  defText.textContent = definition.length > 40 ? definition.slice(0, 40) + '…' : definition;
  innerG.appendChild(defText);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
