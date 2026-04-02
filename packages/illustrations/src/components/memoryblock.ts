/**
 * @preplai/illustrations — MemoryBlock Component (Cinematic Depth)
 *
 * Memory address space: vertical stack of addressable cells with addr on left, value on right.
 * Cinematic lighting, ground shadow, ambient occlusion, specular, micro-life.
 *
 * Metadata: { cells: Array<{addr: string, value: string}> } or { cells: [addr, value][] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, SHAPES, LABEL_DEFAULTS } from '../design-tokens.js';
import { resolveColorCascade } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

type CellSpec = { addr: string; value: string } | [string, string];

function parseCells(meta: Record<string, unknown>): Array<{ addr: string; value: string }> {
  const raw = meta.cells as CellSpec[] | undefined;
  if (!Array.isArray(raw) || raw.length === 0) {
    return [
      { addr: '0x0000', value: 'main' },
      { addr: '0x0008', value: '42' },
      { addr: '0x0010', value: 'ptr' },
      { addr: '0x0018', value: '0x0020' },
    ];
  }
  return raw.slice(0, 10).map((c) => {
    if (Array.isArray(c) && c.length >= 2) {
      return { addr: String(c[0]), value: String(c[1]) };
    }
    if (typeof c === 'object' && c != null && 'addr' in c && 'value' in c) {
      return { addr: String((c as { addr: unknown }).addr), value: String((c as { value: unknown }).value) };
    }
    return { addr: '?', value: '?' };
  });
}

export function renderMemoryBlock(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const s = getSizeParam(entity);
  const scale = s / 50;
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const cells = parseCells(meta);

  const cellW = 70 * scale;
  const cellH = 20 * scale;
  const gap = 3;
  const totalH = cells.length * cellH + (cells.length - 1) * gap;
  const startY = -totalH / 2 + cellH / 2;
  const cellFontSize = TYPOGRAPHY.fontSizeValue * scale;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ──────────────────────────────────
  const haloId = `memblk-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-cellW * 0.08));
  halo.setAttribute('cy', String(-totalH * 0.05));
  halo.setAttribute('rx', String(cellW * 0.8));
  halo.setAttribute('ry', String(totalH * 0.65));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ─────────────────────────────────────────
  const gsId = `memblk-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(totalH / 2 + cellH * 0.4));
  groundShadow.setAttribute('rx', String(cellW * 0.55));
  groundShadow.setAttribute('ry', String(cellH * 0.35));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ─────────────────────────────────────
  const aoId = `memblk-ao-${entityId}`;
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

  // ── Cells ───────────────────────────────────────────────────────────
  cells.forEach(({ addr, value }, i) => {
    const y = startY + i * (cellH + gap);

    const rect = document.createElementNS(SVG_NS, 'rect');
    rect.setAttribute('x', String(-cellW / 2));
    rect.setAttribute('y', String(y - cellH / 2));
    rect.setAttribute('width', String(cellW));
    rect.setAttribute('height', String(cellH));
    rect.setAttribute('rx', String(SHAPES.borderRadius - 2));
    rect.setAttribute('fill', cc.fill);
    rect.setAttribute('stroke', cc.stroke);
    rect.setAttribute('stroke-width', '2.5');
    innerG.appendChild(rect);

    // AO overlay per cell
    const aoRect = document.createElementNS(SVG_NS, 'rect');
    aoRect.setAttribute('x', String(-cellW / 2));
    aoRect.setAttribute('y', String(y - cellH / 2));
    aoRect.setAttribute('width', String(cellW));
    aoRect.setAttribute('height', String(cellH));
    aoRect.setAttribute('rx', String(SHAPES.borderRadius - 2));
    aoRect.setAttribute('fill', `url(#${aoId})`);
    aoRect.setAttribute('pointer-events', 'none');
    innerG.appendChild(aoRect);

    const addrText = document.createElementNS(SVG_NS, 'text');
    addrText.setAttribute('x', String(-cellW / 2 + 6));
    addrText.setAttribute('y', String(y + 4));
    addrText.setAttribute('text-anchor', 'start');
    addrText.setAttribute('fill', cc.textSecondary);
    addrText.setAttribute('font-size', String(cellFontSize * 0.9));
    addrText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    addrText.textContent = addr.length > 10 ? addr.slice(0, 8) + '\u2026' : addr;
    innerG.appendChild(addrText);

    const valText = document.createElementNS(SVG_NS, 'text');
    valText.setAttribute('x', String(cellW / 2 - 6));
    valText.setAttribute('y', String(y + 4));
    valText.setAttribute('text-anchor', 'end');
    valText.setAttribute('fill', cc.textPrimary);
    valText.setAttribute('font-size', String(cellFontSize));
    valText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    valText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    valText.textContent = value.length > 12 ? value.slice(0, 10) + '\u2026' : value;
    innerG.appendChild(valText);
  });

  // ── Pillar 4: Specular Highlight ────────────────────────────────────
  const specId = `memblk-spec-${entityId}`;
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
  specular.setAttribute('x', String(-cellW / 2));
  specular.setAttribute('y', String(-totalH / 2));
  specular.setAttribute('width', String(cellW));
  specular.setAttribute('height', String(totalH));
  specular.setAttribute('rx', String(SHAPES.borderRadius));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Pillar 5: Micro-Life Animation ──────────────────────────────────
  const styleId = `memblk-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes memblkFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      .memblk-float-${entityId} {
        animation: memblkFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`memblk-float-${entityId}`);

  // ── Label below ─────────────────────────────────────────────────────
  if (entity.label) {
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String(totalH / 2 + LABEL_DEFAULTS.offsetBelow));
    labelEl.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    labelEl.setAttribute('fill', cc.textPrimary);
    labelEl.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel * scale));
    labelEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    labelEl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    labelEl.textContent = entity.label;
    innerG.appendChild(labelEl);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
