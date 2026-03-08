/**
 * @preplai/illustrations — GanttChart Component
 * Horizontal bars showing task durations
 *
 * Metadata: { tasks: [{ name, start, end }], maxTime?: number }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import { ganttLayout } from '../layouts/index.js';
import type { VisualEntity } from '@preplai/shared';

interface GanttTask {
  name: string;
  start: number;
  end: number;
}

export function renderGanttChart(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const taskFontSize = Math.round(12 * scale);
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

  const { lineX1, lineY, lineX2, bars } = ganttLayout(tasks, {
    barHeight: 22,
    gap: 6,
    chartWidth: s * 2.4,
    maxTime: maxTime ?? Math.max(...tasks.map(t => t.end), 1),
  });

  // Base line
  const line = document.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1', String(lineX1));
  line.setAttribute('y1', String(lineY));
  line.setAttribute('x2', String(lineX2));
  line.setAttribute('y2', String(lineY));
  line.setAttribute('stroke', `${color}60`);
  line.setAttribute('stroke-width', '1');
  innerG.appendChild(line);

  // Task bars
  bars?.forEach(({ x, width, y, label }) => {
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(x));
    rect.setAttribute('y', String(y - 11));
    rect.setAttribute('width', String(Math.max(width, 4)));
    rect.setAttribute('height', '22');
    rect.setAttribute('rx', String(SHAPES.borderRadius - 2));
    rect.setAttribute('fill', `url(#${gradId})`);
    rect.setAttribute('stroke', color);
    rect.setAttribute('stroke-width', String(SHAPES.strokeWidthThin));
    innerG.appendChild(rect);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(x + Math.max(width, 4) / 2));
    text.setAttribute('y', String(y + 4));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(taskFontSize));
    text.setAttribute('font-weight', '600');
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = label;
    innerG.appendChild(text);
  });

  if (entity.label) {
    const totalH = bars ? bars.length * 22 + (bars.length - 1) * 6 : 40;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(totalH / 2 + 20));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
