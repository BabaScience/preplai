/**
 * @preplai/illustrations — SymbolTable Component (Cinematic Depth)
 *
 * Compiler/interpreter symbol table with name -> type entries.
 * Cinematic depth: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (table float).
 *
 * Metadata:
 *   entries?: Array<{ name: string; type: string; scope?: string }> — symbol entries
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

interface SymbolEntry {
  name: string;
  type: string;
  scope?: string;
}

export function renderSymbolTable(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const scale = size / 50;
  const meta = entity.metadata ?? {};
  const entries: SymbolEntry[] = (meta.entries as SymbolEntry[]) ?? [
    { name: 'x', type: 'int' },
    { name: 'name', type: 'string' },
    { name: 'sum', type: 'float' },
  ];
  const label = entity.label ?? 'SymbolTable';

  const maxEntries = Math.min(entries.length, 6);
  const rowH = Math.max(16, 20 * scale);
  const headerH = Math.max(18, 22 * scale);
  const nameColW = size * 0.9;
  const typeColW = size * 0.7;
  const w = nameColW + typeColW;
  const h = headerH + maxEntries * rowH + 4 * scale;
  const halfW = w / 2;
  const halfH = h / 2;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ─────────────────────────────────
  const haloId = `symtbl-halo-${entityId}`;
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
  halo.setAttribute('x', String(-halfW - 10));
  halo.setAttribute('y', String(-halfH - 10));
  halo.setAttribute('width', String(w + 20));
  halo.setAttribute('height', String(h + 20));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ────────────────────────────────────────
  const gsId = `symtbl-gs-${entityId}`;
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
  gs.setAttribute('cy', String(halfH + 5));
  gs.setAttribute('rx', String(w * 0.35));
  gs.setAttribute('ry', String(h * 0.05));
  gs.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(gs);

  // ── Pillar 3: Ambient Occlusion ────────────────────────────────────
  const aoId = `symtbl-ao-${entityId}`;
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

  // ── Pillar 4: Specular Highlight ───────────────────────────────────
  const specId = `symtbl-spec-${entityId}`;
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

  // ── Highlight glow ─────────────────────────────────────────────────
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-halfW - 4));
    glow.setAttribute('y', String(-halfH - 4));
    glow.setAttribute('width', String(w + 8));
    glow.setAttribute('height', String(h + 8));
    glow.setAttribute('rx', '6');
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Outer frame ────────────────────────────────────────────────────
  const frame = document.createElementNS(SVG_NS, 'rect');
  frame.setAttribute('x', String(-halfW));
  frame.setAttribute('y', String(-halfH));
  frame.setAttribute('width', String(w));
  frame.setAttribute('height', String(h));
  frame.setAttribute('rx', '4');
  frame.setAttribute('fill', cc.fill);
  frame.setAttribute('stroke', cc.stroke);
  frame.setAttribute('stroke-width', '2.5');
  innerG.appendChild(frame);

  // AO overlay
  const aoRect = document.createElementNS(SVG_NS, 'rect');
  aoRect.setAttribute('x', String(-halfW));
  aoRect.setAttribute('y', String(-halfH));
  aoRect.setAttribute('width', String(w));
  aoRect.setAttribute('height', String(h));
  aoRect.setAttribute('rx', '4');
  aoRect.setAttribute('fill', `url(#${aoId})`);
  aoRect.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoRect);

  // Specular overlay (top half)
  const specRect = document.createElementNS(SVG_NS, 'rect');
  specRect.setAttribute('x', String(-halfW));
  specRect.setAttribute('y', String(-halfH));
  specRect.setAttribute('width', String(w));
  specRect.setAttribute('height', String(h * 0.4));
  specRect.setAttribute('rx', '4');
  specRect.setAttribute('fill', `url(#${specId})`);
  specRect.setAttribute('pointer-events', 'none');
  innerG.appendChild(specRect);

  // ── Header row ─────────────────────────────────────────────────────
  const headerY = -halfH;
  const headerBg = document.createElementNS(SVG_NS, 'rect');
  headerBg.setAttribute('x', String(-halfW));
  headerBg.setAttribute('y', String(headerY));
  headerBg.setAttribute('width', String(w));
  headerBg.setAttribute('height', String(headerH));
  headerBg.setAttribute('rx', '4');
  headerBg.setAttribute('fill', cc.fillMedium);
  innerG.appendChild(headerBg);

  // Clip the bottom corners of header
  const headerPatch = document.createElementNS(SVG_NS, 'rect');
  headerPatch.setAttribute('x', String(-halfW));
  headerPatch.setAttribute('y', String(headerY + headerH - 4));
  headerPatch.setAttribute('width', String(w));
  headerPatch.setAttribute('height', '4');
  headerPatch.setAttribute('fill', cc.fillMedium);
  innerG.appendChild(headerPatch);

  // Header divider line
  const headerLine = document.createElementNS(SVG_NS, 'line');
  headerLine.setAttribute('x1', String(-halfW));
  headerLine.setAttribute('y1', String(headerY + headerH));
  headerLine.setAttribute('x2', String(halfW));
  headerLine.setAttribute('y2', String(headerY + headerH));
  headerLine.setAttribute('stroke', cc.stroke);
  headerLine.setAttribute('stroke-width', '2.5');
  headerLine.setAttribute('opacity', '0.4');
  innerG.appendChild(headerLine);

  // Column divider
  const colDivX = -halfW + nameColW;
  const colDiv = document.createElementNS(SVG_NS, 'line');
  colDiv.setAttribute('x1', String(colDivX));
  colDiv.setAttribute('y1', String(headerY));
  colDiv.setAttribute('x2', String(colDivX));
  colDiv.setAttribute('y2', String(headerY + h));
  colDiv.setAttribute('stroke', cc.stroke);
  colDiv.setAttribute('stroke-width', '2.5');
  colDiv.setAttribute('opacity', '0.2');
  innerG.appendChild(colDiv);

  const headerFontSize = Math.min(TYPOGRAPHY.fontSizeValue, 11);
  const cellFontSize = Math.min(TYPOGRAPHY.fontSizeValue, 10);

  // Header labels
  const hName = document.createElementNS(SVG_NS, 'text');
  hName.setAttribute('x', String(-halfW + nameColW / 2));
  hName.setAttribute('y', String(headerY + headerH / 2 + 4 * scale));
  hName.setAttribute('text-anchor', 'middle');
  hName.setAttribute('fill', cc.textPrimary);
  hName.setAttribute('font-size', String(headerFontSize));
  hName.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
  hName.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  hName.textContent = 'Name';
  innerG.appendChild(hName);

  const hType = document.createElementNS(SVG_NS, 'text');
  hType.setAttribute('x', String(colDivX + typeColW / 2));
  hType.setAttribute('y', String(headerY + headerH / 2 + 4 * scale));
  hType.setAttribute('text-anchor', 'middle');
  hType.setAttribute('fill', cc.textPrimary);
  hType.setAttribute('font-size', String(headerFontSize));
  hType.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
  hType.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  hType.textContent = 'Type';
  innerG.appendChild(hType);

  // ── Entries ────────────────────────────────────────────────────────
  for (let i = 0; i < maxEntries; i++) {
    const entry = entries[i];
    const rowY = headerY + headerH + i * rowH;

    if (i > 0) {
      const rowLine = document.createElementNS(SVG_NS, 'line');
      rowLine.setAttribute('x1', String(-halfW + 4));
      rowLine.setAttribute('y1', String(rowY));
      rowLine.setAttribute('x2', String(halfW - 4));
      rowLine.setAttribute('y2', String(rowY));
      rowLine.setAttribute('stroke', cc.stroke);
      rowLine.setAttribute('stroke-width', '0.5');
      rowLine.setAttribute('opacity', '0.12');
      innerG.appendChild(rowLine);
    }

    const nameText = document.createElementNS(SVG_NS, 'text');
    nameText.setAttribute('x', String(-halfW + nameColW / 2));
    nameText.setAttribute('y', String(rowY + rowH / 2 + 3.5 * scale));
    nameText.setAttribute('text-anchor', 'middle');
    nameText.setAttribute('fill', cc.textSecondary);
    nameText.setAttribute('font-size', String(cellFontSize));
    nameText.setAttribute('font-family', TYPOGRAPHY.fontCode);
    const nameStr = entry.name ?? '';
    nameText.textContent = nameStr.length > 10 ? nameStr.slice(0, 8) + '\u2026' : nameStr;
    innerG.appendChild(nameText);

    const typeText = document.createElementNS(SVG_NS, 'text');
    typeText.setAttribute('x', String(colDivX + typeColW / 2));
    typeText.setAttribute('y', String(rowY + rowH / 2 + 3.5 * scale));
    typeText.setAttribute('text-anchor', 'middle');
    typeText.setAttribute('fill', cc.textSecondary);
    typeText.setAttribute('font-size', String(cellFontSize));
    typeText.setAttribute('font-family', TYPOGRAPHY.fontCode);
    const typeStr = entry.type ?? '';
    typeText.textContent = typeStr.length > 8 ? typeStr.slice(0, 6) + '\u2026' : typeStr;
    innerG.appendChild(typeText);
  }

  // ── Pillar 5: Micro-Life ───────────────────────────────────────────
  const styleId = `symtbl-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes symtblFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      .symtbl-float-${entityId} {
        animation: symtblFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`symtbl-float-${entityId}`);

  // ── Label below ────────────────────────────────────────────────────
  const labelText = document.createElementNS(SVG_NS, 'text');
  labelText.setAttribute('x', '0');
  labelText.setAttribute('y', String(halfH + LABEL_DEFAULTS.offsetBelow));
  labelText.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
  labelText.setAttribute('fill', cc.textPrimary);
  labelText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
  labelText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  labelText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  labelText.textContent = label.length > 14 ? label.slice(0, 12) + '\u2026' : label;
  innerG.appendChild(labelText);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
