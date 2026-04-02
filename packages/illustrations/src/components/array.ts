/**
 * @preplai/illustrations — Array Component (Cinematic Depth)
 *
 * Five indexed cells in a row with bracket line.
 * Cinematic depth: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (cell highlight sweep + float).
 *
 * Metadata: { values: (string|number)[] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';import type { VisualEntity } from '@preplai/shared';

export function renderArray(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const values = ((meta.values as (string | number)[]) ?? [1, 2, 3, 4, 5]).slice(0, 8);

  const scale = size / 50;
  const cellW = 28 * scale;
  const cellH = 24 * scale;
  const totalW = values.length * cellW;
  const startX = -totalW / 2 + cellW / 2;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ──────────────────────────────────
  const haloId = `arr-halo-${entityId}`;
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
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', String(-totalW * 0.08));
  halo.setAttribute('cy', String(-size * 0.05));
  halo.setAttribute('rx', String(totalW * 0.7));
  halo.setAttribute('ry', String(cellH * 1.8));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ─────────────────────────────────────────
  const gsId = `arr-gs-${entityId}`;
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
  gs.setAttribute('cy', String(cellH / 2 + cellH * 0.25));
  gs.setAttribute('rx', String(totalW * 0.55));
  gs.setAttribute('ry', String(cellH * 0.25));
  gs.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(gs);

  // ── Pillar 3: Ambient Occlusion ─────────────────────────────────────
  const aoId = `arr-ao-${entityId}`;
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
  const ao = document.createElementNS(SVG_NS, 'rect');
  ao.setAttribute('x', String(-totalW / 2));
  ao.setAttribute('y', String(-cellH / 2));
  ao.setAttribute('width', String(totalW));
  ao.setAttribute('height', String(cellH));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Body fill + stroke gradients ────────────────────────────────────
  const bodyFillId = `arr-bf-${entityId}`;
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
  const bodyStrokeId = `arr-bs-${entityId}`;
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
    glow.setAttribute('x', String(-totalW / 2 - 3));
    glow.setAttribute('y', String(-cellH / 2 - 3));
    glow.setAttribute('width', String(totalW + 6));
    glow.setAttribute('height', String(cellH + 6));
    glow.setAttribute('rx', '6');
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Cells ───────────────────────────────────────────────────────────
  values.forEach((value, i) => {
    const x = startX + i * cellW;
    const pad = 2 * scale;

    const cell = document.createElementNS(SVG_NS, 'rect');
    cell.setAttribute('x', String(x - cellW / 2 + pad));
    cell.setAttribute('y', String(-cellH / 2));
    cell.setAttribute('width', String(cellW - pad * 2));
    cell.setAttribute('height', String(cellH));
    cell.setAttribute('rx', String(Math.max(1, 2 * scale)));
    cell.setAttribute('fill', `url(#${bodyFillId})`);
    cell.setAttribute('stroke', `url(#${bodyStrokeId})`);
    cell.setAttribute('stroke-width', String(STROKE.default));
    cell.classList.add(`arr-cell-${entityId}`);
    cell.style.animationDelay = `${i * 0.15}s`;
    innerG.appendChild(cell);

    // Index above
    const indexText = document.createElementNS(SVG_NS, 'text');
    indexText.setAttribute('x', String(x));
    indexText.setAttribute('y', String(-cellH / 2 - 6 * scale));
    indexText.setAttribute('text-anchor', 'middle');
    indexText.setAttribute('fill', cc.textSecondary);
    indexText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel * 0.7));
    indexText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    indexText.textContent = String(i);
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
    valueText.textContent = String(value);
    innerG.appendChild(valueText);
  });

  // ── Bracket line ────────────────────────────────────────────────────
  const bracketY = cellH / 2 + 4 * scale;
  const bracket = document.createElementNS(SVG_NS, 'path');
  bracket.setAttribute('d', `M ${-totalW / 2} ${bracketY} L ${-totalW / 2} ${bracketY + 3 * scale} L ${totalW / 2} ${bracketY + 3 * scale} L ${totalW / 2} ${bracketY}`);
  bracket.setAttribute('fill', 'none');
  bracket.setAttribute('stroke', colorWithAlpha(color, '55'));
  bracket.setAttribute('stroke-width', String(STROKE.default * 0.6));
  innerG.appendChild(bracket);

  // ── Pillar 4: Specular Highlight ────────────────────────────────────
  const specId = `arr-spec-${entityId}`;
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
  const spec = document.createElementNS(SVG_NS, 'ellipse');
  spec.setAttribute('cx', String(-totalW * 0.15));
  spec.setAttribute('cy', String(-cellH * 0.2));
  spec.setAttribute('rx', String(totalW * 0.35));
  spec.setAttribute('ry', String(cellH * 0.35));
  spec.setAttribute('fill', `url(#${specId})`);
  spec.setAttribute('pointer-events', 'none');
  innerG.appendChild(spec);

  // ── Pillar 5: Micro-Life ────────────────────────────────────────────
  const styleId = `arr-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes arrSweep_${entityId} {
        0%, 100% { transform: translateX(0) scale(1); }
        50% { transform: translateX(1.5px) scale(1.04); }
      }
      @keyframes arrFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .arr-cell-${entityId} {
        animation: arrSweep_${entityId} 2.8s ease-in-out infinite;
      }
      .arr-float-${entityId} {
        animation: arrFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`arr-float-${entityId}`);

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
