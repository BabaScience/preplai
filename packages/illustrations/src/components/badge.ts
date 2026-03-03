/**
 * @preplai/illustrations — Badge Component
 * Pill shape with monospace label
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderBadge(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity) * 0.9;
  const color = entity.color ?? getCategoryColor('Badge');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-badge-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const label = entity.label ?? entity.type;
  const padX = 14;
  const padY = 8;
  const w = Math.max(label.length * 8 + padX * 2, s);
  const h = 24;

  const pill = document.createElementNS(SVG_NS, 'rect');
  pill.setAttribute('x', String(-w / 2));
  pill.setAttribute('y', String(-h / 2));
  pill.setAttribute('width', String(w));
  pill.setAttribute('height', String(h));
  pill.setAttribute('rx', String(h / 2));
  pill.setAttribute('fill', `url(#${gradId})`);
  pill.setAttribute('stroke', color);
  pill.setAttribute('stroke-width', '2');
  innerG.appendChild(pill);

  const text = document.createElementNS(SVG_NS, 'text');
  text.setAttribute('x', '0');
  text.setAttribute('y', '5');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('fill', color);
  text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeBadge + 1));
  text.setAttribute('font-weight', '600');
  text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  text.textContent = label;
  innerG.appendChild(text);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
