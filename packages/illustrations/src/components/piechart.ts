/**
 * @preplai/illustrations — PieChart Component (Cinematic Depth)
 *
 * Clean pie/donut chart with solid colored slices and external labels.
 * 5 Cinematic Pillars: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (float + breathe).
 *
 * Metadata: { slices: [{ label, value, color? }], donut?: boolean, showPercentages?: boolean }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
  TYPOGRAPHY,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import { resolveColorCascade } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

interface SliceSpec { label: string; value: number; color?: string; }

const SLICE_COLORS = ['#00e5ff', '#7c4dff', '#00e676', '#ffab00', '#ff5252', '#e040fb', '#18ffff', '#76ff03'];

function parseSlices(meta: Record<string, unknown>): SliceSpec[] {
  const raw = (meta.slices ?? meta.segments) as SliceSpec[] | undefined;
  if (!Array.isArray(raw) || raw.length === 0) {
    return [
      { label: 'A', value: 30 },
      { label: 'B', value: 25 },
      { label: 'C', value: 20 },
      { label: 'D', value: 15 },
      { label: 'E', value: 10 },
    ];
  }
  return raw.slice(0, 12).map((s, i) => ({
    label: String(s?.label ?? '?'),
    value: Math.max(0, Number(s?.value) || 0),
    color: s?.color ?? SLICE_COLORS[i % SLICE_COLORS.length],
  }));
}

function polar(cx: number, cy: number, r: number, deg: number): { x: number; y: number } {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

export function renderPieChart(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const cc = resolveColorCascade(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const labelFontSize = getLabelFontSize('inline', scale);
  const defaultColor = entity.color ?? getCategoryColor('PieChart');
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const slices = parseSlices(meta);
  const donut = meta.donut === true;
  const showPercentages = meta.showPercentages !== false;

  const total = slices.reduce((sum, sl) => sum + sl.value, 0) || 1;
  const cx = 0;
  const cy = 0;
  const outerR = s * 1.1;
  const innerR = donut ? outerR * 0.5 : 0;
  const labelR = outerR + 14 * scale;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ────────────────────────────────────
  const haloId = `piechart-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const haloGrad = document.createElementNS(SVG_NS, 'radialGradient');
    haloGrad.setAttribute('id', haloId);
    haloGrad.setAttribute('cx', '38%'); haloGrad.setAttribute('cy', '38%');
    haloGrad.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', defaultColor); s1.setAttribute('stop-opacity', '0.13');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', defaultColor); s2.setAttribute('stop-opacity', '0');
    haloGrad.appendChild(s1); haloGrad.appendChild(s2);
    defs.appendChild(haloGrad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', '0');
  halo.setAttribute('cy', '0');
  halo.setAttribute('rx', String(outerR * 1.5));
  halo.setAttribute('ry', String(outerR * 1.2));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ───────────────────────────────────────────
  const gsId = `piechart-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(outerR * 0.9));
  groundShadow.setAttribute('rx', String(outerR * 0.9));
  groundShadow.setAttribute('ry', String(outerR * 0.12));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ───────────────────────────────────────
  const aoId = `piechart-ao-${entityId}`;
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
  const aoCircle = document.createElementNS(SVG_NS, 'circle');
  aoCircle.setAttribute('cx', '0');
  aoCircle.setAttribute('cy', '0');
  aoCircle.setAttribute('r', String(outerR));
  aoCircle.setAttribute('fill', `url(#${aoId})`);
  aoCircle.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoCircle);

  // ── Pillar 4: Specular Highlight ──────────────────────────────────────
  const specId = `piechart-spec-${entityId}`;
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

  // ── Slices ────────────────────────────────────────────────────────────
  let startDeg = 0;
  slices.forEach((slice) => {
    const angle = (slice.value / total) * 360;
    const endDeg = startDeg + angle;
    if (angle <= 0) { startDeg = endDeg; return; }

    const color = slice.color ?? defaultColor;
    const p1 = polar(cx, cy, outerR, startDeg);
    const p2 = polar(cx, cy, outerR, endDeg);
    const largeArc = angle >= 180 ? 1 : 0;

    let d: string;
    if (donut && innerR > 0) {
      const p3 = polar(cx, cy, innerR, endDeg);
      const p4 = polar(cx, cy, innerR, startDeg);
      d = `M ${p1.x} ${p1.y} A ${outerR} ${outerR} 0 ${largeArc} 1 ${p2.x} ${p2.y} L ${p3.x} ${p3.y} A ${innerR} ${innerR} 0 ${largeArc} 0 ${p4.x} ${p4.y} Z`;
    } else {
      d = `M ${cx} ${cy} L ${p1.x} ${p1.y} A ${outerR} ${outerR} 0 ${largeArc} 1 ${p2.x} ${p2.y} Z`;
    }

    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('fill', colorWithAlpha(color, OPACITY.fillMedium));
    path.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeSoft));
    path.setAttribute('stroke-width', '2.5');
    innerG.appendChild(path);

    // External label
    const midDeg = startDeg + angle / 2;
    const labelPos = polar(cx, cy, labelR, midDeg);
    const pct = showPercentages ? ` ${Math.round((slice.value / total) * 100)}%` : '';
    const labelText = document.createElementNS(SVG_NS, 'text');
    labelText.setAttribute('x', String(labelPos.x));
    labelText.setAttribute('y', String(labelPos.y + 4));
    labelText.setAttribute('text-anchor', labelPos.x >= cx ? 'start' : 'end');
    labelText.setAttribute('fill', color);
    labelText.setAttribute('font-size', String(labelFontSize));
    labelText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    labelText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    labelText.textContent = `${slice.label}${pct}`;
    innerG.appendChild(labelText);

    startDeg = endDeg;
  });

  // Specular overlay
  const specular = document.createElementNS(SVG_NS, 'circle');
  specular.setAttribute('cx', '0');
  specular.setAttribute('cy', '0');
  specular.setAttribute('r', String(outerR));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // Title
  if (entity.label) {
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String(outerR + LABEL_DEFAULTS.offsetBelow + 16 * scale));
    labelEl.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    labelEl.setAttribute('fill', cc.textPrimary);
    labelEl.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    labelEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    labelEl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    labelEl.textContent = entity.label;
    innerG.appendChild(labelEl);
  }

  // ── Pillar 5: Micro-Life ──────────────────────────────────────────────
  const styleId = `piechart-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes piechartFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes piechartBreathe_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.01); }
      }
      .piechart-float-${entityId} {
        animation: piechartFloat_${entityId} 4s ease-in-out infinite;
      }
      .piechart-breathe-${entityId} {
        animation: piechartBreathe_${entityId} 3s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`piechart-float-${entityId}`);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
