/**
 * @preplai/illustrations — Container Component
 *
 * Glassmorphic dashed-border rectangle with glass panel and corner brackets.
 * Use for: Docker containers, pods, isolated environments.
 *
 * Visual depth: glass panel fill, gradient dashed border, corner brackets, radial halo.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, SHAPES, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlowFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderContainer(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const w = s * 1.1;
  const h = s * 0.75;
  const hw = w / 2;
  const hh = h / 2;

  const defs = ensureDefs(parentEl);

  // ── Radial depth halo ────────────────────────────────────────────────
  const haloId = `cnt-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', haloId);
    grad.setAttribute('cx', '50%'); grad.setAttribute('cy', '50%');
    grad.setAttribute('r', '50%');
    const hs1 = document.createElementNS(SVG_NS, 'stop');
    hs1.setAttribute('offset', '0%');
    hs1.setAttribute('stop-color', color);
    hs1.setAttribute('stop-opacity', '0.13');
    const hs2 = document.createElementNS(SVG_NS, 'stop');
    hs2.setAttribute('offset', '100%');
    hs2.setAttribute('stop-color', color);
    hs2.setAttribute('stop-opacity', '0');
    grad.appendChild(hs1); grad.appendChild(hs2);
    defs.appendChild(grad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', '0');
  halo.setAttribute('cy', '0');
  halo.setAttribute('rx', String(hw * 1.6));
  halo.setAttribute('ry', String(hh * 1.6));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // Highlight glow (behind shape)
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-hw - 3));
    glow.setAttribute('y', String(-hh - 3));
    glow.setAttribute('width', String(w + 6));
    glow.setAttribute('height', String(h + 6));
    glow.setAttribute('rx', String(SHAPES.borderRadius + 2));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Glass panel fill (inside border) ─────────────────────────────────
  const glowUrl = ensureGlowFilter(parentEl, color);
  const glassPanel = document.createElementNS(SVG_NS, 'rect');
  glassPanel.setAttribute('x', String(-hw + 4));
  glassPanel.setAttribute('y', String(-hh + 4));
  glassPanel.setAttribute('width', String(w - 8));
  glassPanel.setAttribute('height', String(h - 8));
  glassPanel.setAttribute('rx', String(SHAPES.borderRadius - 2));
  glassPanel.setAttribute('fill', cc.fill);
  glassPanel.setAttribute('stroke', 'none');
  glassPanel.setAttribute('filter', glowUrl);
  innerG.appendChild(glassPanel);

  // ── Gradient dashed border ─────────────────────────────────────────
  const borderGradId = `cntBorder_${entityId}`;
  if (!defs.querySelector(`#${borderGradId}`)) {
    const borderGrad = document.createElementNS(SVG_NS, 'linearGradient');
    borderGrad.setAttribute('id', borderGradId);
    borderGrad.setAttribute('gradientTransform', 'rotate(135)');
    [['0%', '0.8'], ['50%', '0.3'], ['100%', '0.7']].forEach(([off, op]) => {
      const st = document.createElementNS(SVG_NS, 'stop');
      st.setAttribute('offset', off);
      st.setAttribute('stop-color', color);
      st.setAttribute('stop-opacity', op);
      borderGrad.appendChild(st);
    });
    defs.appendChild(borderGrad);
  }

  const border = document.createElementNS(SVG_NS, 'rect');
  border.setAttribute('x', String(-hw));
  border.setAttribute('y', String(-hh));
  border.setAttribute('width', String(w));
  border.setAttribute('height', String(h));
  border.setAttribute('rx', String(SHAPES.borderRadius));
  border.setAttribute('fill', 'none');
  border.setAttribute('stroke', `url(#${borderGradId})`);
  border.setAttribute('stroke-width', String(STROKE.default));
  border.setAttribute('stroke-dasharray', '8,5');
  border.setAttribute('data-morph-target', 'true');
  innerG.appendChild(border);

  // ── Corner bracket accents (TL and BR) ────────────────────────────────
  const BS = Math.max(8, w * 0.10);
  const brackets = [
    { x: -hw, y: -hh, bw: BS, bh: 2, op: '0.9' },        // TL horizontal
    { x: -hw, y: -hh, bw: 2, bh: BS, op: '0.9' },        // TL vertical
    { x: hw - BS, y: hh - 2, bw: BS, bh: 2, op: '0.5' }, // BR horizontal
    { x: hw - 2, y: hh - BS, bw: 2, bh: BS, op: '0.5' }, // BR vertical
  ];
  brackets.forEach(b => {
    const br = document.createElementNS(SVG_NS, 'rect');
    br.setAttribute('x', String(b.x));
    br.setAttribute('y', String(b.y));
    br.setAttribute('width', String(b.bw));
    br.setAttribute('height', String(b.bh));
    br.setAttribute('fill', color);
    br.setAttribute('opacity', b.op);
    innerG.appendChild(br);
  });

  // Label below
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(hh + LABEL_DEFAULTS.offsetBelow));
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
