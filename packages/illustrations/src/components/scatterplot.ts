/**
 * @preplai/illustrations — ScatterPlot Component (minimalist)
 *
 * Clean X-Y scatter plot with axes, optional grid, point labels.
 * No dark gradient background, no clip paths.
 *
 * Metadata: { points: [{ x, y, label? }], domain?, range?, xLabel?, yLabel?, showGrid? }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor,
  getLabelFontSize,
  getStrokeWidth,
  TYPOGRAPHY,
  colorWithAlpha,
  OPACITY,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

interface PointSpec { x: number; y: number; label?: string; }

export function renderScatterPlot(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('ScatterPlot');
  const strokeWidth = getStrokeWidth('thin', scale);

  const meta = entity.metadata ?? {};
  const domain = (meta.domain as [number, number]) ?? (meta.xRange as [number, number]) ?? [-5, 5];
  const range = (meta.range as [number, number]) ?? (meta.yRange as [number, number]) ?? [-5, 5];
  const showGrid = meta.showGrid !== false;
  const xLabel = (meta.xLabel as string) ?? 'x';
  const yLabel = (meta.yLabel as string) ?? 'y';

  const rawPoints = (meta.points as PointSpec[]) ?? [
    { x: 0, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 4 }, { x: -1, y: 1 }, { x: -2, y: 4 },
  ];
  const points: PointSpec[] = rawPoints.map((p) => ({
    x: Number(p.x), y: Number(p.y),
    label: typeof p.label === 'string' ? p.label : undefined,
  }));

  const pad = 28;
  const totalW = s * 4;
  const totalH = s * 3;
  const chartW = totalW - pad * 2;
  const chartH = totalH - pad * 2;
  const chartLeft = -totalW / 2 + pad;
  const chartTop = -totalH / 2 + pad;

  const mapX = (v: number) => chartLeft + ((v - domain[0]) / (domain[1] - domain[0] || 1)) * chartW;
  const mapY = (v: number) => chartTop + chartH - ((v - range[0]) / (range[1] - range[0] || 1)) * chartH;

  // Grid lines
  if (showGrid) {
    const gridColor = colorWithAlpha(color, '18');
    for (let v = Math.ceil(domain[0]); v <= Math.floor(domain[1]); v++) {
      const gl = document.createElementNS(SVG_NS, 'line');
      gl.setAttribute('x1', String(mapX(v))); gl.setAttribute('y1', String(chartTop));
      gl.setAttribute('x2', String(mapX(v))); gl.setAttribute('y2', String(chartTop + chartH));
      gl.setAttribute('stroke', gridColor); gl.setAttribute('stroke-width', '1');
      innerG.appendChild(gl);
    }
    for (let v = Math.ceil(range[0]); v <= Math.floor(range[1]); v++) {
      const gl = document.createElementNS(SVG_NS, 'line');
      gl.setAttribute('x1', String(chartLeft)); gl.setAttribute('y1', String(mapY(v)));
      gl.setAttribute('x2', String(chartLeft + chartW)); gl.setAttribute('y2', String(mapY(v)));
      gl.setAttribute('stroke', gridColor); gl.setAttribute('stroke-width', '1');
      innerG.appendChild(gl);
    }
  }

  // Axes
  const axisColor = colorWithAlpha(color, OPACITY.strokeMuted);
  const xAxis = document.createElementNS(SVG_NS, 'line');
  xAxis.setAttribute('x1', String(chartLeft)); xAxis.setAttribute('y1', String(mapY(0)));
  xAxis.setAttribute('x2', String(chartLeft + chartW)); xAxis.setAttribute('y2', String(mapY(0)));
  xAxis.setAttribute('stroke', axisColor); xAxis.setAttribute('stroke-width', String(strokeWidth));
  innerG.appendChild(xAxis);

  const yAxis = document.createElementNS(SVG_NS, 'line');
  yAxis.setAttribute('x1', String(mapX(0))); yAxis.setAttribute('y1', String(chartTop));
  yAxis.setAttribute('x2', String(mapX(0))); yAxis.setAttribute('y2', String(chartTop + chartH));
  yAxis.setAttribute('stroke', axisColor); yAxis.setAttribute('stroke-width', String(strokeWidth));
  innerG.appendChild(yAxis);

  // Axis labels
  const axisFontSize = getLabelFontSize('value', scale);
  if (xLabel) {
    const xl = document.createElementNS(SVG_NS, 'text');
    xl.setAttribute('x', String(chartLeft + chartW - 4));
    xl.setAttribute('y', String(mapY(0) + 14));
    xl.setAttribute('text-anchor', 'end');
    xl.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
    xl.setAttribute('font-size', String(axisFontSize));
    xl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    xl.textContent = xLabel;
    innerG.appendChild(xl);
  }
  if (yLabel) {
    const yl = document.createElementNS(SVG_NS, 'text');
    yl.setAttribute('x', String(mapX(0) - 6));
    yl.setAttribute('y', String(chartTop + 4));
    yl.setAttribute('text-anchor', 'end');
    yl.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
    yl.setAttribute('font-size', String(axisFontSize));
    yl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    yl.textContent = yLabel;
    innerG.appendChild(yl);
  }

  // Points
  const dotR = Math.max(3, 5 * scale);
  const labelFontSize = getLabelFontSize('index', scale);
  for (const p of points) {
    const px = mapX(p.x);
    const py = mapY(p.y);
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(px));
    dot.setAttribute('cy', String(py));
    dot.setAttribute('r', String(dotR));
    dot.setAttribute('fill', color);
    dot.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeSoft));
    dot.setAttribute('stroke-width', String(strokeWidth));
    innerG.appendChild(dot);

    if (p.label) {
      const lbl = document.createElementNS(SVG_NS, 'text');
      lbl.setAttribute('x', String(px + dotR + 4));
      lbl.setAttribute('y', String(py + 4));
      lbl.setAttribute('text-anchor', 'start');
      lbl.setAttribute('fill', color);
      lbl.setAttribute('font-size', String(labelFontSize));
      lbl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
      lbl.textContent = p.label.length > 12 ? p.label.slice(0, 10) + '\u2026' : p.label;
      innerG.appendChild(lbl);
    }
  }

  // Title
  if (entity.label) {
    const title = document.createElementNS(SVG_NS, 'text');
    title.setAttribute('x', '0');
    title.setAttribute('y', String(-totalH / 2 - 8));
    title.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    title.setAttribute('fill', color);
    title.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    title.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    title.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    title.textContent = entity.label;
    innerG.appendChild(title);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
