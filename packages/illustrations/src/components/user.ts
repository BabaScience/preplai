/**
 * @preplai/illustrations — User Component (Badge Card Design)
 *
 * Modern badge/card shape with person silhouette, amber accent strip,
 * profile data lines, and green status dot. No circle — rounded rectangle.
 *
 * 5 Cinematic Pillars:
 * 1. Directional Lighting — offset radial halo (cx=38%, cy=38%)
 * 2. Ground Contact Shadow — ellipse shadow below entity
 * 3. Ambient Occlusion — radial gradient overlay
 * 4. Material Texture — specular highlight + glass filter
 * 5. Micro-Life — status dot pulse + accent strip shimmer animation
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getEntityDimensions } from '../utils.js';
import {
  TYPOGRAPHY,
  STROKE,
  LABEL_DEFAULTS,
  colorWithAlpha,
} from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlowFilter, ensureGlassFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderUser(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const dims = getEntityDimensions(entity, { widthRatio: 0.75, heightRatio: 0.9 });
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const badgeW = dims.width;
  const badgeH = dims.height;
  const badgeX = -badgeW / 2;
  const badgeY = -badgeH / 2;
  const cornerR = 16;

  const defs = ensureDefs(parentEl);

  // ── 1. Directional Lighting — Radial depth halo ─────────────────────
  const haloId = `usr-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', haloId);
    grad.setAttribute('cx', '38%');
    grad.setAttribute('cy', '38%');
    grad.setAttribute('r', '50%');
    const hs1 = document.createElementNS(SVG_NS, 'stop');
    hs1.setAttribute('offset', '0%');
    hs1.setAttribute('stop-color', color);
    hs1.setAttribute('stop-opacity', '0.13');
    const hs2 = document.createElementNS(SVG_NS, 'stop');
    hs2.setAttribute('offset', '100%');
    hs2.setAttribute('stop-color', color);
    hs2.setAttribute('stop-opacity', '0');
    grad.appendChild(hs1);
    grad.appendChild(hs2);
    defs.appendChild(grad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', String(badgeX + badgeW * 0.38));
  halo.setAttribute('cy', String(badgeY + badgeH * 0.38));
  halo.setAttribute('rx', String(badgeW * 1.1));
  halo.setAttribute('ry', String(badgeH * 0.8));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── 2. Ground Contact Shadow ────────────────────────────────────────
  const groundShadowId = `usr-gshadow-${entityId}`;
  if (!defs.querySelector(`#${groundShadowId}`)) {
    const gsg = document.createElementNS(SVG_NS, 'radialGradient');
    gsg.setAttribute('id', groundShadowId);
    gsg.setAttribute('cx', '50%');
    gsg.setAttribute('cy', '50%');
    gsg.setAttribute('r', '50%');
    const gs1 = document.createElementNS(SVG_NS, 'stop');
    gs1.setAttribute('offset', '0%');
    gs1.setAttribute('stop-color', '#000000');
    gs1.setAttribute('stop-opacity', '0.18');
    const gs2 = document.createElementNS(SVG_NS, 'stop');
    gs2.setAttribute('offset', '100%');
    gs2.setAttribute('stop-color', '#000000');
    gs2.setAttribute('stop-opacity', '0');
    gsg.appendChild(gs1);
    gsg.appendChild(gs2);
    defs.appendChild(gsg);
  }
  const groundShadow = document.createElementNS(SVG_NS, 'ellipse');
  groundShadow.setAttribute('cx', '0');
  groundShadow.setAttribute('cy', String(badgeY + badgeH + badgeH * 0.06));
  groundShadow.setAttribute('rx', String(badgeW * 0.55));
  groundShadow.setAttribute('ry', String(badgeH * 0.06));
  groundShadow.setAttribute('fill', `url(#${groundShadowId})`);
  innerG.appendChild(groundShadow);

  // ── Highlight glow ──────────────────────────────────────────────────
  if (entity.highlight) {
    const glowRect = document.createElementNS(SVG_NS, 'rect');
    glowRect.setAttribute('x', String(badgeX - 3));
    glowRect.setAttribute('y', String(badgeY - 3));
    glowRect.setAttribute('width', String(badgeW + 6));
    glowRect.setAttribute('height', String(badgeH + 6));
    glowRect.setAttribute('rx', String(cornerR + 2));
    glowRect.setAttribute('ry', String(cornerR + 2));
    glowRect.setAttribute('stroke-width', String(STROKE.default));
    glowRect.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glowRect, cc);
    innerG.appendChild(glowRect);
  }

  // ── Badge body (rounded rectangle) ──────────────────────────────────
  const glowUrl = ensureGlowFilter(parentEl, color);
  const glassUrl = ensureGlassFilter(parentEl);

  const badge = document.createElementNS(SVG_NS, 'rect');
  badge.setAttribute('x', String(badgeX));
  badge.setAttribute('y', String(badgeY));
  badge.setAttribute('width', String(badgeW));
  badge.setAttribute('height', String(badgeH));
  badge.setAttribute('rx', String(cornerR));
  badge.setAttribute('ry', String(cornerR));
  badge.setAttribute('fill', cc.fill);
  badge.setAttribute('stroke', cc.stroke);
  badge.setAttribute('stroke-width', String(STROKE.default));
  badge.setAttribute('filter', glowUrl);
  badge.setAttribute('id', `usrBadge_${entityId}`);
  innerG.appendChild(badge);

  // Glass overlay on badge
  const glassBadge = document.createElementNS(SVG_NS, 'rect');
  glassBadge.setAttribute('x', String(badgeX));
  glassBadge.setAttribute('y', String(badgeY));
  glassBadge.setAttribute('width', String(badgeW));
  glassBadge.setAttribute('height', String(badgeH));
  glassBadge.setAttribute('rx', String(cornerR));
  glassBadge.setAttribute('ry', String(cornerR));
  glassBadge.setAttribute('fill', 'none');
  glassBadge.setAttribute('filter', glassUrl);
  glassBadge.setAttribute('pointer-events', 'none');
  innerG.appendChild(glassBadge);

  // ── 3. Ambient Occlusion ────────────────────────────────────────────
  const aoId = `usr-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const aoGrad = document.createElementNS(SVG_NS, 'radialGradient');
    aoGrad.setAttribute('id', aoId);
    aoGrad.setAttribute('cx', '70%');
    aoGrad.setAttribute('cy', '75%');
    aoGrad.setAttribute('r', '60%');
    const ao1 = document.createElementNS(SVG_NS, 'stop');
    ao1.setAttribute('offset', '0%');
    ao1.setAttribute('stop-color', '#000000');
    ao1.setAttribute('stop-opacity', '0.10');
    const ao2 = document.createElementNS(SVG_NS, 'stop');
    ao2.setAttribute('offset', '100%');
    ao2.setAttribute('stop-color', '#000000');
    ao2.setAttribute('stop-opacity', '0');
    aoGrad.appendChild(ao1);
    aoGrad.appendChild(ao2);
    defs.appendChild(aoGrad);
  }
  // Clip AO to badge shape
  const aoClipId = `usr-ao-clip-${entityId}`;
  if (!defs.querySelector(`#${aoClipId}`)) {
    const clipPath = document.createElementNS(SVG_NS, 'clipPath');
    clipPath.setAttribute('id', aoClipId);
    const clipRect = document.createElementNS(SVG_NS, 'rect');
    clipRect.setAttribute('x', String(badgeX));
    clipRect.setAttribute('y', String(badgeY));
    clipRect.setAttribute('width', String(badgeW));
    clipRect.setAttribute('height', String(badgeH));
    clipRect.setAttribute('rx', String(cornerR));
    clipRect.setAttribute('ry', String(cornerR));
    clipPath.appendChild(clipRect);
    defs.appendChild(clipPath);
  }
  const ao = document.createElementNS(SVG_NS, 'rect');
  ao.setAttribute('x', String(badgeX));
  ao.setAttribute('y', String(badgeY));
  ao.setAttribute('width', String(badgeW));
  ao.setAttribute('height', String(badgeH));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('clip-path', `url(#${aoClipId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Amber accent strip at top ───────────────────────────────────────
  const accentGradId = `usr-accent-${entityId}`;
  if (!defs.querySelector(`#${accentGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', accentGradId);
    grad.setAttribute('x1', '0%');
    grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%');
    grad.setAttribute('y2', '0%');
    const as1 = document.createElementNS(SVG_NS, 'stop');
    as1.setAttribute('offset', '0%');
    as1.setAttribute('stop-color', '#F59E0B');
    as1.setAttribute('stop-opacity', '0.9');
    const as2 = document.createElementNS(SVG_NS, 'stop');
    as2.setAttribute('offset', '50%');
    as2.setAttribute('stop-color', '#FBBF24');
    as2.setAttribute('stop-opacity', '1');
    const as3 = document.createElementNS(SVG_NS, 'stop');
    as3.setAttribute('offset', '100%');
    as3.setAttribute('stop-color', '#F59E0B');
    as3.setAttribute('stop-opacity', '0.9');
    grad.appendChild(as1);
    grad.appendChild(as2);
    grad.appendChild(as3);
    defs.appendChild(grad);
  }
  // Accent strip — clipped to badge top with rounded corners via clipPath
  const accentStrip = document.createElementNS(SVG_NS, 'rect');
  accentStrip.setAttribute('x', String(badgeX));
  accentStrip.setAttribute('y', String(badgeY));
  accentStrip.setAttribute('width', String(badgeW));
  accentStrip.setAttribute('height', '4');
  accentStrip.setAttribute('rx', String(cornerR));
  accentStrip.setAttribute('ry', String(cornerR));
  accentStrip.setAttribute('fill', `url(#${accentGradId})`);
  accentStrip.setAttribute('clip-path', `url(#${aoClipId})`);
  accentStrip.setAttribute('id', `usrAccent_${entityId}`);
  innerG.appendChild(accentStrip);

  // ── Person silhouette (head + shoulders) ────────────────────────────
  const headR = badgeW * 0.16;
  const headCX = 0;
  const headCY = badgeY + badgeH * 0.3;

  const head = document.createElementNS(SVG_NS, 'circle');
  head.setAttribute('cx', String(headCX));
  head.setAttribute('cy', String(headCY));
  head.setAttribute('r', String(headR));
  head.setAttribute('fill', 'none');
  head.setAttribute('stroke', cc.stroke);
  head.setAttribute('stroke-width', String(Math.max(1.5, STROKE.default)));
  head.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(head);

  // Shoulders arc below head
  const shoulderW = badgeW * 0.35;
  const shoulderY = headCY + headR + headR * 0.35;
  const bodyPath = document.createElementNS(SVG_NS, 'path');
  bodyPath.setAttribute(
    'd',
    `M ${headCX - shoulderW} ${shoulderY + shoulderW * 0.55} A ${shoulderW} ${shoulderW * 0.8} 0 0 1 ${headCX + shoulderW} ${shoulderY + shoulderW * 0.55}`,
  );
  bodyPath.setAttribute('fill', 'none');
  bodyPath.setAttribute('stroke', cc.stroke);
  bodyPath.setAttribute('stroke-width', String(Math.max(1.5, STROKE.default)));
  bodyPath.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(bodyPath);

  // ── Horizontal divider line at ~65% badge height ────────────────────
  const dividerY = badgeY + badgeH * 0.65;
  const dividerPad = badgeW * 0.12;
  const divider = document.createElementNS(SVG_NS, 'line');
  divider.setAttribute('x1', String(badgeX + dividerPad));
  divider.setAttribute('y1', String(dividerY));
  divider.setAttribute('x2', String(badgeX + badgeW - dividerPad));
  divider.setAttribute('y2', String(dividerY));
  divider.setAttribute('stroke', cc.strokeMuted ?? colorWithAlpha(cc.stroke, '40'));
  divider.setAttribute('stroke-width', '1');
  innerG.appendChild(divider);

  // ── Data lines (two gradient bars below divider) ────────────────────
  const dataLineGradId = `usr-dataline-${entityId}`;
  if (!defs.querySelector(`#${dataLineGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', dataLineGradId);
    grad.setAttribute('x1', '0%');
    grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%');
    grad.setAttribute('y2', '0%');
    const dl1 = document.createElementNS(SVG_NS, 'stop');
    dl1.setAttribute('offset', '0%');
    dl1.setAttribute('stop-color', color);
    dl1.setAttribute('stop-opacity', '0.35');
    const dl2 = document.createElementNS(SVG_NS, 'stop');
    dl2.setAttribute('offset', '100%');
    dl2.setAttribute('stop-color', color);
    dl2.setAttribute('stop-opacity', '0.08');
    grad.appendChild(dl1);
    grad.appendChild(dl2);
    defs.appendChild(grad);
  }

  const dataLineH = 3;
  const dataLinePadX = badgeW * 0.15;
  const dataLine1Y = dividerY + badgeH * 0.08;
  const dataLine2Y = dataLine1Y + dataLineH + badgeH * 0.06;

  // First data line (wider)
  const dl1Rect = document.createElementNS(SVG_NS, 'rect');
  dl1Rect.setAttribute('x', String(badgeX + dataLinePadX));
  dl1Rect.setAttribute('y', String(dataLine1Y));
  dl1Rect.setAttribute('width', String(badgeW * 0.7));
  dl1Rect.setAttribute('height', String(dataLineH));
  dl1Rect.setAttribute('rx', '1.5');
  dl1Rect.setAttribute('ry', '1.5');
  dl1Rect.setAttribute('fill', `url(#${dataLineGradId})`);
  innerG.appendChild(dl1Rect);

  // Second data line (shorter)
  const dl2Rect = document.createElementNS(SVG_NS, 'rect');
  dl2Rect.setAttribute('x', String(badgeX + dataLinePadX));
  dl2Rect.setAttribute('y', String(dataLine2Y));
  dl2Rect.setAttribute('width', String(badgeW * 0.5));
  dl2Rect.setAttribute('height', String(dataLineH));
  dl2Rect.setAttribute('rx', '1.5');
  dl2Rect.setAttribute('ry', '1.5');
  dl2Rect.setAttribute('fill', `url(#${dataLineGradId})`);
  innerG.appendChild(dl2Rect);

  // ── 4. Material Texture — Specular highlight ────────────────────────
  const specId = `usr-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    const specGrad = document.createElementNS(SVG_NS, 'radialGradient');
    specGrad.setAttribute('id', specId);
    specGrad.setAttribute('cx', '35%');
    specGrad.setAttribute('cy', '25%');
    specGrad.setAttribute('r', '40%');
    const sp1 = document.createElementNS(SVG_NS, 'stop');
    sp1.setAttribute('offset', '0%');
    sp1.setAttribute('stop-color', '#ffffff');
    sp1.setAttribute('stop-opacity', '0.18');
    const sp2 = document.createElementNS(SVG_NS, 'stop');
    sp2.setAttribute('offset', '100%');
    sp2.setAttribute('stop-color', '#ffffff');
    sp2.setAttribute('stop-opacity', '0');
    specGrad.appendChild(sp1);
    specGrad.appendChild(sp2);
    defs.appendChild(specGrad);
  }
  const spec = document.createElementNS(SVG_NS, 'ellipse');
  spec.setAttribute('cx', String(badgeX + badgeW * 0.35));
  spec.setAttribute('cy', String(badgeY + badgeH * 0.25));
  spec.setAttribute('rx', String(badgeW * 0.35));
  spec.setAttribute('ry', String(badgeH * 0.2));
  spec.setAttribute('fill', `url(#${specId})`);
  spec.setAttribute('clip-path', `url(#${aoClipId})`);
  spec.setAttribute('pointer-events', 'none');
  innerG.appendChild(spec);

  // ── Green status dot at top-right corner ────────────────────────────
  const statusDotR = 5;
  const statusDotCX = badgeX + badgeW - cornerR * 0.5;
  const statusDotCY = badgeY + cornerR * 0.5;

  const statusDot = document.createElementNS(SVG_NS, 'circle');
  statusDot.setAttribute('cx', String(statusDotCX));
  statusDot.setAttribute('cy', String(statusDotCY));
  statusDot.setAttribute('r', String(statusDotR));
  statusDot.setAttribute('fill', '#22C55E');
  statusDot.setAttribute('stroke', cc.fill);
  statusDot.setAttribute('stroke-width', '1.5');
  statusDot.setAttribute('id', `usrDot_${entityId}`);
  innerG.appendChild(statusDot);

  // ── 5. Micro-Life — pulse + shimmer animations ──────────────────────
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  const styleId = `usr-style-${entityId}`;
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes usrPulse_${entityId} {
        0%, 100% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.6); opacity: 0.4; }
      }
      @keyframes usrShimmer_${entityId} {
        0%   { opacity: 0.6; transform: translateX(-${badgeW * 0.1}px); }
        50%  { opacity: 1;   transform: translateX(${badgeW * 0.1}px); }
        100% { opacity: 0.6; transform: translateX(-${badgeW * 0.1}px); }
      }
      @keyframes usrFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-3px); }
      }
      #usrDot_${entityId} {
        transform-origin: ${statusDotCX}px ${statusDotCY}px;
        animation: usrPulse_${entityId} 2s ease-in-out infinite;
      }
      #usrAccent_${entityId} {
        animation: usrShimmer_${entityId} 3s ease-in-out infinite;
      }
      #usrBadge_${entityId} {
        animation: usrFloat_${entityId} 4s ease-in-out infinite;
      }
    `;
    svg.prepend(style);
  }

  // ── Label below ─────────────────────────────────────────────────────
  if (entity.label) {
    const labelY = badgeY + badgeH + LABEL_DEFAULTS.offsetBelow;
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(labelY));
    text.setAttribute('text-anchor', 'middle');
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
