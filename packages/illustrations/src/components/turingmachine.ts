/**
 * @preplai/illustrations — TuringMachine Component (Cinematic Depth)
 *
 * Tape (row of cells) + read/write head + current state.
 * Cinematic depth: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (head bob + tape float).
 *
 * Metadata: { tape: string[], headPosition: number, state: string }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, LABEL_DEFAULTS } from '../design-tokens.js';import { resolveColorCascade } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

const CELL_W = 28;
const CELL_H = 26;
const GAP = 4;
const HEAD_SIZE = 10;

function parseTape(meta: Record<string, unknown>): string[] {
  const raw = (meta.tape ?? meta.cells ?? meta.values) as string[] | undefined;
  if (!Array.isArray(raw) || raw.length === 0) {
    return ['a', 'b', '_', 'a', 'b', '_'];
  }
  return raw.slice(0, 9).map((v) => String(v ?? '_'));
}

export function renderTuringMachine(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const scale = size / 50;
  const meta = entity.metadata ?? {};
  const tape = parseTape(meta);
  const headPos = Math.max(0, Math.min(tape.length - 1, Math.floor(Number(meta.headPosition ?? 2))));
  const state = String(meta.state ?? 'q0');

  const totalW = tape.length * (CELL_W + GAP) - GAP;
  const startX = -totalW / 2 + (CELL_W + GAP) / 2;

  const valueFontSize = TYPOGRAPHY.fontSizeValue / scale;
  const stateFontSize = TYPOGRAPHY.fontSizeBadge / scale;

  const defs = ensureDefs(parentEl);

  const scaleGroup = document.createElementNS(SVG_NS, 'g');
  scaleGroup.setAttribute('transform', `scale(${scale})`);

  // ── Pillar 1: Directional Lighting ─────────────────────────────────
  const haloId = `turing-halo-${entityId}`;
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
  halo.setAttribute('x', String(-totalW / 2 - 10));
  halo.setAttribute('y', String(-CELL_H - HEAD_SIZE - 10));
  halo.setAttribute('width', String(totalW + 20));
  halo.setAttribute('height', String(CELL_H * 2 + HEAD_SIZE + 30));
  halo.setAttribute('fill', `url(#${haloId})`);
  scaleGroup.appendChild(halo);

  // ── Pillar 2: Ground Shadow ────────────────────────────────────────
  const gsId = `turing-gs-${entityId}`;
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
  gs.setAttribute('cy', String(CELL_H / 2 + 20));
  gs.setAttribute('rx', String(totalW * 0.35));
  gs.setAttribute('ry', String(CELL_H * 0.25));
  gs.setAttribute('fill', `url(#${gsId})`);
  scaleGroup.appendChild(gs);

  // ── Pillar 3: Ambient Occlusion ────────────────────────────────────
  const aoId = `turing-ao-${entityId}`;
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
  const specId = `turing-spec-${entityId}`;
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

  // ── Tape cells ─────────────────────────────────────────────────────
  tape.forEach((sym, i) => {
    const x = startX + i * (CELL_W + GAP);
    const isHead = i === headPos;

    const cell = document.createElementNS(SVG_NS, 'rect');
    cell.setAttribute('x', String(x - CELL_W / 2 + 2));
    cell.setAttribute('y', String(-CELL_H / 2));
    cell.setAttribute('width', String(CELL_W - 4));
    cell.setAttribute('height', String(CELL_H));
    cell.setAttribute('rx', String(Math.max(1, 3)));
    cell.setAttribute('fill', cc.fill);
    cell.setAttribute('stroke', isHead ? cc.stroke : cc.strokeSoft);
    cell.setAttribute('stroke-width', '2.5');
    scaleGroup.appendChild(cell);

    // AO overlay on cell
    const aoOverlay = document.createElementNS(SVG_NS, 'rect');
    aoOverlay.setAttribute('x', String(x - CELL_W / 2 + 2));
    aoOverlay.setAttribute('y', String(-CELL_H / 2));
    aoOverlay.setAttribute('width', String(CELL_W - 4));
    aoOverlay.setAttribute('height', String(CELL_H));
    aoOverlay.setAttribute('rx', '3');
    aoOverlay.setAttribute('fill', `url(#${aoId})`);
    aoOverlay.setAttribute('pointer-events', 'none');
    scaleGroup.appendChild(aoOverlay);

    // Specular on cell (top half)
    const cellSpec = document.createElementNS(SVG_NS, 'rect');
    cellSpec.setAttribute('x', String(x - CELL_W / 2 + 2));
    cellSpec.setAttribute('y', String(-CELL_H / 2));
    cellSpec.setAttribute('width', String(CELL_W - 4));
    cellSpec.setAttribute('height', String(CELL_H * 0.5));
    cellSpec.setAttribute('rx', '3');
    cellSpec.setAttribute('fill', `url(#${specId})`);
    cellSpec.setAttribute('pointer-events', 'none');
    scaleGroup.appendChild(cellSpec);

    const displaySym = sym === '_' || sym === ' ' ? '\u25A1' : (sym.length > 1 ? sym[0] : sym);
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(x));
    text.setAttribute('y', String(5));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', cc.textPrimary);
    text.setAttribute('font-size', String(valueFontSize));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = displaySym;
    scaleGroup.appendChild(text);
  });

  // ── Read/Write Head ────────────────────────────────────────────────
  const headX = startX + headPos * (CELL_W + GAP);
  const headY = -CELL_H / 2 - HEAD_SIZE;
  const head = document.createElementNS(SVG_NS, 'polygon');
  head.setAttribute(
    'points',
    `${headX},${headY + HEAD_SIZE} ${headX - HEAD_SIZE / 2},${headY} ${headX + HEAD_SIZE / 2},${headY}`,
  );
  head.setAttribute('fill', color);
  head.setAttribute('stroke', cc.stroke);
  head.setAttribute('stroke-width', '2.5');
  scaleGroup.appendChild(head);

  // ── State label ────────────────────────────────────────────────────
  const stateY = CELL_H / 2 + 14;
  const stateText = document.createElementNS(SVG_NS, 'text');
  stateText.setAttribute('x', '0');
  stateText.setAttribute('y', String(stateY));
  stateText.setAttribute('text-anchor', 'middle');
  stateText.setAttribute('fill', cc.textSecondary);
  stateText.setAttribute('font-size', String(stateFontSize));
  stateText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  stateText.textContent = `state: ${state.length > 12 ? state.slice(0, 11) + '\u2026' : state}`;
  scaleGroup.appendChild(stateText);

  innerG.appendChild(scaleGroup);

  // ── Pillar 5: Micro-Life ───────────────────────────────────────────
  const styleId = `turing-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes turingFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes turingBob_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
      }
      .turing-float-${entityId} {
        animation: turingFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`turing-float-${entityId}`);

  // ── Label below ────────────────────────────────────────────────────
  if (entity.label) {
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String(stateY + CELL_H / 2 * scale + LABEL_DEFAULTS.offsetBelow));
    labelEl.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    labelEl.setAttribute('fill', cc.textPrimary);
    labelEl.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    labelEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    labelEl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    labelEl.textContent = entity.label;
    innerG.appendChild(labelEl);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
