/**
 * @preplai/illustrations — Concept Component (Cinematic Depth)
 *
 * Clean pill-shaped rounded rectangle with gradient fill and centered label.
 * Use for: key ideas, glossary terms, abstract concepts (short phrases).
 *
 * Cinematic Depth: directional lighting halo, ground shadow, ambient occlusion,
 * specular highlight, micro-life float animation.
 *
 * @see METADATA_SCHEMAS.md#concept
 * @see ILLUSTRATIONS_AGENT_GUIDE.md
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam, wrapBodyText } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';
import { resolveColorCascade, applyShapeColors, applyGlowColors } from '../color-cascade.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

const CHAR_WIDTH_RATIO = 0.55;
const DESIGN_W_DEFAULT = 80;
const DESIGN_H = 44;
const MAX_LINES_DEFAULT = 4;
const CONCEPT_FONT = 8;  // design-space font size for legibility

/** Wrap text into lines (delegates to canonical wrapBodyText). */
function wrapToLines(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  return wrapBodyText(text, maxCharsPerLine, maxLines).lines;
}

export function renderConcept(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);
  const color = cc.base;
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const label = (meta.label as string) ?? entity.label ?? '';
  const designW = (typeof meta.width === 'number' ? meta.width : DESIGN_W_DEFAULT);
  const maxLines = (typeof meta.maxLines === 'number' ? meta.maxLines : MAX_LINES_DEFAULT);

  const scale = s / 50;
  const scaleGroup = document.createElementNS(SVG_NS, 'g');
  scaleGroup.setAttribute('transform', `scale(${scale})`);

  const w = designW;

  // Compute text lines first so we can size the shape to fit
  const fontSize = CONCEPT_FONT;
  const availableWidth = Math.max(40, w - 16);
  const maxCharsPerLine = Math.max(8, Math.floor(availableWidth / (fontSize * CHAR_WIDTH_RATIO)));
  const lines = wrapToLines(label, maxCharsPerLine, maxLines);
  const lineHeight = fontSize * LABEL_DEFAULTS.lineHeight;

  // Height adapts to content: base height for 1 line, grows for multi-line
  const textBlockH = lines.length > 0 ? lines.length * lineHeight + 8 : 0;
  const h = Math.max(DESIGN_H, textBlockH + 16);
  const hw = w / 2;
  const hh = h / 2;

  const pillRx = Math.min(12, h / 3);

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ────────────────────────────────
  const haloId = `concept-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-hw * 0.15));
  halo.setAttribute('cy', String(-hh * 0.1));
  halo.setAttribute('rx', String(hw * 1.6));
  halo.setAttribute('ry', String(hh * 1.4));
  halo.setAttribute('fill', `url(#${haloId})`);
  scaleGroup.appendChild(halo);

  // ── Pillar 2: Ground Shadow ───────────────────────────────────────
  const gsId = `concept-gshadow-${entityId}`;
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
  groundShadow.setAttribute('cy', String(hh + 4));
  groundShadow.setAttribute('rx', String(hw * 0.85));
  groundShadow.setAttribute('ry', String(hh * 0.25));
  groundShadow.setAttribute('fill', `url(#${gsId})`);
  scaleGroup.appendChild(groundShadow);

  // ── Pillar 3: Ambient Occlusion ───────────────────────────────────
  const aoId = `concept-ao-${entityId}`;
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

  // Highlight glow (behind shape)
  if (entity.highlight) {
    const glow = document.createElementNS(SVG_NS, 'rect');
    glow.setAttribute('x', String(-hw - 3));
    glow.setAttribute('y', String(-hh - 3));
    glow.setAttribute('width', String(w + 6));
    glow.setAttribute('height', String(h + 6));
    glow.setAttribute('rx', String(pillRx + 2));
    glow.setAttribute('stroke-width', String(STROKE.default));
    glow.setAttribute('stroke-dasharray', '4,4');
    applyGlowColors(glow, cc);
    scaleGroup.appendChild(glow);
  }

  // Clean rounded rectangle with gradient fill
  const outerRect = document.createElementNS(SVG_NS, 'rect');
  outerRect.setAttribute('x', String(-hw));
  outerRect.setAttribute('y', String(-hh));
  outerRect.setAttribute('width', String(w));
  outerRect.setAttribute('height', String(h));
  outerRect.setAttribute('rx', String(pillRx));
  outerRect.setAttribute('stroke-width', String(STROKE.default));
  outerRect.setAttribute('data-morph-target', 'true');
  applyShapeColors(outerRect, cc);
  scaleGroup.appendChild(outerRect);

  // Ambient occlusion overlay on shape
  const aoRect = document.createElementNS(SVG_NS, 'rect');
  aoRect.setAttribute('x', String(-hw));
  aoRect.setAttribute('y', String(-hh));
  aoRect.setAttribute('width', String(w));
  aoRect.setAttribute('height', String(h));
  aoRect.setAttribute('rx', String(pillRx));
  aoRect.setAttribute('fill', `url(#${aoId})`);
  aoRect.setAttribute('pointer-events', 'none');
  scaleGroup.appendChild(aoRect);

  // ── Pillar 4: Specular Highlight ──────────────────────────────────
  const specId = `concept-spec-${entityId}`;
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
  specular.setAttribute('rx', String(pillRx));
  specular.setAttribute('fill', `url(#${specId})`);
  specular.setAttribute('pointer-events', 'none');
  scaleGroup.appendChild(specular);

  if (lines.length > 0) {
    const textGroup = document.createElementNS(SVG_NS, 'text');
    textGroup.setAttribute('x', '0');
    textGroup.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    textGroup.setAttribute('fill', cc.textPrimary);
    textGroup.setAttribute('font-size', String(fontSize));
    textGroup.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    textGroup.setAttribute('font-family', TYPOGRAPHY.fontLabel);

    // Absolute y per tspan — reliable across all browsers
    const firstLineY = -((lines.length - 1) * lineHeight) / 2 + fontSize * 0.35;
    lines.forEach((line, i) => {
      const tspan = document.createElementNS(SVG_NS, 'tspan');
      tspan.setAttribute('x', '0');
      tspan.setAttribute('y', String(firstLineY + i * lineHeight));
      tspan.textContent = line;
      textGroup.appendChild(tspan);
    });
    scaleGroup.appendChild(textGroup);
  }

  innerG.appendChild(scaleGroup);

  // ── Pillar 5: Micro-Life (float animation) ────────────────────────
  const styleId = `concept-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes conceptFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      .concept-float-${entityId} {
        animation: conceptFloat_${entityId} 3.8s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`concept-float-${entityId}`);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
