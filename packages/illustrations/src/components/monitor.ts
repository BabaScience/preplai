/**
 * @preplai/illustrations — Monitor Component (Cinematic 5-Pillar)
 *
 * A glowing screen with heartbeat line and metric dots.
 * Use for: monitoring dashboards, health checks, observability, APM.
 *
 * 5 Pillars: Directional Lighting, Ground Shadow, Ambient Occlusion,
 * Specular Highlight, Micro-Life (float + heartbeat shimmer + dot pulse).
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs, ensureGlassFilter, ensureGlowFilter } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

export function renderMonitor(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const w = s * 0.9;
  const h = s * 0.7;
  const hw = w / 2;
  const hh = h / 2;
  const rx = 8;

  const defs = ensureDefs(parentEl);

  // ── P1: Directional Lighting — radial halo behind entity ────────────
  const haloId = `mon-halo-${entityId}`;
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
  halo.setAttribute('cy', String(-hh * 0.05));
  halo.setAttribute('rx', String(hw * 2));
  halo.setAttribute('ry', String(hh * 1.4));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── P2: Ground Shadow — ellipse below ───────────────────────────────
  const gsId = `mon-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(hh + 4));
  groundShadow.setAttribute('rx', String(hw * 0.9));
  groundShadow.setAttribute('ry', String(hh * 0.18));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Highlight glow ring ─────────────────────────────────────────────
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

  // ── Body fill gradient ──────────────────────────────────────────────
  const bodyGradId = `mon-body-${entityId}`;
  if (!defs.querySelector(`#${bodyGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', bodyGradId);
    grad.setAttribute('cx', '50%');
    grad.setAttribute('cy', '50%');
    grad.setAttribute('r', '50%');
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

  // ── Body stroke gradient (135deg, color 0.9→0.3) ───────────────────
  const strokeGradId = `mon-stroke-${entityId}`;
  if (!defs.querySelector(`#${strokeGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', strokeGradId);
    // 135deg → x1=0% y1=0% x2=100% y2=100%
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

  // ── Filters ─────────────────────────────────────────────────────────
  const glowUrl = ensureGlowFilter(parentEl, color, `mon-glow-${entityId}`);
  const glassUrl = ensureGlassFilter(parentEl);

  // ── Body rect ───────────────────────────────────────────────────────
  const body = document.createElementNS(SVG_NS, 'rect');
  body.setAttribute('x', String(-hw));
  body.setAttribute('y', String(-hh));
  body.setAttribute('width', String(w));
  body.setAttribute('height', String(h));
  body.setAttribute('rx', String(rx));
  body.setAttribute('fill', `url(#${bodyGradId})`);
  body.setAttribute('stroke', `url(#${strokeGradId})`);
  body.setAttribute('stroke-width', '2');
  body.setAttribute('filter', glassUrl);
  innerG.appendChild(body);

  // ── P3: Ambient Occlusion — rect overlay, lower-right bias ─────────
  const aoId = `mon-ao-${entityId}`;
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
  ao.setAttribute('rx', String(rx));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Heartbeat line ──────────────────────────────────────────────────
  const lineY = -hh * 0.15;       // slightly above center
  const lineL = -hw * 0.7;        // left start
  const lineR = hw * 0.7;         // right end
  const span = lineR - lineL;
  const pulse = document.createElementNS(SVG_NS, 'polyline');
  pulse.setAttribute('points', [
    `${lineL},${lineY}`,                                   // flat start
    `${lineL + span * 0.25},${lineY}`,                     // flat run
    `${lineL + span * 0.35},${lineY - h * 0.22}`,          // spike up
    `${lineL + span * 0.42},${lineY + h * 0.15}`,          // valley down
    `${lineL + span * 0.50},${lineY}`,                     // return
    `${lineL + span * 0.55},${lineY}`,                     // small flat
    `${lineL + span * 0.62},${lineY - h * 0.10}`,          // minor bump
    `${lineL + span * 0.68},${lineY}`,                     // return
    `${lineR},${lineY}`,                                   // flat end
  ].join(' '));
  pulse.setAttribute('fill', 'none');
  pulse.setAttribute('stroke', colorWithAlpha(color, 'cc'));
  pulse.setAttribute('stroke-width', '2');
  pulse.setAttribute('stroke-linecap', 'round');
  pulse.setAttribute('stroke-linejoin', 'round');
  pulse.setAttribute('filter', glowUrl);
  pulse.classList.add(`mon-heartbeat-${entityId}`);
  innerG.appendChild(pulse);

  // ── 3 metric dots below heartbeat ───────────────────────────────────
  const dotY = lineY + h * 0.22;
  const dotSpacing = span * 0.18;
  const dotAlphas = ['e6', '99', '66'];  // 0.9, 0.6, 0.4
  const dotR = 3;
  for (let i = 0; i < 3; i++) {
    const dot = document.createElementNS(SVG_NS, 'circle');
    const dotX = -dotSpacing + i * dotSpacing;
    dot.setAttribute('cx', String(dotX));
    dot.setAttribute('cy', String(dotY));
    dot.setAttribute('r', String(dotR));
    dot.setAttribute('fill', colorWithAlpha(color, dotAlphas[i]));
    if (i === 0) {
      dot.setAttribute('filter', glowUrl);
    }
    dot.classList.add(`mon-dot-${entityId}`);
    dot.style.animationDelay = `${i * 0.35}s`;
    innerG.appendChild(dot);
  }

  // ── P4: Specular Highlight — upper-left ellipse ─────────────────────
  const specId = `mon-spec-${entityId}`;
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
  specular.setAttribute('ry', String(hh * 0.4));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── P5: Micro-Life animations ───────────────────────────────────────
  const styleId = `mon-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes monFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes monHeartbeat_${entityId} {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(2px); }
        75% { transform: translateX(-2px); }
      }
      @keyframes monDotPulse_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.4); }
      }
      .mon-float-${entityId} {
        animation: monFloat_${entityId} 4s ease-in-out infinite;
      }
      .mon-heartbeat-${entityId} {
        animation: monHeartbeat_${entityId} 2.5s ease-in-out infinite;
      }
      .mon-dot-${entityId} {
        animation: monDotPulse_${entityId} 2s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`mon-float-${entityId}`);

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
