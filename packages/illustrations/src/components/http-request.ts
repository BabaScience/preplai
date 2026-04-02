/**
 * @preplai/illustrations — HTTPRequest / HTTPResponse Component (Cinematic 5-Pillar)
 *
 * Card with method badge + arrow icon. Handles GET/POST/PUT/DELETE methods
 * and long URLs gracefully with truncation.
 *
 * Cinematic Depth: directional lighting, ground shadow, ambient occlusion,
 * specular highlight, micro-life float animation.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, SHAPES, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

/** Method badge colors */
const METHOD_COLORS: Record<string, string> = {
  GET: '#10b981',
  POST: '#3b82f6',
  PUT: '#f59e0b',
  DELETE: '#ef4444',
  PATCH: '#8b5cf6',
};

function renderHTTP(entity: VisualEntity, parentEl: SVGElement, isResponse: boolean): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = (entity.metadata ?? {}) as { method?: string; url?: string; status?: string };
  const method = (meta.method ?? 'GET').toUpperCase();
  const url = meta.url ?? '';

  const w = s * 1.1;
  const h = s * 0.75;
  const hw = w / 2;
  const hh = h / 2;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ──────────────────────────────────
  const haloId = `http-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-hw * 0.15));
  halo.setAttribute('cy', String(-hh * 0.1));
  halo.setAttribute('rx', String(hw * 1.6));
  halo.setAttribute('ry', String(hh * 1.4));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ─────────────────────────────────────────
  const gsId = `http-gshadow-${entityId}`;
  if (!defs.querySelector(`#${gsId}`)) {
    const gsg = document.createElementNS(SVG_NS, 'radialGradient');
    gsg.setAttribute('id', gsId);
    gsg.setAttribute('cx', '50%'); gsg.setAttribute('cy', '50%'); gsg.setAttribute('r', '50%');
    const g1 = document.createElementNS(SVG_NS, 'stop');
    g1.setAttribute('offset', '0%'); g1.setAttribute('stop-color', '#000000'); g1.setAttribute('stop-opacity', '0.18');
    const g2 = document.createElementNS(SVG_NS, 'stop');
    g2.setAttribute('offset', '100%'); g2.setAttribute('stop-color', '#000000'); g2.setAttribute('stop-opacity', '0');
    gsg.appendChild(g1); gsg.appendChild(g2);
    defs.appendChild(gsg);
  }
  const groundShadow = document.createElementNS(SVG_NS, 'ellipse');
  groundShadow.setAttribute('cx', '0');
  groundShadow.setAttribute('cy', String(hh + 5));
  groundShadow.setAttribute('rx', String(hw * 0.9));
  groundShadow.setAttribute('ry', String(hh * 0.18));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ─────────────────────────────────────
  const aoId = `http-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const aoGrad = document.createElementNS(SVG_NS, 'radialGradient');
    aoGrad.setAttribute('id', aoId);
    aoGrad.setAttribute('cx', '70%'); aoGrad.setAttribute('cy', '75%'); aoGrad.setAttribute('r', '55%');
    const a1 = document.createElementNS(SVG_NS, 'stop');
    a1.setAttribute('offset', '0%'); a1.setAttribute('stop-color', '#000000'); a1.setAttribute('stop-opacity', '0.10');
    const a2 = document.createElementNS(SVG_NS, 'stop');
    a2.setAttribute('offset', '100%'); a2.setAttribute('stop-color', '#000000'); a2.setAttribute('stop-opacity', '0');
    aoGrad.appendChild(a1); aoGrad.appendChild(a2);
    defs.appendChild(aoGrad);
  }
  const ao = document.createElementNS(SVG_NS, 'rect');
  ao.setAttribute('x', String(-hw));
  ao.setAttribute('y', String(-hh));
  ao.setAttribute('width', String(w));
  ao.setAttribute('height', String(h));
  ao.setAttribute('rx', String(SHAPES.borderRadius));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Highlight glow ──────────────────────────────────────────────────
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-hw - 3));
    glow.setAttribute('y', String(-hh - 3));
    glow.setAttribute('width', String(w + 6));
    glow.setAttribute('height', String(h + 6));
    glow.setAttribute('rx', String(SHAPES.borderRadius + 2));
    glow.setAttribute('fill', 'none');
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Body ────────────────────────────────────────────────────────────
  const card = document.createElementNS(SVG_NS, 'rect');
  card.setAttribute('x', String(-hw));
  card.setAttribute('y', String(-hh));
  card.setAttribute('width', String(w));
  card.setAttribute('height', String(h));
  card.setAttribute('rx', String(SHAPES.borderRadius));
  card.setAttribute('fill', cc.fill);
  card.setAttribute('stroke', cc.stroke);
  card.setAttribute('stroke-width', '2.5');
  innerG.appendChild(card);

  // ── Method badge (top-left) ─────────────────────────────────────────
  const methodColor = METHOD_COLORS[method] ?? color;
  const badgeW = s * 0.3;
  const badgeH = s * 0.14;
  const badgeX = -hw + 6;
  const badgeY = -hh + 6;

  const badgeRect = document.createElementNS(SVG_NS, 'rect');
  badgeRect.setAttribute('x', String(badgeX));
  badgeRect.setAttribute('y', String(badgeY));
  badgeRect.setAttribute('width', String(badgeW));
  badgeRect.setAttribute('height', String(badgeH));
  badgeRect.setAttribute('rx', '3');
  badgeRect.setAttribute('fill', `${methodColor}33`);
  badgeRect.setAttribute('stroke', methodColor);
  badgeRect.setAttribute('stroke-width', '1');
  innerG.appendChild(badgeRect);

  const badgeText = document.createElementNS(SVG_NS, 'text');
  badgeText.setAttribute('x', String(badgeX + badgeW / 2));
  badgeText.setAttribute('y', String(badgeY + badgeH / 2 + 3));
  badgeText.setAttribute('text-anchor', 'middle');
  badgeText.setAttribute('fill', methodColor);
  badgeText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeIndex));
  badgeText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  badgeText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  badgeText.textContent = method;
  innerG.appendChild(badgeText);

  // ── Arrow icon (centered) ───────────────────────────────────────────
  const arrowY = 2;
  const is = s * 0.1;
  const dir = isResponse ? -1 : 1;
  const arrow = document.createElementNS(SVG_NS, 'path');
  arrow.setAttribute('d', [
    `M ${-is * dir} ${arrowY}`,
    `L ${is * dir} ${arrowY}`,
    `M ${is * dir * 0.5} ${arrowY - is * 0.5}`,
    `L ${is * dir} ${arrowY}`,
    `L ${is * dir * 0.5} ${arrowY + is * 0.5}`,
  ].join(' '));
  arrow.setAttribute('fill', 'none');
  arrow.setAttribute('stroke', cc.stroke);
  arrow.setAttribute('stroke-width', '2.5');
  arrow.setAttribute('stroke-linecap', 'round');
  arrow.setAttribute('stroke-linejoin', 'round');
  innerG.appendChild(arrow);

  // ── URL text (truncated, small monospace below arrow) ───────────────
  if (url) {
    const displayUrl = url.length > 25 ? url.slice(0, 24) + '\u2026' : url;
    const urlText = document.createElementNS(SVG_NS, 'text');
    urlText.setAttribute('x', '0');
    urlText.setAttribute('y', String(hh - 6));
    urlText.setAttribute('text-anchor', 'middle');
    urlText.setAttribute('fill', cc.textTertiary);
    urlText.setAttribute('font-size', String(TYPOGRAPHY.fontSizeIndex));
    urlText.setAttribute('font-family', TYPOGRAPHY.fontCode);
    urlText.textContent = displayUrl;
    innerG.appendChild(urlText);
  }

  // ── Pillar 4: Specular Highlight ────────────────────────────────────
  const specId = `http-spec-${entityId}`;
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
  const specular = document.createElementNS(SVG_NS, 'rect');
  specular.setAttribute('x', String(-hw));
  specular.setAttribute('y', String(-hh));
  specular.setAttribute('width', String(w));
  specular.setAttribute('height', String(h * 0.5));
  specular.setAttribute('rx', String(SHAPES.borderRadius));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Pillar 5: Micro-Life ────────────────────────────────────────────
  const styleId = `http-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes httpFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      .http-float-${entityId} {
        animation: httpFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`http-float-${entityId}`);

  // ── Label below ─────────────────────────────────────────────────────
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

export function renderHTTPRequest(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  return renderHTTP(entity, parentEl, false);
}

export function renderHTTPResponse(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  return renderHTTP(entity, parentEl, true);
}
