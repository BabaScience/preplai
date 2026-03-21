/**
 * @preplai/illustrations — BigO Component (minimalist)
 *
 * Clean complexity growth curves. No dark gradient background, no clip paths.
 * Metadata: { curves?: string[], domain?: [number, number] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor,
  TYPOGRAPHY,
  COLORS,
  LABEL_DEFAULTS,
  getLabelFontSize,
  getStrokeWidth,
  colorWithAlpha,
  OPACITY,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

type BigOCurve = 'O(1)' | 'O(log n)' | 'O(n)' | 'O(n log n)' | 'O(n\u00B2)' | 'O(2^n)';

const CURVE_COLORS: Record<string, string> = {
  'O(1)': COLORS.green,
  'O(log n)': COLORS.teal,
  'O(n)': COLORS.blue,
  'O(n log n)': COLORS.violet,
  'O(n\u00B2)': COLORS.pink,
  'O(2^n)': COLORS.red,
};

function evalCurve(name: BigOCurve, n: number): number {
  if (n <= 0) return 0;
  switch (name) {
    case 'O(1)': return 1;
    case 'O(log n)': return Math.log2(n + 1);
    case 'O(n)': return n;
    case 'O(n log n)': return n * Math.log2(n + 1);
    case 'O(n\u00B2)': return n * n;
    case 'O(2^n)': return Math.pow(2, Math.min(n, 8));
    default: return 0;
  }
}

const DEFAULT_CURVES: BigOCurve[] = ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)', 'O(n\u00B2)'];

export function renderBigO(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const axisFontSize = getLabelFontSize('value', scale);
  const legendFontSize = getLabelFontSize('inline', scale);
  const strokeWidth = getStrokeWidth('thin', scale);
  const totalW = s * 4;
  const totalH = s * 3;

  const color = entity.color ?? getCategoryColor('BigO');
  const meta = entity.metadata ?? {};
  const curves = (meta.curves as BigOCurve[]) ?? DEFAULT_CURVES;
  const domain: [number, number] = (meta.domain as [number, number]) ?? [0, 10];
  const pad = 30;

  // Compute max Y for scaling
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

  const mapX = (v: number) => chartLeft + ((v - domain[0]) / (domain[1] - domain[0])) * chartW;
  const mapY = (v: number) => chartTop + chartH - ((v - range[0]) / (range[1] - range[0])) * chartH;

  // Grid
  const gridColor = colorWithAlpha(color, '18');
  for (let v = Math.ceil(domain[0]); v <= Math.floor(domain[1]); v++) {
    const gl = document.createElementNS(SVG_NS, 'line');
    gl.setAttribute('x1', String(mapX(v))); gl.setAttribute('y1', String(chartTop));
    gl.setAttribute('x2', String(mapX(v))); gl.setAttribute('y2', String(chartTop + chartH));
    gl.setAttribute('stroke', gridColor); gl.setAttribute('stroke-width', '1');
    innerG.appendChild(gl);
  }

  // Axes
  const axisColor = colorWithAlpha(color, OPACITY.strokeMuted);
  const xAxis = document.createElementNS(SVG_NS, 'line');
  xAxis.setAttribute('x1', String(chartLeft)); xAxis.setAttribute('y1', String(mapY(0)));
  xAxis.setAttribute('x2', String(chartLeft + chartW)); xAxis.setAttribute('y2', String(mapY(0)));
  xAxis.setAttribute('stroke', axisColor); xAxis.setAttribute('stroke-width', String(strokeWidth));
  innerG.appendChild(xAxis);

  const yAxis = document.createElementNS(SVG_NS, 'line');
  yAxis.setAttribute('x1', String(mapX(domain[0]))); yAxis.setAttribute('y1', String(chartTop));
  yAxis.setAttribute('x2', String(mapX(domain[0]))); yAxis.setAttribute('y2', String(chartTop + chartH));
  yAxis.setAttribute('stroke', axisColor); yAxis.setAttribute('stroke-width', String(strokeWidth));
  innerG.appendChild(yAxis);

  // Axis labels
  const axisLabelColor = colorWithAlpha(color, OPACITY.strokeSoft);
  const nLabel = document.createElementNS(SVG_NS, 'text');
  nLabel.setAttribute('x', String(chartLeft + chartW - 4));
  nLabel.setAttribute('y', String(mapY(0) + 14));
  nLabel.setAttribute('text-anchor', 'end');
  nLabel.setAttribute('fill', axisLabelColor);
  nLabel.setAttribute('font-size', String(axisFontSize));
  nLabel.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  nLabel.textContent = 'n';
  innerG.appendChild(nLabel);

  // Plot curves
  for (const curveName of curves) {
    const curveColor = CURVE_COLORS[curveName] ?? color;
    const parts: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const n = domain[0] + i * dx;
      const y = evalCurve(curveName, n);
      if (!isFinite(y)) continue;
      const px = mapX(n); const py = mapY(y);
      // Clamp to chart area
      if (py < chartTop || py > chartTop + chartH) continue;
      parts.push(`${parts.length === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`);
    }
    if (parts.length > 0) {
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', parts.join(' '));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', curveColor);
      path.setAttribute('stroke-width', String(getStrokeWidth('default', scale)));
      innerG.appendChild(path);
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
    dot.setAttribute('x1', String(lx - 12)); dot.setAttribute('y1', String(legendY));
    dot.setAttribute('x2', String(lx - 4)); dot.setAttribute('y2', String(legendY));
    dot.setAttribute('stroke', lineColor);
    dot.setAttribute('stroke-width', String(getStrokeWidth('default', scale)));
    innerG.appendChild(dot);

    const txt = document.createElementNS(SVG_NS, 'text');
    txt.setAttribute('x', String(lx)); txt.setAttribute('y', String(legendY + 4));
    txt.setAttribute('text-anchor', 'start');
    txt.setAttribute('fill', lineColor);
    txt.setAttribute('font-size', String(legendFontSize));
    txt.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    txt.textContent = curveName;
    innerG.appendChild(txt);
  });

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
