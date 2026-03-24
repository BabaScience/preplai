/**
 * @preplai/illustrations — Analogy Component
 *
 * Two-part layout: X | ~ | Y for "X is like Y" analogies.
 * Uses metadata.x + metadata.y, or parses " is like " / " like " from label.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam, wrapBodyText } from '../utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES, STROKE, colorWithAlpha, OPACITY } from '../design-tokens.js';
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

  if (x && y) {
    // Two-part layout: [X] ~ [Y] — wrap long text into multiple lines
    const xLines = wrapToLines(x, maxCharsPerLine);
    const yLines = wrapToLines(y, maxCharsPerLine);
    const boxH = Math.max(baseBoxH, lineHeight * Math.max(xLines.length, yLines.length) + 8);
    const contentW = boxW * 2 + tildaSize + gap * 2;
    const leftBoxX = -contentW / 2;
    const rightBoxX = contentW / 2 - boxW;
    const tildaX = -tildaSize / 2;

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
  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
