/**
 * @preplai/illustrations — Timeline Layout Primitive
 *
 * Horizontal line + markers. Supports simple timeline (single marker)
 * and Gantt-style (multiple task bars).
 */

export interface TimelineMarker {
  x: number;
  d: number; // diamond half-size
}

export interface GanttTask {
  name: string;
  start: number;
  end: number;
}

export interface GanttBar {
  x: number;
  width: number;
  y: number;
  label: string;
}

export interface TimelineLayoutResult {
  lineX1: number;
  lineY: number;
  lineX2: number;
  markers?: TimelineMarker[];
  bars?: GanttBar[];
}

const DEFAULT_LINE_LEN = 80;
const DEFAULT_DIAMOND_SIZE = 8;

/**
 * Simple timeline: horizontal line + optional single diamond marker.
 */
export function timelineLayout(
  lineLength: number = DEFAULT_LINE_LEN,
  diamondSize: number = DEFAULT_DIAMOND_SIZE,
  markerAtCenter: boolean = true,
): TimelineLayoutResult {
  const halfLen = lineLength / 2;
  const markers: TimelineMarker[] = markerAtCenter
    ? [{ x: 0, d: diamondSize }]
    : [];
  return {
    lineX1: -halfLen,
    lineY: 0,
    lineX2: halfLen,
    markers,
  };
}

/**
 * Gantt chart layout: horizontal line + task bars.
 * Tasks have start/end in 0-1 normalized range (or absolute if maxTime provided).
 */
export function ganttLayout(
  tasks: GanttTask[],
  options: { barHeight?: number; gap?: number; chartWidth?: number; maxTime?: number } = {},
): TimelineLayoutResult {
  const barH = options.barHeight ?? 20;
  const gap = options.gap ?? 4;
  const chartW = options.chartWidth ?? 120;
  const maxTime = options.maxTime ?? Math.max(...tasks.map(t => t.end), 1);

  const totalH = tasks.length * barH + (tasks.length - 1) * gap;
  const startY = -totalH / 2 + barH / 2;

  const bars: GanttBar[] = tasks.map((task, i) => {
    const x = -chartW / 2 + (task.start / maxTime) * chartW;
    const width = ((task.end - task.start) / maxTime) * chartW;
    const y = startY + i * (barH + gap);
    return { x, width, y, label: task.name };
  });

  return {
    lineX1: -chartW / 2,
    lineY: 0,
    lineX2: chartW / 2,
    bars,
  };
}
