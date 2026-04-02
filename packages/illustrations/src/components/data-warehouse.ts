/**
 * @preplai/illustrations — DataWarehouse Component (Cinematic Depth)
 *
 * Warehouse rect with roof peak, shelves, and boxes.
 * Use for: data warehouses, BigQuery, Snowflake, Redshift, structured storage.
 *
 * Micro-life: shelf shimmer, box pulse, float.
 * Metadata: { provider?: string }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';import type { VisualEntity } from '@preplai/shared';

export function renderDataWarehouse(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = (entity.metadata ?? {}) as { provider?: string };

  const w = size * 1.4;
  const h = size * 1.1;
  const hw = w / 2;
  const hh = h / 2;
  const rx = 5;
  const roofH = size * 0.22;

  const defs = ensureDefs(parentEl);

  // ── 1. Directional Lighting ───────────────────────────────────────────
  const haloId = `dwh-halo-${entityId}`;
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
  halo.setAttribute('rx', String(hw * 1.5));
  halo.setAttribute('ry', String(hh * 1.3));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── 2. Ground Shadow ──────────────────────────────────────────────────
  const gsId = `dwh-gshadow-${entityId}`;
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
  gShadow.setAttribute('rx', String(hw * 0.9));
  gShadow.setAttribute('ry', String(hh * 0.15));
  gShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(gShadow);

  // ── 3. Ambient Occlusion ──────────────────────────────────────────────
  const aoId = `dwh-ao-${entityId}`;
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
  ao.setAttribute('x', String(-hw)); ao.setAttribute('y', String(-hh + roofH));
  ao.setAttribute('width', String(w)); ao.setAttribute('height', String(h - roofH));
  ao.setAttribute('rx', String(rx));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Body fill gradient ────────────────────────────────────────────────
  const bodyGradId = `dwh-body-${entityId}`;
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
  const strokeGradId = `dwh-stroke-${entityId}`;
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
    glowRect.setAttribute('y', String(-hh + roofH - 3));
    glowRect.setAttribute('width', String(w + 6));
    glowRect.setAttribute('height', String(h - roofH + 6));
    glowRect.setAttribute('rx', String(rx + 2));
    glowRect.setAttribute('fill', 'none');
    glowRect.setAttribute('stroke-width', String(STROKE.default));
    glowRect.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glowRect, cc);
    innerG.appendChild(glowRect);
  }

  // ── Warehouse body rect ───────────────────────────────────────────────
  const bodyTop = -hh + roofH;
  const bodyBot = hh;
  const bodyHeight = bodyBot - bodyTop;
  const card = document.createElementNS(SVG_NS, 'rect');
  card.setAttribute('x', String(-hw)); card.setAttribute('y', String(bodyTop));
  card.setAttribute('width', String(w)); card.setAttribute('height', String(bodyHeight));
  card.setAttribute('rx', String(rx));
  card.setAttribute('fill', `url(#${bodyGradId})`);
  card.setAttribute('stroke', `url(#${strokeGradId})`);
  card.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(card);

  // ── Roof peak (triangle) ──────────────────────────────────────────────
  const roof = document.createElementNS(SVG_NS, 'path');
  const roofPeakY = -hh - 2;
  roof.setAttribute('d', `M ${-hw - 4} ${bodyTop} L 0 ${roofPeakY} L ${hw + 4} ${bodyTop} Z`);
  roof.setAttribute('fill', colorWithAlpha(color, '33'));
  roof.setAttribute('stroke', `url(#${strokeGradId})`);
  roof.setAttribute('stroke-width', String(STROKE.default));
  roof.setAttribute('stroke-linejoin', 'round');
  innerG.appendChild(roof);

  // ── Shelves (horizontal lines) ────────────────────────────────────────
  const shelfCount = 3;
  const shelfPad = bodyHeight * 0.08;
  const shelfAreaH = bodyHeight - shelfPad * 2;
  for (let i = 0; i < shelfCount; i++) {
    const sy = bodyTop + shelfPad + (i + 1) * (shelfAreaH / (shelfCount + 1));
    const shelf = document.createElementNS(SVG_NS, 'line');
    shelf.setAttribute('x1', String(-hw + 6));
    shelf.setAttribute('y1', String(sy));
    shelf.setAttribute('x2', String(hw - 6));
    shelf.setAttribute('y2', String(sy));
    shelf.setAttribute('stroke', colorWithAlpha(color, '44'));
    shelf.setAttribute('stroke-width', String(STROKE.default));
    shelf.classList.add(`dwh-shelf-${entityId}`);
    shelf.style.animationDelay = `${i * 0.2}s`;
    innerG.appendChild(shelf);
  }

  // ── Boxes on shelves ──────────────────────────────────────────────────
  const boxPositions = [
    { col: -0.35, row: 0 },
    { col: 0.1, row: 0 },
    { col: -0.2, row: 1 },
    { col: 0.25, row: 1 },
    { col: -0.1, row: 2 },
    { col: 0.3, row: 2 },
  ];
  const boxW = w * 0.13;
  const boxH = shelfAreaH / (shelfCount + 1) * 0.55;

  for (let bi = 0; bi < boxPositions.length; bi++) {
    const bp = boxPositions[bi];
    const shelfY = bodyTop + shelfPad + (bp.row + 1) * (shelfAreaH / (shelfCount + 1));
    const bx = bp.col * w;
    const by = shelfY - boxH;
    const box = document.createElementNS(SVG_NS, 'rect');
    box.setAttribute('x', String(bx));
    box.setAttribute('y', String(by));
    box.setAttribute('width', String(boxW));
    box.setAttribute('height', String(boxH));
    box.setAttribute('rx', '1.5');
    box.setAttribute('fill', colorWithAlpha(color, '66'));
    box.setAttribute('stroke', colorWithAlpha(color, '33'));
    box.setAttribute('stroke-width', '0.5');
    box.classList.add(`dwh-box-${entityId}`);
    box.style.animationDelay = `${bi * 0.15}s`;
    innerG.appendChild(box);
  }

  // ── Provider badge ────────────────────────────────────────────────────
  if (meta.provider) {
    const badge = document.createElementNS(SVG_NS, 'text');
    badge.setAttribute('x', '0');
    badge.setAttribute('y', String(bodyBot - 6));
    badge.setAttribute('text-anchor', 'middle');
    badge.setAttribute('fill', cc.textSecondary);
    badge.setAttribute('font-size', String(TYPOGRAPHY.fontSizeIndex));
    badge.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    badge.setAttribute('opacity', '0.6');
    badge.textContent = meta.provider;
    innerG.appendChild(badge);
  }

  // ── 4. Specular Highlight ─────────────────────────────────────────────
  const specId = `dwh-spec-${entityId}`;
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
  specular.setAttribute('cy', String(bodyTop + bodyHeight * 0.15));
  specular.setAttribute('rx', String(hw * 0.5));
  specular.setAttribute('ry', String(hh * 0.3));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── 5. Micro-Life Animations ──────────────────────────────────────────
  const styleId = `dwh-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes dwhShelfShimmer_${entityId} {
        0%, 100% { transform: translateX(0); opacity: 0.4; }
        50% { transform: translateX(2px); opacity: 0.7; }
      }
      @keyframes dwhBoxPulse_${entityId} {
        0%, 100% { transform: scale(1); opacity: 0.7; }
        50% { transform: scale(1.08); opacity: 1; }
      }
      @keyframes dwhFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .dwh-shelf-${entityId} {
        animation: dwhShelfShimmer_${entityId} 2.8s ease-in-out infinite;
      }
      .dwh-box-${entityId} {
        animation: dwhBoxPulse_${entityId} 2.2s ease-in-out infinite;
      }
      .dwh-float-${entityId} {
        animation: dwhFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`dwh-float-${entityId}`);

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
