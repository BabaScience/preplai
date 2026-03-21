/**
 * @preplai/illustrations — CoordinateSystem Component (minimalist)
 *
 * Clean 2D coordinate plane with axes, grid, points, and vectors.
 * No dark gradient background.
 *
 * Metadata: { xRange?, yRange?, gridSpacing?, showGrid?, xLabel?, yLabel?, points?, vectors? }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
  TYPOGRAPHY,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

type PointSpec = { x: number; y: number; label?: string; color?: string };
type VectorSpec = { dx: number; dy: number; label?: string; color?: string };

export function renderCoordinateSystem(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const axisFontSize = getLabelFontSize('value', scale);
  const strokeWidth = getStrokeWidth('thin', scale);
  const totalW = s * 4;
  const totalH = s * 3;

  const meta = entity.metadata ?? {};
  const color = entity.color ?? getCategoryColor('CoordinateSystem');

  const xRange = (meta.xRange as [number, number]) ?? [-5, 5];
  const yRange = (meta.yRange as [number, number]) ?? [-5, 5];
  const gridSpacing = (meta.gridSpacing as number) ?? 1;
  const showGrid = meta.showGrid !== false;
  const xLabel = (meta.xLabel as string) ?? 'x';
  const yLabel = (meta.yLabel as string) ?? 'y';
  const points = (meta.points as PointSpec[]) ?? [];
  const vectors = (meta.vectors as VectorSpec[]) ?? [];
  const pad = 30;

  const chartW = totalW - pad * 2;
  const chartH = totalH - pad * 2;

  const mapX = (v: number) => -totalW / 2 + pad + ((v - xRange[0]) / (xRange[1] - xRange[0])) * chartW;
  const mapY = (v: number) => totalH / 2 - pad - ((v - yRange[0]) / (yRange[1] - yRange[0])) * chartH;

  // Grid lines
  if (showGrid && gridSpacing > 0) {
    const gridColor = colorWithAlpha(color, '18');
    for (let v = Math.ceil(xRange[0] / gridSpacing) * gridSpacing; v <= xRange[1]; v += gridSpacing) {
      const gl = document.createElementNS(SVG_NS, 'line');
      gl.setAttribute('x1', String(mapX(v))); gl.setAttribute('y1', String(-totalH / 2 + pad));
      gl.setAttribute('x2', String(mapX(v))); gl.setAttribute('y2', String(totalH / 2 - pad));
      gl.setAttribute('stroke', gridColor); gl.setAttribute('stroke-width', String(strokeWidth));
      innerG.appendChild(gl);
    }
    for (let v = Math.ceil(yRange[0] / gridSpacing) * gridSpacing; v <= yRange[1]; v += gridSpacing) {
      const gl = document.createElementNS(SVG_NS, 'line');
      gl.setAttribute('x1', String(-totalW / 2 + pad)); gl.setAttribute('y1', String(mapY(v)));
      gl.setAttribute('x2', String(totalW / 2 - pad)); gl.setAttribute('y2', String(mapY(v)));
      gl.setAttribute('stroke', gridColor); gl.setAttribute('stroke-width', String(strokeWidth));
      innerG.appendChild(gl);
    }
  }

  // Axes
  const axisColor = colorWithAlpha(color, OPACITY.strokeMuted);
  const xAxis = document.createElementNS(SVG_NS, 'line');
  xAxis.setAttribute('x1', String(-totalW / 2 + pad)); xAxis.setAttribute('y1', String(mapY(0)));
  xAxis.setAttribute('x2', String(totalW / 2 - pad)); xAxis.setAttribute('y2', String(mapY(0)));
  xAxis.setAttribute('stroke', axisColor); xAxis.setAttribute('stroke-width', String(strokeWidth));
  innerG.appendChild(xAxis);

  const yAxis = document.createElementNS(SVG_NS, 'line');
  yAxis.setAttribute('x1', String(mapX(0))); yAxis.setAttribute('y1', String(-totalH / 2 + pad));
  yAxis.setAttribute('x2', String(mapX(0))); yAxis.setAttribute('y2', String(totalH / 2 - pad));
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

  // Vectors (from origin)
  for (const v of vectors) {
    const ox = mapX(0); const oy = mapY(0);
    const ex = mapX(v.dx); const ey = mapY(v.dy);
    const vecColor = v.color ?? color;

    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(ox)); line.setAttribute('y1', String(oy));
    line.setAttribute('x2', String(ex)); line.setAttribute('y2', String(ey));
    line.setAttribute('stroke', vecColor); line.setAttribute('stroke-width', String(strokeWidth));
    innerG.appendChild(line);

    // Arrowhead
    const angle = Math.atan2(ey - oy, ex - ox);
    const headLen = 8;
    const ax = ex - headLen * Math.cos(angle);
    const ay = ey - headLen * Math.sin(angle);
    const arrow = document.createElementNS(SVG_NS, 'polygon');
    arrow.setAttribute('points',
      `${ex},${ey} ${ax + headLen * 0.4 * Math.cos(angle - Math.PI / 2)},${ay + headLen * 0.4 * Math.sin(angle - Math.PI / 2)} ${ax + headLen * 0.4 * Math.cos(angle + Math.PI / 2)},${ay + headLen * 0.4 * Math.sin(angle + Math.PI / 2)}`
    );
    arrow.setAttribute('fill', vecColor);
    innerG.appendChild(arrow);

    if (v.label) {
      const tl = document.createElementNS(SVG_NS, 'text');
      tl.setAttribute('x', String((ox + ex) / 2 + 6));
      tl.setAttribute('y', String((oy + ey) / 2 - 4));
      tl.setAttribute('fill', vecColor);
      tl.setAttribute('font-size', String(axisFontSize));
      tl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
      tl.textContent = v.label;
      innerG.appendChild(tl);
    }
  }

  // Points
  for (const p of points) {
    const px = mapX(p.x); const py = mapY(p.y);
    const ptColor = p.color ?? color;
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(px)); dot.setAttribute('cy', String(py));
    dot.setAttribute('r', '4');
    dot.setAttribute('fill', ptColor);
    dot.setAttribute('stroke', colorWithAlpha(ptColor, OPACITY.strokeSoft));
    dot.setAttribute('stroke-width', String(strokeWidth));
    innerG.appendChild(dot);

    if (p.label) {
      const pl = document.createElementNS(SVG_NS, 'text');
      pl.setAttribute('x', String(px + 6)); pl.setAttribute('y', String(py + 4));
      pl.setAttribute('fill', ptColor);
      pl.setAttribute('font-size', String(axisFontSize));
      pl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
      pl.textContent = p.label;
      innerG.appendChild(pl);
    }
  }

  // Title
  if (entity.label) {
    const title = document.createElementNS(SVG_NS, 'text');
    title.setAttribute('x', '0');
    title.setAttribute('y', String(-totalH / 2 + LABEL_DEFAULTS.offsetBelow));
    title.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    title.setAttribute('fill', color);
    title.setAttribute('font-size', String(getLabelFontSize('title', scale)));
    title.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    title.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    title.textContent = entity.label;
    innerG.appendChild(title);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
