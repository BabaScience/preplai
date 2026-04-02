/**
 * @preplai/illustrations — Subnet Component (Cinematic 5-Pillar)
 *
 * Dashed boundary rectangle with internal hosts, bus line, and CIDR notation.
 * Use for: VPC subnets, LAN segments, network boundaries.
 *
 * 5 Pillars:
 *   1. Directional Lighting — radial halo cx=38% cy=38%
 *   2. Ground Shadow — radial black ellipse beneath
 *   3. Ambient Occlusion — radial overlay bottom-right
 *   4. Specular Highlight — radial white ellipse upper-left
 *   5. Micro-Life — float, bus-dot pulse, host shimmer
 *
 * Metadata:
 *   cidr?: string — CIDR notation (e.g. 192.168.1.0/24)
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlassFilter, ensureGlowFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderSubnet(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const cidr = (meta.cidr as string) ?? '192.168.1.0/24';

  const w = s * 1.4;
  const h = s * 0.85;
  const hw = w / 2;
  const hh = h / 2;

  const defs = ensureDefs(parentEl);

  // ── 1. Directional Lighting — radial halo ──────────────────────────
  const haloId = `subnet-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const haloGrad = document.createElementNS(SVG_NS, 'radialGradient');
    haloGrad.setAttribute('id', haloId);
    haloGrad.setAttribute('cx', '38%');
    haloGrad.setAttribute('cy', '38%');
    haloGrad.setAttribute('r', '50%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', color);
    s1.setAttribute('stop-opacity', '0.13');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', color);
    s2.setAttribute('stop-opacity', '0');
    haloGrad.appendChild(s1);
    haloGrad.appendChild(s2);
    defs.appendChild(haloGrad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', String(-hw * 0.1));
  halo.setAttribute('cy', String(-hh * 0.1));
  halo.setAttribute('rx', String(hw * 1.3));
  halo.setAttribute('ry', String(hh * 1.2));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── 2. Ground Shadow ───────────────────────────────────────────────
  const gsId = `subnet-gshadow-${entityId}`;
  if (!defs.querySelector(`#${gsId}`)) {
    const gsg = document.createElementNS(SVG_NS, 'radialGradient');
    gsg.setAttribute('id', gsId);
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
  groundShadow.setAttribute('cy', String(hh + hh * 0.12));
  groundShadow.setAttribute('rx', String(hw * 0.85));
  groundShadow.setAttribute('ry', String(hh * 0.15));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── 3. Ambient Occlusion ───────────────────────────────────────────
  const aoId = `subnet-ao-${entityId}`;
  if (!defs.querySelector(`#${aoId}`)) {
    const aoGrad = document.createElementNS(SVG_NS, 'radialGradient');
    aoGrad.setAttribute('id', aoId);
    aoGrad.setAttribute('cx', '70%');
    aoGrad.setAttribute('cy', '75%');
    aoGrad.setAttribute('r', '55%');
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

  // ── Filters ────────────────────────────────────────────────────────
  const glowFilterUrl = ensureGlowFilter(parentEl, color, `subnet-glow-${entityId}`);
  const glassFilterUrl = ensureGlassFilter(parentEl);

  // ── Boundary fill gradient ─────────────────────────────────────────
  const boundFillId = `subnet-bfill-${entityId}`;
  if (!defs.querySelector(`#${boundFillId}`)) {
    const bfg = document.createElementNS(SVG_NS, 'radialGradient');
    bfg.setAttribute('id', boundFillId);
    bfg.setAttribute('cx', '50%');
    bfg.setAttribute('cy', '50%');
    bfg.setAttribute('r', '50%');
    const bf1 = document.createElementNS(SVG_NS, 'stop');
    bf1.setAttribute('offset', '0%');
    bf1.setAttribute('stop-color', color);
    bf1.setAttribute('stop-opacity', '0.15');
    const bf2 = document.createElementNS(SVG_NS, 'stop');
    bf2.setAttribute('offset', '100%');
    bf2.setAttribute('stop-color', color);
    bf2.setAttribute('stop-opacity', '0.04');
    bfg.appendChild(bf1);
    bfg.appendChild(bf2);
    defs.appendChild(bfg);
  }

  // ── Boundary stroke gradient (135deg) ──────────────────────────────
  const boundStrokeId = `subnet-bstroke-${entityId}`;
  if (!defs.querySelector(`#${boundStrokeId}`)) {
    const bsg = document.createElementNS(SVG_NS, 'linearGradient');
    bsg.setAttribute('id', boundStrokeId);
    // 135deg: x1=0 y1=0 → x2=1 y2=1
    bsg.setAttribute('x1', '0%');
    bsg.setAttribute('y1', '0%');
    bsg.setAttribute('x2', '100%');
    bsg.setAttribute('y2', '100%');
    const bs1 = document.createElementNS(SVG_NS, 'stop');
    bs1.setAttribute('offset', '0%');
    bs1.setAttribute('stop-color', color);
    bs1.setAttribute('stop-opacity', '0.8');
    const bs2 = document.createElementNS(SVG_NS, 'stop');
    bs2.setAttribute('offset', '100%');
    bs2.setAttribute('stop-color', color);
    bs2.setAttribute('stop-opacity', '0.3');
    bsg.appendChild(bs1);
    bsg.appendChild(bs2);
    defs.appendChild(bsg);
  }

  // ── Highlight glow ring ────────────────────────────────────────────
  if (entity.highlight) {
    const glowRect = document.createElementNS(SVG_NS, 'rect');
    glowRect.setAttribute('x', String(-hw - 3));
    glowRect.setAttribute('y', String(-hh - 3));
    glowRect.setAttribute('width', String(w + 6));
    glowRect.setAttribute('height', String(h + 6));
    glowRect.setAttribute('rx', '12');
    glowRect.setAttribute('fill', 'none');
    glowRect.setAttribute('stroke-dasharray', '4,4');
    glowRect.setAttribute('stroke-width', String(STROKE.default));
    applyGlowColors(glowRect, cc);
    innerG.appendChild(glowRect);
  }

  // ── Dashed boundary rect ───────────────────────────────────────────
  const boundary = document.createElementNS(SVG_NS, 'rect');
  boundary.setAttribute('x', String(-hw));
  boundary.setAttribute('y', String(-hh));
  boundary.setAttribute('width', String(w));
  boundary.setAttribute('height', String(h));
  boundary.setAttribute('rx', '10');
  boundary.setAttribute('fill', `url(#${boundFillId})`);
  boundary.setAttribute('stroke', `url(#${boundStrokeId})`);
  boundary.setAttribute('stroke-width', '2');
  boundary.setAttribute('stroke-dasharray', '8,6');
  boundary.setAttribute('filter', glassFilterUrl);
  innerG.appendChild(boundary);

  // ── Ambient occlusion overlay ──────────────────────────────────────
  const aoRect = document.createElementNS(SVG_NS, 'rect');
  aoRect.setAttribute('x', String(-hw));
  aoRect.setAttribute('y', String(-hh));
  aoRect.setAttribute('width', String(w));
  aoRect.setAttribute('height', String(h));
  aoRect.setAttribute('rx', '10');
  aoRect.setAttribute('fill', `url(#${aoId})`);
  aoRect.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoRect);

  // ── 4. Specular Highlight ──────────────────────────────────────────
  const specId = `subnet-spec-${entityId}`;
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
  const specular = document.createElementNS(SVG_NS, 'ellipse');
  specular.setAttribute('cx', String(-hw * 0.25));
  specular.setAttribute('cy', String(-hh * 0.35));
  specular.setAttribute('rx', String(hw * 0.55));
  specular.setAttribute('ry', String(hh * 0.35));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Host rects inside boundary ─────────────────────────────────────
  // Layout: 2 on left column, 1 smaller on right
  const hostW = w * 0.2;
  const hostH = h * 0.3;
  const hostSmallW = w * 0.15;
  const hostSmallH = h * 0.22;

  const hostPositions = [
    { x: -hw + w * 0.1, y: -hh + h * 0.12, w: hostW, h: hostH },
    { x: -hw + w * 0.1, y: -hh + h * 0.12 + hostH + h * 0.06, w: hostW, h: hostH },
    { x: hw - w * 0.1 - hostSmallW, y: -hh + h * 0.18, w: hostSmallW, h: hostSmallH },
  ];

  const hostEls: SVGRectElement[] = [];
  for (const hp of hostPositions) {
    const hostRect = document.createElementNS(SVG_NS, 'rect');
    hostRect.setAttribute('x', String(hp.x));
    hostRect.setAttribute('y', String(hp.y));
    hostRect.setAttribute('width', String(hp.w));
    hostRect.setAttribute('height', String(hp.h));
    hostRect.setAttribute('rx', '4');
    hostRect.setAttribute('fill', `${color}26`);
    hostRect.setAttribute('stroke', `${color}80`);
    hostRect.setAttribute('stroke-width', '1.5');
    hostRect.classList.add(`subnet-host-${entityId}`);
    innerG.appendChild(hostRect);
    hostEls.push(hostRect);
  }

  // ── Bus line (horizontal) ──────────────────────────────────────────
  const busY = hh - h * 0.2;
  const busX1 = -hw + w * 0.08;
  const busX2 = hw - w * 0.08;

  const busLine = document.createElementNS(SVG_NS, 'line');
  busLine.setAttribute('x1', String(busX1));
  busLine.setAttribute('y1', String(busY));
  busLine.setAttribute('x2', String(busX2));
  busLine.setAttribute('y2', String(busY));
  busLine.setAttribute('stroke', `${color}66`);
  busLine.setAttribute('stroke-width', '1.5');
  innerG.appendChild(busLine);

  // ── Bus dots ───────────────────────────────────────────────────────
  const dotR = Math.max(2.5, s * 0.04);
  const busLen = busX2 - busX1;
  const dotPositions = [
    busX1 + busLen * 0.25,
    busX1 + busLen * 0.5,
    busX1 + busLen * 0.75,
  ];

  const dotEls: SVGCircleElement[] = [];
  for (let i = 0; i < 3; i++) {
    // Glow shadow for first two dots
    if (i < 2) {
      const dotGlow = document.createElementNS(SVG_NS, 'circle');
      dotGlow.setAttribute('cx', String(dotPositions[i]));
      dotGlow.setAttribute('cy', String(busY));
      dotGlow.setAttribute('r', String(dotR * 1.8));
      dotGlow.setAttribute('fill', `${color}33`);
      dotGlow.setAttribute('filter', glowFilterUrl);
      innerG.appendChild(dotGlow);
    }

    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', String(dotPositions[i]));
    dot.setAttribute('cy', String(busY));
    dot.setAttribute('r', String(dotR));
    dot.setAttribute('fill', color);
    if (i === 2) {
      dot.setAttribute('opacity', '0.5');
    }
    dot.classList.add(`subnet-dot-${entityId}`);
    innerG.appendChild(dot);
    dotEls.push(dot);
  }

  // ── CIDR text below bus line ───────────────────────────────────────
  const cidrFontSize = Math.max(8, s * 0.13);
  const cidrText = document.createElementNS(SVG_NS, 'text');
  cidrText.setAttribute('x', '0');
  cidrText.setAttribute('y', String(busY + cidrFontSize * 1.4));
  cidrText.setAttribute('text-anchor', 'middle');
  cidrText.setAttribute('fill', `${color}80`);
  cidrText.setAttribute('font-size', String(cidrFontSize));
  cidrText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  cidrText.setAttribute('font-family', TYPOGRAPHY.fontBadge);
  cidrText.textContent = cidr.length > 18 ? cidr.slice(0, 16) + '\u2026' : cidr;
  innerG.appendChild(cidrText);

  // ── Label below boundary ───────────────────────────────────────────
  if (entity.label) {
    const labelEl = document.createElementNS(SVG_NS, 'text');
    labelEl.setAttribute('x', '0');
    labelEl.setAttribute('y', String(hh + LABEL_DEFAULTS.offsetBelow));
    labelEl.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    labelEl.setAttribute('fill', cc.textPrimary);
    labelEl.setAttribute('font-size', String(TYPOGRAPHY.fontSizeLabel));
    labelEl.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    labelEl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    labelEl.textContent = entity.label;
    innerG.appendChild(labelEl);
  }

  // ── 5. Micro-Life Animations ───────────────────────────────────────
  const styleId = `subnet-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes subnetFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes subnetDotPulse_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.4); }
      }
      @keyframes subnetHostShimmer_${entityId} {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.6; }
      }
      .subnet-float-${entityId} {
        animation: subnetFloat_${entityId} 4s ease-in-out infinite;
      }
      .subnet-dot-${entityId} {
        transform-origin: center;
        transform-box: fill-box;
        animation: subnetDotPulse_${entityId} 2s ease-in-out infinite;
      }
      .subnet-dot-${entityId}:nth-child(2) { animation-delay: 0.3s; }
      .subnet-dot-${entityId}:nth-child(3) { animation-delay: 0.6s; }
      .subnet-host-${entityId} {
        animation: subnetHostShimmer_${entityId} 3s ease-in-out infinite;
      }
      .subnet-host-${entityId}:nth-of-type(2) { animation-delay: 0.5s; }
      .subnet-host-${entityId}:nth-of-type(3) { animation-delay: 1.0s; }
    `;
    svg.insertBefore(style, svg.firstChild);
  }

  // Apply staggered delays to dot elements directly
  dotEls.forEach((dot, i) => {
    dot.style.animationDelay = `${i * 0.3}s`;
  });

  // Apply staggered delays to host elements directly
  hostEls.forEach((hostEl, i) => {
    hostEl.style.animationDelay = `${i * 0.5}s`;
  });

  innerG.classList.add(`subnet-float-${entityId}`);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
