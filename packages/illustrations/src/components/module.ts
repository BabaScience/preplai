/**
 * @preplai/illustrations — Module Component
 * Code module/package: card with curly braces icon + module name + exports count
 * Metadata: { exports?: number }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  TYPOGRAPHY, SHAPES,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderModule(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Module');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-mod-${entity.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const label = entity.label ?? 'auth';
  const meta = entity.metadata ?? {};
  const exports = (meta.exports as number) ?? 5;

  const w = s * 1.2;
  const h = s * 0.8;
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

  // Curly braces icon
  const braceText = document.createElementNS(SVG_NS, 'text');
  braceText.setAttribute('x', String(-hw + 14));
  braceText.setAttribute('y', String(5));
  braceText.setAttribute('text-anchor', 'middle');
  braceText.setAttribute('fill', color);
  braceText.setAttribute('font-size', String(s * 0.35));
  braceText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  braceText.setAttribute('opacity', '0.5');
  braceText.textContent = '{ }';
  innerG.appendChild(braceText);

  // Module name
  const nameText = document.createElementNS(SVG_NS, 'text');
  nameText.setAttribute('x', String(-hw + 30));
  nameText.setAttribute('y', String(-2));
  nameText.setAttribute('text-anchor', 'start');
  nameText.setAttribute('fill', color);
  nameText.setAttribute('font-size', String(getLabelFontSize('value', scale)));
  nameText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  nameText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  nameText.textContent = label;
  innerG.appendChild(nameText);

  // Exports count
  const exText = document.createElementNS(SVG_NS, 'text');
  exText.setAttribute('x', String(-hw + 30));
  exText.setAttribute('y', String(12));
  exText.setAttribute('text-anchor', 'start');
  exText.setAttribute('fill', color);
  exText.setAttribute('font-size', String(getLabelFontSize('inline', scale)));
  exText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  exText.setAttribute('opacity', '0.5');
  exText.textContent = `${exports} exports`;
  innerG.appendChild(exText);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
