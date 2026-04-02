/**
 * @preplai/illustrations — APIGateway Component (5-Pillar Cinematic)
 *
 * Rounded rect body with "GW" badge, inbound arrow, fan-out lines + endpoint dots.
 * Use for: API gateways, reverse proxies, request routers.
 *
 * 5 Pillars: directional lighting halo, ground shadow, ambient occlusion,
 * specular highlight, micro-life (float, dot pulse, badge breathe).
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlassFilter, ensureGlowFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderAPIGateway(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const w = s * 0.85;
  const h = s * 0.5;
  const hw = w / 2;
  const hh = h / 2;

  const defs = ensureDefs(parentEl);

  // ── 1. Directional Lighting — radial halo behind entity ──────────────
  const haloId = `apigw-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-hw * 0.15));
  halo.setAttribute('cy', String(-hh * 0.1));
  halo.setAttribute('rx', String(hw * 1.8));
  halo.setAttribute('ry', String(hh * 1.6));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── 2. Ground Shadow — ellipse below body ────────────────────────────
  const gsId = `apigw-gshadow-${entityId}`;
  if (!defs.querySelector(`#${gsId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', gsId);
    grad.setAttribute('cx', '50%'); grad.setAttribute('cy', '50%');
    grad.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', '#000000');
    s1.setAttribute('stop-opacity', '0.18');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', '#000000');
    s2.setAttribute('stop-opacity', '0');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }
  const groundShadow = document.createElementNS(SVG_NS, 'ellipse');
  groundShadow.setAttribute('cx', '0');
  groundShadow.setAttribute('cy', String(hh + s * 0.22));
  groundShadow.setAttribute('rx', String(hw * 0.9));
  groundShadow.setAttribute('ry', String(hh * 0.25));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Highlight glow ring (behind shape) ───────────────────────────────
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-hw - 3));
    glow.setAttribute('y', String(-hh - 3));
    glow.setAttribute('width', String(w + 6));
    glow.setAttribute('height', String(h + 6));
    glow.setAttribute('rx', '10');
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Body fill gradient ───────────────────────────────────────────────
  const bodyFillId = `apigw-bfill-${entityId}`;
  if (!defs.querySelector(`#${bodyFillId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', bodyFillId);
    grad.setAttribute('cx', '50%'); grad.setAttribute('cy', '50%');
    grad.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', color);
    s1.setAttribute('stop-opacity', '0.3');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', color);
    s2.setAttribute('stop-opacity', '0.08');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // ── Body stroke gradient (135deg, color 0.9→0.3) ────────────────────
  const bodyStrokeId = `apigw-bstroke-${entityId}`;
  if (!defs.querySelector(`#${bodyStrokeId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', bodyStrokeId);
    // 135deg → x1=0% y1=0% x2=100% y2=100%
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', color);
    s1.setAttribute('stop-opacity', '0.9');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', color);
    s2.setAttribute('stop-opacity', '0.3');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // ── Body rect ────────────────────────────────────────────────────────
  const glowUrl = ensureGlowFilter(parentEl, color, 'apigw-glow');
  const glassUrl = ensureGlassFilter(parentEl);

  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x', String(-hw));
  body.setAttribute('y', String(-hh));
  body.setAttribute('width', String(w));
  body.setAttribute('height', String(h));
  body.setAttribute('rx', '8');
  body.setAttribute('fill', `url(#${bodyFillId})`);
  body.setAttribute('stroke', `url(#${bodyStrokeId})`);
  body.setAttribute('stroke-width', '2');
  body.setAttribute('filter', `${glowUrl} ${glassUrl}`);
  body.setAttribute('data-morph-target', 'true');
  innerG.appendChild(body);

  // ── 3. Ambient Occlusion — rect overlay bottom-right ─────────────────
  const aoId = `apigw-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', aoId);
    grad.setAttribute('cx', '70%'); grad.setAttribute('cy', '75%');
    grad.setAttribute('r', '55%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', '#000000');
    s1.setAttribute('stop-opacity', '0.10');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', '#000000');
    s2.setAttribute('stop-opacity', '0');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }
  const ao = document.createElementNS(SVG_NS, 'rect');
  ao.setAttribute('x', String(-hw));
  ao.setAttribute('y', String(-hh));
  ao.setAttribute('width', String(w));
  ao.setAttribute('height', String(h));
  ao.setAttribute('rx', '8');
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── 4. Specular Highlight — upper-left ellipse ───────────────────────
  const specId = `apigw-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', specId);
    grad.setAttribute('cx', '35%'); grad.setAttribute('cy', '25%');
    grad.setAttribute('r', '40%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', '#ffffff');
    s1.setAttribute('stop-opacity', '0.18');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', '#ffffff');
    s2.setAttribute('stop-opacity', '0');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }
  const specular = document.createElementNS(SVG_NS, 'ellipse');
  specular.setAttribute('cx', String(-hw * 0.25));
  specular.setAttribute('cy', String(-hh * 0.35));
  specular.setAttribute('rx', String(hw * 0.65));
  specular.setAttribute('ry', String(hh * 0.55));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── "GW" badge text — centered in body ───────────────────────────────
  const badge = document.createElementNS(SVG_NS, 'text');
  badge.setAttribute('x', '0');
  badge.setAttribute('y', String(s * 0.18 * 0.35)); // vertical centering nudge
  badge.setAttribute('text-anchor', 'middle');
  badge.setAttribute('dominant-baseline', 'central');
  badge.setAttribute('fill', colorWithAlpha(color, 'cc'));
  badge.setAttribute('font-size', String(Math.round(s * 0.18)));
  badge.setAttribute('font-weight', '700');
  badge.setAttribute('font-family', "'JetBrains Mono', 'Fira Code', monospace");
  badge.setAttribute('letter-spacing', '1');
  badge.textContent = 'GW';
  badge.classList.add(`apigw-badge-${entityId}`);
  innerG.appendChild(badge);

  // ── Arrow in — small downward triangle above body ────────────────────
  const arrowY = -hh - s * 0.06;
  const arrowSize = s * 0.05;
  const arrowPath = document.createElementNS(SVG_NS, 'path');
  arrowPath.setAttribute('d', [
    `M 0 ${arrowY}`,
    `L ${-arrowSize} ${arrowY - arrowSize * 1.4}`,
    `L ${arrowSize} ${arrowY - arrowSize * 1.4}`,
    'Z',
  ].join(' '));
  arrowPath.setAttribute('fill', colorWithAlpha(color, '99'));
  innerG.appendChild(arrowPath);

  // ── 3 fan-out lines from bottom of body ──────────────────────────────
  const fanStartY = hh;
  const fanEndY = hh + s * 0.18;
  const lineSpacing = w * 0.25;
  const dotR = 3;

  for (let i = -1; i <= 1; i++) {
    const x = i * lineSpacing;

    // Fan-out line
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', '0');
    line.setAttribute('y1', String(fanStartY));
    line.setAttribute('x2', String(x));
    line.setAttribute('y2', String(fanEndY));
    line.setAttribute('stroke', colorWithAlpha(color, '80'));
    line.setAttribute('stroke-width', '1.5');
    line.setAttribute('stroke-linecap', 'round');
    innerG.appendChild(line);

    // Endpoint dot with glow
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(x));
    dot.setAttribute('cy', String(fanEndY));
    dot.setAttribute('r', String(dotR));
    dot.setAttribute('fill', colorWithAlpha(color, '66'));
    dot.setAttribute('stroke', colorWithAlpha(color, 'b3'));
    dot.setAttribute('stroke-width', '1');
    dot.setAttribute('filter', glowUrl);
    dot.classList.add(`apigw-dot-${entityId}`);
    dot.style.animationDelay = `${(i + 1) * 0.4}s`;
    innerG.appendChild(dot);
  }

  // ── 5. Micro-Life Animations ─────────────────────────────────────────
  const styleId = `apigw-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes apigwFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes apigwDotPulse_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.4); }
      }
      @keyframes apigwBadgeBreathe_${entityId} {
        0%, 100% { opacity: 0.8; }
        50% { opacity: 1; }
      }
      .apigw-float-${entityId} {
        animation: apigwFloat_${entityId} 4s ease-in-out infinite;
      }
      .apigw-dot-${entityId} {
        transform-origin: center;
        transform-box: fill-box;
        animation: apigwDotPulse_${entityId} 2s ease-in-out infinite;
      }
      .apigw-badge-${entityId} {
        animation: apigwBadgeBreathe_${entityId} 3s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`apigw-float-${entityId}`);

  // ── Label below ──────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(fanEndY + LABEL_DEFAULTS.offsetBelow));
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
