/**
 * @preplai/illustrations — ScatterPlot Component (Cinematic Depth)
 *
 * Clean X-Y scatter plot with axes, optional grid, point labels.
 * 5 Cinematic Pillars: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (float + pulse).
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
import { resolveColorCascade } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

interface PointSpec { x: number; y: number; label?: string; }

export function renderScatterPlot(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const cc = resolveColorCascade(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('ScatterPlot');
  const _strokeWidth = getStrokeWidth('thin', scale);
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

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

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ────────────────────────────────────
  const haloId = `scatter-halo-${entityId}`;
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
  const gsId = `scatter-gshadow-${entityId}`;
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
  const aoId = `scatter-ao-${entityId}`;
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
  ao.setAttribute('x', String(chartLeft));
  ao.setAttribute('y', String(chartTop));
  ao.setAttribute('width', String(chartW));
  ao.setAttribute('height', String(chartH));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Pillar 4: Specular Highlight ──────────────────────────────────────
  const specId = `scatter-spec-${entityId}`;
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
  xAxis.setAttribute('stroke', axisColor); xAxis.setAttribute('stroke-width', '2.5');
  innerG.appendChild(xAxis);

  const yAxis = document.createElementNS(SVG_NS, 'line');
  yAxis.setAttribute('x1', String(mapX(0))); yAxis.setAttribute('y1', String(chartTop));
  yAxis.setAttribute('x2', String(mapX(0))); yAxis.setAttribute('y2', String(chartTop + chartH));
  yAxis.setAttribute('stroke', axisColor); yAxis.setAttribute('stroke-width', '2.5');
  innerG.appendChild(yAxis);

  // Axis labels
  const axisFontSize = getLabelFontSize('value', scale);
  if (xLabel) {
    const xl = document.createElementNS(SVG_NS, 'text');
    xl.setAttribute('x', String(chartLeft + chartW - 4));
    xl.setAttribute('y', String(mapY(0) + 14));
    xl.setAttribute('text-anchor', 'end');
    xl.setAttribute('fill', cc.textPrimary);
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
    yl.setAttribute('fill', cc.textPrimary);
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
    dot.setAttribute('stroke-width', '2.5');
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

  // Specular overlay
  const specular = document.createElementNS(SVG_NS, 'rect');
  specular.setAttribute('x', String(chartLeft));
  specular.setAttribute('y', String(chartTop));
  specular.setAttribute('width', String(chartW));
  specular.setAttribute('height', String(chartH));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // Title
  if (entity.label) {
    const title = document.createElementNS(SVG_NS, 'text');
    title.setAttribute('x', '0');
    title.setAttribute('y', String(-totalH / 2 - 8));
    title.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    title.setAttribute('fill', cc.textPrimary);
    title.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    title.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    title.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    title.textContent = entity.label;
    innerG.appendChild(title);
  }

  // ── Pillar 5: Micro-Life ──────────────────────────────────────────────
  const styleId = `scatter-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes scatterFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes scatterPulse_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.01); }
      }
      .scatter-float-${entityId} {
        animation: scatterFloat_${entityId} 4s ease-in-out infinite;
      }
      .scatter-pulse-${entityId} {
        animation: scatterPulse_${entityId} 3s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`scatter-float-${entityId}`);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
