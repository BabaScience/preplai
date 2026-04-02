/**
 * @preplai/illustrations — CoordinateSystem Component (Cinematic Depth)
 *
 * Clean 2D coordinate plane with axes, grid, points, and vectors.
 * 5 Cinematic Pillars: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (float + breathe).
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
import { resolveColorCascade } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

type PointSpec = { x: number; y: number; label?: string; color?: string };
type VectorSpec = { dx: number; dy: number; label?: string; color?: string };

export function renderCoordinateSystem(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const cc = resolveColorCascade(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const axisFontSize = getLabelFontSize('value', scale);
  const strokeWidth = getStrokeWidth('thin', scale);
  const totalW = s * 4;
  const totalH = s * 3;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

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

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ────────────────────────────────────
  const haloId = `coordsys-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const haloGrad = document.createElementNS(SVG_NS, 'radialGradient');
    haloGrad.setAttribute('id', haloId);
    haloGrad.setAttribute('cx', '38%'); haloGrad.setAttribute('cy', '38%');
    haloGrad.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.13');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0');
    haloGrad.appendChild(s1); haloGrad.appendChild(s2);
    defs.appendChild(haloGrad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', '0');
  halo.setAttribute('cy', '0');
  halo.setAttribute('rx', String(totalW * 0.45));
  halo.setAttribute('ry', String(totalH * 0.4));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ───────────────────────────────────────────
  const gsId = `coordsys-gshadow-${entityId}`;
  if (!defs.querySelector(`#${gsId}`)) {
    const gsg = document.createElementNS(SVG_NS, 'radialGradient');
    gsg.setAttribute('id', gsId);
    gsg.setAttribute('cx', '50%'); gsg.setAttribute('cy', '50%'); gsg.setAttribute('r', '50%');
    const gs1 = document.createElementNS(SVG_NS, 'stop');
    gs1.setAttribute('offset', '0%'); gs1.setAttribute('stop-color', '#000000'); gs1.setAttribute('stop-opacity', '0.18');
    const gs2 = document.createElementNS(SVG_NS, 'stop');
    gs2.setAttribute('offset', '100%'); gs2.setAttribute('stop-color', '#000000'); gs2.setAttribute('stop-opacity', '0');
    gsg.appendChild(gs1); gsg.appendChild(gs2);
    defs.appendChild(gsg);
  }
  const groundShadow = document.createElementNS(SVG_NS, 'ellipse');
  groundShadow.setAttribute('cx', '0');
  groundShadow.setAttribute('cy', String(totalH / 2 - pad * 0.5));
  groundShadow.setAttribute('rx', String(totalW * 0.4));
  groundShadow.setAttribute('ry', String(totalH * 0.04));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ───────────────────────────────────────
  const aoId = `coordsys-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const aoGrad = document.createElementNS(SVG_NS, 'radialGradient');
    aoGrad.setAttribute('id', aoId);
    aoGrad.setAttribute('cx', '70%'); aoGrad.setAttribute('cy', '75%'); aoGrad.setAttribute('r', '55%');
    const ao1 = document.createElementNS(SVG_NS, 'stop');
    ao1.setAttribute('offset', '0%'); ao1.setAttribute('stop-color', '#000000'); ao1.setAttribute('stop-opacity', '0.10');
    const ao2 = document.createElementNS(SVG_NS, 'stop');
    ao2.setAttribute('offset', '100%'); ao2.setAttribute('stop-color', '#000000'); ao2.setAttribute('stop-opacity', '0');
    aoGrad.appendChild(ao1); aoGrad.appendChild(ao2);
    defs.appendChild(aoGrad);
  }
  const ao = document.createElementNS(SVG_NS, 'rect');
  ao.setAttribute('x', String(-totalW / 2 + pad));
  ao.setAttribute('y', String(-totalH / 2 + pad));
  ao.setAttribute('width', String(chartW));
  ao.setAttribute('height', String(chartH));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Pillar 4: Specular Highlight ──────────────────────────────────────
  const specId = `coordsys-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    const specGrad = document.createElementNS(SVG_NS, 'radialGradient');
    specGrad.setAttribute('id', specId);
    specGrad.setAttribute('cx', '35%'); specGrad.setAttribute('cy', '25%'); specGrad.setAttribute('r', '40%');
    const sp1 = document.createElementNS(SVG_NS, 'stop');
    sp1.setAttribute('offset', '0%'); sp1.setAttribute('stop-color', '#ffffff'); sp1.setAttribute('stop-opacity', '0.18');
    const sp2 = document.createElementNS(SVG_NS, 'stop');
    sp2.setAttribute('offset', '100%'); sp2.setAttribute('stop-color', '#ffffff'); sp2.setAttribute('stop-opacity', '0');
    specGrad.appendChild(sp1); specGrad.appendChild(sp2);
    defs.appendChild(specGrad);
  }

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
  xAxis.setAttribute('stroke', axisColor); xAxis.setAttribute('stroke-width', '2.5');
  innerG.appendChild(xAxis);

  const yAxis = document.createElementNS(SVG_NS, 'line');
  yAxis.setAttribute('x1', String(mapX(0))); yAxis.setAttribute('y1', String(-totalH / 2 + pad));
  yAxis.setAttribute('x2', String(mapX(0))); yAxis.setAttribute('y2', String(totalH / 2 - pad));
  yAxis.setAttribute('stroke', axisColor); yAxis.setAttribute('stroke-width', '2.5');
  innerG.appendChild(yAxis);

  // Axis labels
  if (xLabel) {
    const xl = document.createElementNS(SVG_NS, 'text');
    xl.setAttribute('x', String(totalW / 2 - pad));
    xl.setAttribute('y', String(mapY(0) - 6));
    xl.setAttribute('text-anchor', 'end');
    xl.setAttribute('fill', cc.textPrimary);
    xl.setAttribute('font-size', String(axisFontSize));
    xl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    xl.textContent = xLabel;
    innerG.appendChild(xl);
  }
  if (yLabel) {
    const yl = document.createElementNS(SVG_NS, 'text');
    yl.setAttribute('x', String(mapX(0) + 6));
    yl.setAttribute('y', String(-totalH / 2 + pad + 4));
    yl.setAttribute('fill', cc.textPrimary);
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
    line.setAttribute('stroke', vecColor); line.setAttribute('stroke-width', '2.5');
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
    dot.setAttribute('stroke-width', '2.5');
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

  // Specular overlay
  const specular = document.createElementNS(SVG_NS, 'rect');
  specular.setAttribute('x', String(-totalW / 2 + pad));
  specular.setAttribute('y', String(-totalH / 2 + pad));
  specular.setAttribute('width', String(chartW));
  specular.setAttribute('height', String(chartH));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // Title
  if (entity.label) {
    const title = document.createElementNS(SVG_NS, 'text');
    title.setAttribute('x', '0');
    title.setAttribute('y', String(-totalH / 2 + LABEL_DEFAULTS.offsetBelow));
    title.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    title.setAttribute('fill', cc.textPrimary);
    title.setAttribute('font-size', String(getLabelFontSize('title', scale)));
    title.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    title.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    title.textContent = entity.label;
    innerG.appendChild(title);
  }

  // ── Pillar 5: Micro-Life ──────────────────────────────────────────────
  const styleId = `coordsys-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes coordsysFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes coordsysBreathe_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.008); }
      }
      .coordsys-float-${entityId} {
        animation: coordsysFloat_${entityId} 4s ease-in-out infinite;
      }
      .coordsys-breathe-${entityId} {
        animation: coordsysBreathe_${entityId} 3s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`coordsys-float-${entityId}`);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
