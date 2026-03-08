/**
 * @preplai/illustrations — GanttChart Component
 *
 * Horizontal bars showing task durations. Uses design tokens, scaleGroup.
 *
 * @see METADATA_SCHEMAS.md#ganttchart
 *
 * Metadata:
 *   tasks: Array<{ name, start, end }>
 *   maxTime?: number
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
import { ganttLayout } from '../layouts/index.js';
import type { VisualEntity } from '@preplai/shared';

interface GanttTask {
  name: string;
  start: number;
  end: number;
}

const BAR_H = 20;
const GAP = 6;
const CHART_W = 120;

export function renderGanttChart(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('GanttChart');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-gantt-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'horizontal', defs);

  const meta = entity.metadata ?? {};
  const tasksData = meta.tasks as GanttTask[] | undefined;
  const maxTime = meta.maxTime as number | undefined;

  const tasks: GanttTask[] = tasksData ?? [
    { name: 'P1', start: 0, end: 3 },
    { name: 'P2', start: 1, end: 5 },
    { name: 'P3', start: 3, end: 6 },
  ];

  const resolvedMaxTime = maxTime ?? Math.max(...tasks.map((t) => t.end), 1);
  const { lineX1, lineX2, bars } = ganttLayout(tasks, {
    barHeight: BAR_H,
    gap: GAP,
    chartWidth: CHART_W,
    maxTime: resolvedMaxTime,
  });

  const totalH = bars ? bars.length * BAR_H + (bars.length - 1) * GAP : 40;
  const pad = 8;

  const scaleGroup = document.createElementNS(SVG_NS, 'g');
  scaleGroup.setAttribute('transform', `scale(${scale})`);

  const strokeWidth = getStrokeWidth('thin', 1);
  const taskFontSize = getLabelFontSize('value', 1) / scale;
  const axisFontSize = getLabelFontSize('index', 1) / scale;

  // Vertical grid lines at 25%, 50%, 75%
  [0.25, 0.5, 0.75].forEach((frac) => {
    const gx = lineX1 + frac * (lineX2 - lineX1);
    const gridLine = document.createElementNS(SVG_NS, 'line');
    gridLine.setAttribute('x1', String(gx));
    gridLine.setAttribute('y1', String(-totalH / 2));
    gridLine.setAttribute('x2', String(gx));
    gridLine.setAttribute('y2', String(totalH / 2));
    gridLine.setAttribute('stroke', colorWithAlpha(color, '20'));
    gridLine.setAttribute('stroke-width', String(strokeWidth * 0.5));
    gridLine.setAttribute('stroke-dasharray', '2 2');
    scaleGroup.appendChild(gridLine);
  });

  const lineY = 0;
  const line = document.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1', String(lineX1));
  line.setAttribute('y1', String(lineY));
  line.setAttribute('x2', String(lineX2));
  line.setAttribute('y2', String(lineY));
  line.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
  line.setAttribute('stroke-width', String(strokeWidth));
  scaleGroup.appendChild(line);

  bars?.forEach(({ x, width, y, label }) => {
    // Task name on the left
    const labelX = lineX1 - 4;
    const labelText = document.createElementNS(SVG_NS, 'text');
    labelText.setAttribute('x', String(labelX));
    labelText.setAttribute('y', String(y));
    labelText.setAttribute('text-anchor', 'end');
    labelText.setAttribute('dominant-baseline', 'central');
    labelText.setAttribute('fill', color);
    labelText.setAttribute('font-size', String(taskFontSize));
    labelText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    labelText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    labelText.textContent = label.length > 12 ? label.slice(0, 10) + '…' : label;
    scaleGroup.appendChild(labelText);

    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(x));
    rect.setAttribute('y', String(y - BAR_H / 2));
    rect.setAttribute('width', String(Math.max(width, 4)));
    rect.setAttribute('height', String(BAR_H));
    rect.setAttribute('rx', String(SHAPES.borderRadius - 2));
    rect.setAttribute('fill', `url(#${gradId})`);
    rect.setAttribute('stroke', color);
    rect.setAttribute('stroke-width', String(strokeWidth));
    scaleGroup.appendChild(rect);
  });

  [0, resolvedMaxTime / 2, resolvedMaxTime].forEach((t, i) => {
    const tx = lineX1 + (t / resolvedMaxTime) * (lineX2 - lineX1);
    const tick = document.createElementNS(SVG_NS, 'text');
    tick.setAttribute('x', String(tx));
    tick.setAttribute('y', String(totalH / 2 + axisFontSize + 4));
    tick.setAttribute('text-anchor', i === 0 ? 'start' : i === 2 ? 'end' : 'middle');
    tick.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
    tick.setAttribute('font-size', String(axisFontSize));
    tick.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    tick.textContent = String(Math.round(t * 10) / 10);
    scaleGroup.appendChild(tick);
  });

  innerG.appendChild(scaleGroup);

  if (entity.label) {
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String(totalH / 2 * scale + pad * scale + LABEL_DEFAULTS.offsetBelow));
    labelEl.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    labelEl.setAttribute('fill', color);
    labelEl.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    labelEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    labelEl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    labelEl.textContent = entity.label;
    innerG.appendChild(labelEl);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
