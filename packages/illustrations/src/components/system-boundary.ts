/**
 * @preplai/illustrations — SystemBoundary Component (Cinematic Depth)
 *
 * Large dashed rectangle used to visually contain other entities in C4 diagrams.
 * Shows the boundary of "your system" vs external actors.
 * 5 Cinematic Pillars: directional lighting, ground shadow,
 * ambient occlusion, specular highlight, micro-life animations.
 *
 * Metadata:
 *   label?:       string          -- falls back to entity.label
 *   style?:       "dashed"|"solid" -- default "dashed"
 *   description?: string          -- optional subtitle
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, SHAPES, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderSystemBoundary(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = (entity.metadata ?? {}) as Record<string, unknown>;
  const labelText = (meta.label as string) ?? entity.label ?? 'System Boundary';
  const style = (meta.style as string) ?? 'dashed';
  const description = (meta.description as string) ?? '';

  const scale = size / 50;
  const w = 300 * scale;
  const h = 200 * scale;
  const rx = SHAPES.borderRadiusLarge;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ─────────────────────────────────
  const haloId = `sysBnd-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const haloGrad = document.createElementNS(SVG_NS, 'radialGradient');
    haloGrad.setAttribute('id', haloId);
    haloGrad.setAttribute('cx', '38%'); haloGrad.setAttribute('cy', '38%');
    haloGrad.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.13');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0');
    haloGrad.appendChild(s1); haloGrad.appendChild(s2);
    defs.appendChild(haloGrad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', String(-w * 0.08));
  halo.setAttribute('cy', String(-h * 0.05));
  halo.setAttribute('rx', String(w * 0.7));
  halo.setAttribute('ry', String(h * 0.6));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ────────────────────────────────────────
  const gsId = `sysBnd-gshadow-${entityId}`;
  if (!defs.querySelector(`#${gsId}`)) {
    const gsg = document.createElementNS(SVG_NS, 'radialGradient');
    gsg.setAttribute('id', gsId);
    gsg.setAttribute('cx', '50%'); gsg.setAttribute('cy', '50%'); gsg.setAttribute('r', '50%');
    const gs1 = document.createElementNS(SVG_NS, 'stop');
    gs1.setAttribute('offset', '0%'); gs1.setAttribute('stop-color', '#000000'); gs1.setAttribute('stop-opacity', '0.18');
    const gs2 = document.createElementNS(SVG_NS, 'stop');
    gs2.setAttribute('offset', '100%'); gs2.setAttribute('stop-color', '#000000'); gs2.setAttribute('stop-opacity', '0');
    gsg.appendChild(gs1); gsg.appendChild(gs2);
    defs.appendChild(gsg);
  }
  const groundShadow = document.createElementNS(SVG_NS, 'ellipse');
  groundShadow.setAttribute('cx', '0');
  groundShadow.setAttribute('cy', String(h / 2 + 8 * scale));
  groundShadow.setAttribute('rx', String(w * 0.45));
  groundShadow.setAttribute('ry', String(8 * scale));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ────────────────────────────────────
  const aoId = `sysBnd-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const aoGrad = document.createElementNS(SVG_NS, 'radialGradient');
    aoGrad.setAttribute('id', aoId);
    aoGrad.setAttribute('cx', '70%'); aoGrad.setAttribute('cy', '75%'); aoGrad.setAttribute('r', '55%');
    const ao1 = document.createElementNS(SVG_NS, 'stop');
    ao1.setAttribute('offset', '0%'); ao1.setAttribute('stop-color', '#000000'); ao1.setAttribute('stop-opacity', '0.10');
    const ao2 = document.createElementNS(SVG_NS, 'stop');
    ao2.setAttribute('offset', '100%'); ao2.setAttribute('stop-color', '#000000'); ao2.setAttribute('stop-opacity', '0');
    aoGrad.appendChild(ao1); aoGrad.appendChild(ao2);
    defs.appendChild(aoGrad);
  }
  const aoRect = document.createElementNS(SVG_NS, 'rect');
  aoRect.setAttribute('x', String(-w / 2));
  aoRect.setAttribute('y', String(-h / 2));
  aoRect.setAttribute('width', String(w));
  aoRect.setAttribute('height', String(h));
  aoRect.setAttribute('rx', String(rx));
  aoRect.setAttribute('fill', `url(#${aoId})`);
  aoRect.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoRect);

  // ── Highlight glow ring ────────────────────────────────────────────
  if (entity.highlight) {
    const glowRect = document.createElementNS(SVG_NS, 'rect');
    glowRect.setAttribute('x', String(-w / 2 - 4));
    glowRect.setAttribute('y', String(-h / 2 - 4));
    glowRect.setAttribute('width', String(w + 8));
    glowRect.setAttribute('height', String(h + 8));
    glowRect.setAttribute('rx', String(rx + 2));
    glowRect.setAttribute('fill', 'none');
    glowRect.setAttribute('stroke-width', String(STROKE.default));
    glowRect.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glowRect, cc);
    innerG.appendChild(glowRect);
  }

  // ── Background fill ────────────────────────────────────────────────
  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x', String(-w / 2));
  rect.setAttribute('y', String(-h / 2));
  rect.setAttribute('width', String(w));
  rect.setAttribute('height', String(h));
  rect.setAttribute('rx', String(rx));
  rect.setAttribute('fill', colorWithAlpha(color, '0D'));
  rect.setAttribute('stroke', cc.strokeSoft);
  rect.setAttribute('stroke-width', '2.5');
  if (style === 'dashed') {
    rect.setAttribute('stroke-dasharray', '10,6');
  }
  innerG.appendChild(rect);

  // ── Label pill (top-left, inside the boundary) ─────────────────────
  const labelX = -w / 2 + 16 * scale;
  const labelY = -h / 2 + 16 * scale;
  const labelFontSize = 14 * scale;
  const pillPadX = 8 * scale;
  const pillPadY = 4 * scale;
  const estimatedTextWidth = labelText.length * labelFontSize * 0.6;

  const pill = document.createElementNS(SVG_NS, 'rect');
  pill.setAttribute('x', String(labelX - pillPadX));
  pill.setAttribute('y', String(labelY - labelFontSize * 0.8 - pillPadY));
  pill.setAttribute('width', String(estimatedTextWidth + pillPadX * 2));
  pill.setAttribute('height', String(labelFontSize + pillPadY * 2));
  pill.setAttribute('rx', String(4 * scale));
  pill.setAttribute('fill', cc.fill);
  innerG.appendChild(pill);

  const label = document.createElementNS(SVG_NS, 'text');
  label.setAttribute('x', String(labelX));
  label.setAttribute('y', String(labelY));
  label.setAttribute('text-anchor', 'start');
  label.setAttribute('fill', cc.textPrimary);
  label.setAttribute('font-size', String(labelFontSize));
  label.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  label.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  label.textContent = labelText;
  innerG.appendChild(label);

  // ── Optional description/subtitle ──────────────────────────────────
  if (description) {
    const descFontSize = 11 * scale;
    const desc = document.createElementNS(SVG_NS, 'text');
    desc.setAttribute('x', String(labelX));
    desc.setAttribute('y', String(labelY + labelFontSize * 1.2));
    desc.setAttribute('text-anchor', 'start');
    desc.setAttribute('fill', cc.textSecondary);
    desc.setAttribute('font-size', String(descFontSize));
    desc.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    desc.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    desc.textContent = description;
    innerG.appendChild(desc);
  }

  // ── Pillar 4: Specular Highlight ───────────────────────────────────
  const specId = `sysBnd-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    const specGrad = document.createElementNS(SVG_NS, 'radialGradient');
    specGrad.setAttribute('id', specId);
    specGrad.setAttribute('cx', '35%'); specGrad.setAttribute('cy', '25%'); specGrad.setAttribute('r', '40%');
    const sp1 = document.createElementNS(SVG_NS, 'stop');
    sp1.setAttribute('offset', '0%'); sp1.setAttribute('stop-color', '#ffffff'); sp1.setAttribute('stop-opacity', '0.18');
    const sp2 = document.createElementNS(SVG_NS, 'stop');
    sp2.setAttribute('offset', '100%'); sp2.setAttribute('stop-color', '#ffffff'); sp2.setAttribute('stop-opacity', '0');
    specGrad.appendChild(sp1); specGrad.appendChild(sp2);
    defs.appendChild(specGrad);
  }
  const specular = document.createElementNS(SVG_NS, 'ellipse');
  specular.setAttribute('cx', String(-w * 0.15));
  specular.setAttribute('cy', String(-h * 0.2));
  specular.setAttribute('rx', String(w * 0.3));
  specular.setAttribute('ry', String(h * 0.2));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Pillar 5: Micro-Life Animations ────────────────────────────────
  const styleId = `sysBnd-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const styleEl = document.createElementNS(SVG_NS, 'style');
    styleEl.setAttribute('id', styleId);
    styleEl.textContent = `
      @keyframes sysBndFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-1.5px); }
      }
      @keyframes sysBndBreathe_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.01); }
      }
      .sysBnd-float-${entityId} {
        animation: sysBndFloat_${entityId} 4s ease-in-out infinite;
      }
      .sysBnd-breathe-${entityId} {
        animation: sysBndBreathe_${entityId} 3s ease-in-out infinite;
      }
    `;
    svg.insertBefore(styleEl, svg.firstChild);
  }
  innerG.classList.add(`sysBnd-float-${entityId}`);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
