/**
 * @preplai/illustrations — Task Component
 * Project task/ticket: card with checkbox + title + status badge
 * Metadata: { status?: 'todo'|'in_progress'|'done', priority?: 'low'|'medium'|'high' }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  TYPOGRAPHY, SHAPES, STROKE,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

const STATUS_COLORS: Record<string, string> = {
  todo: '#94a3b8',
  in_progress: '#60a5fa',
  done: '#4ade80',
};

export function renderTask(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Task');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-task-${entity.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const label = entity.label ?? 'Implement OAuth';
  const meta = entity.metadata ?? {};
  const status = (meta.status as string) ?? 'in_progress';
  const statusColor = STATUS_COLORS[status] ?? color;

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

  // Checkbox
  const cbG = document.createElementNS(SVG_NS, 'g');
  cbG.setAttribute('transform', `translate(${-hw + 16}, 0)`);
  const cbRect = document.createElementNS(SVG_NS, 'rect');
  cbRect.setAttribute('x', '-6');
  cbRect.setAttribute('y', '-6');
  cbRect.setAttribute('width', '12');
  cbRect.setAttribute('height', '12');
  cbRect.setAttribute('rx', '2');
  cbRect.setAttribute('fill', 'none');
  cbRect.setAttribute('stroke', statusColor);
  cbRect.setAttribute('stroke-width', String(STROKE.default));
  cbG.appendChild(cbRect);
  // Checkmark for done
  if (status === 'done') {
    const check = document.createElementNS(SVG_NS, 'path');
    check.setAttribute('d', 'M -3 0 L -1 3 L 4 -3');
    check.setAttribute('fill', 'none');
    check.setAttribute('stroke', statusColor);
    check.setAttribute('stroke-width', String(STROKE.emphasized));
    cbG.appendChild(check);
  }
  // Dot for in_progress
  if (status === 'in_progress') {
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', '0');
    dot.setAttribute('cy', '0');
    dot.setAttribute('r', '3');
    dot.setAttribute('fill', statusColor);
    dot.setAttribute('opacity', '0.5');
    cbG.appendChild(dot);
  }
  innerG.appendChild(cbG);

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

  // Status text
  const statusLabel = status.replace('_', ' ').toUpperCase();
  const stText = document.createElementNS(SVG_NS, 'text');
  stText.setAttribute('x', String(-hw + 30));
  stText.setAttribute('y', String(12));
  stText.setAttribute('text-anchor', 'start');
  stText.setAttribute('fill', statusColor);
  stText.setAttribute('font-size', String(getLabelFontSize('inline', scale)));
  stText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  stText.textContent = statusLabel;
  innerG.appendChild(stText);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
