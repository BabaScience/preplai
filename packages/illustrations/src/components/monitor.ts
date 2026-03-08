/**
 * @preplai/illustrations — Monitor Component
 *
 * Monitoring screen: rect + EKG pulse line + stand.
 *
 * Metadata: { label?: string } — optional title on screen
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
  TYPOGRAPHY,
  SHAPES,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

/** EKG/heartbeat-like path: horizontal baseline with pulse peaks */
function ekgPath(w: number, h: number): string {
  const pad = w * 0.1;
  const dx = (w - 2 * pad) / 8;
  const baseY = h / 2;
  const peak = h * 0.35;
  const d = dx * 0.3;
  return [
    `M ${pad} ${baseY}`,
    `L ${pad + dx} ${baseY}`,
    `L ${pad + dx + d} ${baseY - peak}`,
    `L ${pad + dx + 2 * d} ${baseY}`,
    `L ${pad + dx + 3 * d} ${baseY}`,
    `L ${pad + 2 * dx} ${baseY - peak * 0.8}`,
    `L ${pad + 2 * dx + d} ${baseY}`,
    `L ${pad + 3 * dx} ${baseY}`,
    `L ${pad + 4 * dx} ${baseY}`,
    `L ${pad + 5 * dx} ${baseY - peak}`,
    `L ${pad + 5 * dx + d} ${baseY}`,
    `L ${pad + 6 * dx} ${baseY}`,
    `L ${w - pad} ${baseY}`,
  ].join(' ');
}

export function renderMonitor(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const strokeWidth = getStrokeWidth('thin', scale);
  const color = entity.color ?? getCategoryColor('Monitor');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-monitor-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const screenLabel = (meta.label as string) ?? '';

  const sizeScale = 0.7;
  const screenW = s * 2.2 * sizeScale;
  const screenH = s * 1.4 * sizeScale;
  const standH = s * 0.4 * sizeScale;
  const standW = screenW * 0.6;

  const screen = document.createElementNS(SVG_NS, 'rect');
  screen.setAttribute('x', String(-screenW / 2));
  screen.setAttribute('y', String(-screenH / 2 - standH / 2));
  screen.setAttribute('width', String(screenW));
  screen.setAttribute('height', String(screenH));
  screen.setAttribute('rx', String(SHAPES.borderRadius));
  screen.setAttribute('fill', `url(#${gradId})`);
  screen.setAttribute('stroke', color);
  screen.setAttribute('stroke-width', String(strokeWidth));
  innerG.appendChild(screen);

  const ekg = document.createElementNS(SVG_NS, 'path');
  ekg.setAttribute('d', ekgPath(screenW * 0.8, screenH * 0.5));
  ekg.setAttribute('transform', `translate(${-screenW * 0.4}, ${-screenH / 2 - standH / 2 + screenH * 0.25})`);
  ekg.setAttribute('fill', 'none');
  ekg.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeFull));
  ekg.setAttribute('stroke-width', String(strokeWidth * 1.5));
  ekg.setAttribute('stroke-linecap', 'round');
  ekg.setAttribute('stroke-linejoin', 'round');
  innerG.appendChild(ekg);

  if (screenLabel) {
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String(-screenH / 2 - standH / 2 + screenH * 0.85));
    labelEl.setAttribute('text-anchor', 'middle');
    labelEl.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
    labelEl.setAttribute('font-size', String(getLabelFontSize('inline', scale)));
    labelEl.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    labelEl.textContent = screenLabel.length > 12 ? screenLabel.slice(0, 10) + '…' : screenLabel;
    innerG.appendChild(labelEl);
  }

  const stand = document.createElementNS(SVG_NS, 'rect');
  stand.setAttribute('x', String(-standW / 2));
  stand.setAttribute('y', String(screenH / 2 - standH / 2));
  stand.setAttribute('width', String(standW));
  stand.setAttribute('height', String(standH));
  stand.setAttribute('rx', String(4));
  stand.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  stand.setAttribute('stroke', color);
  stand.setAttribute('stroke-width', String(strokeWidth));
  innerG.appendChild(stand);

  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(screenH / 2 + standH / 2 + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
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
