/**
 * @preplai/illustrations — Webhook Component
 * Outbound trigger: card with arrow-out icon + event name + target URL
 * Metadata: { event?: string, targetUrl?: string }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  TYPOGRAPHY, SHAPES, STROKE,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderWebhook(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Webhook');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-wh-${entity.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const event = (meta.event as string) ?? entity.label ?? 'webhook';
  const targetUrl = (meta.targetUrl as string) ?? '';

  const w = s * 1.6;
  const h = s * 0.7;
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

  // Left accent bar
  const accent = document.createElementNS(SVG_NS, 'rect');
  accent.setAttribute('x', String(-hw));
  accent.setAttribute('y', String(-hh));
  accent.setAttribute('width', '3');
  accent.setAttribute('height', String(h));
  accent.setAttribute('fill', color);
  accent.setAttribute('opacity', '0.7');
  innerG.appendChild(accent);

  // Outbound arrow icon
  const arrowPath = document.createElementNS(SVG_NS, 'path');
  arrowPath.setAttribute('d', `M ${-hw + 14} ${-4} L ${-hw + 22} ${-4} L ${-hw + 19} ${-8} M ${-hw + 22} ${-4} L ${-hw + 19} ${0}`);
  arrowPath.setAttribute('stroke', color);
  arrowPath.setAttribute('stroke-width', String(STROKE.emphasized));
  arrowPath.setAttribute('fill', 'none');
  innerG.appendChild(arrowPath);

  // Event name
  const eventText = document.createElementNS(SVG_NS, 'text');
  eventText.setAttribute('x', String(-hw + 28));
  eventText.setAttribute('y', String(-1));
  eventText.setAttribute('text-anchor', 'start');
  eventText.setAttribute('fill', color);
  eventText.setAttribute('font-size', String(getLabelFontSize('value', scale)));
  eventText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  eventText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  eventText.textContent = event;
  innerG.appendChild(eventText);

  // Target URL
  if (targetUrl) {
    const urlText = document.createElementNS(SVG_NS, 'text');
    urlText.setAttribute('x', String(-hw + 28));
    urlText.setAttribute('y', String(hh - 8));
    urlText.setAttribute('text-anchor', 'start');
    urlText.setAttribute('fill', color);
    urlText.setAttribute('font-size', String(getLabelFontSize('inline', scale)));
    urlText.setAttribute('font-family', TYPOGRAPHY.fontCode);
    urlText.setAttribute('opacity', '0.6');
    urlText.textContent = targetUrl.length > 28 ? targetUrl.slice(0, 28) + '...' : targetUrl;
    innerG.appendChild(urlText);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
