/**
 * @preplai/illustrations — Container Component
 *
 * Glassmorphic dashed-border rectangle with glass panel and corner brackets.
 * Use for: Docker containers, pods, isolated environments.
 *
 * Visual depth: glass panel fill, gradient dashed border, corner brackets, radial halo.
 *
 * Cinematic 5-pillar depth: offset halo, ground shadow, AO, glass filter,
 * frosted glass lines, breathing border animation, specular highlight.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, SHAPES, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlowFilter, ensureGlassFilter } from '../visual-utils.js';
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
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);

  // ── 1. Offset radial halo ───────────────────────────────────────────
  const haloId = `cnt-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', haloId);
    grad.setAttribute('cx', '38%'); grad.setAttribute('cy', '38%');
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
  halo.setAttribute('cx', String(-hw * 0.08));
  halo.setAttribute('cy', String(-hh * 0.08));
  halo.setAttribute('rx', String(hw * 1.6));
  halo.setAttribute('ry', String(hh * 1.6));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── 2. Ground contact shadow ────────────────────────────────────────
  const gndShadowId = `cnt-gnd-${entityId}`;
  if (!defs.querySelector(`#${gndShadowId}`)) {
    const gndGrad = document.createElementNS(SVG_NS, 'radialGradient');
    gndGrad.setAttribute('id', gndShadowId);
    const gs1 = document.createElementNS(SVG_NS, 'stop');
    gs1.setAttribute('offset', '0%');
    gs1.setAttribute('stop-color', '#000000');
    gs1.setAttribute('stop-opacity', '0.18');
    const gs2 = document.createElementNS(SVG_NS, 'stop');
    gs2.setAttribute('offset', '100%');
    gs2.setAttribute('stop-color', '#000000');
    gs2.setAttribute('stop-opacity', '0');
    gndGrad.appendChild(gs1); gndGrad.appendChild(gs2);
    defs.appendChild(gndGrad);
  }
  const gndShadow = document.createElementNS(SVG_NS, 'ellipse');
  gndShadow.setAttribute('cx', '0');
  gndShadow.setAttribute('cy', String(hh + 4));
  gndShadow.setAttribute('rx', String(hw * 0.7));
  gndShadow.setAttribute('ry', String(hh * 0.12));
  gndShadow.setAttribute('fill', `url(#${gndShadowId})`);
  innerG.appendChild(gndShadow);

  // ── 3. Ambient occlusion ────────────────────────────────────────────
  const aoId = `cnt-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const aoGrad = document.createElementNS(SVG_NS, 'radialGradient');
    aoGrad.setAttribute('id', aoId);
    aoGrad.setAttribute('cx', '75%'); aoGrad.setAttribute('cy', '75%');
    aoGrad.setAttribute('r', '50%');
    const ao1 = document.createElementNS(SVG_NS, 'stop');
    ao1.setAttribute('offset', '0%');
    ao1.setAttribute('stop-color', '#000000');
    ao1.setAttribute('stop-opacity', '0.10');
    const ao2 = document.createElementNS(SVG_NS, 'stop');
    ao2.setAttribute('offset', '100%');
    ao2.setAttribute('stop-color', '#000000');
    ao2.setAttribute('stop-opacity', '0');
    aoGrad.appendChild(ao1); aoGrad.appendChild(ao2);
    defs.appendChild(aoGrad);
  }
  const ao = document.createElementNS(SVG_NS, 'rect');
  ao.setAttribute('x', String(-hw));
  ao.setAttribute('y', String(-hh));
  ao.setAttribute('width', String(w));
  ao.setAttribute('height', String(h));
  ao.setAttribute('rx', String(SHAPES.borderRadius));
  ao.setAttribute('fill', `url(#${aoId})`);
  innerG.appendChild(ao);

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

  // ── 4. Glass panel fill (inside border) — with glass filter ─────────
  const _glowUrl = ensureGlowFilter(parentEl, color);
  const glassUrl = ensureGlassFilter(parentEl);
  const glassPanel = document.createElementNS(SVG_NS, 'rect');
  glassPanel.setAttribute('x', String(-hw + 4));
  glassPanel.setAttribute('y', String(-hh + 4));
  glassPanel.setAttribute('width', String(w - 8));
  glassPanel.setAttribute('height', String(h - 8));
  glassPanel.setAttribute('rx', String(SHAPES.borderRadius - 2));
  glassPanel.setAttribute('fill', cc.fill);
  glassPanel.setAttribute('stroke', 'none');
  glassPanel.setAttribute('filter', glassUrl);
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

  // ── 5. Material texture — 4 frosted glass lines ────────────────────
  for (let i = 0; i < 4; i++) {
    const lineY = -hh + (h / 5) * (i + 1);
    const frostLine = document.createElementNS(SVG_NS, 'line');
    frostLine.setAttribute('x1', String(-hw + 6));
    frostLine.setAttribute('y1', String(lineY));
    frostLine.setAttribute('x2', String(hw - 6));
    frostLine.setAttribute('y2', String(lineY));
    frostLine.setAttribute('stroke', '#ffffff');
    frostLine.setAttribute('stroke-width', '0.5');
    frostLine.setAttribute('stroke-opacity', '0.05');
    frostLine.setAttribute('pointer-events', 'none');
    innerG.appendChild(frostLine);
  }

  // ── 6. Breathing micro-animation — border opacity pulse ─────────────
  const styleId = `cnt-style-${entityId}`;
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes cntBorderBreathe_${entityId} {
        0%   { stroke-opacity: 0.5; stroke-width: ${STROKE.default}; }
        50%  { stroke-opacity: 1; stroke-width: ${STROKE.default * 1.5}; }
        100% { stroke-opacity: 0.5; stroke-width: ${STROKE.default}; }
      }
      @keyframes cntFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      .cnt-float-${entityId} {
        animation: cntFloat_${entityId} 4s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  border.setAttribute('style', `animation: cntBorderBreathe_${entityId} 3s ease-in-out infinite`);
  innerG.classList.add(`cnt-float-${entityId}`);

  // ── 7. Specular highlight ───────────────────────────────────────────
  const specId = `cnt-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    const specGrad = document.createElementNS(SVG_NS, 'radialGradient');
    specGrad.setAttribute('id', specId);
    specGrad.setAttribute('cx', '28%'); specGrad.setAttribute('cy', '22%');
    specGrad.setAttribute('r', '38%');
    const sp1 = document.createElementNS(SVG_NS, 'stop');
    sp1.setAttribute('offset', '0%');
    sp1.setAttribute('stop-color', '#ffffff');
    sp1.setAttribute('stop-opacity', '0.16');
    const sp2 = document.createElementNS(SVG_NS, 'stop');
    sp2.setAttribute('offset', '100%');
    sp2.setAttribute('stop-color', '#ffffff');
    sp2.setAttribute('stop-opacity', '0');
    specGrad.appendChild(sp1); specGrad.appendChild(sp2);
    defs.appendChild(specGrad);
  }
  const specular = document.createElementNS(SVG_NS, 'ellipse');
  specular.setAttribute('cx', String(-hw * 0.3));
  specular.setAttribute('cy', String(-hh * 0.35));
  specular.setAttribute('rx', String(hw * 0.5));
  specular.setAttribute('ry', String(hh * 0.35));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

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
