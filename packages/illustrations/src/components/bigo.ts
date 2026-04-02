/**
 * @preplai/illustrations — BigO Component (Cinematic Depth)
 *
 * Clean complexity growth curves with cinematic depth treatment.
 * Cinematic depth: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (chart float).
 *
 * Metadata: { curves?: string[], domain?: [number, number] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, COLORS, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';import { resolveColorCascade } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
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
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const _scale = size / 50;
  const axisFontSize = TYPOGRAPHY.fontSizeValue;
  const legendFontSize = TYPOGRAPHY.fontSizeBadge;
  const totalW = size * 4;
  const totalH = size * 3;

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

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ─────────────────────────────────
  const haloId = `bigo-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const g = document.createElementNS(SVG_NS, 'radialGradient');
    g.setAttribute('id', haloId);
    g.setAttribute('cx', '38%'); g.setAttribute('cy', '38%'); g.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.13');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0');
    g.appendChild(s1); g.appendChild(s2);
    defs.appendChild(g);
  }
  const halo = document.createElementNS(SVG_NS, 'rect');
  halo.setAttribute('x', String(-totalW / 2 - 5));
  halo.setAttribute('y', String(-totalH / 2 - 5));
  halo.setAttribute('width', String(totalW + 10));
  halo.setAttribute('height', String(totalH + 10));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ────────────────────────────────────────
  const gsId = `bigo-gs-${entityId}`;
  if (!defs.querySelector(`#${gsId}`)) {
    const g = document.createElementNS(SVG_NS, 'radialGradient');
    g.setAttribute('id', gsId);
    g.setAttribute('cx', '50%'); g.setAttribute('cy', '50%'); g.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#000000'); s1.setAttribute('stop-opacity', '0.18');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#000000'); s2.setAttribute('stop-opacity', '0');
    g.appendChild(s1); g.appendChild(s2);
    defs.appendChild(g);
  }
  const gs = document.createElementNS(SVG_NS, 'ellipse');
  gs.setAttribute('cx', '0');
  gs.setAttribute('cy', String(totalH / 2 + 6));
  gs.setAttribute('rx', String(totalW * 0.3));
  gs.setAttribute('ry', String(totalH * 0.04));
  gs.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(gs);

  // ── Pillar 3: Ambient Occlusion ────────────────────────────────────
  const aoId = `bigo-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const g = document.createElementNS(SVG_NS, 'radialGradient');
    g.setAttribute('id', aoId);
    g.setAttribute('cx', '70%'); g.setAttribute('cy', '75%'); g.setAttribute('r', '55%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#000000'); s1.setAttribute('stop-opacity', '0.10');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#000000'); s2.setAttribute('stop-opacity', '0');
    g.appendChild(s1); g.appendChild(s2);
    defs.appendChild(g);
  }
  const ao = document.createElementNS(SVG_NS, 'rect');
  ao.setAttribute('x', String(-totalW / 2));
  ao.setAttribute('y', String(-totalH / 2));
  ao.setAttribute('width', String(totalW));
  ao.setAttribute('height', String(totalH));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Grid ───────────────────────────────────────────────────────────
  const gridColor = colorWithAlpha(color, '18');
  for (let v = Math.ceil(domain[0]); v <= Math.floor(domain[1]); v++) {
    const gl = document.createElementNS(SVG_NS, 'line');
    gl.setAttribute('x1', String(mapX(v))); gl.setAttribute('y1', String(chartTop));
    gl.setAttribute('x2', String(mapX(v))); gl.setAttribute('y2', String(chartTop + chartH));
    gl.setAttribute('stroke', gridColor); gl.setAttribute('stroke-width', '1');
    innerG.appendChild(gl);
  }

  // ── Axes ───────────────────────────────────────────────────────────
  const xAxis = document.createElementNS(SVG_NS, 'line');
  xAxis.setAttribute('x1', String(chartLeft)); xAxis.setAttribute('y1', String(mapY(0)));
  xAxis.setAttribute('x2', String(chartLeft + chartW)); xAxis.setAttribute('y2', String(mapY(0)));
  xAxis.setAttribute('stroke', cc.strokeSoft); xAxis.setAttribute('stroke-width', '2.5');
  innerG.appendChild(xAxis);

  const yAxis = document.createElementNS(SVG_NS, 'line');
  yAxis.setAttribute('x1', String(mapX(domain[0]))); yAxis.setAttribute('y1', String(chartTop));
  yAxis.setAttribute('x2', String(mapX(domain[0]))); yAxis.setAttribute('y2', String(chartTop + chartH));
  yAxis.setAttribute('stroke', cc.strokeSoft); yAxis.setAttribute('stroke-width', '2.5');
  innerG.appendChild(yAxis);

  // Axis label
  const nLabel = document.createElementNS(SVG_NS, 'text');
  nLabel.setAttribute('x', String(chartLeft + chartW - 4));
  nLabel.setAttribute('y', String(mapY(0) + 14));
  nLabel.setAttribute('text-anchor', 'end');
  nLabel.setAttribute('fill', cc.textSecondary);
  nLabel.setAttribute('font-size', String(axisFontSize));
  nLabel.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  nLabel.textContent = 'n';
  innerG.appendChild(nLabel);

  // ── Plot curves ────────────────────────────────────────────────────
  for (const curveName of curves) {
    const curveColor = CURVE_COLORS[curveName] ?? color;
    const parts: string[] = [];
    for (let i = 0; i <= steps; i++) {
      const n = domain[0] + i * dx;
      const y = evalCurve(curveName, n);
      if (!isFinite(y)) continue;
      const px = mapX(n); const py = mapY(y);
      if (py < chartTop || py > chartTop + chartH) continue;
      parts.push(`${parts.length === 0 ? 'M' : 'L'}${px.toFixed(1)},${py.toFixed(1)}`);
    }
    if (parts.length > 0) {
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', parts.join(' '));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', curveColor);
      path.setAttribute('stroke-width', '2.5');
      innerG.appendChild(path);
    }
  }

  // ── Pillar 4: Specular Highlight ───────────────────────────────────
  const specId = `bigo-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    const g = document.createElementNS(SVG_NS, 'radialGradient');
    g.setAttribute('id', specId);
    g.setAttribute('cx', '35%'); g.setAttribute('cy', '25%'); g.setAttribute('r', '40%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#ffffff'); s1.setAttribute('stop-opacity', '0.18');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#ffffff'); s2.setAttribute('stop-opacity', '0');
    g.appendChild(s1); g.appendChild(s2);
    defs.appendChild(g);
  }
  const spec = document.createElementNS(SVG_NS, 'rect');
  spec.setAttribute('x', String(-totalW / 2));
  spec.setAttribute('y', String(-totalH / 2));
  spec.setAttribute('width', String(totalW));
  spec.setAttribute('height', String(totalH * 0.35));
  spec.setAttribute('fill', `url(#${specId})`);
  spec.setAttribute('pointer-events', 'none');
  innerG.appendChild(spec);

  // ── Legend ──────────────────────────────────────────────────────────
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
    dot.setAttribute('stroke-width', '2.5');
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

  // ── Pillar 5: Micro-Life ───────────────────────────────────────────
  const styleId = `bigo-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes bigoFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      .bigo-float-${entityId} {
        animation: bigoFloat_${entityId} 4s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`bigo-float-${entityId}`);

  // ── Title ──────────────────────────────────────────────────────────
  if (entity.label) {
    const title = document.createElementNS(SVG_NS, 'text');
    title.setAttribute('x', '0');
    title.setAttribute('y', String(-totalH / 2 - 8));
    title.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    title.setAttribute('fill', cc.textPrimary);
    title.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    title.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    title.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    title.textContent = entity.label;
    innerG.appendChild(title);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
