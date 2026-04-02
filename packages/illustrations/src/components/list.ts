/**
 * @preplai/illustrations — List Component (Cinematic Depth)
 *
 * Four vertical item rows with bullet dots and content lines.
 * Cinematic depth: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (item shimmer translateX staggered + float).
 *
 * Metadata: { values: (string|number)[] } or { cells: (string|number)[] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';import type { VisualEntity } from '@preplai/shared';

export function renderList(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const scale = size / 50;
  const meta = entity.metadata ?? {};
  const values = ((meta.values as (string | number)[]) ?? (meta.cells as (string | number)[]) ?? [1, 2, 3, 4]).slice(0, 6);

  const rowH = 18 * scale;
  const rowW = 60 * scale;
  const rowGap = 4 * scale;
  const totalH = values.length * rowH + (values.length - 1) * rowGap;
  const bulletR = 3 * scale;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ──────────────────────────────────
  const haloId = `lst-halo-${entityId}`;
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
  haloEl.setAttribute('cx', String(-rowW * 0.08));
  haloEl.setAttribute('cy', String(-size * 0.05));
  haloEl.setAttribute('rx', String(rowW * 0.65));
  haloEl.setAttribute('ry', String(totalH * 0.55));
  haloEl.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(haloEl);

  // ── Pillar 2: Ground Shadow ─────────────────────────────────────────
  const gsId = `lst-gs-${entityId}`;
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
  gsEl.setAttribute('cy', String(totalH / 2 + rowH * 0.3));
  gsEl.setAttribute('rx', String(rowW * 0.55));
  gsEl.setAttribute('ry', String(rowH * 0.3));
  gsEl.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(gsEl);

  // ── Pillar 3: Ambient Occlusion ─────────────────────────────────────
  const aoId = `lst-ao-${entityId}`;
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
  aoEl.setAttribute('x', String(-rowW / 2));
  aoEl.setAttribute('y', String(-totalH / 2));
  aoEl.setAttribute('width', String(rowW));
  aoEl.setAttribute('height', String(totalH));
  aoEl.setAttribute('fill', `url(#${aoId})`);
  aoEl.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoEl);

  // ── Body gradients ──────────────────────────────────────────────────
  const bodyFillId = `lst-bf-${entityId}`;
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
  const bodyStrokeId = `lst-bst-${entityId}`;
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
    glow.setAttribute('x', String(-rowW / 2 - 3));
    glow.setAttribute('y', String(-totalH / 2 - 3));
    glow.setAttribute('width', String(rowW + 6));
    glow.setAttribute('height', String(totalH + 6));
    glow.setAttribute('rx', '6');
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Rows ────────────────────────────────────────────────────────────
  values.forEach((val, i) => {
    const y = -totalH / 2 + i * (rowH + rowGap) + rowH / 2;

    // Row background
    const row = document.createElementNS(SVG_NS, 'rect');
    row.setAttribute('x', String(-rowW / 2));
    row.setAttribute('y', String(y - rowH / 2));
    row.setAttribute('width', String(rowW));
    row.setAttribute('height', String(rowH));
    row.setAttribute('rx', String(2 * scale));
    row.setAttribute('fill', `url(#${bodyFillId})`);
    row.setAttribute('stroke', `url(#${bodyStrokeId})`);
    row.setAttribute('stroke-width', String(STROKE.default * 0.7));
    row.classList.add(`lst-item-${entityId}`);
    row.style.animationDelay = `${i * 0.2}s`;
    innerG.appendChild(row);

    // Bullet dot
    const bullet = document.createElementNS(SVG_NS, 'circle');
    bullet.setAttribute('cx', String(-rowW / 2 + bulletR * 3));
    bullet.setAttribute('cy', String(y));
    bullet.setAttribute('r', String(bulletR));
    bullet.setAttribute('fill', color);
    innerG.appendChild(bullet);

    // Content line (text)
    const contentLine = document.createElementNS(SVG_NS, 'text');
    contentLine.setAttribute('x', String(-rowW / 2 + bulletR * 6));
    contentLine.setAttribute('y', String(y + 4 * scale));
    contentLine.setAttribute('fill', cc.textPrimary);
    contentLine.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel * 0.8));
    contentLine.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    contentLine.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    contentLine.textContent = String(val);
    innerG.appendChild(contentLine);
  });

  // ── Pillar 4: Specular Highlight ────────────────────────────────────
  const specId = `lst-spec-${entityId}`;
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
  specEl.setAttribute('cx', String(-rowW * 0.1));
  specEl.setAttribute('cy', String(-totalH * 0.3));
  specEl.setAttribute('rx', String(rowW * 0.3));
  specEl.setAttribute('ry', String(totalH * 0.2));
  specEl.setAttribute('fill', `url(#${specId})`);
  specEl.setAttribute('pointer-events', 'none');
  innerG.appendChild(specEl);

  // ── Pillar 5: Micro-Life ────────────────────────────────────────────
  const styleId = `lst-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes lstItemShimmer_${entityId} {
        0%, 100% { transform: translateX(0); }
        50% { transform: translateX(2px); }
      }
      @keyframes lstFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .lst-item-${entityId} {
        animation: lstItemShimmer_${entityId} 2.6s ease-in-out infinite;
      }
      .lst-float-${entityId} {
        animation: lstFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`lst-float-${entityId}`);

  // ── Label below ─────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(totalH / 2 + LABEL_DEFAULTS.offsetBelow));
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
