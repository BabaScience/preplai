/**
 * @preplai/illustrations — Notification Component
 * Push/in-app notification: card with bell icon + title + channel badge
 * Metadata: { channel?: 'push'|'email'|'slack'|'sms', title?: string }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  TYPOGRAPHY, SHAPES,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderNotification(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Notification');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-notif-${entity.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const label = entity.label ?? 'Deploy succeeded';
  const meta = entity.metadata ?? {};
  const channel = (meta.channel as string) ?? 'push';

  const w = s * 1.4;
  const h = s * 0.6;
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

  // Bell icon
  const bellG = document.createElementNS(SVG_NS, 'g');
  bellG.setAttribute('transform', `translate(${-hw + 16}, 0)`);
  // Bell body
  const bell = document.createElementNS(SVG_NS, 'path');
  bell.setAttribute('d', 'M -5 1 Q -5 -6 0 -8 Q 5 -6 5 1 L 6 3 L -6 3 Z');
  bell.setAttribute('fill', color);
  bell.setAttribute('opacity', '0.5');
  bellG.appendChild(bell);
  // Clapper
  const clapper = document.createElementNS(SVG_NS, 'circle');
  clapper.setAttribute('cx', '0');
  clapper.setAttribute('cy', '5');
  clapper.setAttribute('r', '2');
  clapper.setAttribute('fill', color);
  clapper.setAttribute('opacity', '0.4');
  bellG.appendChild(clapper);
  // Notification dot
  const dot = document.createElementNS(SVG_NS, 'circle');
  dot.setAttribute('cx', '5');
  dot.setAttribute('cy', '-7');
  dot.setAttribute('r', '3');
  dot.setAttribute('fill', '#f87171');
  bellG.appendChild(dot);
  innerG.appendChild(bellG);

  // Title
  const titleText = document.createElementNS(SVG_NS, 'text');
  titleText.setAttribute('x', String(-hw + 30));
  titleText.setAttribute('y', String(-1));
  titleText.setAttribute('text-anchor', 'start');
  titleText.setAttribute('fill', color);
  titleText.setAttribute('font-size', String(getLabelFontSize('value', scale)));
  titleText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  titleText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  titleText.textContent = label.length > 20 ? label.slice(0, 17) + '...' : label;
  innerG.appendChild(titleText);

  // Channel badge
  const chText = document.createElementNS(SVG_NS, 'text');
  chText.setAttribute('x', String(-hw + 30));
  chText.setAttribute('y', String(12));
  chText.setAttribute('text-anchor', 'start');
  chText.setAttribute('fill', color);
  chText.setAttribute('font-size', String(getLabelFontSize('inline', scale)));
  chText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  chText.setAttribute('opacity', '0.5');
  chText.textContent = channel;
  innerG.appendChild(chText);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
