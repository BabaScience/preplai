/**
 * @preplai/illustrations — Expression Component (Cinematic 5 Pillars)
 *
 * Compact inline math expression box with glassmorphic depth.
 * Directional lighting, ground shadow, AO, specular highlight, micro-life.
 *
 * Metadata: { expression?: string, width?: number }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { formatMathExpression } from './equation.js';
import {
  getLabelFontSize,
  TYPOGRAPHY,
  SHAPES,
  LABEL_DEFAULTS,
  colorWithAlpha,
  OPACITY,
} from '../design-tokens.js';
import { resolveColorCascade } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

const DESIGN_H = 32;
const MAX_CHARS = 20;

export function renderExpression(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const raw = (meta.expression as string) ?? entity.label ?? 'f(x) = x\u00B2';
  const expression = formatMathExpression(raw);
  const displayText = expression.length > MAX_CHARS ? expression.slice(0, MAX_CHARS - 1) + '\u2026' : expression;

  const designW = typeof meta.width === 'number' ? meta.width : Math.max(60, Math.min(110, expression.length * 7));
  const w = designW * scale;
  const h = DESIGN_H * scale;
  const hw = w / 2;
  const hh = h / 2;

  const fontSize = getLabelFontSize('value', scale);
  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ────────────────────────────────────
  const haloId = `expr-halo-${entityId}`;
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
  halo.setAttribute('cx', '0');
  halo.setAttribute('cy', '0');
  halo.setAttribute('rx', String(hw * 1.3));
  halo.setAttribute('ry', String(hh * 1.8));
  halo.setAttribute('fill', `url(#${haloId})`);
  innerG.appendChild(halo);

  // ── Pillar 2: Ground Shadow ───────────────────────────────────────────
  const gsId = `expr-gshadow-${entityId}`;
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
  groundShadow.setAttribute('rx', String(hw * 0.85));
  groundShadow.setAttribute('ry', String(3));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  innerG.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ───────────────────────────────────────
  const aoId = `expr-ao-${entityId}`;
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

  // Main rect
  const rect = document.createElementNS(SVG_NS, 'rect');
  rect.setAttribute('x', String(-hw));
  rect.setAttribute('y', String(-hh));
  rect.setAttribute('width', String(w));
  rect.setAttribute('height', String(h));
  rect.setAttribute('rx', String(SHAPES.borderRadius));
  rect.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
  rect.setAttribute('stroke', cc.stroke);
  rect.setAttribute('stroke-width', '2.5');
  rect.setAttribute('stroke-dasharray', '4,4');
  innerG.appendChild(rect);

  // AO overlay
  const aoRect = document.createElementNS(SVG_NS, 'rect');
  aoRect.setAttribute('x', String(-hw));
  aoRect.setAttribute('y', String(-hh));
  aoRect.setAttribute('width', String(w));
  aoRect.setAttribute('height', String(h));
  aoRect.setAttribute('rx', String(SHAPES.borderRadius));
  aoRect.setAttribute('fill', `url(#${aoId})`);
  aoRect.setAttribute('pointer-events', 'none');
  innerG.appendChild(aoRect);

  // ── Pillar 4: Specular Highlight ──────────────────────────────────────
  const specId = `expr-spec-${entityId}`;
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
  specular.setAttribute('height', String(h));
  specular.setAttribute('rx', String(SHAPES.borderRadius));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  innerG.appendChild(specular);

  // Expression text
  const text = document.createElementNS(SVG_NS, 'text');
  text.setAttribute('x', '0');
  text.setAttribute('y', '0');
  text.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
  text.setAttribute('dominant-baseline', 'central');
  text.setAttribute('fill', cc.textPrimary);
  text.setAttribute('font-size', String(fontSize));
  text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
  text.setAttribute('font-family', TYPOGRAPHY.fontCode);
  text.textContent = displayText;
  innerG.appendChild(text);

  // ── Pillar 5: Micro-Life ──────────────────────────────────────────────
  const styleId = `expr-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes exprFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-1.5px); }
      }
      @keyframes exprPulse_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }
      .expr-float-${entityId} {
        animation: exprFloat_${entityId} 3.2s ease-in-out infinite;
      }
      .expr-pulse-${entityId} {
        animation: exprPulse_${entityId} 2.6s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`expr-float-${entityId}`);
  rect.classList.add(`expr-pulse-${entityId}`);

  // Sub-label below
  if (meta.expression && entity.label) {
    const subText = document.createElementNS(SVG_NS, 'text');
    subText.setAttribute('x', '0');
    subText.setAttribute('y', String(hh + LABEL_DEFAULTS.offsetBelow));
    subText.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    subText.setAttribute('fill', cc.textPrimary);
    subText.setAttribute('font-size', String(getLabelFontSize('label', scale)));
    subText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    subText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    subText.textContent = entity.label;
    innerG.appendChild(subText);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
