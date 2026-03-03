/**
 * @preplai/illustrations — Graph2D Component
 * 2D function plotter: axes, grid, explicit/parametric curves, scatter points
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createDarkGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderGraph2D(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity, 2.0);
  const totalW = s * 4;
  const totalH = s * 3;

  const meta = entity.metadata ?? {};
  const color = entity.color ?? getCategoryColor('Graph2D');
  const defs = ensureDefs(parentEl);
  const bgGradId = `grad-graph2d-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createDarkGradient(bgGradId, defs, color);
  const curveType = meta.curveType as string | undefined;
  const isROC = curveType === 'roc';
  const isLoss = curveType === 'loss';
  const domain = (meta.domain as [number, number]) ?? (meta.xRange as [number, number]) ??
    (isROC || isLoss ? (isROC ? [0, 1] : [0, 10]) : [-5, 5]);
  const range = (meta.range as [number, number]) ?? (meta.yRange as [number, number]) ??
    (isROC ? [0, 1] : isLoss ? [0, 2] : [-5, 5]);
  const showGrid = meta.showGrid !== false;
  const xLabel = (meta.xLabel as string) ?? (isROC ? 'FPR' : isLoss ? 'Epoch' : '');
  const yLabel = (meta.yLabel as string) ?? (isROC ? 'TPR' : isLoss ? 'Loss' : '');
  const pad = 30;

  const chartW = totalW - pad * 2;
  const chartH = totalH - pad * 2;

  // Mapping helpers
  const mapX = (v: number) => -totalW / 2 + pad + ((v - domain[0]) / (domain[1] - domain[0])) * chartW;
  const mapY = (v: number) => totalH / 2 - pad - ((v - range[0]) / (range[1] - range[0])) * chartH;

  // ── Background with subtle gradient
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

  // ── Grid lines (more visible)
  if (showGrid) {
    for (let v = Math.ceil(domain[0]); v <= Math.floor(domain[1]); v++) {
      const gx = mapX(v);
      const gl = document.createElementNS(SVG_NS, 'line');
      gl.setAttribute('x1', String(gx));
      gl.setAttribute('y1', String(-totalH / 2 + pad));
      gl.setAttribute('x2', String(gx));
      gl.setAttribute('y2', String(totalH / 2 - pad));
      gl.setAttribute('stroke', '#ffffff12');
      gl.setAttribute('stroke-width', '1');
      innerG.appendChild(gl);
    }
    for (let v = Math.ceil(range[0]); v <= Math.floor(range[1]); v++) {
      const gy = mapY(v);
      const gl = document.createElementNS(SVG_NS, 'line');
      gl.setAttribute('x1', String(-totalW / 2 + pad));
      gl.setAttribute('y1', String(gy));
      gl.setAttribute('x2', String(totalW / 2 - pad));
      gl.setAttribute('y2', String(gy));
      gl.setAttribute('stroke', '#ffffff12');
      gl.setAttribute('stroke-width', '1');
      innerG.appendChild(gl);
    }
  }

  // ── Axes
  const xAxis = document.createElementNS(SVG_NS, 'line');
  xAxis.setAttribute('x1', String(-totalW / 2 + pad));
  xAxis.setAttribute('y1', String(mapY(0)));
  xAxis.setAttribute('x2', String(totalW / 2 - pad));
  xAxis.setAttribute('y2', String(mapY(0)));
  xAxis.setAttribute('stroke', '#ffffff40');
  xAxis.setAttribute('stroke-width', '1.5');
  innerG.appendChild(xAxis);

  const yAxis = document.createElementNS(SVG_NS, 'line');
  yAxis.setAttribute('x1', String(mapX(0)));
  yAxis.setAttribute('y1', String(-totalH / 2 + pad));
  yAxis.setAttribute('x2', String(mapX(0)));
  yAxis.setAttribute('y2', String(totalH / 2 - pad));
  yAxis.setAttribute('stroke', '#ffffff40');
  yAxis.setAttribute('stroke-width', '1.5');
  innerG.appendChild(yAxis);

  // ── Axis labels
  if (xLabel) {
    const xl = document.createElementNS(SVG_NS, 'text');
    xl.setAttribute('x', String(totalW / 2 - pad));
    xl.setAttribute('y', String(mapY(0) - 6));
    xl.setAttribute('text-anchor', 'end');
    xl.setAttribute('fill', `${color}80`);
    xl.setAttribute('font-size', '11');
    xl.textContent = xLabel;
    innerG.appendChild(xl);
  }
  if (yLabel) {
    const yl = document.createElementNS(SVG_NS, 'text');
    yl.setAttribute('x', String(mapX(0) + 6));
    yl.setAttribute('y', String(-totalH / 2 + pad + 4));
    yl.setAttribute('fill', `${color}80`);
    yl.setAttribute('font-size', '11');
    yl.textContent = yLabel;
    innerG.appendChild(yl);
  }

  // ── Curve rendering (explicit expression)
  const expression = meta.expression as string | undefined;
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
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', '2.5');
      innerG.appendChild(path);
    }
  }

  // ── Parametric curve
  if (meta.parametric) {
    const xExpr = (meta.xExpression as string) ?? 'Math.cos(t)';
    const yExpr = (meta.yExpression as string) ?? 'Math.sin(t)';
    const tRange = (meta.tRange as [number, number]) ?? [0, 2 * Math.PI];
    const steps = 200;
    const dt = (tRange[1] - tRange[0]) / steps;
    const parts: string[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = tRange[0] + i * dt;
      try {
        const xv = new Function('t', 'Math', `return (${xExpr})`)(t, Math) as number;
        const yv = new Function('t', 'Math', `return (${yExpr})`)(t, Math) as number;
        if (!isFinite(xv) || !isFinite(yv)) continue;
        parts.push(`${parts.length === 0 ? 'M' : 'L'}${mapX(xv).toFixed(1)},${mapY(yv).toFixed(1)}`);
      } catch { /* skip */ }
    }

    if (parts.length > 0) {
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', parts.join(' '));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#e040fb');
      path.setAttribute('stroke-width', '2.5');
      innerG.appendChild(path);
    }
  }

  // ── ROC curve: connect points as path (TPR vs FPR)
  if (isROC) {
    const rocPoints = (meta.points as Array<{ x: number; y: number }>) ?? [
      { x: 0, y: 0 }, { x: 0.1, y: 0.3 }, { x: 0.3, y: 0.6 }, { x: 0.6, y: 0.85 }, { x: 1, y: 1 },
    ];
    if (rocPoints.length > 0) {
      const pathD = rocPoints.map((p, i) =>
        `${i === 0 ? 'M' : 'L'}${mapX(p.x).toFixed(1)},${mapY(p.y).toFixed(1)}`
      ).join(' ');
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', pathD);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', '2.5');
      innerG.appendChild(path);
    }
  }

  // ── Loss curve: connect points as path (epoch vs loss)
  if (isLoss && !meta.expression) {
    const lossPoints = (meta.points as Array<{ x: number; y: number }>) ?? [
      { x: 0, y: 1.8 }, { x: 2, y: 1.2 }, { x: 4, y: 0.8 }, { x: 6, y: 0.5 }, { x: 8, y: 0.35 }, { x: 10, y: 0.25 },
    ];
    if (lossPoints.length > 0) {
      const pathD = lossPoints.map((p, i) =>
        `${i === 0 ? 'M' : 'L'}${mapX(p.x).toFixed(1)},${mapY(p.y).toFixed(1)}`
      ).join(' ');
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', pathD);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', color);
      path.setAttribute('stroke-width', '2.5');
      innerG.appendChild(path);
    }
  }

  // ── Scatter points (skip if roc/loss drew a path)
  const points = (meta.points as Array<{ x: number; y: number }>) ?? [];
  const drawScatter = !isROC && !isLoss;
  for (const p of drawScatter ? points : []) {
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(mapX(p.x)));
    dot.setAttribute('cy', String(mapY(p.y)));
    dot.setAttribute('r', '4');
    dot.setAttribute('fill', color);
    dot.setAttribute('stroke', '#0b0d14');
    dot.setAttribute('stroke-width', '1.5');
    innerG.appendChild(dot);
  }

  // ── Title label
  if (entity.label) {
    const title = document.createElementNS(SVG_NS, 'text');
    title.setAttribute('x', '0');
    title.setAttribute('y', String(-totalH / 2 + 18));
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
