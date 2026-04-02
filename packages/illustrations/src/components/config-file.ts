/**
 * @preplai/illustrations — ConfigFile Component (Cinematic Depth)
 *
 * Document rect + config lines + braces. Directional lighting,
 * ground shadow, ambient occlusion, specular highlight, micro-life.
 * Use for: configuration files, .env, settings.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS, colorWithAlpha } from '../design-tokens.js';
import { resolveColorCascade, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';import type { VisualEntity } from '@preplai/shared';

export function renderConfigFile(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);
  const size = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const w = size * 0.75;
  const h = size * 0.9;
  const hw = w / 2;
  const hh = h / 2;
  const rx = 5;

  const defs = ensureDefs(parentEl);

  // ── 1. Directional Lighting ─────────────────────────────────────────
  const haloId = `cfg-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-hw * 0.15));
  halo.setAttribute('cy', String(-hh * 0.1));
  halo.setAttribute('rx', String(hw * 1.8));
  halo.setAttribute('ry', String(hh * 1.4));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── 2. Ground Shadow ────────────────────────────────────────────────
  const gsId = `cfg-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(hh + hh * 0.15));
  groundShadow.setAttribute('rx', String(hw * 1.1));
  groundShadow.setAttribute('ry', String(hh * 0.2));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── 3. Ambient Occlusion ────────────────────────────────────────────
  const aoId = `cfg-ao-${entityId}`;
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
    glow.setAttribute('width', String(w + 6));
    glow.setAttribute('height', String(h + 6));
    glow.setAttribute('rx', String(rx + 2));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    innerG.appendChild(glow);
  }

  // ── Body fill gradient ──────────────────────────────────────────────
  const bodyFillId = `cfg-bfill-${entityId}`;
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

  // ── Body stroke gradient ────────────────────────────────────────────
  const bodyStrokeId = `cfg-bstroke-${entityId}`;
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

  // ── Document body (tall rect — page shape) ─────────────────────────
  const card = document.createElementNS(SVG_NS, 'rect');
  card.setAttribute('x', String(-hw));
  card.setAttribute('y', String(-hh));
  card.setAttribute('width', String(w));
  card.setAttribute('height', String(h));
  card.setAttribute('rx', String(rx));
  card.setAttribute('fill', `url(#${bodyFillId})`);
  card.setAttribute('stroke', `url(#${bodyStrokeId})`);
  card.setAttribute('stroke-width', String(STROKE.default));
  innerG.appendChild(card);

  // ── Ambient occlusion overlay ───────────────────────────────────────
  const aoRect = document.createElementNS(SVG_NS, 'rect');
  aoRect.setAttribute('x', String(-hw));
  aoRect.setAttribute('y', String(-hh));
  aoRect.setAttribute('width', String(w));
  aoRect.setAttribute('height', String(h));
  aoRect.setAttribute('rx', String(rx));
  aoRect.setAttribute('fill', `url(#${aoId})`);
  aoRect.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoRect);

  // ── Config lines (3 horizontal lines) ───────────────────────────────
  const lineW = w * 0.6;
  for (let i = 0; i < 3; i++) {
    const ly = -hh * 0.3 + i * (h * 0.18);
    const configLine = document.createElementNS(SVG_NS, 'line');
    configLine.setAttribute('x1', String(-lineW / 2));
    configLine.setAttribute('y1', String(ly));
    configLine.setAttribute('x2', String(lineW / 2 - i * w * 0.08));
    configLine.setAttribute('y2', String(ly));
    configLine.setAttribute('stroke', colorWithAlpha(color, '66'));
    configLine.setAttribute('stroke-width', '1.2');
    configLine.setAttribute('stroke-linecap', 'round');
    configLine.classList.add(`cfg-line-${entityId}`);
    configLine.style.animationDelay = `${i * 0.25}s`;
    innerG.appendChild(configLine);
  }

  // ── Braces { } at top ──────────────────────────────────────────────
  const braceSize = size * 0.16;
  const braceY = -hh * 0.7;

  const lBrace = document.createElementNS(SVG_NS, 'text');
  lBrace.setAttribute('x', String(-hw * 0.45));
  lBrace.setAttribute('y', String(braceY));
  lBrace.setAttribute('text-anchor', 'middle');
  lBrace.setAttribute('dominant-baseline', 'central');
  lBrace.setAttribute('fill', color);
  lBrace.setAttribute('font-size', String(braceSize));
  lBrace.setAttribute('font-weight', '300');
  lBrace.setAttribute('font-family', TYPOGRAPHY.fontCode);
  lBrace.textContent = '{';
  lBrace.classList.add(`cfg-brace-${entityId}`);
  innerG.appendChild(lBrace);

  const rBrace = document.createElementNS(SVG_NS, 'text');
  rBrace.setAttribute('x', String(hw * 0.45));
  rBrace.setAttribute('y', String(braceY));
  rBrace.setAttribute('text-anchor', 'middle');
  rBrace.setAttribute('dominant-baseline', 'central');
  rBrace.setAttribute('fill', color);
  rBrace.setAttribute('font-size', String(braceSize));
  rBrace.setAttribute('font-weight', '300');
  rBrace.setAttribute('font-family', TYPOGRAPHY.fontCode);
  rBrace.textContent = '}';
  rBrace.classList.add(`cfg-brace-${entityId}`);
  innerG.appendChild(rBrace);

  // ── 4. Specular Highlight ───────────────────────────────────────────
  const specId = `cfg-spec-${entityId}`;
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
  specular.setAttribute('cx', String(-hw * 0.2));
  specular.setAttribute('cy', String(-hh * 0.4));
  specular.setAttribute('rx', String(hw * 0.6));
  specular.setAttribute('ry', String(hh * 0.35));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // ── 5. Micro-Life — line shimmer translateX, brace breathe, float ───
  const styleId = `cfg-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as unknown as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes cfgLineShimmer_${entityId} {
        0%, 100% { transform: translateX(0); opacity: 0.6; }
        50% { transform: translateX(3px); opacity: 1; }
      }
      @keyframes cfgBraceBreathe_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
      }
      @keyframes cfgFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2.5px); }
      }
      .cfg-line-${entityId} {
        animation: cfgLineShimmer_${entityId} 2.6s ease-in-out infinite;
      }
      .cfg-brace-${entityId} {
        animation: cfgBraceBreathe_${entityId} 3s ease-in-out infinite;
      }
      .cfg-float-${entityId} {
        animation: cfgFloat_${entityId} 3.5s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`cfg-float-${entityId}`);

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
