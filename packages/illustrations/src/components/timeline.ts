/**
 * @preplai/illustrations — Timeline Component
 *
 * Horizontal line + markers. Use for: event sequences, process steps, time flow.
 *
 * Metadata: { events?: [{ label: string, position?: number }] } — position 0–1 along line
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, getLabelFontSize, TYPOGRAPHY } from '../design-tokens.js';
import { timelineLayout } from '../layouts/index.js';
import type { VisualEntity } from '@preplai/shared';

interface TimelineEvent {
  label: string;
  position?: number;
}

function parseEvents(meta: Record<string, unknown>): TimelineEvent[] {
  const raw = meta.events as TimelineEvent[] | undefined;
  if (!Array.isArray(raw) || raw.length === 0) return [];
  return raw.slice(0, 8).map((e) => ({
    label: String(e?.label ?? ''),
    position: typeof e?.position === 'number' ? Math.max(0, Math.min(1, e.position)) : undefined,
  })).filter((e) => e.label || e.position !== undefined);
}

export function renderTimeline(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Timeline');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-timeline-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'horizontal', defs);

  const lineLen = s * 1.6;
  const d = s / 6;
  const halfLen = lineLen / 2;

  const line = document.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1', String(-halfLen));
  line.setAttribute('y1', String(0));
  line.setAttribute('x2', String(halfLen));
  line.setAttribute('y2', String(0));
  line.setAttribute('stroke', `url(#${gradId})`);
  line.setAttribute('stroke-width', '2');
  innerG.appendChild(line);

  const meta = entity.metadata ?? {};
  const events = parseEvents(meta);

  if (events.length > 0) {
    const fontSize = getLabelFontSize('index', scale);
    events.forEach((ev, i) => {
      const pos = ev.position ?? (events.length === 1 ? 0.5 : (i + 1) / (events.length + 1));
      const x = -halfLen + pos * lineLen;
      const diamond = document.createElementNS(SVG_NS, 'polygon');
      diamond.setAttribute('points', `${x},${-d} ${x + d},0 ${x},${d} ${x - d},0`);
      diamond.setAttribute('fill', `${color}40`);
      diamond.setAttribute('stroke', color);
      diamond.setAttribute('stroke-width', '2');
      innerG.appendChild(diamond);
      if (ev.label) {
        const text = document.createElementNS(SVG_NS, 'text');
        text.setAttribute('x', String(x));
        text.setAttribute('y', String(d + 14));
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', color);
        text.setAttribute('font-size', String(fontSize));
        text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
        text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
        text.textContent = ev.label.length > 10 ? ev.label.slice(0, 9) + '…' : ev.label;
        innerG.appendChild(text);
      }
    });
  } else {
    const { markers } = timelineLayout(lineLen, d, true);
    if (markers && markers.length > 0) {
      const diamond = document.createElementNS(SVG_NS, 'polygon');
      const m = markers[0];
      diamond.setAttribute('points', `${m.x},${-m.d} ${m.x + m.d},0 ${m.x},${m.d} ${m.x - m.d},0`);
      diamond.setAttribute('fill', `${color}40`);
      diamond.setAttribute('stroke', color);
      diamond.setAttribute('stroke-width', '2');
      innerG.appendChild(diamond);
    }
    if (entity.label) {
      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', '0');
      text.setAttribute('y', String(d + 18));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', color);
      text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
      text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
      text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
      text.textContent = entity.label;
      innerG.appendChild(text);
    }
  }

  if (entity.label && events.length > 0) {
    const totalH = d + 28;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(totalH));
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
