/**
 * @preplai/illustrations — Set Component (Cinematic Depth)
 *
 * Large ellipse boundary with scattered element dots.
 * Cinematic depth: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (element pulse staggered + boundary breathe + float).
 *
 * Metadata: { values: (string|number)[] }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';import type { VisualEntity } from '@preplai/shared';

export function renderSet(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const scale = size / 50;
  const meta = entity.metadata ?? {};
  const values = ((meta.values as (string | number)[]) ?? ['a', 'b', 'c']).slice(0, 8).map(String);

  const rx = size * 0.65;
  const ry = size * 0.45;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ──────────────────────────────────
  const haloId = `set-halo-${entityId}`;
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
  haloEl.setAttribute('cx', String(-rx * 0.15));
  haloEl.setAttribute('cy', String(-ry * 0.1));
  haloEl.setAttribute('rx', String(rx * 1.3));
  haloEl.setAttribute('ry', String(ry * 1.2));
  haloEl.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(haloEl);

  // ── Pillar 2: Ground Shadow ─────────────────────────────────────────
  const gsId = `set-gs-${entityId}`;
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
  gsEl.setAttribute('cy', String(ry + ry * 0.15));
  gsEl.setAttribute('rx', String(rx * 0.9));
  gsEl.setAttribute('ry', String(ry * 0.2));
  gsEl.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(gsEl);

  // ── Pillar 3: Ambient Occlusion ─────────────────────────────────────
  const aoId = `set-ao-${entityId}`;
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
  const aoEl = document.createElementNS(SVG_NS, 'ellipse');
  aoEl.setAttribute('cx', String(rx * 0.15));
  aoEl.setAttribute('cy', String(ry * 0.15));
  aoEl.setAttribute('rx', String(rx));
  aoEl.setAttribute('ry', String(ry));
  aoEl.setAttribute('fill', `url(#${aoId})`);
  aoEl.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoEl);

  // ── Body gradients ──────────────────────────────────────────────────
  const bodyFillId = `set-bf-${entityId}`;
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
  const bodyStrokeId = `set-bst-${entityId}`;
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
    const glow = document.createElementNS(SVG_NS, 'ellipse');
    glow.setAttribute('cx', '0');
    glow.setAttribute('cy', '0');
    glow.setAttribute('rx', String(rx + 3));
    glow.setAttribute('ry', String(ry + 3));
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Boundary ellipse ────────────────────────────────────────────────
  const boundary = document.createElementNS(SVG_NS, 'ellipse');
  boundary.setAttribute('cx', '0');
  boundary.setAttribute('cy', '0');
  boundary.setAttribute('rx', String(rx));
  boundary.setAttribute('ry', String(ry));
  boundary.setAttribute('fill', `url(#${bodyFillId})`);
  boundary.setAttribute('stroke', `url(#${bodyStrokeId})`);
  boundary.setAttribute('stroke-width', String(STROKE.default));
  boundary.setAttribute('stroke-dasharray', '6,3');
  boundary.classList.add(`set-boundary-${entityId}`);
  innerG.appendChild(boundary);

  // ── Scattered element dots ──────────────────────────────────────────
  // Distribute values in a scattered pattern inside the ellipse
  const dotR = 5 * scale;
  const angleStep = (Math.PI * 2) / values.length;
  values.forEach((val, i) => {
    // Scatter using golden angle for even distribution
    const angle = i * angleStep + Math.PI / 6;
    const dist = 0.35 + (i % 3) * 0.18;
    const ex = Math.cos(angle) * rx * dist;
    const ey = Math.sin(angle) * ry * dist;

    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(ex));
    dot.setAttribute('cy', String(ey));
    dot.setAttribute('r', String(dotR));
    dot.setAttribute('fill', colorWithAlpha(color, '66'));
    dot.setAttribute('stroke', color);
    dot.setAttribute('stroke-width', String(STROKE.default * 0.6));
    dot.classList.add(`set-elem-${entityId}`);
    dot.style.animationDelay = `${i * 0.2}s`;
    innerG.appendChild(dot);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', String(ex));
    text.setAttribute('y', String(ey + 3.5 * scale));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', cc.textPrimary);
    text.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel * 0.7));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    text.textContent = val.slice(0, 4);
    innerG.appendChild(text);
  });

  // ── Pillar 4: Specular Highlight ────────────────────────────────────
  const specId = `set-spec-${entityId}`;
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
  specEl.setAttribute('cx', String(-rx * 0.2));
  specEl.setAttribute('cy', String(-ry * 0.3));
  specEl.setAttribute('rx', String(rx * 0.45));
  specEl.setAttribute('ry', String(ry * 0.35));
  specEl.setAttribute('fill', `url(#${specId})`);
  specEl.setAttribute('pointer-events', 'none');
  innerG.appendChild(specEl);

  // ── Pillar 5: Micro-Life ────────────────────────────────────────────
  const styleId = `set-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes setElemPulse_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.15); }
      }
      @keyframes setBoundaryBreathe_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }
      @keyframes setFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .set-elem-${entityId} {
        animation: setElemPulse_${entityId} 2.2s ease-in-out infinite;
      }
      .set-boundary-${entityId} {
        animation: setBoundaryBreathe_${entityId} 3s ease-in-out infinite;
      }
      .set-float-${entityId} {
        animation: setFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`set-float-${entityId}`);

  // ── Label below ─────────────────────────────────────────────────────
  if (entity.label) {
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String(ry + LABEL_DEFAULTS.offsetBelow));
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
