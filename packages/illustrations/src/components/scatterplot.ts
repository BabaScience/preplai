/**
 * @preplai/illustrations — ScatterPlot Component
 *
 * X-Y scatter plot with axes, grid, optional point labels, and optional fitted curve.
 *
 * Metadata:
 *   points: Array<{ x, y, label? }>
 *   domain?: [number, number] or xRange
 *   range?: [number, number] or yRange
 *   xLabel?: string
 *   yLabel?: string
 *   showGrid?: boolean (default true)
 *   expression?: string — JS expression in x for fitted curve overlay
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createDarkGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  getLabelFontSize,
  TYPOGRAPHY,
  colorWithAlpha,
  OPACITY,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

interface PointSpec {
  x: number;
  y: number;
  label?: string;
}

export function renderScatterPlot(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('ScatterPlot');
  const defs = ensureDefs(parentEl);
  const bgGradId = `grad-scatter-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createDarkGradient(bgGradId, defs, color);

  const meta = entity.metadata ?? {};
  const domain = (meta.domain as [number, number]) ?? (meta.xRange as [number, number]) ?? [-5, 5];
  const range = (meta.range as [number, number]) ?? (meta.yRange as [number, number]) ?? [-5, 5];
  const showGrid = meta.showGrid !== false;
  const xLabel = (meta.xLabel as string) ?? 'x';
  const yLabel = (meta.yLabel as string) ?? 'y';
  const expression = meta.expression as string | undefined;

  const rawPoints = (meta.points as Array<{ x: number; y: number; label?: string }>) ?? [
    { x: 0, y: 0 },
    { x: 1, y: 1 },
    { x: 2, y: 4 },
    { x: -1, y: 1 },
    { x: -2, y: 4 },
  ];
  const points: PointSpec[] = rawPoints.map((p) => ({
    x: Number(p.x),
    y: Number(p.y),
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

  const clipId = `clip-scatter-${entity.id.replace(/[^a-zA-Z0-9-]/g, '')}`;
  let clipEl = defs.querySelector(`#${clipId}`) as SVGClipPathElement | null;
  if (!clipEl) {
    clipEl = document.createElementNS(SVG_NS, 'clipPath');
    clipEl.setAttribute('id', clipId);
    defs.appendChild(clipEl);
  }
  clipEl.innerHTML = '';
  const clipRect = document.createElementNS(SVG_NS, 'rect');
  clipRect.setAttribute('x', String(chartLeft));
  clipRect.setAttribute('y', String(chartTop));
  clipRect.setAttribute('width', String(chartW));
  clipRect.setAttribute('height', String(chartH));
  clipEl.appendChild(clipRect);

  const chartGroup = document.createElementNS(SVG_NS, 'g');
  chartGroup.setAttribute('clip-path', `url(#${clipId})`);

  const bg = document.createElementNS(SVG_NS, 'rect');
  bg.setAttribute('x', String(-totalW / 2));
  bg.setAttribute('y', String(-totalH / 2));
  bg.setAttribute('width', String(totalW));
  bg.setAttribute('height', String(totalH));
  bg.setAttribute('rx', '8');
  bg.setAttribute('fill', `url(#${bgGradId})`);
  bg.setAttribute('stroke', color);
  bg.setAttribute('stroke-width', '1');
  innerG.appendChild(bg);
  innerG.appendChild(chartGroup);

  if (showGrid) {
    for (let v = Math.ceil(domain[0]); v <= Math.floor(domain[1]); v++) {
      const gx = mapX(v);
      const gl = document.createElementNS(SVG_NS, 'line');
      gl.setAttribute('x1', String(gx));
      gl.setAttribute('y1', String(chartTop));
      gl.setAttribute('x2', String(gx));
      gl.setAttribute('y2', String(chartTop + chartH));
      gl.setAttribute('stroke', '#ffffff12');
      gl.setAttribute('stroke-width', '1');
      chartGroup.appendChild(gl);
    }
    for (let v = Math.ceil(range[0]); v <= Math.floor(range[1]); v++) {
      const gy = mapY(v);
      const gl = document.createElementNS(SVG_NS, 'line');
      gl.setAttribute('x1', String(chartLeft));
      gl.setAttribute('y1', String(gy));
      gl.setAttribute('x2', String(chartLeft + chartW));
      gl.setAttribute('y2', String(gy));
      gl.setAttribute('stroke', '#ffffff12');
      gl.setAttribute('stroke-width', '1');
      chartGroup.appendChild(gl);
    }
  }

  const xAxis = document.createElementNS(SVG_NS, 'line');
  xAxis.setAttribute('x1', String(chartLeft));
  xAxis.setAttribute('y1', String(mapY(0)));
  xAxis.setAttribute('x2', String(chartLeft + chartW));
  xAxis.setAttribute('y2', String(mapY(0)));
  xAxis.setAttribute('stroke', '#ffffff40');
  xAxis.setAttribute('stroke-width', '1.5');
  chartGroup.appendChild(xAxis);

  const yAxis = document.createElementNS(SVG_NS, 'line');
  yAxis.setAttribute('x1', String(mapX(0)));
  yAxis.setAttribute('y1', String(chartTop));
  yAxis.setAttribute('x2', String(mapX(0)));
  yAxis.setAttribute('y2', String(chartTop + chartH));
  yAxis.setAttribute('stroke', '#ffffff40');
  yAxis.setAttribute('stroke-width', '1.5');
  chartGroup.appendChild(yAxis);

  const axisFontSize = Math.round(12 * scale);
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

  if (expression) {
    const steps = 80;
    const dx = (domain[1] - domain[0]) / steps;
    const parts: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const xv = domain[0] + i * dx;
      try {
        const yv = new Function('x', `return (${expression})`)(xv) as number;
        if (!isFinite(yv)) continue;
        parts.push(`${parts.length === 0 ? 'M' : 'L'}${mapX(xv).toFixed(1)},${mapY(yv).toFixed(1)}`);
      } catch { /* skip */ }
    }
    if (parts.length > 0) {
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', parts.join(' '));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeSoft));
      path.setAttribute('stroke-width', '2');
      path.setAttribute('stroke-dasharray', '4,4');
      chartGroup.appendChild(path);
    }
  }

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
    dot.setAttribute('stroke', '#0b0d14');
    dot.setAttribute('stroke-width', '1.5');
    chartGroup.appendChild(dot);

    if (p.label) {
      const lbl = document.createElementNS(SVG_NS, 'text');
      lbl.setAttribute('x', String(px + dotR + 4));
      lbl.setAttribute('y', String(py + 4));
      lbl.setAttribute('text-anchor', 'start');
      lbl.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeFull));
      lbl.setAttribute('font-size', String(labelFontSize));
      lbl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
      lbl.textContent = p.label.length > 12 ? p.label.slice(0, 10) + '…' : p.label;
      chartGroup.appendChild(lbl);
    }
  }

  if (entity.label) {
    const title = document.createElementNS(SVG_NS, 'text');
    title.setAttribute('x', '0');
    title.setAttribute('y', String(-totalH / 2 + 16));
    title.setAttribute('text-anchor', 'middle');
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
