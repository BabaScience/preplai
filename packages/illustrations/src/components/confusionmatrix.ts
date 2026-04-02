/**
 * @preplai/illustrations — ConfusionMatrix Component (Cinematic 5 Pillars)
 *
 * Clean N*N grid for classification metrics. 2*2 auto-colors: TP/TN/FP/FN.
 * Glassmorphic depth: directional lighting, ground shadow, AO, specular, micro-life.
 *
 * Metadata: { matrix: number[][], rowLabels?: string[], colLabels?: string[] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getStrokeWidth,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
  TYPOGRAPHY,
  SHAPES,
  COLORS,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import { resolveColorCascade } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

const CM_COLORS = {
  tp: COLORS.green,
  tn: COLORS.teal,
  fp: COLORS.orange,
  fn: COLORS.red,
} as const;

function getCellType(r: number, c: number, rows: number, cols: number): 'tp' | 'tn' | 'fp' | 'fn' | null {
  if (rows !== 2 || cols !== 2) return null;
  if (r === 0 && c === 0) return 'tn';
  if (r === 0 && c === 1) return 'fp';
  if (r === 1 && c === 0) return 'fn';
  if (r === 1 && c === 1) return 'tp';
  return null;
}

export function renderConfusionMatrix(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const cc = resolveColorCascade(entity);
  const baseColor = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const cellFontSize = getLabelFontSize('value', scale);
  const headerFontSize = getLabelFontSize('inline', scale);
  const badgeFontSize = getLabelFontSize('index', scale);
  const _strokeWidth = getStrokeWidth('thin', scale);

  const meta = entity.metadata ?? {};
  const matrixData = meta.matrix as number[][] | undefined;
  const rowLabels = (meta.rowLabels as string[]) ?? ['Actual -', 'Actual +'];
  const colLabels = (meta.colLabels as string[]) ?? ['Pred -', 'Pred +'];

  const matrix: number[][] = matrixData ?? [[45, 5], [8, 42]];
  const rows = matrix.length;
  const cols = matrix[0]?.length ?? 2;

  const cellW = Math.round(40 * scale);
  const cellH = Math.round(28 * scale);
  const gap = 6;

  const totalGridW = cols * cellW + (cols - 1) * gap;
  const totalGridH = rows * cellH + (rows - 1) * gap;
  const headerW = cellW;
  const headerH = cellH;
  const offsetX = headerW / 2 + gap / 2;
  const offsetY = headerH / 2 + gap / 2;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ────────────────────────────────────
  const haloId = `cm-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const haloGrad = document.createElementNS(SVG_NS, 'radialGradient');
    haloGrad.setAttribute('id', haloId);
    haloGrad.setAttribute('cx', '38%'); haloGrad.setAttribute('cy', '38%');
    haloGrad.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', baseColor); s1.setAttribute('stop-opacity', '0.13');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', baseColor); s2.setAttribute('stop-opacity', '0');
    haloGrad.appendChild(s1); haloGrad.appendChild(s2);
    defs.appendChild(haloGrad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', '0');
  halo.setAttribute('cy', '0');
  halo.setAttribute('rx', String(totalGridW * 0.8));
  halo.setAttribute('ry', String(totalGridH * 0.75));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ───────────────────────────────────────────
  const gsId = `cm-gshadow-${entityId}`;
  if (!defs.querySelector(`#${gsId}`)) {
    const gsg = document.createElementNS(SVG_NS, 'radialGradient');
    gsg.setAttribute('id', gsId);
    gsg.setAttribute('cx', '50%'); gsg.setAttribute('cy', '50%'); gsg.setAttribute('r', '50%');
    const g1 = document.createElementNS(SVG_NS, 'stop');
    g1.setAttribute('offset', '0%'); g1.setAttribute('stop-color', '#000000'); g1.setAttribute('stop-opacity', '0.18');
    const g2 = document.createElementNS(SVG_NS, 'stop');
    g2.setAttribute('offset', '100%'); g2.setAttribute('stop-color', '#000000'); g2.setAttribute('stop-opacity', '0');
    gsg.appendChild(g1); gsg.appendChild(g2);
    defs.appendChild(gsg);
  }
  const groundShadow = document.createElementNS(SVG_NS, 'ellipse');
  groundShadow.setAttribute('cx', '0');
  groundShadow.setAttribute('cy', String(totalGridH / 2 + 8));
  groundShadow.setAttribute('rx', String(totalGridW * 0.45));
  groundShadow.setAttribute('ry', String(4));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ───────────────────────────────────────
  const aoId = `cm-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const aoGrad = document.createElementNS(SVG_NS, 'radialGradient');
    aoGrad.setAttribute('id', aoId);
    aoGrad.setAttribute('cx', '70%'); aoGrad.setAttribute('cy', '75%'); aoGrad.setAttribute('r', '55%');
    const a1 = document.createElementNS(SVG_NS, 'stop');
    a1.setAttribute('offset', '0%'); a1.setAttribute('stop-color', '#000000'); a1.setAttribute('stop-opacity', '0.10');
    const a2 = document.createElementNS(SVG_NS, 'stop');
    a2.setAttribute('offset', '100%'); a2.setAttribute('stop-color', '#000000'); a2.setAttribute('stop-opacity', '0');
    aoGrad.appendChild(a1); aoGrad.appendChild(a2);
    defs.appendChild(aoGrad);
  }

  // Column headers
  colLabels.slice(0, cols).forEach((label, c) => {
    const x = -totalGridW / 2 + offsetX + c * (cellW + gap) + cellW / 2;
    const y = -totalGridH / 2 - offsetY;

    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(x - cellW / 2));
    rect.setAttribute('y', String(y - cellH / 2));
    rect.setAttribute('width', String(cellW));
    rect.setAttribute('height', String(cellH));
    rect.setAttribute('rx', String(SHAPES.borderRadius));
    rect.setAttribute('fill', colorWithAlpha(baseColor, OPACITY.fillLight));
    rect.setAttribute('stroke', colorWithAlpha(baseColor, OPACITY.strokeSoft));
    rect.setAttribute('stroke-width', '2.5');
    innerG.appendChild(rect);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(y + 5));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', cc.textPrimary);
    text.setAttribute('font-size', String(headerFontSize));
    text.setAttribute('font-weight', '600');
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = label;
    innerG.appendChild(text);
  });

  // Row headers + data cells
  matrix.forEach((row, r) => {
    // Row header
    const rowLabel = rowLabels[r] ?? '';
    if (rowLabel) {
      const hx = -totalGridW / 2 - offsetX;
      const hy = -totalGridH / 2 + r * (cellH + gap) + cellH / 2;

      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(hx - cellW / 2));
      rect.setAttribute('y', String(hy - cellH / 2));
      rect.setAttribute('width', String(cellW));
      rect.setAttribute('height', String(cellH));
      rect.setAttribute('rx', String(SHAPES.borderRadius));
      rect.setAttribute('fill', colorWithAlpha(baseColor, OPACITY.fillLight));
      rect.setAttribute('stroke', colorWithAlpha(baseColor, OPACITY.strokeSoft));
      rect.setAttribute('stroke-width', '2.5');
      innerG.appendChild(rect);

      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', String(hx));
      text.setAttribute('y', String(hy + 5));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', cc.textPrimary);
      text.setAttribute('font-size', String(headerFontSize));
      text.setAttribute('font-weight', '600');
      text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      text.textContent = rowLabel;
      innerG.appendChild(text);
    }

    // Data cells
    row.forEach((val, c) => {
      const x = -totalGridW / 2 + offsetX + c * (cellW + gap) + cellW / 2;
      const y = -totalGridH / 2 + r * (cellH + gap) + cellH / 2;
      const cmType = getCellType(r, c, rows, cols);
      const cellColor = cmType ? CM_COLORS[cmType] : baseColor;

      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(x - cellW / 2));
      rect.setAttribute('y', String(y - cellH / 2));
      rect.setAttribute('width', String(cellW));
      rect.setAttribute('height', String(cellH));
      rect.setAttribute('rx', String(SHAPES.borderRadius));
      rect.setAttribute('fill', colorWithAlpha(cellColor, OPACITY.fillMedium));
      rect.setAttribute('stroke', cellColor);
      rect.setAttribute('stroke-width', '2.5');
      innerG.appendChild(rect);

      // AO overlay per cell
      const aoCell = document.createElementNS(SVG_NS, 'rect');
      aoCell.setAttribute('x', String(x - cellW / 2));
      aoCell.setAttribute('y', String(y - cellH / 2));
      aoCell.setAttribute('width', String(cellW));
      aoCell.setAttribute('height', String(cellH));
      aoCell.setAttribute('rx', String(SHAPES.borderRadius));
      aoCell.setAttribute('fill', `url(#${aoId})`);
      aoCell.setAttribute('pointer-events', 'none');
      innerG.appendChild(aoCell);

      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', String(x));
      text.setAttribute('y', String(y + 5));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', cellColor);
      text.setAttribute('font-size', String(cellFontSize));
      text.setAttribute('font-weight', '600');
      text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      text.textContent = String(val);
      innerG.appendChild(text);

      // CM type badge
      if (cmType) {
        const badge = document.createElementNS(SVG_NS, 'text');
        badge.setAttribute('x', String(x - cellW / 2 + 6));
        badge.setAttribute('y', String(y - cellH / 2 + 9));
        badge.setAttribute('fill', cellColor);
        badge.setAttribute('font-size', String(badgeFontSize));
        badge.setAttribute('font-weight', '500');
        badge.setAttribute('font-family', TYPOGRAPHY.fontBadge);
        badge.setAttribute('opacity', '0.8');
        badge.textContent = cmType.toUpperCase();
        innerG.appendChild(badge);
      }
    });
  });

  // ── Pillar 4: Specular Highlight ──────────────────────────────────────
  const specId = `cm-spec-${entityId}`;
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
  const specular = document.createElementNS(SVG_NS, 'rect');
  specular.setAttribute('x', String(-totalGridW / 2));
  specular.setAttribute('y', String(-totalGridH / 2));
  specular.setAttribute('width', String(totalGridW));
  specular.setAttribute('height', String(totalGridH));
  specular.setAttribute('rx', String(SHAPES.borderRadius));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Pillar 5: Micro-Life ──────────────────────────────────────────────
  const styleId = `cm-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes cmFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes cmBreathe_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }
      .cm-float-${entityId} {
        animation: cmFloat_${entityId} 3.6s ease-in-out infinite;
      }
      .cm-breathe-${entityId} {
        animation: cmBreathe_${entityId} 3s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`cm-float-${entityId}`);

  // Label below
  if (entity.label) {
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String(totalGridH / 2 + LABEL_DEFAULTS.offsetBelow));
    labelEl.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    labelEl.setAttribute('fill', cc.textPrimary);
    labelEl.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    labelEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    labelEl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    labelEl.textContent = entity.label;
    innerG.appendChild(labelEl);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
