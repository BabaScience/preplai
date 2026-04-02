/**
 * @preplai/illustrations — APIEndpoint Component (Glassmorphic Depth)
 *
 * A mini HTTP request card: dark header bar, method badge, path string, status badge.
 * Use for: REST endpoints, API routes, service endpoints.
 *
 * Glassmorphic Depth: glass panel fill, gradient border, neon method badge with glow.
 *
 * Cinematic 5-pillar depth: offset halo, ground shadow, AO, glass filter,
 * terminal scan lines, cursor blink animation, specular highlight.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, SHAPES, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade } from '../color-cascade.js';
import { ensureDefs, ensureGlowFilter, ensureGlassFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderAPIEndpoint(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const w = s * 0.9;
  const h = s * 0.72;
  const hw = w / 2;
  const hh = h / 2;
  const headerH = h * 0.26;
  const rx = SHAPES.borderRadius;

  const defs = ensureDefs(parentEl);
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);

  // ── 1. Offset radial halo (atmospheric glow behind entity) ──────────
  const haloId = `api-halo-${entityId}`;
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
  const gndShadowId = `api-gnd-${entityId}`;
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
  const aoId = `api-ao-${entityId}`;
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
  ao.setAttribute('rx', String(rx));
  ao.setAttribute('fill', `url(#${aoId})`);
  innerG.appendChild(ao);

  // ── Gradient IDs (unique per instance) ──────────────────────────────
  const bgGradId = `api-bg-${entityId}`;
  const borderGradId = `api-border-${entityId}`;
  const badgeGlowId = `api-badge-glow-${entityId}`;

  // Background gradient (dark glass)
  if (!defs.querySelector(`#${bgGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', bgGradId);
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '0%'); grad.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', colorWithAlpha(color, '22'));
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', colorWithAlpha(color, '0a'));
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // Border gradient (luminous diagonal — bright top-left to dim bottom-right)
  if (!defs.querySelector(`#${borderGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', borderGradId);
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', colorWithAlpha(color, 'cc'));
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', colorWithAlpha(color, '33'));
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // Badge glow filter (for method badge neon effect)
  if (!defs.querySelector(`#${badgeGlowId}`)) {
    const filter = document.createElementNS(SVG_NS, 'filter');
    filter.setAttribute('id', badgeGlowId);
    filter.setAttribute('x', '-40%'); filter.setAttribute('y', '-40%');
    filter.setAttribute('width', '180%'); filter.setAttribute('height', '180%');
    const fds = document.createElementNS(SVG_NS, 'feDropShadow');
    fds.setAttribute('dx', '0'); fds.setAttribute('dy', '0');
    fds.setAttribute('stdDeviation', '3');
    fds.setAttribute('flood-color', color);
    fds.setAttribute('flood-opacity', '0.8');
    filter.appendChild(fds);
    defs.appendChild(filter);
  }

  // ── Highlight glow ring ──────────────────────────────────────────────
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-hw - 4));
    glow.setAttribute('y', String(-hh - 4));
    glow.setAttribute('width', String(w + 8));
    glow.setAttribute('height', String(h + 8));
    glow.setAttribute('rx', String(rx + 2));
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke', colorWithAlpha(color, '66'));
    glow.setAttribute('stroke-width', '1.5');
    glow.setAttribute('stroke-dasharray', '4,4');
    glow.setAttribute('filter', `url(#${badgeGlowId})`);
    innerG.appendChild(glow);
  }

  // ── 4. Card body (glass panel) — with glass filter ──────────────────
  const _glowUrl = ensureGlowFilter(parentEl, color);
  const glassUrl = ensureGlassFilter(parentEl);
  const card = document.createElementNS(SVG_NS, 'rect');
  card.setAttribute('x', String(-hw));
  card.setAttribute('y', String(-hh));
  card.setAttribute('width', String(w));
  card.setAttribute('height', String(h));
  card.setAttribute('rx', String(rx));
  card.setAttribute('fill', `url(#${bgGradId})`);
  card.setAttribute('stroke', `url(#${borderGradId})`);
  card.setAttribute('stroke-width', String(STROKE.default));
  card.setAttribute('filter', glassUrl);
  innerG.appendChild(card);

  // ── Header bar (dark terminal title bar) ─────────────────────────────
  // Clip to only top rounded portion
  const headerClipId = `api-hclip-${entityId}`;
  if (!defs.querySelector(`#${headerClipId}`)) {
    const clip = document.createElementNS(SVG_NS, 'clipPath');
    clip.setAttribute('id', headerClipId);
    const cr = document.createElementNS(SVG_NS, 'rect');
    cr.setAttribute('x', String(-hw));
    cr.setAttribute('y', String(-hh));
    cr.setAttribute('width', String(w));
    cr.setAttribute('height', String(headerH + rx)); // extra to cover rounded corners at bottom of header
    defs.appendChild(clip);
    clip.appendChild(cr);
  }

  const header = document.createElementNS(SVG_NS, 'rect');
  header.setAttribute('x', String(-hw));
  header.setAttribute('y', String(-hh));
  header.setAttribute('width', String(w));
  header.setAttribute('height', String(headerH));
  header.setAttribute('rx', String(rx));
  header.setAttribute('fill', colorWithAlpha(color, '40'));
  header.setAttribute('clip-path', `url(#${headerClipId})`);
  innerG.appendChild(header);

  // Header bottom line separator
  const sep = document.createElementNS(SVG_NS, 'line');
  sep.setAttribute('x1', String(-hw));
  sep.setAttribute('y1', String(-hh + headerH));
  sep.setAttribute('x2', String(hw));
  sep.setAttribute('y2', String(-hh + headerH));
  sep.setAttribute('stroke', colorWithAlpha(color, '33'));
  sep.setAttribute('stroke-width', '1');
  innerG.appendChild(sep);

  // Header dots (3 tiny circles, terminal-style)
  const dotColors = ['#ff5f57', '#ffbd2e', colorWithAlpha(color, 'cc')];
  for (let i = 0; i < 3; i++) {
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(-hw + 7 + i * 7));
    dot.setAttribute('cy', String(-hh + headerH / 2));
    dot.setAttribute('r', '2');
    dot.setAttribute('fill', dotColors[i]);
    innerG.appendChild(dot);
  }

  // ── Content rows ─────────────────────────────────────────────────────
  const contentTopY = -hh + headerH;
  const contentH = h - headerH;
  const padX = -hw + 8;

  // Row 1 center Y: method badge + path
  const row1Y = contentTopY + contentH * 0.35;

  // Method badge pill (neon glow)
  const meta = (entity.metadata as Record<string, unknown>) ?? {};
  const methodText = meta.method as string ?? 'GET';
  const badgePadX = 5;
  const badgePadY = 2;
  const badgeH = TYPOGRAPHY.fontSizeBadge + badgePadY * 2;
  const badgeW = methodText.length * 5.8 + badgePadX * 2;

  const badgeRect = document.createElementNS(SVG_NS, 'rect');
  badgeRect.setAttribute('x', String(padX));
  badgeRect.setAttribute('y', String(row1Y - badgeH / 2));
  badgeRect.setAttribute('width', String(badgeW));
  badgeRect.setAttribute('height', String(badgeH));
  badgeRect.setAttribute('rx', String(badgeH / 2));
  badgeRect.setAttribute('fill', colorWithAlpha(color, '33'));
  badgeRect.setAttribute('stroke', colorWithAlpha(color, 'cc'));
  badgeRect.setAttribute('stroke-width', '1');
  badgeRect.setAttribute('filter', `url(#${badgeGlowId})`);
  innerG.appendChild(badgeRect);

  const badgeTxt = document.createElementNS(SVG_NS, 'text');
  badgeTxt.setAttribute('x', String(padX + badgePadX));
  badgeTxt.setAttribute('y', String(row1Y));
  badgeTxt.setAttribute('dominant-baseline', 'central');
  badgeTxt.setAttribute('fill', color);
  badgeTxt.setAttribute('font-size', String(TYPOGRAPHY.fontSizeBadge));
  badgeTxt.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  badgeTxt.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  badgeTxt.textContent = methodText;
  innerG.appendChild(badgeTxt);

  // Path string (muted, monospace)
  const pathStr = (meta.path ?? meta.route) as string ?? '/api/v1';
  const pathMaxW = w - (badgeW + 16);
  const maxChars = Math.floor(pathMaxW / 5.5);
  const pathTxt = document.createElementNS(SVG_NS, 'text');
  pathTxt.setAttribute('x', String(padX + badgeW + 5));
  pathTxt.setAttribute('y', String(row1Y));
  pathTxt.setAttribute('dominant-baseline', 'central');
  pathTxt.setAttribute('fill', colorWithAlpha(color, '88'));
  pathTxt.setAttribute('font-size', String(TYPOGRAPHY.fontSizeValue));
  pathTxt.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  pathTxt.textContent = pathStr.length > maxChars ? pathStr.slice(0, maxChars - 1) + '\u2026' : pathStr;
  innerG.appendChild(pathTxt);

  // Row 2: status badge (dim)
  const row2Y = contentTopY + contentH * 0.75;
  const statusCode = String(meta.status ?? '200');
  const statusW = statusCode.length * 5.8 + badgePadX * 2;

  const statusRect = document.createElementNS(SVG_NS, 'rect');
  statusRect.setAttribute('x', String(padX));
  statusRect.setAttribute('y', String(row2Y - badgeH / 2));
  statusRect.setAttribute('width', String(statusW));
  statusRect.setAttribute('height', String(badgeH));
  statusRect.setAttribute('rx', String(badgeH / 2));
  statusRect.setAttribute('fill', colorWithAlpha(color, '18'));
  statusRect.setAttribute('stroke', colorWithAlpha(color, '44'));
  statusRect.setAttribute('stroke-width', '1');
  innerG.appendChild(statusRect);

  const statusTxt = document.createElementNS(SVG_NS, 'text');
  statusTxt.setAttribute('x', String(padX + badgePadX));
  statusTxt.setAttribute('y', String(row2Y));
  statusTxt.setAttribute('dominant-baseline', 'central');
  statusTxt.setAttribute('fill', colorWithAlpha(color, '77'));
  statusTxt.setAttribute('font-size', String(TYPOGRAPHY.fontSizeBadge));
  statusTxt.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  statusTxt.textContent = statusCode;
  innerG.appendChild(statusTxt);

  // ── Response preview lines below status badge ─────────────────────────
  const responseLines = [1.0, 0.7, 0.5];
  responseLines.forEach((op, i) => {
    const lineW = w * (0.72 - i * 0.15);
    const resp = document.createElementNS(SVG_NS, 'rect');
    resp.setAttribute('x', String(padX));
    resp.setAttribute('y', String(row2Y + badgeH / 2 + 5 + i * 7));
    resp.setAttribute('width', String(lineW));
    resp.setAttribute('height', '3');
    resp.setAttribute('rx', '1.5');
    resp.setAttribute('fill', color);
    resp.setAttribute('opacity', String(op * 0.2));
    innerG.appendChild(resp);
  });

  // Top-edge white highlight glint
  const glint = document.createElementNS(SVG_NS, 'line');
  glint.setAttribute('x1', String(-hw + rx));
  glint.setAttribute('y1', String(-hh + 1));
  glint.setAttribute('x2', String(hw - rx));
  glint.setAttribute('y2', String(-hh + 1));
  glint.setAttribute('stroke', 'rgba(255,255,255,0.12)');
  glint.setAttribute('stroke-width', '1');
  glint.setAttribute('stroke-linecap', 'round');
  innerG.appendChild(glint);

  // ── 5. Material texture — 3 terminal scan lines ────────────────────
  for (let i = 0; i < 3; i++) {
    const scanY = contentTopY + contentH * (0.25 + i * 0.25);
    const scanLine = document.createElementNS(SVG_NS, 'line');
    scanLine.setAttribute('x1', String(-hw + 4));
    scanLine.setAttribute('y1', String(scanY));
    scanLine.setAttribute('x2', String(hw - 4));
    scanLine.setAttribute('y2', String(scanY));
    scanLine.setAttribute('stroke', '#ffffff');
    scanLine.setAttribute('stroke-width', '0.5');
    scanLine.setAttribute('stroke-opacity', '0.04');
    scanLine.setAttribute('pointer-events', 'none');
    innerG.appendChild(scanLine);
  }

  // ── 6. Breathing micro-animation — cursor blink ─────────────────────
  const cursorEl = document.createElementNS(SVG_NS, 'rect');
  cursorEl.setAttribute('x', String(padX + badgeW + 5 + (pathStr.length > maxChars ? maxChars - 1 : pathStr.length) * 5.5));
  cursorEl.setAttribute('y', String(row1Y - 4));
  cursorEl.setAttribute('width', '1.5');
  cursorEl.setAttribute('height', '8');
  cursorEl.setAttribute('fill', color);
  cursorEl.setAttribute('opacity', '0.6');
  cursorEl.setAttribute('pointer-events', 'none');
  innerG.appendChild(cursorEl);

  const styleId = `api-style-${entityId}`;
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes apiCursorBlink_${entityId} {
        0%   { opacity: 0.8; }
        50%  { opacity: 0; }
        100% { opacity: 0.8; }
      }
      @keyframes apiFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      .api-float-${entityId} {
        animation: apiFloat_${entityId} 4s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  cursorEl.setAttribute('style', `animation: apiCursorBlink_${entityId} 1s step-end infinite`);
  innerG.classList.add(`api-float-${entityId}`);

  // ── 7. Specular highlight ───────────────────────────────────────────
  const specId = `api-spec-${entityId}`;
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
  specular.setAttribute('cy', String(-hh * 0.3));
  specular.setAttribute('rx', String(hw * 0.45));
  specular.setAttribute('ry', String(hh * 0.3));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Label below ──────────────────────────────────────────────────────
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
