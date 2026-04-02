/**
 * @preplai/illustrations — Mutex Component (Cinematic Depth)
 *
 * Clean rect with simple lock icon inside.
 * Cinematic depth: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (lock breathe + float).
 *
 * Metadata:
 *   locked?: boolean — whether the mutex is locked (default false)
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderMutex(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const locked = (meta.locked as boolean) ?? false;

  const w = size * 0.85;
  const h = size * 0.7;
  const hw = w / 2;
  const hh = h / 2;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ─────────────────────────────────
  const haloId = `mutex-halo-${entityId}`;
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
  halo.setAttribute('x', String(-hw - 8));
  halo.setAttribute('y', String(-hh - 8));
  halo.setAttribute('width', String(w + 16));
  halo.setAttribute('height', String(h + 16));
  halo.setAttribute('rx', '6');
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ────────────────────────────────────────
  const gsId = `mutex-gs-${entityId}`;
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
  gs.setAttribute('cy', String(hh + 4));
  gs.setAttribute('rx', String(w * 0.4));
  gs.setAttribute('ry', String(h * 0.08));
  gs.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(gs);

  // ── Pillar 3: Ambient Occlusion ────────────────────────────────────
  const aoId = `mutex-ao-${entityId}`;
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
  const specId = `mutex-spec-${entityId}`;
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
    glow.setAttribute('x', String(-hw - 3));
    glow.setAttribute('y', String(-hh - 3));
    glow.setAttribute('width', String(w + 6));
    glow.setAttribute('height', String(h + 6));
    glow.setAttribute('rx', '6');
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Body ───────────────────────────────────────────────────────────
  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x', String(-hw));
  rect.setAttribute('y', String(-hh));
  rect.setAttribute('width', String(w));
  rect.setAttribute('height', String(h));
  rect.setAttribute('rx', '4');
  rect.setAttribute('fill', cc.fill);
  rect.setAttribute('stroke', cc.stroke);
  rect.setAttribute('stroke-width', '2.5');
  innerG.appendChild(rect);

  // AO overlay
  const aoRect = document.createElementNS(SVG_NS, 'rect');
  aoRect.setAttribute('x', String(-hw));
  aoRect.setAttribute('y', String(-hh));
  aoRect.setAttribute('width', String(w));
  aoRect.setAttribute('height', String(h));
  aoRect.setAttribute('rx', '4');
  aoRect.setAttribute('fill', `url(#${aoId})`);
  aoRect.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoRect);

  // Specular overlay
  const specRect = document.createElementNS(SVG_NS, 'rect');
  specRect.setAttribute('x', String(-hw));
  specRect.setAttribute('y', String(-hh));
  specRect.setAttribute('width', String(w));
  specRect.setAttribute('height', String(h * 0.45));
  specRect.setAttribute('rx', '4');
  specRect.setAttribute('fill', `url(#${specId})`);
  specRect.setAttribute('pointer-events', 'none');
  innerG.appendChild(specRect);

  // ── Lock icon (stroke-based) ───────────────────────────────────────
  const ls = size * 0.12;
  const lockBody = document.createElementNS(SVG_NS, 'rect');
  lockBody.setAttribute('x', String(-ls * 1.2));
  lockBody.setAttribute('y', String(-ls * 0.2));
  lockBody.setAttribute('width', String(ls * 2.4));
  lockBody.setAttribute('height', String(ls * 1.8));
  lockBody.setAttribute('rx', String(ls * 0.3));
  lockBody.setAttribute('fill', 'none');
  lockBody.setAttribute('stroke', cc.stroke);
  lockBody.setAttribute('stroke-width', '2.5');
  innerG.appendChild(lockBody);

  const shackle = document.createElementNS(SVG_NS, 'path');
  if (locked) {
    shackle.setAttribute('d',
      `M ${-ls * 0.7} ${-ls * 0.2} V ${-ls * 1.0} A ${ls * 0.7} ${ls * 0.7} 0 0 1 ${ls * 0.7} ${-ls * 1.0} V ${-ls * 0.2}`
    );
  } else {
    shackle.setAttribute('d',
      `M ${-ls * 0.7} ${-ls * 0.2} V ${-ls * 1.0} A ${ls * 0.7} ${ls * 0.7} 0 0 1 ${ls * 0.7} ${-ls * 1.0} V ${-ls * 0.6}`
    );
  }
  shackle.setAttribute('fill', 'none');
  shackle.setAttribute('stroke', cc.stroke);
  shackle.setAttribute('stroke-width', '2.5');
  shackle.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(shackle);

  // ── Pillar 5: Micro-Life ───────────────────────────────────────────
  const styleId = `mutex-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes mutexBreathe_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.04); }
      }
      @keyframes mutexFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      .mutex-breathe-${entityId} {
        animation: mutexBreathe_${entityId} 2.5s ease-in-out infinite;
      }
      .mutex-float-${entityId} {
        animation: mutexFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  lockBody.classList.add(`mutex-breathe-${entityId}`);
  innerG.classList.add(`mutex-float-${entityId}`);

  // ── Label below ────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(hh + LABEL_DEFAULTS.offsetBelow));
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
