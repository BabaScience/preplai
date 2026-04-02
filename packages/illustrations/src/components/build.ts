/**
 * @preplai/illustrations — Build Component (Cinematic 5-Pillar)
 *
 * Rounded rect body with spinning gear icon and pulsing progress bars.
 * Use for: CI/CD build steps, compilation, deployment pipelines.
 *
 * 5 Pillars: Directional Lighting, Ground Shadow, Ambient Occlusion,
 * Specular Highlight, Micro-Life (float + gear spin + progress pulse).
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlassFilter, ensureGlowFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderBuild(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const w = s * 0.85;
  const h = s * 0.7;
  const hw = w / 2;
  const hh = h / 2;

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ──────────────────────────────────
  const haloId = `build-halo-${entityId}`;
  if (!defs.querySelector(`#${haloId}`)) {
    const haloGrad = document.createElementNS(SVG_NS, 'radialGradient');
    haloGrad.setAttribute('id', haloId);
    haloGrad.setAttribute('cx', '38%');
    haloGrad.setAttribute('cy', '38%');
    haloGrad.setAttribute('r', '50%');
    const hs1 = document.createElementNS(SVG_NS, 'stop');
    hs1.setAttribute('offset', '0%');
    hs1.setAttribute('stop-color', color);
    hs1.setAttribute('stop-opacity', '0.13');
    const hs2 = document.createElementNS(SVG_NS, 'stop');
    hs2.setAttribute('offset', '100%');
    hs2.setAttribute('stop-color', color);
    hs2.setAttribute('stop-opacity', '0');
    haloGrad.appendChild(hs1);
    haloGrad.appendChild(hs2);
    defs.appendChild(haloGrad);
  }
  const halo = document.createElementNS(SVG_NS, 'ellipse');
  halo.setAttribute('cx', String(-hw * 0.15));
  halo.setAttribute('cy', String(-hh * 0.1));
  halo.setAttribute('rx', String(hw * 1.8));
  halo.setAttribute('ry', String(hh * 1.4));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ─────────────────────────────────────────
  const groundShadowId = `build-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(hh + s * 0.06));
  groundShadow.setAttribute('rx', String(hw * 1.1));
  groundShadow.setAttribute('ry', String(hh * 0.2));
  groundShadow.setAttribute('fill', `url(#${groundShadowId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ─────────────────────────────────────
  const aoId = `build-ao-${entityId}`;
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
  const ao = document.createElementNS(SVG_NS, 'rect');
  ao.setAttribute('x', String(-hw));
  ao.setAttribute('y', String(-hh));
  ao.setAttribute('width', String(w));
  ao.setAttribute('height', String(h));
  ao.setAttribute('rx', '8');
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Highlight glow ring ─────────────────────────────────────────────
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

  // ── Body fill gradient ──────────────────────────────────────────────
  const bodyGradId = `build-body-${entityId}`;
  if (!defs.querySelector(`#${bodyGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', bodyGradId);
    grad.setAttribute('cx', '50%');
    grad.setAttribute('cy', '50%');
    grad.setAttribute('r', '60%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', color);
    s1.setAttribute('stop-opacity', '0.3');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', color);
    s2.setAttribute('stop-opacity', '0.08');
    grad.appendChild(s1);
    grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // ── Body stroke gradient ────────────────────────────────────────────
  const strokeGradId = `build-stroke-${entityId}`;
  if (!defs.querySelector(`#${strokeGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', strokeGradId);
    grad.setAttribute('x1', '0%');
    grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%');
    grad.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%');
    s1.setAttribute('stop-color', color);
    s1.setAttribute('stop-opacity', '0.9');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%');
    s2.setAttribute('stop-color', color);
    s2.setAttribute('stop-opacity', '0.3');
    grad.appendChild(s1);
    grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // ── Body rect ───────────────────────────────────────────────────────
  const glassFilterUrl = ensureGlassFilter(parentEl);
  const glowFilterUrl = ensureGlowFilter(parentEl, color, `build-glow-${entityId}`);

  const card = document.createElementNS(SVG_NS, 'rect');
  card.setAttribute('x', String(-hw));
  card.setAttribute('y', String(-hh));
  card.setAttribute('width', String(w));
  card.setAttribute('height', String(h));
  card.setAttribute('rx', '8');
  card.setAttribute('fill', `url(#${bodyGradId})`);
  card.setAttribute('stroke', `url(#${strokeGradId})`);
  card.setAttribute('stroke-width', '2');
  card.setAttribute('filter', glassFilterUrl);
  innerG.appendChild(card);

  // ── Gear icon (centered upper area) ─────────────────────────────────
  const gearCX = 0;
  const gearCY = -hh * 0.3;
  const gearR = s * 0.1;
  const gearG = document.createElementNS(SVG_NS, 'g');
  gearG.setAttribute('class', `build-gear-${entityId}`);

  // Gear hub circle
  const gearHub = document.createElementNS(SVG_NS, 'circle');
  gearHub.setAttribute('cx', String(gearCX));
  gearHub.setAttribute('cy', String(gearCY));
  gearHub.setAttribute('r', String(gearR));
  gearHub.setAttribute('fill', 'none');
  gearHub.setAttribute('stroke', colorWithAlpha(color, 'B3'));
  gearHub.setAttribute('stroke-width', '1.5');
  gearG.appendChild(gearHub);

  // Inner hole
  const gearHole = document.createElementNS(SVG_NS, 'circle');
  gearHole.setAttribute('cx', String(gearCX));
  gearHole.setAttribute('cy', String(gearCY));
  gearHole.setAttribute('r', String(gearR * 0.35));
  gearHole.setAttribute('fill', colorWithAlpha(color, '33'));
  gearG.appendChild(gearHole);

  // 6 teeth around gear
  const toothW = gearR * 0.35;
  const toothH = gearR * 0.4;
  for (let i = 0; i < 6; i++) {
    const angle = (i * 60) * Math.PI / 180;
    const tx = gearCX + Math.cos(angle) * (gearR + toothH * 0.4);
    const ty = gearCY + Math.sin(angle) * (gearR + toothH * 0.4);
    const tooth = document.createElementNS(SVG_NS, 'rect');
    tooth.setAttribute('x', String(tx - toothW / 2));
    tooth.setAttribute('y', String(ty - toothH / 2));
    tooth.setAttribute('width', String(toothW));
    tooth.setAttribute('height', String(toothH));
    tooth.setAttribute('rx', '1');
    tooth.setAttribute('fill', colorWithAlpha(color, 'B3'));
    tooth.setAttribute('transform', `rotate(${i * 60} ${tx} ${ty})`);
    gearG.appendChild(tooth);
  }

  // Gear needs transform-origin for rotation
  gearG.setAttribute('style', `transform-origin: ${gearCX}px ${gearCY}px;`);
  innerG.appendChild(gearG);

  // ── Progress bars (below gear) ──────────────────────────────────────
  const barW = s * 0.5;
  const barH = 3;
  const barX = -barW / 2;
  const barY1 = gearCY + gearR + s * 0.1;
  const barY2 = barY1 + barH + 6;

  // Progress bar 1 (longer, brighter)
  const bar1Bg = document.createElementNS(SVG_NS, 'rect');
  bar1Bg.setAttribute('x', String(barX));
  bar1Bg.setAttribute('y', String(barY1));
  bar1Bg.setAttribute('width', String(barW));
  bar1Bg.setAttribute('height', String(barH));
  bar1Bg.setAttribute('rx', '1.5');
  bar1Bg.setAttribute('fill', colorWithAlpha(color, '15'));
  innerG.appendChild(bar1Bg);

  const bar1Fill = document.createElementNS(SVG_NS, 'rect');
  bar1Fill.setAttribute('x', String(barX));
  bar1Fill.setAttribute('y', String(barY1));
  bar1Fill.setAttribute('width', String(barW * 0.75));
  bar1Fill.setAttribute('height', String(barH));
  bar1Fill.setAttribute('rx', '1.5');
  bar1Fill.setAttribute('fill', colorWithAlpha(color, '66'));
  bar1Fill.setAttribute('class', `build-bar1-${entityId}`);
  bar1Fill.setAttribute('style', `transform-origin: ${barX}px ${barY1 + barH / 2}px;`);
  innerG.appendChild(bar1Fill);

  // Progress bar 2 (shorter, dimmer)
  const bar2Bg = document.createElementNS(SVG_NS, 'rect');
  bar2Bg.setAttribute('x', String(barX));
  bar2Bg.setAttribute('y', String(barY2));
  bar2Bg.setAttribute('width', String(barW));
  bar2Bg.setAttribute('height', String(barH));
  bar2Bg.setAttribute('rx', '1.5');
  bar2Bg.setAttribute('fill', colorWithAlpha(color, '15'));
  innerG.appendChild(bar2Bg);

  const bar2Fill = document.createElementNS(SVG_NS, 'rect');
  bar2Fill.setAttribute('x', String(barX));
  bar2Fill.setAttribute('y', String(barY2));
  bar2Fill.setAttribute('width', String(barW * 0.45));
  bar2Fill.setAttribute('height', String(barH));
  bar2Fill.setAttribute('rx', '1.5');
  bar2Fill.setAttribute('fill', colorWithAlpha(color, '40'));
  bar2Fill.setAttribute('class', `build-bar2-${entityId}`);
  bar2Fill.setAttribute('style', `transform-origin: ${barX}px ${barY2 + barH / 2}px;`);
  innerG.appendChild(bar2Fill);

  // ── Status dot (top-right, solid color with glow) ───────────────────
  const dotCX = hw - s * 0.08;
  const dotCY = -hh + s * 0.08;
  const dotR = s * 0.03;

  const dotGlow = document.createElementNS(SVG_NS, 'circle');
  dotGlow.setAttribute('cx', String(dotCX));
  dotGlow.setAttribute('cy', String(dotCY));
  dotGlow.setAttribute('r', String(dotR * 2.5));
  dotGlow.setAttribute('fill', colorWithAlpha(color, '33'));
  dotGlow.setAttribute('filter', glowFilterUrl);
  innerG.appendChild(dotGlow);

  const dot = document.createElementNS(SVG_NS, 'circle');
  dot.setAttribute('cx', String(dotCX));
  dot.setAttribute('cy', String(dotCY));
  dot.setAttribute('r', String(dotR));
  dot.setAttribute('fill', color);
  innerG.appendChild(dot);

  // ── Pillar 4: Specular Highlight ────────────────────────────────────
  const specId = `build-spec-${entityId}`;
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
  const specular = document.createElementNS(SVG_NS, 'rect');
  specular.setAttribute('x', String(-hw));
  specular.setAttribute('y', String(-hh));
  specular.setAttribute('width', String(w));
  specular.setAttribute('height', String(h));
  specular.setAttribute('rx', '8');
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── Pillar 5: Micro-Life Animations ─────────────────────────────────
  const styleId = `build-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes buildFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes buildGearSpin_${entityId} {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes buildBarPulse_${entityId} {
        0%, 100% { transform: scaleX(1); opacity: 1; }
        50% { transform: scaleX(0.85); opacity: 0.7; }
      }
      .build-float-${entityId} {
        animation: buildFloat_${entityId} 4s ease-in-out infinite;
      }
      .build-gear-${entityId} {
        animation: buildGearSpin_${entityId} 6s linear infinite;
      }
      .build-bar1-${entityId} {
        animation: buildBarPulse_${entityId} 2.5s ease-in-out infinite;
      }
      .build-bar2-${entityId} {
        animation: buildBarPulse_${entityId} 2.5s ease-in-out infinite;
        animation-delay: 0.8s;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`build-float-${entityId}`);

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
