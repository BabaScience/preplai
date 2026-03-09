/**
 * @preplai/illustrations — Alert Component
 * Monitoring alert: card with severity icon + alert name + status
 * Metadata: { severity?: 'critical'|'warning'|'info', status?: 'firing'|'resolved' }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  TYPOGRAPHY, SHAPES,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#f87171',
  warning: '#fbbf24',
  info: '#60a5fa',
};

export function renderAlert(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Alert');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-alert-${entity.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const severity = (meta.severity as string) ?? 'critical';
  const status = (meta.status as string) ?? 'firing';
  const label = entity.label ?? 'High CPU Usage';
  const sevColor = SEVERITY_COLORS[severity] ?? color;

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
  card.setAttribute('stroke', sevColor);
  card.setAttribute('stroke-width', String(getStrokeWidth('default', scale)));
  innerG.appendChild(card);

  // Left accent bar
  const accent = document.createElementNS(SVG_NS, 'rect');
  accent.setAttribute('x', String(-hw));
  accent.setAttribute('y', String(-hh));
  accent.setAttribute('width', '3');
  accent.setAttribute('height', String(h));
  accent.setAttribute('rx', String(SHAPES.borderRadius));
  accent.setAttribute('fill', sevColor);
  accent.setAttribute('opacity', '0.8');
  innerG.appendChild(accent);

  // Bell icon (triangle + circle on top)
  const bellG = document.createElementNS(SVG_NS, 'g');
  bellG.setAttribute('transform', `translate(${-hw + 18}, 0)`);
  // Bell body (triangle-ish)
  const bell = document.createElementNS(SVG_NS, 'path');
  bell.setAttribute('d', 'M -5 2 L -7 2 L 0 -7 L 7 2 L 5 2 Z');
  bell.setAttribute('fill', sevColor);
  bell.setAttribute('opacity', '0.7');
  bellG.appendChild(bell);
  // Bell clapper
  const clapper = document.createElementNS(SVG_NS, 'circle');
  clapper.setAttribute('cx', '0');
  clapper.setAttribute('cy', '5');
  clapper.setAttribute('r', '2');
  clapper.setAttribute('fill', sevColor);
  clapper.setAttribute('opacity', '0.5');
  bellG.appendChild(clapper);
  innerG.appendChild(bellG);

  // Alert name
  const nameText = document.createElementNS(SVG_NS, 'text');
  nameText.setAttribute('x', String(-hw + 32));
  nameText.setAttribute('y', String(-2));
  nameText.setAttribute('text-anchor', 'start');
  nameText.setAttribute('fill', color);
  nameText.setAttribute('font-size', String(getLabelFontSize('value', scale)));
  nameText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  nameText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  nameText.textContent = label.length > 20 ? label.slice(0, 17) + '...' : label;
  innerG.appendChild(nameText);

  // Status badge
  const statusText = document.createElementNS(SVG_NS, 'text');
  statusText.setAttribute('x', String(-hw + 32));
  statusText.setAttribute('y', String(12));
  statusText.setAttribute('text-anchor', 'start');
  statusText.setAttribute('fill', status === 'firing' ? sevColor : '#4ade80');
  statusText.setAttribute('font-size', String(getLabelFontSize('inline', scale)));
  statusText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  statusText.textContent = status.toUpperCase();
  innerG.appendChild(statusText);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
