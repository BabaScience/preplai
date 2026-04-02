/**
 * @preplai/illustrations — ArrayCell Component (Cinematic Depth)
 *
 * Single clean cell with value and index.
 * Cinematic depth: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (breathe pulse + float).
 *
 * Metadata: { value: string|number, index: number }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderArrayCell(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const scale = size / 50;
  const meta = entity.metadata ?? {};
  const value = String(meta.value ?? entity.label ?? '?');
  const index = typeof meta.index === 'number' ? meta.index : 0;

  const cellW = 28 * scale;
  const cellH = 24 * scale;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ─────────────────────────────────
  const haloId = `acell-halo-${entityId}`;
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
  halo.setAttribute('x', String(-cellW * 0.8));
  halo.setAttribute('y', String(-cellH * 0.8));
  halo.setAttribute('width', String(cellW * 1.6));
  halo.setAttribute('height', String(cellH * 1.6));
  halo.setAttribute('rx', '6');
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ────────────────────────────────────────
  const gsId = `acell-gs-${entityId}`;
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
  gs.setAttribute('cy', String(cellH / 2 + 3 * scale));
  gs.setAttribute('rx', String(cellW * 0.55));
  gs.setAttribute('ry', String(cellH * 0.18));
  gs.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(gs);

  // ── Pillar 3: Ambient Occlusion ────────────────────────────────────
  const aoId = `acell-ao-${entityId}`;
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

  // ── Highlight glow ─────────────────────────────────────────────────
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-cellW / 2 - 3));
    glow.setAttribute('y', String(-cellH / 2 - 3));
    glow.setAttribute('width', String(cellW + 6));
    glow.setAttribute('height', String(cellH + 6));
    glow.setAttribute('rx', '6');
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Cell body ──────────────────────────────────────────────────────
  const pad = 2 * scale;
  const cell = document.createElementNS(SVG_NS, 'rect');
  cell.setAttribute('x', String(-cellW / 2 + pad));
  cell.setAttribute('y', String(-cellH / 2));
  cell.setAttribute('width', String(cellW - pad * 2));
  cell.setAttribute('height', String(cellH));
  cell.setAttribute('rx', String(Math.max(1, 2 * scale)));
  cell.setAttribute('fill', cc.fill);
  cell.setAttribute('stroke', cc.stroke);
  cell.setAttribute('stroke-width', '2.5');
  innerG.appendChild(cell);

  // AO overlay on cell
  const aoRect = document.createElementNS(SVG_NS, 'rect');
  aoRect.setAttribute('x', String(-cellW / 2 + pad));
  aoRect.setAttribute('y', String(-cellH / 2));
  aoRect.setAttribute('width', String(cellW - pad * 2));
  aoRect.setAttribute('height', String(cellH));
  aoRect.setAttribute('rx', String(Math.max(1, 2 * scale)));
  aoRect.setAttribute('fill', `url(#${aoId})`);
  aoRect.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoRect);

  // ── Pillar 4: Specular Highlight ───────────────────────────────────
  const specId = `acell-spec-${entityId}`;
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
  const spec = document.createElementNS(SVG_NS, 'rect');
  spec.setAttribute('x', String(-cellW / 2 + pad));
  spec.setAttribute('y', String(-cellH / 2));
  spec.setAttribute('width', String(cellW - pad * 2));
  spec.setAttribute('height', String(cellH * 0.6));
  spec.setAttribute('rx', String(Math.max(1, 2 * scale)));
  spec.setAttribute('fill', `url(#${specId})`);
  spec.setAttribute('pointer-events', 'none');
  innerG.appendChild(spec);

  // ── Index above ────────────────────────────────────────────────────
  const indexText = document.createElementNS(SVG_NS, 'text');
  indexText.setAttribute('x', '0');
  indexText.setAttribute('y', String(-cellH / 2 - 6));
  indexText.setAttribute('text-anchor', 'middle');
  indexText.setAttribute('fill', cc.textSecondary);
  indexText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeBadge));
  indexText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  indexText.textContent = String(index);
  innerG.appendChild(indexText);

  // ── Value centered ─────────────────────────────────────────────────
  const valueText = document.createElementNS(SVG_NS, 'text');
  valueText.setAttribute('x', '0');
  valueText.setAttribute('y', String(4));
  valueText.setAttribute('text-anchor', 'middle');
  valueText.setAttribute('fill', cc.textPrimary);
  valueText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeValue));
  valueText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
  valueText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  valueText.textContent = value;
  innerG.appendChild(valueText);

  // ── Pillar 5: Micro-Life (breathe + float) ─────────────────────────
  const styleId = `acell-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes acellBreathe_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.04); }
      }
      @keyframes acellFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      .acell-breathe-${entityId} {
        animation: acellBreathe_${entityId} 2.8s ease-in-out infinite;
      }
      .acell-float-${entityId} {
        animation: acellFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  cell.classList.add(`acell-breathe-${entityId}`);
  innerG.classList.add(`acell-float-${entityId}`);

  // ── Label below ────────────────────────────────────────────────────
  if (entity.label && entity.label !== value) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(cellH / 2 + LABEL_DEFAULTS.offsetBelow));
    text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    text.setAttribute('fill', cc.textPrimary);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
