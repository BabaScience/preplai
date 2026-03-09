/**
 * @preplai/illustrations — LogEntry Component
 * Application log line: card with severity badge + timestamp + message
 * Metadata: { level?: 'info'|'warn'|'error'|'debug', timestamp?: string, message?: string }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  TYPOGRAPHY, SHAPES,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

const LEVEL_COLORS: Record<string, string> = {
  info: '#60a5fa',
  warn: '#fbbf24',
  error: '#f87171',
  debug: '#a78bfa',
};

export function renderLogEntry(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('LogEntry');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-log-${entity.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const level = (meta.level as string) ?? 'info';
  const timestamp = (meta.timestamp as string) ?? '12:34:56';
  const message = (meta.message as string) ?? entity.label ?? 'Request completed';
  const levelColor = LEVEL_COLORS[level] ?? color;

  const w = s * 2.0;
  const h = s * 0.5;
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

  // Level badge
  const badgeW = 32;
  const badgeH = 14;
  const badge = document.createElementNS(SVG_NS, 'rect');
  badge.setAttribute('x', String(-hw + 8));
  badge.setAttribute('y', String(-badgeH / 2));
  badge.setAttribute('width', String(badgeW));
  badge.setAttribute('height', String(badgeH));
  badge.setAttribute('rx', '3');
  badge.setAttribute('fill', levelColor);
  badge.setAttribute('opacity', '0.25');
  innerG.appendChild(badge);

  const badgeText = document.createElementNS(SVG_NS, 'text');
  badgeText.setAttribute('x', String(-hw + 8 + badgeW / 2));
  badgeText.setAttribute('y', String(4));
  badgeText.setAttribute('text-anchor', 'middle');
  badgeText.setAttribute('fill', levelColor);
  badgeText.setAttribute('font-size', String(getLabelFontSize('inline', scale)));
  badgeText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  badgeText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  badgeText.textContent = level.toUpperCase();
  innerG.appendChild(badgeText);

  // Timestamp
  const tsText = document.createElementNS(SVG_NS, 'text');
  tsText.setAttribute('x', String(-hw + 8 + badgeW + 8));
  tsText.setAttribute('y', String(4));
  tsText.setAttribute('text-anchor', 'start');
  tsText.setAttribute('fill', color);
  tsText.setAttribute('font-size', String(getLabelFontSize('inline', scale)));
  tsText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  tsText.setAttribute('opacity', '0.5');
  tsText.textContent = timestamp;
  innerG.appendChild(tsText);

  // Message
  const msgText = document.createElementNS(SVG_NS, 'text');
  msgText.setAttribute('x', String(hw - 8));
  msgText.setAttribute('y', String(4));
  msgText.setAttribute('text-anchor', 'end');
  msgText.setAttribute('fill', color);
  msgText.setAttribute('font-size', String(getLabelFontSize('inline', scale)));
  msgText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  msgText.textContent = message.length > 30 ? message.slice(0, 27) + '...' : message;
  innerG.appendChild(msgText);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
