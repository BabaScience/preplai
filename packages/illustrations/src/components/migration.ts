/**
 * @preplai/illustrations — Migration Component (Cinematic Depth)
 *
 * Source/dest rects with directional arrow and animated dots.
 * Use for: database migrations, data transfers, schema changes.
 *
 * Micro-life: arrow flow translateX, dot pulse, float.
 * Metadata: { version?: string, description?: string, direction?: 'up'|'down' }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';import type { VisualEntity } from '@preplai/shared';

export function renderMigration(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const version = (meta.version as string) ?? '';
  const description = (meta.description as string) ?? entity.label ?? 'Migration';
  const direction = (meta.direction as string) ?? 'up';

  const w = size * 1.8;
  const h = size * 0.7;
  const hw = w / 2;
  const hh = h / 2;
  const rx = 6;

  const defs = ensureDefs(parentEl);

  // ── 1. Directional Lighting ───────────────────────────────────────────
  const haloId = `mig-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', haloId);
    grad.setAttribute('cx', '38%'); grad.setAttribute('cy', '38%'); grad.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.13');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', String(-hw * 0.15));
  halo.setAttribute('cy', String(-hh * 0.1));
  halo.setAttribute('rx', String(hw * 1.3));
  halo.setAttribute('ry', String(hh * 1.4));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── 2. Ground Shadow ──────────────────────────────────────────────────
  const gsId = `mig-gshadow-${entityId}`;
  if (!defs.querySelector(`#${gsId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', gsId);
    grad.setAttribute('cx', '50%'); grad.setAttribute('cy', '50%'); grad.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#000000'); s1.setAttribute('stop-opacity', '0.18');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#000000'); s2.setAttribute('stop-opacity', '0');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }
  const gShadow = document.createElementNS(SVG_NS, 'ellipse');
  gShadow.setAttribute('cx', '0');
  gShadow.setAttribute('cy', String(hh + 4));
  gShadow.setAttribute('rx', String(hw * 0.85));
  gShadow.setAttribute('ry', String(hh * 0.18));
  gShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(gShadow);

  // ── 3. Ambient Occlusion ──────────────────────────────────────────────
  const aoId = `mig-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', aoId);
    grad.setAttribute('cx', '70%'); grad.setAttribute('cy', '75%'); grad.setAttribute('r', '55%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#000000'); s1.setAttribute('stop-opacity', '0.10');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#000000'); s2.setAttribute('stop-opacity', '0');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }
  const ao = document.createElementNS(SVG_NS, 'rect');
  ao.setAttribute('x', String(-hw)); ao.setAttribute('y', String(-hh));
  ao.setAttribute('width', String(w)); ao.setAttribute('height', String(h));
  ao.setAttribute('rx', String(rx));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Body fill gradient ────────────────────────────────────────────────
  const bodyGradId = `mig-body-${entityId}`;
  if (!defs.querySelector(`#${bodyGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', bodyGradId);
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.3');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.08');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // ── Body stroke gradient ──────────────────────────────────────────────
  const strokeGradId = `mig-stroke-${entityId}`;
  if (!defs.querySelector(`#${strokeGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', strokeGradId);
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.9');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.3');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // ── Highlight glow ring ───────────────────────────────────────────────
  if (entity.highlight) {
    const glowRect = document.createElementNS(SVG_NS, 'rect');
    glowRect.setAttribute('x', String(-hw - 3));
    glowRect.setAttribute('y', String(-hh - 3));
    glowRect.setAttribute('width', String(w + 6));
    glowRect.setAttribute('height', String(h + 6));
    glowRect.setAttribute('rx', String(rx + 2));
    glowRect.setAttribute('fill', 'none');
    glowRect.setAttribute('stroke-width', String(STROKE.default));
    glowRect.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glowRect, cc);
    innerG.appendChild(glowRect);
  }

  // ── Source rect (left) ────────────────────────────────────────────────
  const srcW = w * 0.32;
  const srcH = h * 0.6;
  const srcX = -hw + 8;
  const srcY = -srcH / 2;
  const srcRect = document.createElementNS(SVG_NS, 'rect');
  srcRect.setAttribute('x', String(srcX));
  srcRect.setAttribute('y', String(srcY));
  srcRect.setAttribute('width', String(srcW));
  srcRect.setAttribute('height', String(srcH));
  srcRect.setAttribute('rx', '4');
  srcRect.setAttribute('fill', `url(#${bodyGradId})`);
  srcRect.setAttribute('stroke', `url(#${strokeGradId})`);
  srcRect.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(srcRect);

  // Source label
  const srcLabel = document.createElementNS(SVG_NS, 'text');
  srcLabel.setAttribute('x', String(srcX + srcW / 2));
  srcLabel.setAttribute('y', '3');
  srcLabel.setAttribute('text-anchor', 'middle');
  srcLabel.setAttribute('fill', cc.textSecondary);
  srcLabel.setAttribute('font-size', String(TYPOGRAPHY.fontSizeIndex));
  srcLabel.setAttribute('font-family', TYPOGRAPHY.fontCode);
  srcLabel.textContent = 'v' + (version || '1');
  innerG.appendChild(srcLabel);

  // ── Dest rect (right) ─────────────────────────────────────────────────
  const destX = hw - 8 - srcW;
  const destRect = document.createElementNS(SVG_NS, 'rect');
  destRect.setAttribute('x', String(destX));
  destRect.setAttribute('y', String(srcY));
  destRect.setAttribute('width', String(srcW));
  destRect.setAttribute('height', String(srcH));
  destRect.setAttribute('rx', '4');
  destRect.setAttribute('fill', `url(#${bodyGradId})`);
  destRect.setAttribute('stroke', `url(#${strokeGradId})`);
  destRect.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(destRect);

  // Dest label
  const destLabel = document.createElementNS(SVG_NS, 'text');
  destLabel.setAttribute('x', String(destX + srcW / 2));
  destLabel.setAttribute('y', '3');
  destLabel.setAttribute('text-anchor', 'middle');
  destLabel.setAttribute('fill', cc.textSecondary);
  destLabel.setAttribute('font-size', String(TYPOGRAPHY.fontSizeIndex));
  destLabel.setAttribute('font-family', TYPOGRAPHY.fontCode);
  destLabel.textContent = 'v' + (version ? String(Number(version) + 1 || '2') : '2');
  innerG.appendChild(destLabel);

  // ── Directional arrow between rects ───────────────────────────────────
  const arrowStartX = srcX + srcW + 4;
  const arrowEndX = destX - 4;
  const arrowY = 0;
  const arrowLine = document.createElementNS(SVG_NS, 'line');
  arrowLine.setAttribute('x1', String(arrowStartX));
  arrowLine.setAttribute('y1', String(arrowY));
  arrowLine.setAttribute('x2', String(arrowEndX));
  arrowLine.setAttribute('y2', String(arrowY));
  arrowLine.setAttribute('stroke', direction === 'up' ? '#4ade80' : '#f87171');
  arrowLine.setAttribute('stroke-width', String(STROKE.emphasized));
  arrowLine.setAttribute('marker-end', 'none');
  arrowLine.classList.add(`mig-arrow-${entityId}`);
  innerG.appendChild(arrowLine);

  // Arrow head
  const ahSize = 5;
  const arrowHead = document.createElementNS(SVG_NS, 'path');
  arrowHead.setAttribute('d', `M ${arrowEndX} ${arrowY} L ${arrowEndX - ahSize} ${arrowY - ahSize * 0.6} L ${arrowEndX - ahSize} ${arrowY + ahSize * 0.6} Z`);
  arrowHead.setAttribute('fill', direction === 'up' ? '#4ade80' : '#f87171');
  arrowHead.classList.add(`mig-arrow-${entityId}`);
  innerG.appendChild(arrowHead);

  // ── Flow dots along arrow ─────────────────────────────────────────────
  const dotCount = 3;
  const arrowLen = arrowEndX - arrowStartX;
  for (let i = 0; i < dotCount; i++) {
    const dx = arrowStartX + (arrowLen * (i + 1)) / (dotCount + 1);
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(dx));
    dot.setAttribute('cy', String(arrowY));
    dot.setAttribute('r', '2');
    dot.setAttribute('fill', color);
    dot.classList.add(`mig-dot-${entityId}`);
    dot.style.animationDelay = `${i * 0.3}s`;
    innerG.appendChild(dot);
  }

  // ── Description text ──────────────────────────────────────────────────
  const descText = document.createElementNS(SVG_NS, 'text');
  descText.setAttribute('x', '0');
  descText.setAttribute('y', String(hh - 5));
  descText.setAttribute('text-anchor', 'middle');
  descText.setAttribute('fill', cc.textSecondary);
  descText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeIndex));
  descText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  descText.textContent = description;
  innerG.appendChild(descText);

  // ── 4. Specular Highlight ─────────────────────────────────────────────
  const specId = `mig-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', specId);
    grad.setAttribute('cx', '35%'); grad.setAttribute('cy', '25%'); grad.setAttribute('r', '40%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', '#ffffff'); s1.setAttribute('stop-opacity', '0.18');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', '#ffffff'); s2.setAttribute('stop-opacity', '0');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }
  const specular = document.createElementNS(SVG_NS, 'ellipse');
  specular.setAttribute('cx', String(-hw * 0.3));
  specular.setAttribute('cy', String(-hh * 0.4));
  specular.setAttribute('rx', String(hw * 0.4));
  specular.setAttribute('ry', String(hh * 0.3));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── 5. Micro-Life Animations ──────────────────────────────────────────
  const styleId = `mig-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes migArrowFlow_${entityId} {
        0%, 100% { transform: translateX(0); }
        50% { transform: translateX(4px); }
      }
      @keyframes migDotPulse_${entityId} {
        0%, 100% { transform: scale(1); opacity: 0.6; }
        50% { transform: scale(1.5); opacity: 1; }
      }
      @keyframes migFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .mig-arrow-${entityId} {
        animation: migArrowFlow_${entityId} 2s ease-in-out infinite;
      }
      .mig-dot-${entityId} {
        animation: migDotPulse_${entityId} 1.8s ease-in-out infinite;
      }
      .mig-float-${entityId} {
        animation: migFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`mig-float-${entityId}`);

  // ── Label below ───────────────────────────────────────────────────────
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
