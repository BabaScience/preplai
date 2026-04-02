/**
 * @preplai/illustrations — Semaphore Component (Cinematic Depth)
 *
 * Clean rect with count value centered.
 * Cinematic depth: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life (pulse + float).
 *
 * Metadata:
 *   value?: number — current permit count (default 2)
 *   max?: number — optional max for bounded semaphore (e.g. "2/3")
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderSemaphore(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const _scale = size / 50;
  const meta = entity.metadata ?? {};
  const value = Math.max(0, Math.floor((meta.value as number) ?? 2));
  const max = meta.max != null ? Math.max(1, Math.floor(meta.max as number)) : undefined;

  const w = size * 0.85;
  const h = size * 0.7;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ─────────────────────────────────
  const haloId = `sem-halo-${entityId}`;
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
  halo.setAttribute('x', String(-w / 2 - 8));
  halo.setAttribute('y', String(-h / 2 - 8));
  halo.setAttribute('width', String(w + 16));
  halo.setAttribute('height', String(h + 16));
  halo.setAttribute('rx', '6');
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ────────────────────────────────────────
  const gsId = `sem-gs-${entityId}`;
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
  gs.setAttribute('cy', String(h / 2 + 4));
  gs.setAttribute('rx', String(w * 0.4));
  gs.setAttribute('ry', String(h * 0.08));
  gs.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(gs);

  // ── Pillar 3: Ambient Occlusion ────────────────────────────────────
  const aoId = `sem-ao-${entityId}`;
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
  const specId = `sem-spec-${entityId}`;
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
    glow.setAttribute('x', String(-w / 2 - 3));
    glow.setAttribute('y', String(-h / 2 - 3));
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
  rect.setAttribute('x', String(-w / 2));
  rect.setAttribute('y', String(-h / 2));
  rect.setAttribute('width', String(w));
  rect.setAttribute('height', String(h));
  rect.setAttribute('rx', '4');
  rect.setAttribute('fill', cc.fill);
  rect.setAttribute('stroke', cc.stroke);
  rect.setAttribute('stroke-width', '2.5');
  innerG.appendChild(rect);

  // AO overlay
  const aoRect = document.createElementNS(SVG_NS, 'rect');
  aoRect.setAttribute('x', String(-w / 2));
  aoRect.setAttribute('y', String(-h / 2));
  aoRect.setAttribute('width', String(w));
  aoRect.setAttribute('height', String(h));
  aoRect.setAttribute('rx', '4');
  aoRect.setAttribute('fill', `url(#${aoId})`);
  aoRect.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoRect);

  // Specular overlay (top portion)
  const specRect = document.createElementNS(SVG_NS, 'rect');
  specRect.setAttribute('x', String(-w / 2));
  specRect.setAttribute('y', String(-h / 2));
  specRect.setAttribute('width', String(w));
  specRect.setAttribute('height', String(h * 0.45));
  specRect.setAttribute('rx', '4');
  specRect.setAttribute('fill', `url(#${specId})`);
  specRect.setAttribute('pointer-events', 'none');
  innerG.appendChild(specRect);

  // ── Count value ────────────────────────────────────────────────────
  const countStr = max != null ? `${value}/${max}` : String(value);
  const valueFontSize = Math.min(TYPOGRAPHY.fontSizeMetric, size * 0.4);
  const valueText = document.createElementNS(SVG_NS, 'text');
  valueText.setAttribute('x', '0');
  valueText.setAttribute('y', '2');
  valueText.setAttribute('text-anchor', 'middle');
  valueText.setAttribute('dominant-baseline', 'central');
  valueText.setAttribute('fill', cc.textPrimary);
  valueText.setAttribute('font-size', String(valueFontSize));
  valueText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  valueText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  valueText.textContent = countStr;
  innerG.appendChild(valueText);

  // ── Pillar 5: Micro-Life ───────────────────────────────────────────
  const styleId = `sem-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes semPulse_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.04); }
      }
      @keyframes semFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      .sem-pulse-${entityId} {
        animation: semPulse_${entityId} 2.5s ease-in-out infinite;
      }
      .sem-float-${entityId} {
        animation: semFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  rect.classList.add(`sem-pulse-${entityId}`);
  innerG.classList.add(`sem-float-${entityId}`);

  // ── Label below ────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(h / 2 + LABEL_DEFAULTS.offsetBelow));
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
