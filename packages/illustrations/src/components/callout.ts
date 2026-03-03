/**
 * @preplai/illustrations — Callout Component
 * Icon + type (tip/warning/note/important) + body text
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

const CALLOUT_CONFIG: Record<string, { icon: string; colorOffset?: number }> = {
  tip: { icon: '💡' },
  warning: { icon: '⚠' },
  note: { icon: '📝' },
  important: { icon: '❗' },
};

export function renderCallout(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity, 1.4);
  const color = entity.color ?? getCategoryColor('Callout');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-callout-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const calloutType = ((meta.calloutType as string) ?? 'note').toLowerCase();
  const config = CALLOUT_CONFIG[calloutType] ?? CALLOUT_CONFIG.note;
  const body = (meta.body as string) ?? entity.textContent ?? entity.label ?? '';

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

  const iconText = document.createElementNS(SVG_NS, 'text');
  iconText.setAttribute('x', String(-w / 2 + 20));
  iconText.setAttribute('y', String(-h / 2 + 22));
  iconText.setAttribute('fill', color);
  iconText.setAttribute('font-size', '16');
  iconText.textContent = config.icon;
  innerG.appendChild(iconText);

  const typeLabel = document.createElementNS(SVG_NS, 'text');
  typeLabel.setAttribute('x', String(-w / 2 + 44));
  typeLabel.setAttribute('y', String(-h / 2 + 22));
  typeLabel.setAttribute('fill', color);
  typeLabel.setAttribute('font-size', String(TYPOGRAPHY.fontSizeBadge + 1));
  typeLabel.setAttribute('font-weight', '600');
  typeLabel.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  typeLabel.textContent = calloutType.charAt(0).toUpperCase() + calloutType.slice(1);
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
