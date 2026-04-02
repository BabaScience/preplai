/**
 * @preplai/illustrations — Equation Component (Cinematic 5 Pillars)
 *
 * Clean rect with centered equation text. Glassmorphic depth with
 * directional lighting, ground shadow, ambient occlusion, specular highlight,
 * and micro-life breathing animation.
 *
 * Metadata: { expression?: string, width?: number }
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
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

const DESIGN_H = 44;
const MAX_CHARS = 28;

/** Superscript/subscript formatting. Shared with Expression. */
export function formatMathExpression(raw: string): string {
  return raw
    .replace(/\^2/g, '\u00B2')
    .replace(/\^3/g, '\u00B3')
    .replace(/\^1/g, '\u00B9')
    .replace(/\^n/g, '\u207F')
    .replace(/\^([0-9])/g, (_, d) => '\u2070\u00B9\u00B2\u00B3\u2074\u2075\u2076\u2077\u2078\u2079'[+d])
    .replace(/_0/g, '\u2080')
    .replace(/_1/g, '\u2081')
    .replace(/_2/g, '\u2082')
    .replace(/_3/g, '\u2083')
    .replace(/_([0-9])/g, (_, d) => '\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089'[+d]);
}

export function renderEquation(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const raw = (meta.expression as string) ?? entity.label ?? 'E = mc\u00B2';
  const expression = formatMathExpression(raw);
  const displayText = expression.length > MAX_CHARS ? expression.slice(0, MAX_CHARS - 1) + '\u2026' : expression;

  const designW = typeof meta.width === 'number' ? meta.width : Math.max(80, Math.min(140, expression.length * 8));
  const w = designW;
  const h = DESIGN_H;
  const hw = w / 2;
  const hh = h / 2;

  const scaleGroup = document.createElementNS(SVG_NS, 'g');
  scaleGroup.setAttribute('transform', `scale(${scale})`);

  const fontSize = getLabelFontSize('metric', 1) / scale;
  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ────────────────────────────────────
  const haloId = `eq-halo-${entityId}`;
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
  scaleGroup.appendChild(halo);

  // ── Pillar 2: Ground Shadow ───────────────────────────────────────────
  const gsId = `eq-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(hh + 6));
  groundShadow.setAttribute('rx', String(hw * 0.9));
  groundShadow.setAttribute('ry', String(4));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  scaleGroup.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ───────────────────────────────────────
  const aoId = `eq-ao-${entityId}`;
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
  scaleGroup.appendChild(rect);

  // AO overlay
  const aoRect = document.createElementNS(SVG_NS, 'rect');
  aoRect.setAttribute('x', String(-hw));
  aoRect.setAttribute('y', String(-hh));
  aoRect.setAttribute('width', String(w));
  aoRect.setAttribute('height', String(h));
  aoRect.setAttribute('rx', String(SHAPES.borderRadius));
  aoRect.setAttribute('fill', `url(#${aoId})`);
  aoRect.setAttribute('pointer-events', 'none');
  scaleGroup.appendChild(aoRect);

  // ── Pillar 4: Specular Highlight ──────────────────────────────────────
  const specId = `eq-spec-${entityId}`;
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
  scaleGroup.appendChild(specular);

  // Equation text
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
  scaleGroup.appendChild(text);

  innerG.appendChild(scaleGroup);

  // ── Pillar 5: Micro-Life ──────────────────────────────────────────────
  const styleId = `eq-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes eqFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      @keyframes eqBreathe_${entityId} {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.03); }
      }
      .eq-float-${entityId} {
        animation: eqFloat_${entityId} 3.5s ease-in-out infinite;
      }
      .eq-breathe-${entityId} {
        animation: eqBreathe_${entityId} 2.8s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`eq-float-${entityId}`);
  rect.classList.add(`eq-breathe-${entityId}`);

  // Optional label below
  if (meta.expression && entity.label) {
    const subText = document.createElementNS(SVG_NS, 'text');
    subText.setAttribute('x', '0');
    subText.setAttribute('y', String(hh * scale + LABEL_DEFAULTS.offsetBelow));
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
