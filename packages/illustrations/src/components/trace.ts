/**
 * @preplai/illustrations — Trace Component
 * Distributed trace span: horizontal bar with service name + duration
 * Metadata: { service?: string, duration?: string, status?: 'ok'|'error' }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor, getStrokeWidth, getLabelFontSize,
  TYPOGRAPHY,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderTrace(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Trace');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-trace-${entity.id.replace(/[^a-zA-Z0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'horizontal', defs);

  const meta = entity.metadata ?? {};
  const service = (meta.service as string) ?? entity.label ?? 'api-gateway';
  const duration = (meta.duration as string) ?? '45ms';
  const status = (meta.status as string) ?? 'ok';

  const w = s * 1.8;
  const h = s * 0.35;
  const hw = w / 2;
  const hh = h / 2;

  // Span bar
  const bar = document.createElementNS(SVG_NS, 'rect');
  bar.setAttribute('x', String(-hw));
  bar.setAttribute('y', String(-hh));
  bar.setAttribute('width', String(w));
  bar.setAttribute('height', String(h));
  bar.setAttribute('rx', '4');
  bar.setAttribute('fill', `url(#${gradId})`);
  bar.setAttribute('stroke', status === 'error' ? '#f87171' : color);
  bar.setAttribute('stroke-width', String(getStrokeWidth('default', scale)));
  innerG.appendChild(bar);

  // Service name (left)
  const nameText = document.createElementNS(SVG_NS, 'text');
  nameText.setAttribute('x', String(-hw + 10));
  nameText.setAttribute('y', String(4));
  nameText.setAttribute('text-anchor', 'start');
  nameText.setAttribute('fill', color);
  nameText.setAttribute('font-size', String(getLabelFontSize('value', scale)));
  nameText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  nameText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  nameText.textContent = service;
  innerG.appendChild(nameText);

  // Duration (right)
  const durText = document.createElementNS(SVG_NS, 'text');
  durText.setAttribute('x', String(hw - 10));
  durText.setAttribute('y', String(4));
  durText.setAttribute('text-anchor', 'end');
  durText.setAttribute('fill', color);
  durText.setAttribute('font-size', String(getLabelFontSize('inline', scale)));
  durText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  durText.setAttribute('opacity', '0.7');
  durText.textContent = duration;
  innerG.appendChild(durText);

  // Status dot
  const dot = document.createElementNS(SVG_NS, 'circle');
  dot.setAttribute('cx', String(-hw + 4));
  dot.setAttribute('cy', '0');
  dot.setAttribute('r', '3');
  dot.setAttribute('fill', status === 'error' ? '#f87171' : '#4ade80');
  innerG.appendChild(dot);

  // Label below
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(hh + 16));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
