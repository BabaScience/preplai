/**
 * @preplai/illustrations — Big O Component
 * Complexity growth curves: O(1), O(log n), O(n), O(n log n), O(n²), O(2^n)
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createDarkGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

type BigOCurve =
  | 'O(1)'
  | 'O(log n)'
  | 'O(n)'
  | 'O(n log n)'
  | 'O(n²)'
  | 'O(2^n)';

const CURVE_COLORS: Record<string, string> = {
  'O(1)': '#4ade80',
  'O(log n)': '#22d3ee',
  'O(n)': '#60a5fa',
  'O(n log n)': '#a78bfa',
  'O(n²)': '#f472b6',
  'O(2^n)': '#f87171',
};

function evalCurve(name: BigOCurve, n: number): number {
  if (n <= 0) return 0;
  switch (name) {
    case 'O(1)':
      return 1;
    case 'O(log n)':
      return Math.log2(n + 1);
    case 'O(n)':
      return n;
    case 'O(n log n)':
      return n * Math.log2(n + 1);
    case 'O(n²)':
      return n * n;
    case 'O(2^n)':
      return Math.pow(2, Math.min(n, 8)); // Cap to avoid overflow
    default:
      return 0;
  }
}

const DEFAULT_CURVES: BigOCurve[] = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n²)'];

export function renderBigO(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity, 2.0);
  const totalW = s * 4;
  const totalH = s * 3;

  const meta = entity.metadata ?? {};
  const color = entity.color ?? getCategoryColor('BigO');
  const defs = ensureDefs(parentEl);
  const bgGradId = `grad-bigo-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createDarkGradient(bgGradId, defs, color);

  const curves = (meta.curves as BigOCurve[]) ?? DEFAULT_CURVES;
  const domain: [number, number] = (meta.domain as [number, number]) ?? [0, 10];
  const pad = 30;

  // Compute max Y across all curves for scaling
  const steps = 60;
  const dx = (domain[1] - domain[0]) / steps;
  let maxY = 1;
  for (const curveName of curves) {
    for (let i = 0; i <= steps; i++) {
      const n = domain[0] + i * dx;
      const y = evalCurve(curveName, n);
      if (isFinite(y)) maxY = Math.max(maxY, y);
    }
  }
  const range: [number, number] = [0, maxY * 1.05];

  const chartW = totalW - pad * 2;
  const chartH = totalH - pad * 2;
  const chartLeft = -totalW / 2 + pad;
  const chartTop = -totalH / 2 + pad;

  const mapX = (v: number) =>
    chartLeft + ((v - domain[0]) / (domain[1] - domain[0])) * chartW;
  const mapY = (v: number) =>
    chartTop + chartH - ((v - range[0]) / (range[1] - range[0])) * chartH;

  // Clip path
  const clipId = `clip-bigo-${Math.random().toString(36).slice(2, 9)}`;
  const clipPath = document.createElementNS(SVG_NS, 'clipPath');
  clipPath.setAttribute('id', clipId);
  const clipRect = document.createElementNS(SVG_NS, 'rect');
  clipRect.setAttribute('x', String(chartLeft));
  clipRect.setAttribute('y', String(chartTop));
  clipRect.setAttribute('width', String(chartW));
  clipRect.setAttribute('height', String(chartH));
  clipPath.appendChild(clipRect);
  defs.appendChild(clipPath);

  const chartGroup = document.createElementNS(SVG_NS, 'g');
  chartGroup.setAttribute('clip-path', `url(#${clipId})`);

  // Background
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

  // Grid
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
  for (let v = 0; v <= range[1]; v += Math.max(1, Math.ceil(range[1] / 5))) {
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

  // Axes
  const xAxis = document.createElementNS(SVG_NS, 'line');
  xAxis.setAttribute('x1', String(chartLeft));
  xAxis.setAttribute('y1', String(mapY(0)));
  xAxis.setAttribute('x2', String(chartLeft + chartW));
  xAxis.setAttribute('y2', String(mapY(0)));
  xAxis.setAttribute('stroke', '#ffffff40');
  xAxis.setAttribute('stroke-width', '1.5');
  chartGroup.appendChild(xAxis);

  const yAxis = document.createElementNS(SVG_NS, 'line');
  yAxis.setAttribute('x1', String(mapX(domain[0])));
  yAxis.setAttribute('y1', String(chartTop));
  yAxis.setAttribute('x2', String(mapX(domain[0])));
  yAxis.setAttribute('y2', String(chartTop + chartH));
  yAxis.setAttribute('stroke', '#ffffff40');
  yAxis.setAttribute('stroke-width', '1.5');
  chartGroup.appendChild(yAxis);

  // Axis labels
  const xLabel = document.createElementNS(SVG_NS, 'text');
  xLabel.setAttribute('x', String(chartLeft + chartW - 4));
  xLabel.setAttribute('y', String(mapY(0) + 14));
  xLabel.setAttribute('text-anchor', 'end');
  xLabel.setAttribute('fill', `${color}80`);
  xLabel.setAttribute('font-size', '11');
  xLabel.textContent = 'n';
  innerG.appendChild(xLabel);

  const yLabel = document.createElementNS(SVG_NS, 'text');
  yLabel.setAttribute('x', String(chartLeft - 6));
  yLabel.setAttribute('y', String(chartTop + 4));
  yLabel.setAttribute('text-anchor', 'end');
  yLabel.setAttribute('fill', `${color}80`);
  yLabel.setAttribute('font-size', '11');
  yLabel.textContent = 'Operations';
  innerG.appendChild(yLabel);

  // Plot each curve
  for (const curveName of curves) {
    const curveColor = CURVE_COLORS[curveName] ?? color;
    const parts: string[] = [];

    for (let i = 0; i <= steps; i++) {
      const n = domain[0] + i * dx;
      const y = evalCurve(curveName, n);
      if (!isFinite(y)) continue;
      parts.push(
        `${parts.length === 0 ? 'M' : 'L'}${mapX(n).toFixed(1)},${mapY(y).toFixed(1)}`
      );
    }

    if (parts.length > 0) {
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', parts.join(' '));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', curveColor);
      path.setAttribute('stroke-width', '2.5');
      chartGroup.appendChild(path);
    }
  }

  // Legend
  const legendY = -totalH / 2 + 14;
  const legendItems = curves.filter((c, i, a) => a.indexOf(c) === i);
  const legendSpacing = totalW / (legendItems.length + 1);
  legendItems.forEach((curveName, i) => {
    const lx = -totalW / 2 + legendSpacing * (i + 1);
    const lineColor = CURVE_COLORS[curveName] ?? color;

    const dot = document.createElementNS(SVG_NS, 'line');
    dot.setAttribute('x1', String(lx - 12));
    dot.setAttribute('y1', String(legendY));
    dot.setAttribute('x2', String(lx - 4));
    dot.setAttribute('y2', String(legendY));
    dot.setAttribute('stroke', lineColor);
    dot.setAttribute('stroke-width', '2.5');
    innerG.appendChild(dot);

    const txt = document.createElementNS(SVG_NS, 'text');
    txt.setAttribute('x', String(lx));
    txt.setAttribute('y', String(legendY + 4));
    txt.setAttribute('text-anchor', 'start');
    txt.setAttribute('fill', lineColor);
    txt.setAttribute('font-size', '10');
    txt.textContent = curveName;
    innerG.appendChild(txt);
  });

  // Title
  if (entity.label) {
    const title = document.createElementNS(SVG_NS, 'text');
    title.setAttribute('x', '0');
    title.setAttribute('y', String(-totalH / 2 - 8));
    title.setAttribute('text-anchor', 'middle');
    title.setAttribute('fill', color);
    title.setAttribute('font-size', String(TYPOGRAPHY.fontSizeTitle));
    title.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    title.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    title.textContent = entity.label;
    innerG.appendChild(title);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
