/**
 * @preplai/illustrations — Docker Registry Component (Cinematic 5-Pillar)
 *
 * Registry body with shelf lines and a 3x2 grid of image thumbnails.
 * Use for: container registries, image repositories, artifact stores.
 *
 * 5-Pillar Depth: radial halo, ground shadow, ambient occlusion,
 * radial fill gradient, linear stroke gradient, GlowFilter + GlassFilter,
 * shelf lines, thumbnail grid with staggered shimmer, status dot with pulse,
 * float micro-life animation.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlassFilter, ensureGlowFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderDockerRegistry(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const w = s * 0.85;
  const h = s * 0.7;
  const hw = w / 2;
  const hh = h / 2;
  const rx = 8;

  const defs = ensureDefs(parentEl);

  // ── 1. Radial depth halo (atmospheric glow behind entity) ──────────
  const haloId = `dreg-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', haloId);
    grad.setAttribute('cx', '38%'); grad.setAttribute('cy', '38%');
    grad.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', color);
    s1.setAttribute('stop-opacity', '0.13');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', color);
    s2.setAttribute('stop-opacity', '0');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', String(-hw * 0.1));
  halo.setAttribute('cy', String(-hh * 0.1));
  halo.setAttribute('rx', String(hw * 1.8));
  halo.setAttribute('ry', String(hh * 1.6));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── 2. Ground contact shadow ───────────────────────────────────────
  const gsId = `dreg-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(hh + 4));
  groundShadow.setAttribute('rx', String(hw * 0.9));
  groundShadow.setAttribute('ry', String(hh * 0.18));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── 3. Ambient occlusion ───────────────────────────────────────────
  const aoId = `dreg-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const aoGrad = document.createElementNS(SVG_NS, 'radialGradient');
    aoGrad.setAttribute('id', aoId);
    aoGrad.setAttribute('cx', '70%'); aoGrad.setAttribute('cy', '75%'); aoGrad.setAttribute('r', '60%');
    const ao1 = document.createElementNS(SVG_NS, 'stop');
    ao1.setAttribute('offset', '0%'); ao1.setAttribute('stop-color', '#000000'); ao1.setAttribute('stop-opacity', '0.12');
    const ao2 = document.createElementNS(SVG_NS, 'stop');
    ao2.setAttribute('offset', '100%'); ao2.setAttribute('stop-color', '#000000'); ao2.setAttribute('stop-opacity', '0');
    aoGrad.appendChild(ao1); aoGrad.appendChild(ao2);
    defs.appendChild(aoGrad);
  }
  const ao = document.createElementNS(SVG_NS, 'rect');
  ao.setAttribute('x', String(-hw));
  ao.setAttribute('y', String(-hh));
  ao.setAttribute('width', String(w));
  ao.setAttribute('height', String(h));
  ao.setAttribute('rx', String(rx));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Gradient IDs (unique per instance) ──────────────────────────────
  const fillGradId = `dreg-fill-${entityId}`;
  const strokeGradId = `dreg-stroke-${entityId}`;

  // Radial fill gradient (center lighter, edges darker)
  if (!defs.querySelector(`#${fillGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', fillGradId);
    grad.setAttribute('cx', '35%'); grad.setAttribute('cy', '30%');
    grad.setAttribute('r', '65%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', color);
    s1.setAttribute('stop-opacity', '0.22');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', color);
    s2.setAttribute('stop-opacity', '0.06');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // Linear stroke gradient (top bright, bottom dim)
  if (!defs.querySelector(`#${strokeGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', strokeGradId);
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '0%'); grad.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', color);
    s1.setAttribute('stop-opacity', '0.9');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', color);
    s2.setAttribute('stop-opacity', '0.35');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // ── Highlight glow ring ────────────────────────────────────────────
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-hw - 3));
    glow.setAttribute('y', String(-hh - 3));
    glow.setAttribute('width', String(w + 6));
    glow.setAttribute('height', String(h + 6));
    glow.setAttribute('rx', String(rx + 2));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Body rect (radial fill, gradient stroke, glass + glow filters) ─
  const glassUrl = ensureGlassFilter(parentEl);
  const glowUrl = ensureGlowFilter(parentEl, color);

  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x', String(-hw));
  body.setAttribute('y', String(-hh));
  body.setAttribute('width', String(w));
  body.setAttribute('height', String(h));
  body.setAttribute('rx', String(rx));
  body.setAttribute('fill', `url(#${fillGradId})`);
  body.setAttribute('stroke', `url(#${strokeGradId})`);
  body.setAttribute('stroke-width', String(STROKE.default));
  body.setAttribute('filter', `${glassUrl.replace('url(', '').replace(')', '')} ${glowUrl.replace('url(', '').replace(')', '')}`);
  body.setAttribute('data-morph-target', 'true');
  // Apply both filters by nesting: use glass on body, glow as outer wrapper
  body.removeAttribute('filter');
  body.setAttribute('filter', glassUrl);
  innerG.appendChild(body);

  // Outer glow rect (behind body, provides soft colored glow)
  const glowRect = document.createElementNS(SVG_NS, 'rect');
  glowRect.setAttribute('x', String(-hw));
  glowRect.setAttribute('y', String(-hh));
  glowRect.setAttribute('width', String(w));
  glowRect.setAttribute('height', String(h));
  glowRect.setAttribute('rx', String(rx));
  glowRect.setAttribute('fill', 'none');
  glowRect.setAttribute('stroke', colorWithAlpha(color, '33'));
  glowRect.setAttribute('stroke-width', '2');
  glowRect.setAttribute('filter', glowUrl);
  glowRect.setAttribute('pointer-events', 'none');
  innerG.appendChild(glowRect);

  // ── 4. Specular highlight on body ──────────────────────────────────
  const specId = `dreg-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    const specGrad = document.createElementNS(SVG_NS, 'radialGradient');
    specGrad.setAttribute('id', specId);
    specGrad.setAttribute('cx', '30%'); specGrad.setAttribute('cy', '20%'); specGrad.setAttribute('r', '50%');
    const sp1 = document.createElementNS(SVG_NS, 'stop');
    sp1.setAttribute('offset', '0%'); sp1.setAttribute('stop-color', '#ffffff'); sp1.setAttribute('stop-opacity', '0.14');
    const sp2 = document.createElementNS(SVG_NS, 'stop');
    sp2.setAttribute('offset', '100%'); sp2.setAttribute('stop-color', '#ffffff'); sp2.setAttribute('stop-opacity', '0');
    specGrad.appendChild(sp1); specGrad.appendChild(sp2);
    defs.appendChild(specGrad);
  }
  const specular = document.createElementNS(SVG_NS, 'rect');
  specular.setAttribute('x', String(-hw));
  specular.setAttribute('y', String(-hh));
  specular.setAttribute('width', String(w));
  specular.setAttribute('height', String(h * 0.5));
  specular.setAttribute('rx', String(rx));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Shelf lines (2 horizontal dividers inside body) ────────────────
  const shelfColor = colorWithAlpha(color, '33'); // 0.2 opacity
  for (let i = 1; i <= 2; i++) {
    const shelfY = -hh + h * (i / 3);
    const shelf = document.createElementNS(SVG_NS, 'line');
    shelf.setAttribute('x1', String(-hw + 6));
    shelf.setAttribute('y1', String(shelfY));
    shelf.setAttribute('x2', String(hw - 6));
    shelf.setAttribute('y2', String(shelfY));
    shelf.setAttribute('stroke', shelfColor);
    shelf.setAttribute('stroke-width', '1');
    shelf.setAttribute('pointer-events', 'none');
    innerG.appendChild(shelf);
  }

  // ── 3x2 grid of image thumbnails ───────────────────────────────────
  const thumbW = s * 0.1;
  const thumbH = s * 0.1;
  const thumbRx = 2;
  const opacities = ['40', '2E', '1F']; // ~0.25, ~0.18, ~0.12

  const gridCols = 3;
  const gridRows = 2;
  const gapX = thumbW * 0.55;
  const gapY = thumbH * 0.55;
  const gridW = gridCols * thumbW + (gridCols - 1) * gapX;
  const gridH = gridRows * thumbH + (gridRows - 1) * gapY;
  const gridStartX = -gridW / 2;
  const gridStartY = -gridH / 2;

  const thumbEls: SVGRectElement[] = [];

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const tx = gridStartX + col * (thumbW + gapX);
      const ty = gridStartY + row * (thumbH + gapY);
      const opIdx = (row + col) % opacities.length;

      const thumb = document.createElementNS(SVG_NS, 'rect');
      thumb.setAttribute('x', String(tx));
      thumb.setAttribute('y', String(ty));
      thumb.setAttribute('width', String(thumbW));
      thumb.setAttribute('height', String(thumbH));
      thumb.setAttribute('rx', String(thumbRx));
      thumb.setAttribute('fill', colorWithAlpha(color, opacities[opIdx]));
      thumb.setAttribute('pointer-events', 'none');
      innerG.appendChild(thumb);
      thumbEls.push(thumb);
    }
  }

  // ── Status dot with glow ───────────────────────────────────────────
  const dotX = hw - 10;
  const dotY = -hh + 10;
  const dotR = 3;

  const dotGlowId = `dreg-dotglow-${entityId}`;
  if (!defs.querySelector(`#${dotGlowId}`)) {
    const dg = document.createElementNS(SVG_NS, 'radialGradient');
    dg.setAttribute('id', dotGlowId);
    [['0%', '#ffffff', '0.95'], ['50%', color, '0.7'], ['100%', color, '0']].forEach(([off, col, op]) => {
      const st = document.createElementNS(SVG_NS, 'stop');
      st.setAttribute('offset', off);
      st.setAttribute('stop-color', col);
      st.setAttribute('stop-opacity', op);
      dg.appendChild(st);
    });
    defs.appendChild(dg);
  }

  // Dot glow halo
  const dotHalo = document.createElementNS(SVG_NS, 'circle');
  dotHalo.setAttribute('cx', String(dotX));
  dotHalo.setAttribute('cy', String(dotY));
  dotHalo.setAttribute('r', String(dotR * 2.5));
  dotHalo.setAttribute('fill', `url(#${dotGlowId})`);
  dotHalo.setAttribute('pointer-events', 'none');
  innerG.appendChild(dotHalo);

  // Dot core
  const dot = document.createElementNS(SVG_NS, 'circle');
  dot.setAttribute('cx', String(dotX));
  dot.setAttribute('cy', String(dotY));
  dot.setAttribute('r', String(dotR));
  dot.setAttribute('fill', color);
  innerG.appendChild(dot);

  // ── 5. Micro-Life Animations ───────────────────────────────────────
  const styleId = `dreg-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes dregFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      @keyframes dregThumbShimmer_${entityId} {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      @keyframes dregDotPulse_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.4); }
      }
      .dreg-float-${entityId} {
        animation: dregFloat_${entityId} 4s ease-in-out infinite;
      }
      .dreg-thumb-shimmer-${entityId} {
        animation: dregThumbShimmer_${entityId} 3s ease-in-out infinite;
      }
      .dreg-dot-pulse-${entityId} {
        animation: dregDotPulse_${entityId} 2s ease-in-out infinite;
        transform-origin: ${dotX}px ${dotY}px;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }

  // Float animation on whole inner group
  innerG.classList.add(`dreg-float-${entityId}`);

  // Staggered shimmer on thumbnails
  thumbEls.forEach((thumb, i) => {
    thumb.classList.add(`dreg-thumb-shimmer-${entityId}`);
    thumb.style.animationDelay = `${i * 0.4}s`;
  });

  // Status dot pulse
  dot.classList.add(`dreg-dot-pulse-${entityId}`);
  dotHalo.classList.add(`dreg-dot-pulse-${entityId}`);

  // ── Label below ────────────────────────────────────────────────────
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
