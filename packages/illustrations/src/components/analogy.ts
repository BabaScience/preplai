/**
 * @preplai/illustrations — Analogy Component (Cinematic Depth)
 *
 * Two-part layout: X | ~ | Y for "X is like Y" analogies.
 * Uses metadata.x + metadata.y, or parses " is like " / " like " from label.
 *
 * Cinematic Depth: directional lighting halo, ground shadow, ambient occlusion,
 * specular highlight, micro-life float animation.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam, wrapBodyText } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES, STROKE, colorWithAlpha, OPACITY } from '../design-tokens.js';
import { ensureDefs } from '../visual-utils.js';
import type { VisualEntity } from '@preplai/shared';

function parseAnalogy(label: string): { x: string; y: string } | null {
  const trimmed = label.trim();
  const likeMatch = trimmed.match(/^(.+?)\s+is\s+like\s+(.+)$/i);
  if (likeMatch) return { x: likeMatch[1].trim(), y: likeMatch[2].trim() };
  const shortMatch = trimmed.match(/^(.+?)\s+like\s+(.+)$/i);
  if (shortMatch) return { x: shortMatch[1].trim(), y: shortMatch[2].trim() };
  return null;
}

/** Wrap text into lines (delegates to canonical wrapBodyText). */
function wrapToLines(text: string, maxCharsPerLine: number): string[] {
  return wrapBodyText(text, maxCharsPerLine, 999).lines;
}

export function renderAnalogy(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Analogy');
  const entityId = (entity.id ?? Math.random().toString(36).slice(2)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 8);

  const meta = entity.metadata ?? {};
  const label = (meta.label as string) ?? entity.label ?? 'Analogy';
  const xPart = (meta.x as string) ?? '';
  const yPart = (meta.y as string) ?? '';

  let x = xPart;
  let y = yPart;
  if (!x || !y) {
    const parsed = parseAnalogy(label);
    if (parsed) {
      x = parsed.x;
      y = parsed.y;
    } else {
      x = label;
      y = '';
    }
  }

  const scale = s / 50;
  const boxW = 70;
  const baseBoxH = 28;
  const valueFontSize = 8;  // design-space font for legibility
  const tildaSize = 10;
  const gap = 6;
  const lineHeight = valueFontSize * 1.3;
  const maxCharsPerLine = 10;

  const scaleGroup = document.createElementNS(SVG_NS, 'g');
  scaleGroup.setAttribute('transform', `scale(${scale})`);

  const defs = ensureDefs(parentEl);

  // Compute layout bounds for lighting/shadow
  const contentW = x && y ? boxW * 2 + tildaSize + gap * 2 : Math.max(120, 220);
  const cw2 = contentW / 2;

  // ── Pillar 1: Directional Lighting ────────────────────────────────
  const haloId = `analogy-halo-${entityId}`;
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
  halo.setAttribute('cx', String(-cw2 * 0.1));
  halo.setAttribute('cy', String(-baseBoxH * 0.1));
  halo.setAttribute('rx', String(cw2 * 1.3));
  halo.setAttribute('ry', String(baseBoxH * 1.8));
  halo.setAttribute('fill', `url(#${haloId})`);
  scaleGroup.appendChild(halo);

  // ── Pillar 2: Ground Shadow ───────────────────────────────────────
  const gsId = `analogy-gshadow-${entityId}`;
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
  const aoId = `analogy-ao-${entityId}`;
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
  const specId = `analogy-spec-${entityId}`;
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

  if (x && y) {
    // Two-part layout: [X] ~ [Y] — wrap long text into multiple lines
    const xLines = wrapToLines(x, maxCharsPerLine);
    const yLines = wrapToLines(y, maxCharsPerLine);
    const boxH = Math.max(baseBoxH, lineHeight * Math.max(xLines.length, yLines.length) + 8);
    const totalContentW = boxW * 2 + tildaSize + gap * 2;
    const leftBoxX = -totalContentW / 2;
    const rightBoxX = totalContentW / 2 - boxW;
    const tildaX = -tildaSize / 2;

    // Ground shadow
    const groundShadow = document.createElementNS(SVG_NS, 'ellipse');
    groundShadow.setAttribute('cx', '0');
    groundShadow.setAttribute('cy', String(boxH / 2 + 5));
    groundShadow.setAttribute('rx', String(totalContentW * 0.4));
    groundShadow.setAttribute('ry', String(boxH * 0.15));
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
    leftBox.setAttribute('stroke-width', String(STROKE.thin));
    scaleGroup.appendChild(leftBox);

    // Left AO overlay
    const leftAo = document.createElementNS(SVG_NS, 'rect');
    leftAo.setAttribute('x', String(leftBoxX));
    leftAo.setAttribute('y', String(-boxH / 2));
    leftAo.setAttribute('width', String(boxW));
    leftAo.setAttribute('height', String(boxH));
    leftAo.setAttribute('rx', String(SHAPES.borderRadius - 2));
    leftAo.setAttribute('fill', `url(#${aoId})`);
    leftAo.setAttribute('pointer-events', 'none');
    scaleGroup.appendChild(leftAo);

    // Left specular
    const leftSpec = document.createElementNS(SVG_NS, 'rect');
    leftSpec.setAttribute('x', String(leftBoxX));
    leftSpec.setAttribute('y', String(-boxH / 2));
    leftSpec.setAttribute('width', String(boxW));
    leftSpec.setAttribute('height', String(boxH));
    leftSpec.setAttribute('rx', String(SHAPES.borderRadius - 2));
    leftSpec.setAttribute('fill', `url(#${specId})`);
    leftSpec.setAttribute('pointer-events', 'none');
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
    rightBox.setAttribute('stroke-width', String(STROKE.thin));
    scaleGroup.appendChild(rightBox);

    // Right AO overlay
    const rightAo = document.createElementNS(SVG_NS, 'rect');
    rightAo.setAttribute('x', String(rightBoxX));
    rightAo.setAttribute('y', String(-boxH / 2));
    rightAo.setAttribute('width', String(boxW));
    rightAo.setAttribute('height', String(boxH));
    rightAo.setAttribute('rx', String(SHAPES.borderRadius - 2));
    rightAo.setAttribute('fill', `url(#${aoId})`);
    rightAo.setAttribute('pointer-events', 'none');
    scaleGroup.appendChild(rightAo);

    // Right specular
    const rightSpec = document.createElementNS(SVG_NS, 'rect');
    rightSpec.setAttribute('x', String(rightBoxX));
    rightSpec.setAttribute('y', String(-boxH / 2));
    rightSpec.setAttribute('width', String(boxW));
    rightSpec.setAttribute('height', String(boxH));
    rightSpec.setAttribute('rx', String(SHAPES.borderRadius - 2));
    rightSpec.setAttribute('fill', `url(#${specId})`);
    rightSpec.setAttribute('pointer-events', 'none');
    scaleGroup.appendChild(rightSpec);

    // ~ symbol (tilda) in center
    const tilda = document.createElementNS(SVG_NS, 'text');
    tilda.setAttribute('x', String(tildaX + tildaSize / 2));
    tilda.setAttribute('y', String(tildaSize * 0.35));
    tilda.setAttribute('text-anchor', 'middle');
    tilda.setAttribute('fill', color);
    tilda.setAttribute('font-size', String(tildaSize));
    tilda.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightBold));
    tilda.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    tilda.textContent = '~';
    scaleGroup.appendChild(tilda);

    // X text (wrapped, centered horizontally and vertically)
    const xCenterX = leftBoxX + boxW / 2;
    const xText = document.createElementNS(SVG_NS, 'text');
    xText.setAttribute('x', String(xCenterX));
    xText.setAttribute('text-anchor', 'middle');
    xText.setAttribute('fill', color);
    xText.setAttribute('font-size', String(valueFontSize));
    xText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    xText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    const xFirstY = -((xLines.length - 1) * lineHeight) / 2 + valueFontSize * 0.35;
    xLines.forEach((line, i) => {
      const tspan = document.createElementNS(SVG_NS, 'tspan');
      tspan.setAttribute('x', String(xCenterX));
      tspan.setAttribute('y', String(xFirstY + i * lineHeight));
      tspan.textContent = line;
      xText.appendChild(tspan);
    });
    scaleGroup.appendChild(xText);

    // Y text (wrapped, centered horizontally and vertically)
    const yCenterX = rightBoxX + boxW / 2;
    const yText = document.createElementNS(SVG_NS, 'text');
    yText.setAttribute('x', String(yCenterX));
    yText.setAttribute('text-anchor', 'middle');
    yText.setAttribute('fill', color);
    yText.setAttribute('font-size', String(valueFontSize));
    yText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    yText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    const yFirstY = -((yLines.length - 1) * lineHeight) / 2 + valueFontSize * 0.35;
    yLines.forEach((line, i) => {
      const tspan = document.createElementNS(SVG_NS, 'tspan');
      tspan.setAttribute('x', String(yCenterX));
      tspan.setAttribute('y', String(yFirstY + i * lineHeight));
      tspan.textContent = line;
      yText.appendChild(tspan);
    });
    scaleGroup.appendChild(yText);
  } else {
    // Fallback: single card with wrapped full label
    const lines = wrapToLines(x, 18);
    const fbLineH = valueFontSize * 1.3;
    const w = Math.max(120, Math.min(220, Math.max(...lines.map((l) => l.length)) * 6.5));
    const h = Math.max(36, fbLineH * lines.length + 16);

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
    card.setAttribute('stroke-width', String(STROKE.thin));
    scaleGroup.appendChild(card);

    // AO overlay
    const cardAo = document.createElementNS(SVG_NS, 'rect');
    cardAo.setAttribute('x', String(-w / 2));
    cardAo.setAttribute('y', String(-h / 2));
    cardAo.setAttribute('width', String(w));
    cardAo.setAttribute('height', String(h));
    cardAo.setAttribute('rx', String(SHAPES.borderRadius));
    cardAo.setAttribute('fill', `url(#${aoId})`);
    cardAo.setAttribute('pointer-events', 'none');
    scaleGroup.appendChild(cardAo);

    // Specular overlay
    const cardSpec = document.createElementNS(SVG_NS, 'rect');
    cardSpec.setAttribute('x', String(-w / 2));
    cardSpec.setAttribute('y', String(-h / 2));
    cardSpec.setAttribute('width', String(w));
    cardSpec.setAttribute('height', String(h));
    cardSpec.setAttribute('rx', String(SHAPES.borderRadius));
    cardSpec.setAttribute('fill', `url(#${specId})`);
    cardSpec.setAttribute('pointer-events', 'none');
    scaleGroup.appendChild(cardSpec);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(valueFontSize));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    const fbFirstY = -((lines.length - 1) * fbLineH) / 2 + valueFontSize * 0.35;
    lines.forEach((line, i) => {
      const tspan = document.createElementNS(SVG_NS, 'tspan');
      tspan.setAttribute('x', '0');
      tspan.setAttribute('y', String(fbFirstY + i * fbLineH));
      tspan.textContent = line;
      text.appendChild(tspan);
    });
    scaleGroup.appendChild(text);
  }

  innerG.appendChild(scaleGroup);

  // ── Pillar 5: Micro-Life (float animation) ────────────────────────
  const styleId = `analogy-style-${entityId}`;
  const svg = parentEl.ownerSVGElement ?? (parentEl as SVGSVGElement);
  if (!svg.querySelector(`#${styleId}`)) {
    const style = document.createElementNS(SVG_NS, 'style');
    style.setAttribute('id', styleId);
    style.textContent = `
      @keyframes analogyFloat_${entityId} {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-2px); }
      }
      .analogy-float-${entityId} {
        animation: analogyFloat_${entityId} 3.8s ease-in-out infinite;
      }
    `;
    svg.insertBefore(style, svg.firstChild);
  }
  innerG.classList.add(`analogy-float-${entityId}`);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
