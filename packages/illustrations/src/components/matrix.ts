/**
 * @preplai/illustrations — Matrix Component (Cinematic 5 Pillars)
 *
 * Clean numeric grid with optional row/column labels. Glassmorphic depth with
 * directional lighting, ground shadow, AO, specular highlight, micro-life.
 * Handles 2x2 to 5x5+ matrices gracefully.
 *
 * Metadata: { rows: number[][], rowLabels?: string[], colLabels?: string[] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import {
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
  TYPOGRAPHY,
  SHAPES,
  STROKE,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import { resolveColorCascade } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderMatrix(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const rawRows = (meta.rows as number[][]) ?? [[1, 0], [0, 1]];
  const rows = rawRows.slice(0, 8).map((row) =>
    Array.isArray(row)
      ? row.slice(0, 8).map((v) => (typeof v === 'number' && !Number.isNaN(v) ? v : 0))
      : []
  ).filter((r) => r.length > 0);

  const numCols = Math.max(...rows.map((r) => r.length), 1);
  const cellW = 32 * scale;
  const cellH = 24 * scale;
  const gap = 4 * scale;

  const totalW = numCols * cellW + (numCols - 1) * gap;
  const totalH = rows.length * cellH + (rows.length - 1) * gap;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ────────────────────────────────────
  const haloId = `mat-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-totalW * 0.08));
  halo.setAttribute('cy', String(-totalH * 0.05));
  halo.setAttribute('rx', String(totalW * 0.75));
  halo.setAttribute('ry', String(totalH * 0.7));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ───────────────────────────────────────────
  const gsId = `mat-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(totalH / 2 + 6));
  groundShadow.setAttribute('rx', String(totalW * 0.45));
  groundShadow.setAttribute('ry', String(4));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // Highlight glow
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-totalW / 2 - 3));
    glow.setAttribute('y', String(-totalH / 2 - 3));
    glow.setAttribute('width', String(totalW + 6));
    glow.setAttribute('height', String(totalH + 6));
    glow.setAttribute('rx', String(SHAPES.borderRadius + 2));
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', colorWithAlpha(color, OPACITY.strokeMuted));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    innerG.appendChild(glow);
  }

  // ── Pillar 3: Ambient Occlusion ───────────────────────────────────────
  const aoId = `mat-ao-${entityId}`;
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

  // Cells
  const fontSize = getLabelFontSize('value', scale);
  rows.forEach((row, rowIdx) => {
    row.forEach((val, colIdx) => {
      const x = -totalW / 2 + colIdx * (cellW + gap) + cellW / 2;
      const y = -totalH / 2 + rowIdx * (cellH + gap) + cellH / 2;

      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(x - cellW / 2));
      rect.setAttribute('y', String(y - cellH / 2));
      rect.setAttribute('width', String(cellW));
      rect.setAttribute('height', String(cellH));
      rect.setAttribute('rx', String(SHAPES.borderRadius - 2));
      rect.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
      rect.setAttribute('stroke', cc.stroke);
      rect.setAttribute('stroke-width', '2.5');
      innerG.appendChild(rect);

      // AO overlay per cell
      const aoCell = document.createElementNS(SVG_NS, 'rect');
      aoCell.setAttribute('x', String(x - cellW / 2));
      aoCell.setAttribute('y', String(y - cellH / 2));
      aoCell.setAttribute('width', String(cellW));
      aoCell.setAttribute('height', String(cellH));
      aoCell.setAttribute('rx', String(SHAPES.borderRadius - 2));
      aoCell.setAttribute('fill', `url(#${aoId})`);
      aoCell.setAttribute('pointer-events', 'none');
      innerG.appendChild(aoCell);

      const text = document.createElementNS(SVG_NS, 'text');
      text.setAttribute('x', String(x));
      text.setAttribute('y', String(y + 4));
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', cc.textPrimary);
      text.setAttribute('font-size', String(fontSize));
      text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
      text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
      text.textContent = String(val);
      innerG.appendChild(text);
    });
  });

  // ── Pillar 4: Specular Highlight (full grid overlay) ──────────────────
  const specId = `mat-spec-${entityId}`;
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
  specular.setAttribute('x', String(-totalW / 2));
  specular.setAttribute('y', String(-totalH / 2));
  specular.setAttribute('width', String(totalW));
  specular.setAttribute('height', String(totalH));
  specular.setAttribute('rx', String(SHAPES.borderRadius));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Pillar 5: Micro-Life ──────────────────────────────────────────────
  const styleId = `mat-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes matFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes matBreathe_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }
      .mat-float-${entityId} {
        animation: matFloat_${entityId} 3.8s ease-in-out infinite;
      }
      .mat-breathe-${entityId} {
        animation: matBreathe_${entityId} 3s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`mat-float-${entityId}`);

  // Label below
  if (entity.label) {
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String(totalH / 2 + LABEL_DEFAULTS.offsetBelow));
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
