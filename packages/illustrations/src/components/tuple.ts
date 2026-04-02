/**
 * @preplai/illustrations — Tuple Component (Cinematic Depth)
 *
 * Three cells with values + parentheses.
 * Cinematic depth: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (cell highlight staggered + paren breathe + float).
 *
 * Metadata: { values: (string|number)[] } or { cells: (string|number)[] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';import type { VisualEntity } from '@preplai/shared';

export function renderTuple(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const scale = size / 50;
  const meta = entity.metadata ?? {};
  const values = ((meta.values as (string | number)[]) ?? (meta.cells as (string | number)[]) ?? [1, 2, 3]).slice(0, 6);

  const cellW = 28 * scale;
  const cellH = 24 * scale;
  const cellGap = 4 * scale;
  const totalW = values.length * cellW + (values.length - 1) * cellGap;
  const parenW = 10 * scale;
  const fullW = totalW + parenW * 2;
  const startX = -totalW / 2 + cellW / 2;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ──────────────────────────────────
  const haloId = `tpl-halo-${entityId}`;
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
  const haloEl = document.createElementNS(SVG_NS, 'ellipse');
  haloEl.setAttribute('cx', String(-fullW * 0.08));
  haloEl.setAttribute('cy', String(-size * 0.05));
  haloEl.setAttribute('rx', String(fullW * 0.6));
  haloEl.setAttribute('ry', String(cellH * 1.8));
  haloEl.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(haloEl);

  // ── Pillar 2: Ground Shadow ─────────────────────────────────────────
  const gsId = `tpl-gs-${entityId}`;
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
  const gsEl = document.createElementNS(SVG_NS, 'ellipse');
  gsEl.setAttribute('cx', '0');
  gsEl.setAttribute('cy', String(cellH / 2 + cellH * 0.25));
  gsEl.setAttribute('rx', String(fullW * 0.5));
  gsEl.setAttribute('ry', String(cellH * 0.2));
  gsEl.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(gsEl);

  // ── Pillar 3: Ambient Occlusion ─────────────────────────────────────
  const aoId = `tpl-ao-${entityId}`;
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
  const aoEl = document.createElementNS(SVG_NS, 'rect');
  aoEl.setAttribute('x', String(-fullW / 2));
  aoEl.setAttribute('y', String(-cellH / 2));
  aoEl.setAttribute('width', String(fullW));
  aoEl.setAttribute('height', String(cellH));
  aoEl.setAttribute('fill', `url(#${aoId})`);
  aoEl.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoEl);

  // ── Body gradients ──────────────────────────────────────────────────
  const bodyFillId = `tpl-bf-${entityId}`;
  if (!defs.querySelector(`#${bodyFillId}`)) {
    const g = document.createElementNS(SVG_NS, 'radialGradient');
    g.setAttribute('id', bodyFillId);
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.3');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.08');
    g.appendChild(s1); g.appendChild(s2);
    defs.appendChild(g);
  }
  const bodyStrokeId = `tpl-bst-${entityId}`;
  if (!defs.querySelector(`#${bodyStrokeId}`)) {
    const g = document.createElementNS(SVG_NS, 'linearGradient');
    g.setAttribute('id', bodyStrokeId);
    g.setAttribute('x1', '0%'); g.setAttribute('y1', '0%'); g.setAttribute('x2', '100%'); g.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.9');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.3');
    g.appendChild(s1); g.appendChild(s2);
    defs.appendChild(g);
  }

  // ── Highlight glow ring ─────────────────────────────────────────────
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-fullW / 2 - 3));
    glow.setAttribute('y', String(-cellH / 2 - 3));
    glow.setAttribute('width', String(fullW + 6));
    glow.setAttribute('height', String(cellH + 6));
    glow.setAttribute('rx', '6');
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Parentheses ─────────────────────────────────────────────────────
  const parenSize = cellH * 0.9;
  const leftParen = document.createElementNS(SVG_NS, 'text');
  leftParen.setAttribute('x', String(-totalW / 2 - parenW * 0.5));
  leftParen.setAttribute('y', String(cellH * 0.15));
  leftParen.setAttribute('text-anchor', 'middle');
  leftParen.setAttribute('fill', colorWithAlpha(color, '88'));
  leftParen.setAttribute('font-size', String(parenSize));
  leftParen.setAttribute('font-family', 'serif');
  leftParen.classList.add(`tpl-paren-${entityId}`);
  leftParen.textContent = '(';
  innerG.appendChild(leftParen);

  const rightParen = document.createElementNS(SVG_NS, 'text');
  rightParen.setAttribute('x', String(totalW / 2 + parenW * 0.5));
  rightParen.setAttribute('y', String(cellH * 0.15));
  rightParen.setAttribute('text-anchor', 'middle');
  rightParen.setAttribute('fill', colorWithAlpha(color, '88'));
  rightParen.setAttribute('font-size', String(parenSize));
  rightParen.setAttribute('font-family', 'serif');
  rightParen.classList.add(`tpl-paren-${entityId}`);
  rightParen.textContent = ')';
  innerG.appendChild(rightParen);

  // ── Cells ───────────────────────────────────────────────────────────
  values.forEach((val, i) => {
    const x = startX + i * (cellW + cellGap);

    const cell = document.createElementNS(SVG_NS, 'rect');
    cell.setAttribute('x', String(x - cellW / 2 + 2 * scale));
    cell.setAttribute('y', String(-cellH / 2));
    cell.setAttribute('width', String(cellW - 4 * scale));
    cell.setAttribute('height', String(cellH));
    cell.setAttribute('rx', String(Math.max(1, 2 * scale)));
    cell.setAttribute('fill', `url(#${bodyFillId})`);
    cell.setAttribute('stroke', `url(#${bodyStrokeId})`);
    cell.setAttribute('stroke-width', String(STROKE.default));
    cell.classList.add(`tpl-cell-${entityId}`);
    cell.style.animationDelay = `${i * 0.2}s`;
    innerG.appendChild(cell);

    // Index above
    const indexText = document.createElementNS(SVG_NS, 'text');
    indexText.setAttribute('x', String(x));
    indexText.setAttribute('y', String(-cellH / 2 - 5 * scale));
    indexText.setAttribute('text-anchor', 'middle');
    indexText.setAttribute('fill', cc.textSecondary);
    indexText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel * 0.65));
    indexText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    indexText.textContent = `(${i})`;
    innerG.appendChild(indexText);

    // Value centered
    const valueText = document.createElementNS(SVG_NS, 'text');
    valueText.setAttribute('x', String(x));
    valueText.setAttribute('y', String(4 * scale));
    valueText.setAttribute('text-anchor', 'middle');
    valueText.setAttribute('fill', cc.textPrimary);
    valueText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    valueText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    valueText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    const display = String(val).length > 6 ? String(val).slice(0, 5) + '\u2026' : String(val);
    valueText.textContent = display;
    innerG.appendChild(valueText);
  });

  // ── Pillar 4: Specular Highlight ────────────────────────────────────
  const specId = `tpl-spec-${entityId}`;
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
  const specEl = document.createElementNS(SVG_NS, 'ellipse');
  specEl.setAttribute('cx', String(-fullW * 0.12));
  specEl.setAttribute('cy', String(-cellH * 0.2));
  specEl.setAttribute('rx', String(fullW * 0.3));
  specEl.setAttribute('ry', String(cellH * 0.3));
  specEl.setAttribute('fill', `url(#${specId})`);
  specEl.setAttribute('pointer-events', 'none');
  innerG.appendChild(specEl);

  // ── Pillar 5: Micro-Life ────────────────────────────────────────────
  const styleId = `tpl-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes tplCellHighlight_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
      }
      @keyframes tplParenBreathe_${entityId} {
        0%, 100% { transform: scaleX(1); }
        50% { transform: scaleX(1.08); }
      }
      @keyframes tplFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .tpl-cell-${entityId} {
        animation: tplCellHighlight_${entityId} 2.4s ease-in-out infinite;
      }
      .tpl-paren-${entityId} {
        animation: tplParenBreathe_${entityId} 3s ease-in-out infinite;
      }
      .tpl-float-${entityId} {
        animation: tplFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`tpl-float-${entityId}`);

  // ── Label below ─────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(cellH / 2 + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('fill', cc.textPrimary);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
