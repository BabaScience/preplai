/**
 * @preplai/illustrations — APIEndpoint Component
 * Card with HTTP method badge (GET/POST/PUT/DELETE) + route path + status
 * Metadata: { method?: string, route?: string, status?: number }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  TYPOGRAPHY, SHAPES, COLORS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

const METHOD_COLORS: Record<string, string> = {
  GET: COLORS.green,
  POST: COLORS.blue,
  PUT: COLORS.orange,
  PATCH: COLORS.orange,
  DELETE: COLORS.red,
};

export function renderAPIEndpoint(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('APIEndpoint');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-apiep-${entity.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const method = ((meta.method as string) ?? 'GET').toUpperCase();
  const route = (meta.route as string) ?? entity.label ?? '/api';
  const status = meta.status as number | undefined;

  const w = s * 2;
  const h = s * 0.7;
  const hw = w / 2;
  const hh = h / 2;

  // Card background
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

  // Method badge (pill)
  const methodColor = METHOD_COLORS[method] ?? color;
  const badgeW = Math.max(method.length * 7 + 12, 36);
  const badgeH = 16;
  const badgeX = -hw + 8;
  const badgeY = -hh + 8;

  const badge = document.createElementNS(SVG_NS, 'rect');
  badge.setAttribute('x', String(badgeX));
  badge.setAttribute('y', String(badgeY));
  badge.setAttribute('width', String(badgeW));
  badge.setAttribute('height', String(badgeH));
  badge.setAttribute('rx', String(badgeH / 2));
  badge.setAttribute('fill', methodColor);
  badge.setAttribute('opacity', '0.8');
  innerG.appendChild(badge);

  const methodText = document.createElementNS(SVG_NS, 'text');
  methodText.setAttribute('x', String(badgeX + badgeW / 2));
  methodText.setAttribute('y', String(badgeY + badgeH / 2 + 4));
  methodText.setAttribute('text-anchor', 'middle');
  methodText.setAttribute('fill', '#0a0a12');
  methodText.setAttribute('font-size', String(getLabelFontSize('inline', scale)));
  methodText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  methodText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  methodText.textContent = method;
  innerG.appendChild(methodText);

  // Route path
  const routeText = document.createElementNS(SVG_NS, 'text');
  routeText.setAttribute('x', String(-hw + 12));
  routeText.setAttribute('y', String(hh - 10));
  routeText.setAttribute('text-anchor', 'start');
  routeText.setAttribute('fill', color);
  routeText.setAttribute('font-size', String(getLabelFontSize('value', scale)));
  routeText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  routeText.textContent = route;
  innerG.appendChild(routeText);

  // Status code (if present)
  if (status) {
    const statusColor = status < 300 ? COLORS.green : status < 400 ? COLORS.orange : COLORS.red;
    const statusText = document.createElementNS(SVG_NS, 'text');
    statusText.setAttribute('x', String(hw - 10));
    statusText.setAttribute('y', String(badgeY + badgeH / 2 + 4));
    statusText.setAttribute('text-anchor', 'end');
    statusText.setAttribute('fill', statusColor);
    statusText.setAttribute('font-size', String(getLabelFontSize('inline', scale)));
    statusText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
    statusText.setAttribute('font-family', TYPOGRAPHY.fontCode);
    statusText.textContent = String(status);
    innerG.appendChild(statusText);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
