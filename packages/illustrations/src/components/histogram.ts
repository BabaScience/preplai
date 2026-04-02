/**
 * @preplai/illustrations — Histogram Component (Cinematic Depth)
 *
 * Clean vertical bars for distribution bins.
 * 5 Cinematic Pillars: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (float + breathe).
 *
 * Metadata: { bins: [{ label, count }] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor,
  TYPOGRAPHY,
  SHAPES,
  getLabelFontSize,
  getStrokeWidth,
  colorWithAlpha,
  OPACITY,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import { resolveColorCascade } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

interface BinSpec { label: string; count: number; }

function parseBins(meta: Record<string, unknown>): BinSpec[] {
  const raw = meta.bins as Array<{ label?: string; count?: number; value?: number }> | undefined;
  if (!Array.isArray(raw) || raw.length === 0) {
    return [
      { label: '0-10', count: 5 },
      { label: '10-20', count: 12 },
      { label: '20-30', count: 8 },
      { label: '30-40', count: 15 },
      { label: '40-50', count: 6 },
    ];
  }
  return raw.slice(0, 12).map((b) => ({
    label: String(b?.label ?? '?'),
    count: Number(b?.count ?? b?.value ?? 0),
  }));
}

export function renderHistogram(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const cc = resolveColorCascade(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const labelFontSize = getLabelFontSize('inline', scale);
  const defaultColor = entity.color ?? getCategoryColor('Histogram');
  const _strokeWidth = getStrokeWidth('thin', scale);
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const bins = parseBins(meta);

  const padLeft = 32;
  const padRight = 12;
  const padTop = 12;
  const padBottom = 24;
  const chartW = s * 3 - padLeft - padRight;
  const chartH = s * 2 - padTop - padBottom;

  const maxCount = Math.max(...bins.map((b) => b.count), 1);
  const n = bins.length;
  const barGap = 4;
  const barW = Math.max(6, (chartW - (n - 1) * barGap) / n);
  const barAreaH = chartH - 14;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ────────────────────────────────────
  const haloId = `histogram-halo-${entityId}`;
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
  halo.setAttribute('rx', String(chartW * 0.7));
  halo.setAttribute('ry', String(chartH * 0.6));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ───────────────────────────────────────────
  const gsId = `histogram-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(chartH / 2));
  groundShadow.setAttribute('rx', String(chartW * 0.55));
  groundShadow.setAttribute('ry', String(chartH * 0.08));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ───────────────────────────────────────
  const aoId = `histogram-ao-${entityId}`;
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
  ao.setAttribute('x', String(-chartW / 2));
  ao.setAttribute('y', String(-chartH / 2));
  ao.setAttribute('width', String(chartW));
  ao.setAttribute('height', String(chartH));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Pillar 4: Specular Highlight ──────────────────────────────────────
  const specId = `histogram-spec-${entityId}`;
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

  // ── Chart content ─────────────────────────────────────────────────────
  bins.forEach((bin, i) => {
    const x = -chartW / 2 + padLeft + i * (barW + barGap) + barW / 2;
    const height = (bin.count / maxCount) * barAreaH;
    const yBase = chartH / 2 - padBottom;

    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(x - barW / 2));
    rect.setAttribute('y', String(yBase - height));
    rect.setAttribute('width', String(barW));
    rect.setAttribute('height', String(Math.max(height, 2)));
    rect.setAttribute('rx', String(SHAPES.borderRadius));
    rect.setAttribute('fill', colorWithAlpha(defaultColor, OPACITY.fillMedium));
    rect.setAttribute('stroke', defaultColor);
    rect.setAttribute('stroke-width', '2.5');
    innerG.appendChild(rect);

    const labelText = document.createElementNS(SVG_NS, 'text');
    labelText.setAttribute('x', String(x));
    labelText.setAttribute('y', String(yBase + 12));
    labelText.setAttribute('text-anchor', 'middle');
    labelText.setAttribute('fill', cc.textPrimary);
    labelText.setAttribute('font-size', String(labelFontSize));
    labelText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    labelText.textContent = bin.label.length > 8 ? bin.label.slice(0, 6) + '\u2026' : bin.label;
    innerG.appendChild(labelText);

    const valText = document.createElementNS(SVG_NS, 'text');
    valText.setAttribute('x', String(x));
    valText.setAttribute('y', String(yBase - height - 3));
    valText.setAttribute('text-anchor', 'middle');
    valText.setAttribute('fill', cc.textPrimary);
    valText.setAttribute('font-size', String(labelFontSize * 0.9));
    valText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    valText.textContent = String(bin.count);
    innerG.appendChild(valText);
  });

  // Axis line
  const axisColor = colorWithAlpha(defaultColor, OPACITY.strokeMuted);
  const axisStroke = getStrokeWidth('minimal', scale);
  const lineX = -chartW / 2 + padLeft - 6;
  const line = document.createElementNS(SVG_NS, 'line');
  line.setAttribute('x1', String(lineX));
  line.setAttribute('y1', String(-chartH / 2 + padTop));
  line.setAttribute('x2', String(lineX));
  line.setAttribute('y2', String(chartH / 2 - padBottom));
  line.setAttribute('stroke', axisColor);
  line.setAttribute('stroke-width', String(axisStroke));
  innerG.appendChild(line);

  // Specular overlay
  const specular = document.createElementNS(SVG_NS, 'rect');
  specular.setAttribute('x', String(-chartW / 2));
  specular.setAttribute('y', String(-chartH / 2));
  specular.setAttribute('width', String(chartW));
  specular.setAttribute('height', String(chartH));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // Title
  if (entity.label) {
    const title = document.createElementNS(SVG_NS, 'text');
    title.setAttribute('x', '0');
    title.setAttribute('y', String(-chartH / 2 - 6));
    title.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    title.setAttribute('fill', cc.textPrimary);
    title.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    title.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    title.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    title.textContent = entity.label;
    innerG.appendChild(title);
  }

  // ── Pillar 5: Micro-Life ──────────────────────────────────────────────
  const styleId = `histogram-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes histogramFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes histogramBreathe_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.008); }
      }
      .histogram-float-${entityId} {
        animation: histogramFloat_${entityId} 4s ease-in-out infinite;
      }
      .histogram-breathe-${entityId} {
        animation: histogramBreathe_${entityId} 3s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`histogram-float-${entityId}`);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
