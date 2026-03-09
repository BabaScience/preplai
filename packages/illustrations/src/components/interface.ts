/**
 * @preplai/illustrations — Interface Component
 * TypeScript/Java interface: card with "I" badge + interface name + methods list
 * Metadata: { methods?: string[] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  TYPOGRAPHY, SHAPES,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderInterface(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Interface');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-iface-${entity.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const label = entity.label ?? 'IUserService';
  const meta = entity.metadata ?? {};
  const methods = (meta.methods as string[]) ?? ['getUser()', 'createUser()', 'deleteUser()'];

  const w = s * 1.4;
  const rowH = 13;
  const headerH = 22;
  const h = Math.max(s * 0.7, headerH + methods.length * rowH + 8);
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
  card.setAttribute('stroke-dasharray', '6,3');
  innerG.appendChild(card);

  // Header with "I" badge
  const headerBar = document.createElementNS(SVG_NS, 'rect');
  headerBar.setAttribute('x', String(-hw));
  headerBar.setAttribute('y', String(-hh));
  headerBar.setAttribute('width', String(w));
  headerBar.setAttribute('height', String(headerH));
  headerBar.setAttribute('rx', String(SHAPES.borderRadius));
  headerBar.setAttribute('fill', color);
  headerBar.setAttribute('opacity', '0.15');
  innerG.appendChild(headerBar);

  // "I" badge
  const badgeCircle = document.createElementNS(SVG_NS, 'circle');
  badgeCircle.setAttribute('cx', String(-hw + 14));
  badgeCircle.setAttribute('cy', String(-hh + headerH / 2));
  badgeCircle.setAttribute('r', '7');
  badgeCircle.setAttribute('fill', color);
  badgeCircle.setAttribute('opacity', '0.3');
  innerG.appendChild(badgeCircle);

  const badgeI = document.createElementNS(SVG_NS, 'text');
  badgeI.setAttribute('x', String(-hw + 14));
  badgeI.setAttribute('y', String(-hh + headerH / 2 + 4));
  badgeI.setAttribute('text-anchor', 'middle');
  badgeI.setAttribute('fill', color);
  badgeI.setAttribute('font-size', String(getLabelFontSize('value', scale)));
  badgeI.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  badgeI.setAttribute('font-family', TYPOGRAPHY.fontCode);
  badgeI.textContent = 'I';
  innerG.appendChild(badgeI);

  // Interface name
  const nameText = document.createElementNS(SVG_NS, 'text');
  nameText.setAttribute('x', String(-hw + 26));
  nameText.setAttribute('y', String(-hh + 15));
  nameText.setAttribute('text-anchor', 'start');
  nameText.setAttribute('fill', color);
  nameText.setAttribute('font-size', String(getLabelFontSize('value', scale)));
  nameText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  nameText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  nameText.textContent = label;
  innerG.appendChild(nameText);

  // Methods list
  const fontSize = getLabelFontSize('inline', scale);
  const maxMethods = Math.min(methods.length, 5);
  for (let i = 0; i < maxMethods; i++) {
    const y = -hh + headerH + 12 + i * rowH;
    const methodText = document.createElementNS(SVG_NS, 'text');
    methodText.setAttribute('x', String(-hw + 12));
    methodText.setAttribute('y', String(y));
    methodText.setAttribute('text-anchor', 'start');
    methodText.setAttribute('fill', color);
    methodText.setAttribute('font-size', String(fontSize));
    methodText.setAttribute('font-family', TYPOGRAPHY.fontCode);
    methodText.setAttribute('opacity', '0.7');
    methodText.textContent = methods[i];
    innerG.appendChild(methodText);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
