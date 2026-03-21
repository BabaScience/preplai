/**
 * @preplai/illustrations — GanttChart Component (minimalist)
 *
 * Clean horizontal task bars. No scaleGroup wrapper, no ganttLayout import.
 *
 * Metadata: { tasks: [{ name, start, end }], maxTime?: number }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
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

interface GanttTask { name: string; start: number; end: number; }

export function renderGanttChart(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('GanttChart');
  const strokeWidth = getStrokeWidth('thin', scale);

  const meta = entity.metadata ?? {};
  const tasks: GanttTask[] = (meta.tasks as GanttTask[]) ?? [
    { name: 'P1', start: 0, end: 3 },
    { name: 'P2', start: 1, end: 5 },
    { name: 'P3', start: 3, end: 6 },
  ];

  const maxTime = (meta.maxTime as number) ?? Math.max(...tasks.map((t) => t.end), 1);
  const n = tasks.length;

  const barH = 16 * scale;
  const gap = 6 * scale;
  const labelW = 50 * scale;
  const chartW = s * 3;
  const barAreaW = chartW - labelW;
  const totalH = n * barH + (n - 1) * gap;

  // Grid lines (25%, 50%, 75%)
  [0.25, 0.5, 0.75].forEach((frac) => {
    const gx = -chartW / 2 + labelW + frac * barAreaW;
    const gl = document.createElementNS(SVG_NS, 'line');
    gl.setAttribute('x1', String(gx)); gl.setAttribute('y1', String(-totalH / 2));
    gl.setAttribute('x2', String(gx)); gl.setAttribute('y2', String(totalH / 2));
    gl.setAttribute('stroke', colorWithAlpha(color, '20'));
    gl.setAttribute('stroke-width', String(strokeWidth * 0.5));
    gl.setAttribute('stroke-dasharray', '2 2');
    innerG.appendChild(gl);
  });

  // Tasks
  tasks.forEach((task, i) => {
    const y = -totalH / 2 + i * (barH + gap) + barH / 2;
    const barX = -chartW / 2 + labelW + (task.start / maxTime) * barAreaW;
    const barW = ((task.end - task.start) / maxTime) * barAreaW;

    // Task name
    const nameText = document.createElementNS(SVG_NS, 'text');
    nameText.setAttribute('x', String(-chartW / 2 + labelW - 6));
    nameText.setAttribute('y', String(y + 4));
    nameText.setAttribute('text-anchor', 'end');
    nameText.setAttribute('fill', color);
    nameText.setAttribute('font-size', String(getLabelFontSize('value', scale)));
    nameText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    nameText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    nameText.textContent = task.name.length > 12 ? task.name.slice(0, 10) + '\u2026' : task.name;
    innerG.appendChild(nameText);

    // Bar
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(barX));
    rect.setAttribute('y', String(y - barH / 2));
    rect.setAttribute('width', String(Math.max(barW, 4)));
    rect.setAttribute('height', String(barH));
    rect.setAttribute('rx', String(SHAPES.borderRadius));
    rect.setAttribute('fill', colorWithAlpha(color, OPACITY.fillMedium));
    rect.setAttribute('stroke', color);
    rect.setAttribute('stroke-width', String(strokeWidth));
    innerG.appendChild(rect);
  });

  // Time axis ticks
  const tickFontSize = getLabelFontSize('index', scale);
  [0, maxTime / 2, maxTime].forEach((t, i) => {
    const tx = -chartW / 2 + labelW + (t / maxTime) * barAreaW;
    const tick = document.createElementNS(SVG_NS, 'text');
    tick.setAttribute('x', String(tx));
    tick.setAttribute('y', String(totalH / 2 + tickFontSize + 4));
    tick.setAttribute('text-anchor', i === 0 ? 'start' : i === 2 ? 'end' : 'middle');
    tick.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
    tick.setAttribute('font-size', String(tickFontSize));
    tick.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    tick.textContent = String(Math.round(t * 10) / 10);
    innerG.appendChild(tick);
  });

  // Label below
  if (entity.label) {
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String(totalH / 2 + tickFontSize + LABEL_DEFAULTS.offsetBelow));
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
