/**
 * @preplai/illustrations — Sidecar Component (Cinematic Depth)
 *
 * Main rect + smaller dashed rect + connector. Directional lighting,
 * ground shadow, ambient occlusion, specular highlight, micro-life.
 * Use for: sidecar proxies (Envoy, Istio, Linkerd).
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';import type { VisualEntity } from '@preplai/shared';

export function renderSidecar(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const scale = size / 50;
  const mainW = 60 * scale;
  const mainH = 45 * scale;
  const sideW = 32 * scale;
  const sideH = mainH;
  const connW = 8 * scale;
  const totalW = mainW + connW + sideW;
  const hw = totalW / 2;
  const hh = mainH / 2;
  const rx = 5;

  const defs = ensureDefs(parentEl);

  // ── 1. Directional Lighting ─────────────────────────────────────────
  const haloId = `sc-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-hw * 0.1));
  halo.setAttribute('cy', String(-hh * 0.1));
  halo.setAttribute('rx', String(hw * 1.6));
  halo.setAttribute('ry', String(hh * 1.8));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── 2. Ground Shadow ────────────────────────────────────────────────
  const gsId = `sc-gshadow-${entityId}`;
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
  const groundShadow = document.createElementNS(SVG_NS, 'ellipse');
  groundShadow.setAttribute('cx', '0');
  groundShadow.setAttribute('cy', String(hh + hh * 0.2));
  groundShadow.setAttribute('rx', String(hw * 1.1));
  groundShadow.setAttribute('ry', String(hh * 0.22));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── 3. Ambient Occlusion ────────────────────────────────────────────
  const aoId = `sc-ao-${entityId}`;
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

  // ── Highlight glow ring ─────────────────────────────────────────────
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-hw - 3));
    glow.setAttribute('y', String(-hh - 3));
    glow.setAttribute('width', String(totalW + 6));
    glow.setAttribute('height', String(mainH + 6));
    glow.setAttribute('rx', String(rx + 2));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Body fill gradient ──────────────────────────────────────────────
  const bodyFillId = `sc-bfill-${entityId}`;
  if (!defs.querySelector(`#${bodyFillId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', bodyFillId);
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.3');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.08');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }
  const bodyStrokeId = `sc-bstroke-${entityId}`;
  if (!defs.querySelector(`#${bodyStrokeId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', bodyStrokeId);
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.9');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.3');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // ── Main service box (left) ─────────────────────────────────────────
  const mainX = -hw;
  const mainRect = document.createElementNS(SVG_NS, 'rect');
  mainRect.setAttribute('x', String(mainX));
  mainRect.setAttribute('y', String(-hh));
  mainRect.setAttribute('width', String(mainW));
  mainRect.setAttribute('height', String(mainH));
  mainRect.setAttribute('rx', String(rx));
  mainRect.setAttribute('fill', `url(#${bodyFillId})`);
  mainRect.setAttribute('stroke', `url(#${bodyStrokeId})`);
  mainRect.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(mainRect);

  // Service icon lines inside main box
  const svcCx = mainX + mainW / 2;
  for (const yOff of [-6 * scale, 0, 6 * scale]) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(svcCx - 10 * scale));
    line.setAttribute('y1', String(yOff));
    line.setAttribute('x2', String(svcCx + 10 * scale));
    line.setAttribute('y2', String(yOff));
    line.setAttribute('stroke', colorWithAlpha(color, '55'));
    line.setAttribute('stroke-width', String(STROKE.thin));
    innerG.appendChild(line);
  }

  // AO overlay on main box
  const aoMain = document.createElementNS(SVG_NS, 'rect');
  aoMain.setAttribute('x', String(mainX));
  aoMain.setAttribute('y', String(-hh));
  aoMain.setAttribute('width', String(mainW));
  aoMain.setAttribute('height', String(mainH));
  aoMain.setAttribute('rx', String(rx));
  aoMain.setAttribute('fill', `url(#${aoId})`);
  aoMain.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoMain);

  // ── Connector line between boxes ────────────────────────────────────
  const connX1 = mainX + mainW;
  const connX2 = connX1 + connW;
  const connLine = document.createElementNS(SVG_NS, 'line');
  connLine.setAttribute('x1', String(connX1));
  connLine.setAttribute('y1', '0');
  connLine.setAttribute('x2', String(connX2));
  connLine.setAttribute('y2', '0');
  connLine.setAttribute('stroke', color);
  connLine.setAttribute('stroke-width', String(STROKE.default));
  connLine.classList.add(`sc-conn-${entityId}`);
  innerG.appendChild(connLine);

  // ── Sidecar box (right, dashed) ─────────────────────────────────────
  const sideX = connX2;
  const sideRect = document.createElementNS(SVG_NS, 'rect');
  sideRect.setAttribute('x', String(sideX));
  sideRect.setAttribute('y', String(-hh));
  sideRect.setAttribute('width', String(sideW));
  sideRect.setAttribute('height', String(sideH));
  sideRect.setAttribute('rx', String(rx));
  sideRect.setAttribute('fill', `url(#${bodyFillId})`);
  sideRect.setAttribute('stroke', `url(#${bodyStrokeId})`);
  sideRect.setAttribute('stroke-width', String(STROKE.default));
  sideRect.setAttribute('stroke-dasharray', '5,3');
  sideRect.classList.add(`sc-side-${entityId}`);
  innerG.appendChild(sideRect);

  // "SC" text inside sidecar
  const scText = document.createElementNS(SVG_NS, 'text');
  scText.setAttribute('x', String(sideX + sideW / 2));
  scText.setAttribute('y', '2');
  scText.setAttribute('text-anchor', 'middle');
  scText.setAttribute('dominant-baseline', 'central');
  scText.setAttribute('fill', color);
  scText.setAttribute('font-size', String(size * 0.12));
  scText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
  scText.setAttribute('font-family', TYPOGRAPHY.fontCode);
  scText.textContent = 'SC';
  innerG.appendChild(scText);

  // AO overlay on sidecar box
  const aoSide = document.createElementNS(SVG_NS, 'rect');
  aoSide.setAttribute('x', String(sideX));
  aoSide.setAttribute('y', String(-hh));
  aoSide.setAttribute('width', String(sideW));
  aoSide.setAttribute('height', String(sideH));
  aoSide.setAttribute('rx', String(rx));
  aoSide.setAttribute('fill', `url(#${aoId})`);
  aoSide.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoSide);

  // ── 4. Specular Highlight ───────────────────────────────────────────
  const specId = `sc-spec-${entityId}`;
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
  specular.setAttribute('cx', String(mainX + mainW * 0.3));
  specular.setAttribute('cy', String(-hh * 0.4));
  specular.setAttribute('rx', String(mainW * 0.35));
  specular.setAttribute('ry', String(hh * 0.4));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── 5. Micro-Life — connector pulse, sidecar shimmer, float ─────────
  const styleId = `sc-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes scConnPulse_${entityId} {
        0%, 100% { transform: scaleX(1); opacity: 0.7; }
        50% { transform: scaleX(1.2); opacity: 1; }
      }
      @keyframes scSideShimmer_${entityId} {
        0%, 100% { transform: scale(1); opacity: 0.8; }
        50% { transform: scale(1.04); opacity: 1; }
      }
      @keyframes scFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .sc-conn-${entityId} {
        animation: scConnPulse_${entityId} 2s ease-in-out infinite;
      }
      .sc-side-${entityId} {
        animation: scSideShimmer_${entityId} 2.8s ease-in-out infinite;
      }
      .sc-float-${entityId} {
        animation: scFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`sc-float-${entityId}`);

  // ── Label below ─────────────────────────────────────────────────────
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
