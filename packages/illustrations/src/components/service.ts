/**
 * @preplai/illustrations — Service Component
 *
 * Glassmorphic hexagon with glowing gear center.
 * Use for: microservices, service endpoints, APIs.
 *
 * Visual depth: radial halo, outer glow, glowing gear center, block ticks.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';import { resolveColorCascade, applyShapeColors, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlowFilter, ensureGlassFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderService(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const r = s * 0.45;

  const defs = ensureDefs(parentEl);

  // ── Radial depth halo ────────────────────────────────────────────────
  const haloId = `svc-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-r * 0.12));
  halo.setAttribute('cy', String(-r * 0.08));
  halo.setAttribute('rx', String(r * 1.8));
  halo.setAttribute('ry', String(r * 1.8));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Ground contact shadow ───────────────────────────────────────────
  const groundShadowId = `svc-gshadow-${entityId}`;
  if (!defs.querySelector(`#${groundShadowId}`)) {
    const gsg = document.createElementNS(SVG_NS, 'radialGradient');
    gsg.setAttribute('id', groundShadowId);
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
  groundShadow.setAttribute('cy', String(r * 1.05));
  groundShadow.setAttribute('rx', String(r * 0.85));
  groundShadow.setAttribute('ry', String(r * 0.16));
  groundShadow.setAttribute('fill', `url(#${groundShadowId})`);
  innerG.appendChild(groundShadow);

  // ── Ambient occlusion ───────────────────────────────────────────────
  const aoId = `svc-ao-${entityId}`;
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
  // AO polygon deferred until after hexagon shape is drawn

  // Highlight glow
  if (entity.highlight) {
    const glowR = r + 4;
    const glowPoints = [0, 1, 2, 3, 4, 5]
      .map(i => {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        return `${(Math.cos(angle) * glowR).toFixed(1)},${(Math.sin(angle) * glowR).toFixed(1)}`;
      })
      .join(' ');
    const glow = document.createElementNS(SVG_NS, 'polygon');
    glow.setAttribute('points', glowPoints);
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // Hexagon shape with outer glow + glass filter
  const glowUrl = ensureGlowFilter(parentEl, color);
  const glassUrl = ensureGlassFilter(parentEl);
  const hexPoints = [0, 1, 2, 3, 4, 5]
    .map(i => {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      return `${(Math.cos(angle) * r).toFixed(1)},${(Math.sin(angle) * r).toFixed(1)}`;
    })
    .join(' ');

  const polygon = document.createElementNS(SVG_NS, 'polygon');
  polygon.setAttribute('points', hexPoints);
  polygon.setAttribute('stroke-width', String(STROKE.default));
  polygon.setAttribute('stroke-linejoin', 'round');
  polygon.setAttribute('filter', glowUrl);
  polygon.setAttribute('data-morph-target', 'true');
  polygon.setAttribute('id', `svcBody_${entityId}`);
  applyShapeColors(polygon, cc);
  innerG.appendChild(polygon);

  // Glass overlay on hexagon
  const glassHex = document.createElementNS(SVG_NS, 'polygon');
  glassHex.setAttribute('points', hexPoints);
  glassHex.setAttribute('fill', 'none');
  glassHex.setAttribute('filter', glassUrl);
  glassHex.setAttribute('pointer-events', 'none');
  innerG.appendChild(glassHex);

  // ── Ambient occlusion (deferred from above) ─────────────────────────
  const aoHex = document.createElementNS(SVG_NS, 'polygon');
  aoHex.setAttribute('points', hexPoints);
  aoHex.setAttribute('fill', `url(#${aoId})`);
  aoHex.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoHex);

  // ── Material texture: 4 scan lines ──────────────────────────────────
  const scanLineOpacity = '0.04';
  for (let i = 0; i < 4; i++) {
    const ly = -r * 0.5 + (r / 2.5) * i;
    const scanLine = document.createElementNS(SVG_NS, 'line');
    scanLine.setAttribute('x1', String(-r * 0.6));
    scanLine.setAttribute('y1', String(ly));
    scanLine.setAttribute('x2', String(r * 0.6));
    scanLine.setAttribute('y2', String(ly));
    scanLine.setAttribute('stroke', '#ffffff');
    scanLine.setAttribute('stroke-width', '0.5');
    scanLine.setAttribute('stroke-opacity', scanLineOpacity);
    scanLine.setAttribute('pointer-events', 'none');
    innerG.appendChild(scanLine);
  }

  // ── Enhanced gear: ring + glowing center + block ticks ──────────────
  const gearR = r * 0.22;
  const gearCenterR = gearR * 0.65;
  const tickLen = gearR * 0.55;
  const tickW = Math.max(3, gearR * 0.22);

  // Wrap gear ring + ticks in a <g> for rotation animation
  const gearG = document.createElementNS(SVG_NS, 'g');
  innerG.appendChild(gearG);

  // Gear ring (hollow)
  const gearRing = document.createElementNS(SVG_NS, 'circle');
  gearRing.setAttribute('cx', '0');
  gearRing.setAttribute('cy', '0');
  gearRing.setAttribute('r', String(gearR));
  gearRing.setAttribute('fill', 'none');
  gearRing.setAttribute('stroke', cc.strokeSoft);
  gearRing.setAttribute('stroke-width', '1.5');
  gearG.appendChild(gearRing);

  // Glowing center dot
  const centerGradId = `msCenter_${entityId}`;
  if (!defs.querySelector(`#${centerGradId}`)) {
    const centerGrad = document.createElementNS(SVG_NS, 'radialGradient');
    centerGrad.setAttribute('id', centerGradId);
    const sc1 = document.createElementNS(SVG_NS, 'stop');
    sc1.setAttribute('offset', '0%');
    sc1.setAttribute('stop-color', color);
    sc1.setAttribute('stop-opacity', '0.9');
    const sc2 = document.createElementNS(SVG_NS, 'stop');
    sc2.setAttribute('offset', '100%');
    sc2.setAttribute('stop-color', color);
    sc2.setAttribute('stop-opacity', '0.5');
    centerGrad.appendChild(sc1); centerGrad.appendChild(sc2);
    defs.appendChild(centerGrad);
  }

  const cgId = `msGlow_${entityId}`;
  if (!defs.querySelector(`#${cgId}`)) {
    const cgFilter = document.createElementNS(SVG_NS, 'filter');
    cgFilter.setAttribute('id', cgId);
    cgFilter.setAttribute('x', '-100%'); cgFilter.setAttribute('y', '-100%');
    cgFilter.setAttribute('width', '300%'); cgFilter.setAttribute('height', '300%');
    const ds = document.createElementNS(SVG_NS, 'feDropShadow');
    ds.setAttribute('dx', '0'); ds.setAttribute('dy', '0');
    ds.setAttribute('stdDeviation', '4');
    ds.setAttribute('flood-color', color);
    ds.setAttribute('flood-opacity', '0.9');
    cgFilter.appendChild(ds);
    defs.appendChild(cgFilter);
  }

  const center = document.createElementNS(SVG_NS, 'circle');
  center.setAttribute('cx', '0');
  center.setAttribute('cy', '0');
  center.setAttribute('r', String(gearCenterR));
  center.setAttribute('fill', `url(#${centerGradId})`);
  center.setAttribute('filter', `url(#${cgId})`);
  innerG.appendChild(center);

  // Block ticks (N, S, E, W)
  [0, 90, 180, 270].forEach(angleDeg => {
    const rad = (angleDeg * Math.PI) / 180;
    const tx = Math.round(Math.sin(rad) * (gearR + tickLen * 0.5));
    const ty = -Math.round(Math.cos(rad) * (gearR + tickLen * 0.5));
    const isVertical = angleDeg % 180 === 0;
    const tick = document.createElementNS(SVG_NS, 'rect');
    tick.setAttribute('x', String(tx - (isVertical ? tickW / 2 : tickLen / 2)));
    tick.setAttribute('y', String(ty - (isVertical ? tickLen / 2 : tickW / 2)));
    tick.setAttribute('width', String(isVertical ? tickW : tickLen));
    tick.setAttribute('height', String(isVertical ? tickLen : tickW));
    tick.setAttribute('rx', '1.5');
    tick.setAttribute('fill', cc.stroke);
    gearG.appendChild(tick);
  });

  // ── Gear rotation animation (12s spin) ──────────────────────────────
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  const styleId = `svc-style-${entityId}`;
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes svcGearSpin_${entityId} {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes svcGlow_${entityId} {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
      #svcGear_${entityId} { animation: svcGearSpin_${entityId} 6s linear infinite; transform-origin: 0 0; }
      #svcBody_${entityId} { animation: svcGlow_${entityId} 3s ease-in-out infinite; }
    `;
    svg.prepend(style);
  }
  gearG.setAttribute('id', `svcGear_${entityId}`);

  // ── Specular highlight ──────────────────────────────────────────────
  const specId = `svc-spec-${entityId}`;
  if (!defs.querySelector(`#${specId}`)) {
    const specGrad = document.createElementNS(SVG_NS, 'radialGradient');
    specGrad.setAttribute('id', specId);
    specGrad.setAttribute('cx', '35%'); specGrad.setAttribute('cy', '25%'); specGrad.setAttribute('r', '40%');
    const sp1 = document.createElementNS(SVG_NS, 'stop');
    sp1.setAttribute('offset', '0%'); sp1.setAttribute('stop-color', '#ffffff'); sp1.setAttribute('stop-opacity', '0.15');
    const sp2 = document.createElementNS(SVG_NS, 'stop');
    sp2.setAttribute('offset', '100%'); sp2.setAttribute('stop-color', '#ffffff'); sp2.setAttribute('stop-opacity', '0');
    specGrad.appendChild(sp1); specGrad.appendChild(sp2);
    defs.appendChild(specGrad);
  }
  const spec = document.createElementNS(SVG_NS, 'ellipse');
  spec.setAttribute('cx', String(-r * 0.18));
  spec.setAttribute('cy', String(-r * 0.28));
  spec.setAttribute('rx', String(r * 0.4));
  spec.setAttribute('ry', String(r * 0.25));
  spec.setAttribute('fill', `url(#${specId})`);
  spec.setAttribute('pointer-events', 'none');
  innerG.appendChild(spec);

  // Label below
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(r + LABEL_DEFAULTS.offsetBelow));
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
