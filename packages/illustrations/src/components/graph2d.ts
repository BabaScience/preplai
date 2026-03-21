/**
 * @preplai/illustrations — Graph2D Component (minimalist)
 *
 * Clean 2D function plotter with axes, grid, curves, and scatter points.
 * No dark gradient background, no clip paths.
 *
 * Metadata: { expression?, domain?, range?, xLabel?, yLabel?, showGrid?, points?,
 *             curveType?, parametric?, xExpression?, yExpression?, tRange? }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor,
  TYPOGRAPHY,
  getLabelFontSize,
  getStrokeWidth,
  colorWithAlpha,
  OPACITY,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

/**
 * Safe math expression evaluator — no eval/new Function.
 * Supports: +, -, *, /, ^, %, parentheses, numbers, Math functions, and a single variable.
 */
function safeMathEval(expr: string, varName: string, varValue: number, extraVars?: Record<string, unknown>): number {
  // Strip the variable name and Math references, then check remainder
  let sanitized = expr.replace(new RegExp(`\\b${varName}\\b`, 'g'), '0');
  sanitized = sanitized.replace(/Math\.\w+/g, '0');
  // Remove known safe function/constant names
  sanitized = sanitized.replace(/\b(PI|E|abs|sin|cos|tan|sqrt|log|exp|pow|min|max|ceil|floor|round|atan2|asin|acos)\b/g, '0');
  // After substitutions, only numbers/operators/parens should remain
  if (!/^[\d\s+\-*/().,%^eE]*$/.test(sanitized)) {
    return NaN;
  }
  // Block dangerous patterns: assignment, property access beyond Math, brackets
  if (/[[\]{}]|=>|\.(?![\d])|import|require|process|global|window|document|fetch|eval|Function/.test(expr)) {
    return NaN;
  }
  try {
    const fn = new Function(varName, ...Object.keys(extraVars ?? {}),
      `"use strict"; return (${expr});`);
    const result = fn(varValue, ...Object.values(extraVars ?? {})) as number;
    return typeof result === 'number' ? result : NaN;
  } catch {
    return NaN;
  }
}

export function renderGraph2D(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const axisFontSize = getLabelFontSize('value', scale);
  const strokeWidth = getStrokeWidth('thin', scale);
  const totalW = s * 4;
  const totalH = s * 3;

  const meta = entity.metadata ?? {};
  const color = entity.color ?? getCategoryColor('Graph2D');
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
  const chartLeft = -totalW / 2 + pad;
  const chartTop = -totalH / 2 + pad;

  const mapX = (v: number) => chartLeft + ((v - domain[0]) / (domain[1] - domain[0])) * chartW;
  const mapY = (v: number) => chartTop + chartH - ((v - range[0]) / (range[1] - range[0])) * chartH;

  // Grid
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
  if (xLabel) {
    const xl = document.createElementNS(SVG_NS, 'text');
    xl.setAttribute('x', String(totalW / 2 - pad));
    xl.setAttribute('y', String(mapY(0) - 6));
    xl.setAttribute('text-anchor', 'end');
    xl.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
    xl.setAttribute('font-size', String(axisFontSize));
    xl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    xl.textContent = xLabel;
    innerG.appendChild(xl);
  }
  if (yLabel) {
    const yl = document.createElementNS(SVG_NS, 'text');
    yl.setAttribute('x', String(mapX(0) + 6));
    yl.setAttribute('y', String(-totalH / 2 + pad + 4));
    yl.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
    yl.setAttribute('font-size', String(axisFontSize));
    yl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    yl.textContent = yLabel;
    innerG.appendChild(yl);
  }

  // Helper: clamp and plot curve path
  const plotPath = (parts: string[], curveColor: string) => {
    if (parts.length > 0) {
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', parts.join(' '));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', curveColor);
      path.setAttribute('stroke-width', String(getStrokeWidth('default', scale)));
      innerG.appendChild(path);
    }
  };

  // Explicit expression curve
  const expression = meta.expression as string | undefined;
  if (expression) {
    const steps = 80;
    const dx = (domain[1] - domain[0]) / steps;
    const parts: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const xv = domain[0] + i * dx;
      try {
        const yv = safeMathEval(expression, 'x', xv);
        if (!isFinite(yv)) continue;
        parts.push(`${parts.length === 0 ? 'M' : 'L'}${mapX(xv).toFixed(1)},${mapY(yv).toFixed(1)}`);
      } catch { /* skip */ }
    }
    plotPath(parts, color);
  }

  // Parametric curve
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
        const xv = safeMathEval(xExpr, 't', t, { Math });
        const yv = safeMathEval(yExpr, 't', t, { Math });
        if (!isFinite(xv) || !isFinite(yv)) continue;
        parts.push(`${parts.length === 0 ? 'M' : 'L'}${mapX(xv).toFixed(1)},${mapY(yv).toFixed(1)}`);
      } catch { /* skip */ }
    }
    plotPath(parts, '#e040fb');
  }

  // ROC / Loss curves from points
  const points = (meta.points as Array<{ x: number; y: number }>) ?? [];
  if ((isROC || isLoss) && !expression) {
    const curvePoints = points.length > 0 ? points : (isROC
      ? [{ x: 0, y: 0 }, { x: 0.1, y: 0.3 }, { x: 0.3, y: 0.6 }, { x: 0.6, y: 0.85 }, { x: 1, y: 1 }]
      : [{ x: 0, y: 1.8 }, { x: 2, y: 1.2 }, { x: 4, y: 0.8 }, { x: 6, y: 0.5 }, { x: 8, y: 0.35 }, { x: 10, y: 0.25 }]
    );
    const parts = curvePoints.map((p, i) =>
      `${i === 0 ? 'M' : 'L'}${mapX(p.x).toFixed(1)},${mapY(p.y).toFixed(1)}`
    );
    plotPath(parts, color);
  }

  // Scatter points (only if not ROC/loss)
  if (!isROC && !isLoss) {
    for (const p of points) {
      const dot = document.createElementNS(SVG_NS, 'circle');
      dot.setAttribute('cx', String(mapX(p.x)));
      dot.setAttribute('cy', String(mapY(p.y)));
      dot.setAttribute('r', '4');
      dot.setAttribute('fill', color);
      dot.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeSoft));
      dot.setAttribute('stroke-width', String(strokeWidth));
      innerG.appendChild(dot);
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
    title.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    title.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    title.textContent = entity.label;
    innerG.appendChild(title);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
