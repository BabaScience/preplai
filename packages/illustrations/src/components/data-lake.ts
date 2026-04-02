/**
 * @preplai/illustrations — DataLake Component (Cinematic Depth)
 *
 * Elliptical pool with wave lines and animated droplets.
 * Use for: data lakes, raw/unstructured data storage, S3-style pools.
 *
 * Micro-life: wave ripple translateX, droplet pulse scale, float.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';import type { VisualEntity } from '@preplai/shared';

export function renderDataLake(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  // Wide and shallow proportions
  const rx = size * 1.2;
  const ry = size / 8;
  const bodyH = size * 0.45;
  const topY = -bodyH / 2 - ry / 2;
  const botY = topY + bodyH;

  const defs = ensureDefs(parentEl);

  // ── 1. Directional Lighting ───────────────────────────────────────────
  const haloId = `dlake-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-rx * 0.15));
  halo.setAttribute('cy', String(-size * 0.05));
  halo.setAttribute('rx', String(rx * 1.4));
  halo.setAttribute('ry', String(rx * 0.8));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── 2. Ground Shadow ──────────────────────────────────────────────────
  const gsId = `dlake-gshadow-${entityId}`;
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
  const gShadow = document.createElementNS(SVG_NS, 'ellipse');
  gShadow.setAttribute('cx', '0');
  gShadow.setAttribute('cy', String(botY + ry * 0.6));
  gShadow.setAttribute('rx', String(rx * 1.1));
  gShadow.setAttribute('ry', String(ry * 0.45));
  gShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(gShadow);

  // ── 3. Ambient Occlusion ──────────────────────────────────────────────
  const aoId = `dlake-ao-${entityId}`;
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
  const ao = document.createElementNS(SVG_NS, 'rect');
  ao.setAttribute('x', String(-rx));
  ao.setAttribute('y', String(topY));
  ao.setAttribute('width', String(rx * 2));
  ao.setAttribute('height', String(bodyH));
  ao.setAttribute('fill', `url(#${aoId})`);
  ao.setAttribute('pointer-events', 'none');
  innerG.appendChild(ao);

  // ── Body fill gradient ────────────────────────────────────────────────
  const bodyGradId = `dlake-body-${entityId}`;
  if (!defs.querySelector(`#${bodyGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'radialGradient');
    grad.setAttribute('id', bodyGradId);
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.3');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.08');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // ── Body stroke gradient ──────────────────────────────────────────────
  const strokeGradId = `dlake-stroke-${entityId}`;
  if (!defs.querySelector(`#${strokeGradId}`)) {
    const grad = document.createElementNS(SVG_NS, 'linearGradient');
    grad.setAttribute('id', strokeGradId);
    grad.setAttribute('x1', '0%'); grad.setAttribute('y1', '0%');
    grad.setAttribute('x2', '100%'); grad.setAttribute('y2', '100%');
    const s1 = document.createElementNS(SVG_NS, 'stop');
    s1.setAttribute('offset', '0%'); s1.setAttribute('stop-color', color); s1.setAttribute('stop-opacity', '0.9');
    const s2 = document.createElementNS(SVG_NS, 'stop');
    s2.setAttribute('offset', '100%'); s2.setAttribute('stop-color', color); s2.setAttribute('stop-opacity', '0.3');
    grad.appendChild(s1); grad.appendChild(s2);
    defs.appendChild(grad);
  }

  // ── Highlight glow ring ───────────────────────────────────────────────
  if (entity.highlight) {
    const hRx = rx + 3;
    const hRy = ry + 2;
    const hTopY = topY - 3;
    const hBotY = botY + 3;
    const glowPath = document.createElementNS(SVG_NS, 'path');
    glowPath.setAttribute('d', [
      `M ${-hRx} ${hTopY}`,
      `A ${hRx} ${hRy} 0 0 1 ${hRx} ${hTopY}`,
      `L ${hRx} ${hBotY}`,
      `A ${hRx} ${hRy} 0 0 1 ${-hRx} ${hBotY}`,
      'Z',
    ].join(' '));
    glowPath.setAttribute('stroke-width', String(STROKE.default));
    glowPath.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glowPath, cc);
    innerG.appendChild(glowPath);
  }

  // ── Pool body (cylinder) ──────────────────────────────────────────────
  const bodyFill = document.createElementNS(SVG_NS, 'rect');
  bodyFill.setAttribute('x', String(-rx));
  bodyFill.setAttribute('y', String(topY));
  bodyFill.setAttribute('width', String(rx * 2));
  bodyFill.setAttribute('height', String(bodyH));
  bodyFill.setAttribute('fill', `url(#${bodyGradId})`);
  innerG.appendChild(bodyFill);

  // Side lines
  for (const xSign of [-1, 1]) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', String(xSign * rx));
    line.setAttribute('y1', String(topY));
    line.setAttribute('x2', String(xSign * rx));
    line.setAttribute('y2', String(botY));
    line.setAttribute('stroke', `url(#${strokeGradId})`);
    line.setAttribute('stroke-width', String(STROKE.default));
    innerG.appendChild(line);
  }

  // Bottom ellipse
  const botEllipse = document.createElementNS(SVG_NS, 'ellipse');
  botEllipse.setAttribute('cx', '0');
  botEllipse.setAttribute('cy', String(botY));
  botEllipse.setAttribute('rx', String(rx));
  botEllipse.setAttribute('ry', String(ry));
  botEllipse.setAttribute('fill', colorWithAlpha(color, '15'));
  botEllipse.setAttribute('stroke', cc.strokeSoft);
  botEllipse.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(botEllipse);

  // Top ellipse (water surface)
  const topEllipse = document.createElementNS(SVG_NS, 'ellipse');
  topEllipse.setAttribute('cx', '0');
  topEllipse.setAttribute('cy', String(topY));
  topEllipse.setAttribute('rx', String(rx));
  topEllipse.setAttribute('ry', String(ry));
  topEllipse.setAttribute('fill', colorWithAlpha(color, '25'));
  topEllipse.setAttribute('stroke', cc.stroke);
  topEllipse.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(topEllipse);

  // ── Wave lines inside body ────────────────────────────────────────────
  const waveAmplitude = bodyH * 0.06;
  const waveWidth = rx * 0.8;
  const waveOffsets = [0.3, 0.55, 0.8];

  for (let wi = 0; wi < waveOffsets.length; wi++) {
    const t = waveOffsets[wi];
    const wy = topY + bodyH * t;
    const segments = 8;
    const step = (waveWidth * 2) / segments;
    let d = `M ${-waveWidth} ${wy}`;
    for (let i = 1; i <= segments; i++) {
      const x = -waveWidth + i * step;
      const cp1x = -waveWidth + (i - 0.5) * step;
      const dir = i % 2 === 1 ? -1 : 1;
      d += ` Q ${cp1x} ${wy + dir * waveAmplitude} ${x} ${wy}`;
    }
    const wave = document.createElementNS(SVG_NS, 'path');
    wave.setAttribute('d', d);
    wave.setAttribute('fill', 'none');
    wave.setAttribute('stroke', colorWithAlpha(color, '66'));
    wave.setAttribute('stroke-width', String(STROKE.thin));
    wave.classList.add(`dlake-wave-${entityId}`);
    wave.style.animationDelay = `${wi * 0.4}s`;
    innerG.appendChild(wave);
  }

  // ── Droplets above surface ────────────────────────────────────────────
  const dropletPositions = [
    { x: -rx * 0.4, y: topY - ry * 1.5 },
    { x: rx * 0.2, y: topY - ry * 2.2 },
    { x: rx * 0.5, y: topY - ry * 1.3 },
  ];
  for (let di = 0; di < dropletPositions.length; di++) {
    const dp = dropletPositions[di];
    const drop = document.createElementNS(SVG_NS, 'circle');
    drop.setAttribute('cx', String(dp.x));
    drop.setAttribute('cy', String(dp.y));
    drop.setAttribute('r', '2');
    drop.setAttribute('fill', colorWithAlpha(color, 'aa'));
    drop.classList.add(`dlake-drop-${entityId}`);
    drop.style.animationDelay = `${di * 0.35}s`;
    innerG.appendChild(drop);
  }

  // ── 4. Specular Highlight ─────────────────────────────────────────────
  const specId = `dlake-spec-${entityId}`;
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
  specular.setAttribute('cx', String(-rx * 0.2));
  specular.setAttribute('cy', String(topY));
  specular.setAttribute('rx', String(rx * 0.5));
  specular.setAttribute('ry', String(ry * 0.5));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── 5. Micro-Life Animations ──────────────────────────────────────────
  const styleId = `dlake-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes dlakeWaveRipple_${entityId} {
        0%, 100% { transform: translateX(0); opacity: 0.4; }
        50% { transform: translateX(4px); opacity: 0.7; }
      }
      @keyframes dlakeDropPulse_${entityId} {
        0%, 100% { transform: scale(1); opacity: 0.7; }
        50% { transform: scale(1.5); opacity: 1; }
      }
      @keyframes dlakeFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .dlake-wave-${entityId} {
        animation: dlakeWaveRipple_${entityId} 3s ease-in-out infinite;
      }
      .dlake-drop-${entityId} {
        animation: dlakeDropPulse_${entityId} 2s ease-in-out infinite;
      }
      .dlake-float-${entityId} {
        animation: dlakeFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`dlake-float-${entityId}`);

  // ── Label below ───────────────────────────────────────────────────────
  if (entity.label) {
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', String(botY + ry + LABEL_DEFAULTS.offsetBelow));
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
