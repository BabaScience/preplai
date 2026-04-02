/**
 * @preplai/illustrations — Table Component (Cinematic 5-Pillar)
 *
 * Tabular grid with optional headers. Use for: data tables, comparison grids,
 * structured key-value layouts when HashTable (pairs) doesn't fit.
 *
 * Cinematic Depth: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life float animation.
 *
 * Metadata: { headers?: string[], rows: string[][] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import { gridLayoutFromMatrix } from '../layouts/index.js';
import type { VisualEntity } from '@preplai/shared';

function parseTableData(meta: Record<string, unknown>): { headers: string[]; rows: string[][] } {
  const headers = (meta.headers as string[]) ?? [];
  const rawRows = (meta.rows as string[][]) ?? [];
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    return {
      headers: ['Name', 'Value'],
      rows: [
        ['a', '1'],
        ['b', '2'],
        ['c', '3'],
      ],
    };
  }
  const rows = rawRows.slice(0, 8).map((row) =>
    Array.isArray(row)
      ? row.slice(0, 6).map((v) => String(v ?? ''))
      : [],
  ).filter((r) => r.length > 0);
  return { headers, rows };
}

export function renderTable(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const { headers, rows } = parseTableData(meta);

  const numCols = Math.max(
    headers.length,
    ...rows.map((r) => r.length),
    1,
  );
  const hasHeaders = headers.length > 0;

  const matrixStr: string[][] = [];
  if (hasHeaders) {
    const headerRow = [...headers];
    while (headerRow.length < numCols) headerRow.push('');
    matrixStr.push(headerRow);
  }
  rows.forEach((row) => {
    const r = [...row];
    while (r.length < numCols) r.push('');
    matrixStr.push(r);
  });

  const cellW = Math.round(44 * scale);
  const cellH = Math.round(24 * scale);
  const gap = 4;

  const totalW = numCols * cellW + (numCols - 1) * gap;
  const totalH = matrixStr.length * cellH + (matrixStr.length - 1) * gap;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ──────────────────────────────────
  const haloId = `table-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-totalW * 0.05));
  halo.setAttribute('cy', String(-totalH * 0.05));
  halo.setAttribute('rx', String(totalW * 0.8));
  halo.setAttribute('ry', String(totalH * 0.7));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ─────────────────────────────────────────
  const gsId = `table-gshadow-${entityId}`;
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
  groundShadow.setAttribute('ry', String(totalH * 0.12));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ─────────────────────────────────────
  const aoId = `table-ao-${entityId}`;
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
  const ao = document.createElementNS(SVG_NS, 'rect');
  ao.setAttribute('x', String(-totalW / 2));
  ao.setAttribute('y', String(-totalH / 2));
  ao.setAttribute('width', String(totalW));
  ao.setAttribute('height', String(totalH));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Highlight glow ring ─────────────────────────────────────────────
  if (entity.highlight) {
    const glowRect = document.createElementNS(SVG_NS, 'rect');
    glowRect.setAttribute('x', String(-totalW / 2 - 4));
    glowRect.setAttribute('y', String(-totalH / 2 - 4));
    glowRect.setAttribute('width', String(totalW + 8));
    glowRect.setAttribute('height', String(totalH + 8));
    glowRect.setAttribute('rx', '6');
    glowRect.setAttribute('fill', 'none');
    glowRect.setAttribute('stroke-width', String(STROKE.default));
    glowRect.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glowRect, cc);
    innerG.appendChild(glowRect);
  }

  // ── Table cells ─────────────────────────────────────────────────────
  const cells = gridLayoutFromMatrix(matrixStr, {
    cellWidth: cellW,
    cellHeight: cellH,
    gap,
    cols: numCols,
    hasRowHeaders: hasHeaders,
    hasColHeaders: false,
  });

  cells.forEach((cell) => {
    const { x, y, width, height, content, cellType } = cell;
    const isHeader = cellType === 'header';

    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(x - width / 2));
    rect.setAttribute('y', String(y - height / 2));
    rect.setAttribute('width', String(width));
    rect.setAttribute('height', String(height));
    rect.setAttribute('rx', '3');
    if (isHeader) {
      rect.setAttribute('fill', cc.fillMedium);
      rect.setAttribute('stroke', cc.strokeSoft);
    } else {
      rect.setAttribute('fill', cc.fill);
      rect.setAttribute('stroke', cc.strokeMuted);
    }
    rect.setAttribute('stroke-width', '2.5');
    rect.setAttribute('stroke-linejoin', 'round');
    innerG.appendChild(rect);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(y + 4));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', isHeader ? cc.textPrimary : cc.textSecondary);
    text.setAttribute('font-size', String(isHeader ? TYPOGRAPHY.fontSizeBadge : TYPOGRAPHY.fontSizeIndex));
    text.setAttribute('font-weight', isHeader ? String(TYPOGRAPHY.fontWeightBold) : String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    const display = content.length > 12 ? content.slice(0, 11) + '\u2026' : content;
    text.textContent = display;
    innerG.appendChild(text);
  });

  // ── Pillar 4: Specular Highlight ────────────────────────────────────
  const specId = `table-spec-${entityId}`;
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
  specular.setAttribute('height', String(totalH * 0.5));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Pillar 5: Micro-Life (float animation) ──────────────────────────
  const styleId = `table-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes tableFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      .table-float-${entityId} {
        animation: tableFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`table-float-${entityId}`);

  // ── Label below ─────────────────────────────────────────────────────
  if (entity.label) {
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String(totalH / 2 + LABEL_DEFAULTS.offsetBelow));
    labelEl.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    labelEl.setAttribute('fill', cc.textPrimary);
    labelEl.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    labelEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    labelEl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    labelEl.textContent = entity.label;
    innerG.appendChild(labelEl);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
