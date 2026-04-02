/**
 * @preplai/illustrations — Comparison Component (Cinematic Depth)
 *
 * Side-by-side layout: [Left] vs [Right] for A vs B comparisons.
 * Uses metadata.left + metadata.right, or parses " vs " / " | " from label.
 * Falls back to single text card when no two-part structure.
 *
 * Cinematic Depth: directional lighting halo, ground shadow, ambient occlusion,
 * specular highlight, micro-life float animation.
 *
 * @see METADATA_SCHEMAS.md#comparison
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam, wrapBodyText } from '../utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  TYPOGRAPHY,
  SHAPES,
  colorWithAlpha,
  OPACITY,
} from '../design-tokens.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

function parseComparison(label: string): { left: string; right: string } | null {
  const trimmed = label.trim();
  const vsMatch = trimmed.match(/^(.+?)\s+vs\.?\s+(.+)$/i);
  if (vsMatch) return { left: vsMatch[1].trim(), right: vsMatch[2].trim() };
  const pipeMatch = trimmed.match(/^(.+?)\s+\|\s+(.+)$/);
  if (pipeMatch) return { left: pipeMatch[1].trim(), right: pipeMatch[2].trim() };
  return null;
}

/** Word-wrap into lines. No newline handling (use wrapBodyText for that). */
function wrapToLines(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  if (!text.trim()) return [];
  const { lines } = wrapBodyText(text, maxCharsPerLine, maxLines);
  return lines;
}

export function renderComparison(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Comparison');
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const label = (meta.label as string) ?? entity.label ?? 'Comparison';
  const leftPart = (meta.left as string) ?? (meta.a as string) ?? '';
  const rightPart = (meta.right as string) ?? (meta.b as string) ?? '';

  let left = leftPart;
  let right = rightPart;
  if (!left || !right) {
    const parsed = parseComparison(label);
    if (parsed) {
      left = parsed.left;
      right = parsed.right;
    } else {
      left = label;
      right = '';
    }
  }

  const boxW = 72;
  const baseBoxH = 30;
  const fontSize = 8;  // design-space font for legibility
  const lineHeight = fontSize * 1.3;
  const maxCharsPerLine = 12;
  const maxLines = 3;
  const gap = 8;
  const vsFontSize = 7;
  const strokeWidth = getStrokeWidth('default');

  const scaleGroup = document.createElementNS(SVG_NS, 'g');
  scaleGroup.setAttribute('transform', `scale(${scale})`);

  const defs = ensureDefs(parentEl);

  // ── Pillar 1: Directional Lighting ────────────────────────────────
  const haloId = `comp-halo-${entityId}`;
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

  // ── Pillar 2: Ground Shadow ───────────────────────────────────────
  const gsId = `comp-gshadow-${entityId}`;
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

  // ── Pillar 3: Ambient Occlusion ───────────────────────────────────
  const aoId = `comp-ao-${entityId}`;
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

  // ── Pillar 4: Specular Highlight ──────────────────────────────────
  const specId = `comp-spec-${entityId}`;
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

  if (left && right) {
    const leftLines = wrapToLines(left, maxCharsPerLine, maxLines);
    const rightLines = wrapToLines(right, maxCharsPerLine, maxLines);
    const boxH = Math.max(baseBoxH, lineHeight * Math.max(leftLines.length, rightLines.length) + 10);
    const vsW = vsFontSize * 1.5;
    const contentW = boxW * 2 + vsW + gap * 2;
    const leftBoxX = -contentW / 2;
    const rightBoxX = contentW / 2 - boxW;
    const vsX = -vsW / 2;

    // Directional halo
    const halo = document.createElementNS(SVG_NS, 'ellipse');
    halo.setAttribute('cx', String(-contentW * 0.05));
    halo.setAttribute('cy', String(-boxH * 0.1));
    halo.setAttribute('rx', String(contentW * 0.6));
    halo.setAttribute('ry', String(boxH * 1.2));
    halo.setAttribute('fill', `url(#${haloId})`);
    scaleGroup.appendChild(halo);

    // Ground shadow
    const groundShadow = document.createElementNS(SVG_NS, 'ellipse');
    groundShadow.setAttribute('cx', '0');
    groundShadow.setAttribute('cy', String(boxH / 2 + 5));
    groundShadow.setAttribute('rx', String(contentW * 0.4));
    groundShadow.setAttribute('ry', String(boxH * 0.12));
    groundShadow.setAttribute('fill', `url(#${gsId})`);
    scaleGroup.appendChild(groundShadow);

    // Left box
    const leftBox = document.createElementNS(SVG_NS, 'rect');
    leftBox.setAttribute('x', String(leftBoxX));
    leftBox.setAttribute('y', String(-boxH / 2));
    leftBox.setAttribute('width', String(boxW));
    leftBox.setAttribute('height', String(boxH));
    leftBox.setAttribute('rx', String(SHAPES.borderRadius - 2));
    leftBox.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
    leftBox.setAttribute('stroke', color);
    leftBox.setAttribute('stroke-width', String(strokeWidth));
    scaleGroup.appendChild(leftBox);

    // Left AO + specular
    const leftAo = document.createElementNS(SVG_NS, 'rect');
    leftAo.setAttribute('x', String(leftBoxX)); leftAo.setAttribute('y', String(-boxH / 2));
    leftAo.setAttribute('width', String(boxW)); leftAo.setAttribute('height', String(boxH));
    leftAo.setAttribute('rx', String(SHAPES.borderRadius - 2));
    leftAo.setAttribute('fill', `url(#${aoId})`); leftAo.setAttribute('pointer-events', 'none');
    scaleGroup.appendChild(leftAo);

    const leftSpec = document.createElementNS(SVG_NS, 'rect');
    leftSpec.setAttribute('x', String(leftBoxX)); leftSpec.setAttribute('y', String(-boxH / 2));
    leftSpec.setAttribute('width', String(boxW)); leftSpec.setAttribute('height', String(boxH));
    leftSpec.setAttribute('rx', String(SHAPES.borderRadius - 2));
    leftSpec.setAttribute('fill', `url(#${specId})`); leftSpec.setAttribute('pointer-events', 'none');
    scaleGroup.appendChild(leftSpec);

    // Right box
    const rightBox = document.createElementNS(SVG_NS, 'rect');
    rightBox.setAttribute('x', String(rightBoxX));
    rightBox.setAttribute('y', String(-boxH / 2));
    rightBox.setAttribute('width', String(boxW));
    rightBox.setAttribute('height', String(boxH));
    rightBox.setAttribute('rx', String(SHAPES.borderRadius - 2));
    rightBox.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
    rightBox.setAttribute('stroke', color);
    rightBox.setAttribute('stroke-width', String(strokeWidth));
    scaleGroup.appendChild(rightBox);

    // Right AO + specular
    const rightAo = document.createElementNS(SVG_NS, 'rect');
    rightAo.setAttribute('x', String(rightBoxX)); rightAo.setAttribute('y', String(-boxH / 2));
    rightAo.setAttribute('width', String(boxW)); rightAo.setAttribute('height', String(boxH));
    rightAo.setAttribute('rx', String(SHAPES.borderRadius - 2));
    rightAo.setAttribute('fill', `url(#${aoId})`); rightAo.setAttribute('pointer-events', 'none');
    scaleGroup.appendChild(rightAo);

    const rightSpec = document.createElementNS(SVG_NS, 'rect');
    rightSpec.setAttribute('x', String(rightBoxX)); rightSpec.setAttribute('y', String(-boxH / 2));
    rightSpec.setAttribute('width', String(boxW)); rightSpec.setAttribute('height', String(boxH));
    rightSpec.setAttribute('rx', String(SHAPES.borderRadius - 2));
    rightSpec.setAttribute('fill', `url(#${specId})`); rightSpec.setAttribute('pointer-events', 'none');
    scaleGroup.appendChild(rightSpec);

    // "vs" text
    const vsText = document.createElementNS(SVG_NS, 'text');
    vsText.setAttribute('x', String(vsX + vsW / 2));
    vsText.setAttribute('y', String(vsFontSize * 0.35));
    vsText.setAttribute('text-anchor', 'middle');
    vsText.setAttribute('fill', color);
    vsText.setAttribute('font-size', String(vsFontSize));
    vsText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    vsText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    vsText.textContent = 'vs';
    scaleGroup.appendChild(vsText);

    // Left text
    const leftCenterX = leftBoxX + boxW / 2;
    const leftText = document.createElementNS(SVG_NS, 'text');
    leftText.setAttribute('x', String(leftCenterX));
    leftText.setAttribute('text-anchor', 'middle');
    leftText.setAttribute('fill', color);
    leftText.setAttribute('font-size', String(fontSize));
    leftText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    leftText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    const leftFirstY = -((leftLines.length - 1) * lineHeight) / 2 + fontSize * 0.35;
    leftLines.forEach((line, i) => {
      const tspan = document.createElementNS(SVG_NS, 'tspan');
      tspan.setAttribute('x', String(leftCenterX));
      tspan.setAttribute('y', String(leftFirstY + i * lineHeight));
      tspan.textContent = line;
      leftText.appendChild(tspan);
    });
    scaleGroup.appendChild(leftText);

    // Right text
    const rightCenterX = rightBoxX + boxW / 2;
    const rightText = document.createElementNS(SVG_NS, 'text');
    rightText.setAttribute('x', String(rightCenterX));
    rightText.setAttribute('text-anchor', 'middle');
    rightText.setAttribute('fill', color);
    rightText.setAttribute('font-size', String(fontSize));
    rightText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    rightText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    const rightFirstY = -((rightLines.length - 1) * lineHeight) / 2 + fontSize * 0.35;
    rightLines.forEach((line, i) => {
      const tspan = document.createElementNS(SVG_NS, 'tspan');
      tspan.setAttribute('x', String(rightCenterX));
      tspan.setAttribute('y', String(rightFirstY + i * lineHeight));
      tspan.textContent = line;
      rightText.appendChild(tspan);
    });
    scaleGroup.appendChild(rightText);
  } else {
    const lines = wrapToLines(left, 18, 4);
    const w = Math.max(120, Math.min(220, Math.max(...lines.map((l) => l.length), 1) * 7));
    const h = Math.max(40, lineHeight * lines.length + 16);

    // Directional halo
    const halo = document.createElementNS(SVG_NS, 'ellipse');
    halo.setAttribute('cx', String(-w * 0.05));
    halo.setAttribute('cy', String(-h * 0.05));
    halo.setAttribute('rx', String(w * 0.7));
    halo.setAttribute('ry', String(h * 0.8));
    halo.setAttribute('fill', `url(#${haloId})`);
    scaleGroup.appendChild(halo);

    // Ground shadow
    const groundShadow = document.createElementNS(SVG_NS, 'ellipse');
    groundShadow.setAttribute('cx', '0');
    groundShadow.setAttribute('cy', String(h / 2 + 4));
    groundShadow.setAttribute('rx', String(w * 0.35));
    groundShadow.setAttribute('ry', String(h * 0.1));
    groundShadow.setAttribute('fill', `url(#${gsId})`);
    scaleGroup.appendChild(groundShadow);

    const card = document.createElementNS(SVG_NS, 'rect');
    card.setAttribute('x', String(-w / 2));
    card.setAttribute('y', String(-h / 2));
    card.setAttribute('width', String(w));
    card.setAttribute('height', String(h));
    card.setAttribute('rx', String(SHAPES.borderRadius));
    card.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
    card.setAttribute('stroke', color);
    card.setAttribute('stroke-width', String(strokeWidth));
    scaleGroup.appendChild(card);

    // AO + specular
    const cardAo = document.createElementNS(SVG_NS, 'rect');
    cardAo.setAttribute('x', String(-w / 2)); cardAo.setAttribute('y', String(-h / 2));
    cardAo.setAttribute('width', String(w)); cardAo.setAttribute('height', String(h));
    cardAo.setAttribute('rx', String(SHAPES.borderRadius));
    cardAo.setAttribute('fill', `url(#${aoId})`); cardAo.setAttribute('pointer-events', 'none');
    scaleGroup.appendChild(cardAo);

    const cardSpec = document.createElementNS(SVG_NS, 'rect');
    cardSpec.setAttribute('x', String(-w / 2)); cardSpec.setAttribute('y', String(-h / 2));
    cardSpec.setAttribute('width', String(w)); cardSpec.setAttribute('height', String(h));
    cardSpec.setAttribute('rx', String(SHAPES.borderRadius));
    cardSpec.setAttribute('fill', `url(#${specId})`); cardSpec.setAttribute('pointer-events', 'none');
    scaleGroup.appendChild(cardSpec);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(fontSize));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    const fbFirstY = -((lines.length - 1) * lineHeight) / 2 + fontSize * 0.35;
    lines.forEach((line, i) => {
      const tspan = document.createElementNS(SVG_NS, 'tspan');
      tspan.setAttribute('x', '0');
      tspan.setAttribute('y', String(fbFirstY + i * lineHeight));
      tspan.textContent = line;
      text.appendChild(tspan);
    });
    scaleGroup.appendChild(text);
  }

  innerG.appendChild(scaleGroup);

  // ── Pillar 5: Micro-Life (float animation) ────────────────────────
  const styleId = `comp-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes compFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-1.8px); }
      }
      .comp-float-${entityId} {
        animation: compFloat_${entityId} 3.6s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`comp-float-${entityId}`);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
