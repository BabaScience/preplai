/**
 * @preplai/illustrations — Decision Component (Cinematic Depth)
 *
 * Diamond + "?" + forking lines to dots. Directional lighting,
 * ground shadow, ambient occlusion, specular highlight, micro-life.
 * Use for: decision points, branch conditions, yes/no gates.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';import type { VisualEntity } from '@preplai/shared';

export function renderDecision(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const d = size * 0.52;

  const defs = ensureDefs(parentEl);

  // ── 1. Directional Lighting ─────────────────────────────────────────
  const haloId = `dec-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-d * 0.1));
  halo.setAttribute('cy', String(-d * 0.1));
  halo.setAttribute('rx', String(d * 1.6));
  halo.setAttribute('ry', String(d * 1.4));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── 2. Ground Shadow ────────────────────────────────────────────────
  const gsId = `dec-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(d + d * 0.15));
  groundShadow.setAttribute('rx', String(d * 1.1));
  groundShadow.setAttribute('ry', String(d * 0.2));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── 3. Ambient Occlusion ────────────────────────────────────────────
  const aoId = `dec-ao-${entityId}`;
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
    const glowD = d + 4;
    const glow = document.createElementNS(SVG_NS, 'polygon');
    glow.setAttribute('points', `0,${-glowD} ${glowD},0 0,${glowD} ${-glowD},0`);
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Body fill gradient ──────────────────────────────────────────────
  const bodyFillId = `dec-bfill-${entityId}`;
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
  const bodyStrokeId = `dec-bstroke-${entityId}`;
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

  // ── Diamond shape ───────────────────────────────────────────────────
  const polygon = document.createElementNS(SVG_NS, 'polygon');
  polygon.setAttribute('points', `0,${-d} ${d},0 0,${d} ${-d},0`);
  polygon.setAttribute('fill', `url(#${bodyFillId})`);
  polygon.setAttribute('stroke', `url(#${bodyStrokeId})`);
  polygon.setAttribute('stroke-width', String(STROKE.default));
  polygon.setAttribute('stroke-linejoin', 'round');
  innerG.appendChild(polygon);

  // ── AO overlay (diamond-shaped clip approximation via ellipse) ──────
  const aoEllipse = document.createElementNS(SVG_NS, 'ellipse');
  aoEllipse.setAttribute('cx', String(d * 0.15));
  aoEllipse.setAttribute('cy', String(d * 0.2));
  aoEllipse.setAttribute('rx', String(d * 0.7));
  aoEllipse.setAttribute('ry', String(d * 0.7));
  aoEllipse.setAttribute('fill', `url(#${aoId})`);
  aoEllipse.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoEllipse);

  // ── "?" text centered ───────────────────────────────────────────────
  const iconSize = d * 0.55;
  const qText = document.createElementNS(SVG_NS, 'text');
  qText.setAttribute('x', '0');
  qText.setAttribute('y', String(iconSize * 0.15));
  qText.setAttribute('text-anchor', 'middle');
  qText.setAttribute('dominant-baseline', 'central');
  qText.setAttribute('fill', color);
  qText.setAttribute('font-size', String(iconSize));
  qText.setAttribute('font-weight', '300');
  qText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  qText.textContent = '?';
  qText.classList.add(`dec-glow-${entityId}`);
  innerG.appendChild(qText);

  // ── Forking lines to dots ───────────────────────────────────────────
  const forkY = d + d * 0.15;
  const forkSpread = d * 0.7;
  const dotR = size * 0.025;

  // Left fork
  const forkL = document.createElementNS(SVG_NS, 'line');
  forkL.setAttribute('x1', '0'); forkL.setAttribute('y1', String(d));
  forkL.setAttribute('x2', String(-forkSpread)); forkL.setAttribute('y2', String(forkY + d * 0.3));
  forkL.setAttribute('stroke', colorWithAlpha(color, '66'));
  forkL.setAttribute('stroke-width', '1');
  forkL.classList.add(`dec-fork-${entityId}`);
  innerG.appendChild(forkL);

  const dotL = document.createElementNS(SVG_NS, 'circle');
  dotL.setAttribute('cx', String(-forkSpread));
  dotL.setAttribute('cy', String(forkY + d * 0.3));
  dotL.setAttribute('r', String(dotR));
  dotL.setAttribute('fill', color);
  innerG.appendChild(dotL);

  // Right fork
  const forkR = document.createElementNS(SVG_NS, 'line');
  forkR.setAttribute('x1', '0'); forkR.setAttribute('y1', String(d));
  forkR.setAttribute('x2', String(forkSpread)); forkR.setAttribute('y2', String(forkY + d * 0.3));
  forkR.setAttribute('stroke', colorWithAlpha(color, '66'));
  forkR.setAttribute('stroke-width', '1');
  forkR.classList.add(`dec-fork-${entityId}`);
  innerG.appendChild(forkR);

  const dotR2 = document.createElementNS(SVG_NS, 'circle');
  dotR2.setAttribute('cx', String(forkSpread));
  dotR2.setAttribute('cy', String(forkY + d * 0.3));
  dotR2.setAttribute('r', String(dotR));
  dotR2.setAttribute('fill', color);
  innerG.appendChild(dotR2);

  // ── 4. Specular Highlight ───────────────────────────────────────────
  const specId = `dec-spec-${entityId}`;
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
  specular.setAttribute('cx', String(-d * 0.2));
  specular.setAttribute('cy', String(-d * 0.35));
  specular.setAttribute('rx', String(d * 0.45));
  specular.setAttribute('ry', String(d * 0.35));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── 5. Micro-Life — fork flow, center glow pulse, float ─────────────
  const styleId = `dec-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes decForkFlow_${entityId} {
        0%, 100% { transform: translateY(0); opacity: 0.5; }
        50% { transform: translateY(2px); opacity: 1; }
      }
      @keyframes decGlowPulse_${entityId} {
        0%, 100% { transform: scale(1); opacity: 0.7; }
        50% { transform: scale(1.15); opacity: 1; }
      }
      @keyframes decFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .dec-fork-${entityId} {
        animation: decForkFlow_${entityId} 2.2s ease-in-out infinite;
      }
      .dec-glow-${entityId} {
        animation: decGlowPulse_${entityId} 2.5s ease-in-out infinite;
      }
      .dec-float-${entityId} {
        animation: decFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`dec-float-${entityId}`);

  // ── Label below ─────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(forkY + d * 0.3 + LABEL_DEFAULTS.offsetBelow));
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
