/**
 * @preplai/illustrations — GanttChart Component (Cinematic Depth)
 *
 * Clean horizontal task bars.
 * 5 Cinematic Pillars: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (float + breathe).
 *
 * Metadata: { tasks: [{ name, start, end }], maxTime?: number }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
  TYPOGRAPHY,
  SHAPES,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import { resolveColorCascade } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

interface GanttTask { name: string; start: number; end: number; }

export function renderGanttChart(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const cc = resolveColorCascade(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('GanttChart');
  const strokeWidth = getStrokeWidth('thin', scale);
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const tasks: GanttTask[] = (meta.tasks as GanttTask[]) ?? [
    { name: 'P1', start: 0, end: 3 },
    { name: 'P2', start: 1, end: 5 },
    { name: 'P3', start: 3, end: 6 },
  ];

  const maxTime = (meta.maxTime as number) ?? Math.max(...tasks.map((t) => t.end), 1);
  const n = tasks.length;

  const barH = 16 * scale;
  const gap = 6 * scale;
  const labelW = 50 * scale;
  const chartW = s * 3;
  const barAreaW = chartW - labelW;
  const totalH = n * barH + (n - 1) * gap;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ────────────────────────────────────
  const haloId = `gantt-halo-${entityId}`;
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
  halo.setAttribute('rx', String(chartW * 0.6));
  halo.setAttribute('ry', String(totalH * 0.8));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ───────────────────────────────────────────
  const gsId = `gantt-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(totalH / 2 + barH * 0.3));
  groundShadow.setAttribute('rx', String(chartW * 0.45));
  groundShadow.setAttribute('ry', String(totalH * 0.06));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ───────────────────────────────────────
  const aoId = `gantt-ao-${entityId}`;
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
  ao.setAttribute('y', String(-totalH / 2));
  ao.setAttribute('width', String(chartW));
  ao.setAttribute('height', String(totalH));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Pillar 4: Specular Highlight ──────────────────────────────────────
  const specId = `gantt-spec-${entityId}`;
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

  // Grid lines (25%, 50%, 75%)
  [0.25, 0.5, 0.75].forEach((frac) => {
    const gx = -chartW / 2 + labelW + frac * barAreaW;
    const gl = document.createElementNS(SVG_NS, 'line');
    gl.setAttribute('x1', String(gx)); gl.setAttribute('y1', String(-totalH / 2));
    gl.setAttribute('x2', String(gx)); gl.setAttribute('y2', String(totalH / 2));
    gl.setAttribute('stroke', colorWithAlpha(color, '20'));
    gl.setAttribute('stroke-width', String(strokeWidth * 0.5));
    gl.setAttribute('stroke-dasharray', '2 2');
    innerG.appendChild(gl);
  });

  // Tasks
  tasks.forEach((task, i) => {
    const y = -totalH / 2 + i * (barH + gap) + barH / 2;
    const barX = -chartW / 2 + labelW + (task.start / maxTime) * barAreaW;
    const barW = ((task.end - task.start) / maxTime) * barAreaW;

    // Task name
    const nameText = document.createElementNS(SVG_NS, 'text');
    nameText.setAttribute('x', String(-chartW / 2 + labelW - 6));
    nameText.setAttribute('y', String(y + 4));
    nameText.setAttribute('text-anchor', 'end');
    nameText.setAttribute('fill', cc.textPrimary);
    nameText.setAttribute('font-size', String(getLabelFontSize('value', scale)));
    nameText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    nameText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    nameText.textContent = task.name.length > 12 ? task.name.slice(0, 10) + '\u2026' : task.name;
    innerG.appendChild(nameText);

    // Bar
    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(barX));
    rect.setAttribute('y', String(y - barH / 2));
    rect.setAttribute('width', String(Math.max(barW, 4)));
    rect.setAttribute('height', String(barH));
    rect.setAttribute('rx', String(SHAPES.borderRadius));
    rect.setAttribute('fill', colorWithAlpha(color, OPACITY.fillMedium));
    rect.setAttribute('stroke', color);
    rect.setAttribute('stroke-width', '2.5');
    innerG.appendChild(rect);
  });

  // Time axis ticks
  const tickFontSize = getLabelFontSize('index', scale);
  [0, maxTime / 2, maxTime].forEach((t, i) => {
    const tx = -chartW / 2 + labelW + (t / maxTime) * barAreaW;
    const tick = document.createElementNS(SVG_NS, 'text');
    tick.setAttribute('x', String(tx));
    tick.setAttribute('y', String(totalH / 2 + tickFontSize + 4));
    tick.setAttribute('text-anchor', i === 0 ? 'start' : i === 2 ? 'end' : 'middle');
    tick.setAttribute('fill', cc.textPrimary);
    tick.setAttribute('font-size', String(tickFontSize));
    tick.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    tick.textContent = String(Math.round(t * 10) / 10);
    innerG.appendChild(tick);
  });

  // Specular overlay
  const specular = document.createElementNS(SVG_NS, 'rect');
  specular.setAttribute('x', String(-chartW / 2));
  specular.setAttribute('y', String(-totalH / 2));
  specular.setAttribute('width', String(chartW));
  specular.setAttribute('height', String(totalH));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // Label below
  if (entity.label) {
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String(totalH / 2 + tickFontSize + LABEL_DEFAULTS.offsetBelow));
    labelEl.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    labelEl.setAttribute('fill', cc.textPrimary);
    labelEl.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    labelEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    labelEl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    labelEl.textContent = entity.label;
    innerG.appendChild(labelEl);
  }

  // ── Pillar 5: Micro-Life ──────────────────────────────────────────────
  const styleId = `gantt-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes ganttFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes ganttBreathe_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.008); }
      }
      .gantt-float-${entityId} {
        animation: ganttFloat_${entityId} 4s ease-in-out infinite;
      }
      .gantt-breathe-${entityId} {
        animation: ganttBreathe_${entityId} 3s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`gantt-float-${entityId}`);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
