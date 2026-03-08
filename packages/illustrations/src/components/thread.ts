/**
 * @preplai/illustrations — Thread Component
 *
 * OS thread: circle with label. Use for: concurrency diagrams, thread pools,
 * parallel execution visualization.
 *
 * Metadata: { status?: 'running' | 'blocked' | 'idle' } — affects stroke style
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createRadialGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  TYPOGRAPHY,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

const STATUS_COLORS: Record<string, string> = {
  running: '#00e676',
  blocked: '#ff5252',
  idle: '#78909c',
};

export function renderThread(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Thread');
  const meta = entity.metadata ?? {};
  const status = (meta.status as string)?.toLowerCase();
  const statusColor = status && STATUS_COLORS[status] ? STATUS_COLORS[status] : color;

  const defs = ensureDefs(parentEl);
  const gradId = `grad-thread-${statusColor.replace(/[^a-fA-F0-9]/g, '')}`;
  createRadialGradient(gradId, statusColor, defs);

  const r = s * 0.4;
  const strokeWidth = getStrokeWidth(status === 'running' ? 'emphasized' : 'thin', scale);

  const circle = document.createElementNS(SVG_NS, 'circle');
  circle.setAttribute('cx', '0');
  circle.setAttribute('cy', '0');
  circle.setAttribute('r', String(r));
  circle.setAttribute('fill', `url(#${gradId})`);
  circle.setAttribute('stroke', statusColor);
  circle.setAttribute('stroke-width', String(strokeWidth));
  if (status === 'blocked') {
    circle.setAttribute('stroke-dasharray', '4,4');
    circle.setAttribute('opacity', '0.85');
  }
  innerG.appendChild(circle);

  const label = entity.label ?? entity.type;
  if (label) {
    const fontSize = getLabelFontSize('value', scale);
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(r + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', statusColor);
    text.setAttribute('font-size', String(fontSize));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    const display = String(label).length > 8 ? String(label).slice(0, 7) + '…' : String(label);
    text.textContent = display;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
