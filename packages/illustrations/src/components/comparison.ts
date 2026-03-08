/**
 * @preplai/illustrations — Comparison Component
 *
 * Side-by-side layout: [Left] vs [Right] for A vs B comparisons.
 * Uses metadata.left + metadata.right, or parses " vs " / " | " from label.
 * Falls back to single text card when no two-part structure.
 *
 * @see METADATA_SCHEMAS.md#comparison
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam, wrapBodyText } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  TYPOGRAPHY,
  SHAPES,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
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
  const defs = ensureDefs(parentEl);
  const gradId = `grad-comparison-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

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
  const fontSize = getLabelFontSize('value', scale);
  const lineHeight = fontSize * LABEL_DEFAULTS.lineHeight;
  const maxCharsPerLine = 12;
  const maxLines = 3;
  const gap = 8;
  const vsFontSize = getLabelFontSize('inline', scale);
  // Stroke is inside scaleGroup; do NOT pass scale—the transform scales it once.
  const strokeWidth = getStrokeWidth('default');

  const scaleGroup = document.createElementNS(SVG_NS, 'g');
  scaleGroup.setAttribute('transform', `scale(${scale})`);

  if (left && right) {
    const leftLines = wrapToLines(left, maxCharsPerLine, maxLines);
    const rightLines = wrapToLines(right, maxCharsPerLine, maxLines);
    const boxH = Math.max(baseBoxH, lineHeight * Math.max(leftLines.length, rightLines.length) + 10);
    const vsW = vsFontSize * 1.5;
    const contentW = boxW * 2 + vsW + gap * 2;
    const leftBoxX = -contentW / 2;
    const rightBoxX = contentW / 2 - boxW;
    const vsX = -vsW / 2;

    const leftBox = document.createElementNS(SVG_NS, 'rect');
    leftBox.setAttribute('x', String(leftBoxX));
    leftBox.setAttribute('y', String(-boxH / 2));
    leftBox.setAttribute('width', String(boxW));
    leftBox.setAttribute('height', String(boxH));
    leftBox.setAttribute('rx', String(SHAPES.borderRadius - 2));
    leftBox.setAttribute('fill', `url(#${gradId})`);
    leftBox.setAttribute('stroke', color);
    leftBox.setAttribute('stroke-width', String(strokeWidth));
    scaleGroup.appendChild(leftBox);

    const rightBox = document.createElementNS(SVG_NS, 'rect');
    rightBox.setAttribute('x', String(rightBoxX));
    rightBox.setAttribute('y', String(-boxH / 2));
    rightBox.setAttribute('width', String(boxW));
    rightBox.setAttribute('height', String(boxH));
    rightBox.setAttribute('rx', String(SHAPES.borderRadius - 2));
    rightBox.setAttribute('fill', `url(#${gradId})`);
    rightBox.setAttribute('stroke', color);
    rightBox.setAttribute('stroke-width', String(strokeWidth));
    scaleGroup.appendChild(rightBox);

    const vsText = document.createElementNS(SVG_NS, 'text');
    vsText.setAttribute('x', String(vsX + vsW / 2));
    vsText.setAttribute('y', '4');
    vsText.setAttribute('text-anchor', 'middle');
    vsText.setAttribute('fill', color);
    vsText.setAttribute('font-size', String(vsFontSize));
    vsText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightEmphasis));
    vsText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    vsText.textContent = 'vs';
    scaleGroup.appendChild(vsText);

    const leftText = document.createElementNS(SVG_NS, 'text');
    leftText.setAttribute('x', String(leftBoxX + boxW / 2));
    leftText.setAttribute('y', '0');
    leftText.setAttribute('text-anchor', 'middle');
    leftText.setAttribute('fill', color);
    leftText.setAttribute('font-size', String(fontSize));
    leftText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    leftText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    const leftOffset = leftLines.length > 1 ? -(lineHeight * (leftLines.length - 1)) / 2 : 0;
    leftLines.forEach((line, i) => {
      const tspan = document.createElementNS(SVG_NS, 'tspan');
      tspan.setAttribute('x', String(leftBoxX + boxW / 2));
      tspan.setAttribute('dy', i === 0 ? String(leftOffset) : String(lineHeight));
      tspan.textContent = line;
      leftText.appendChild(tspan);
    });
    scaleGroup.appendChild(leftText);

    const rightText = document.createElementNS(SVG_NS, 'text');
    rightText.setAttribute('x', String(rightBoxX + boxW / 2));
    rightText.setAttribute('y', '0');
    rightText.setAttribute('text-anchor', 'middle');
    rightText.setAttribute('fill', color);
    rightText.setAttribute('font-size', String(fontSize));
    rightText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    rightText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    const rightOffset = rightLines.length > 1 ? -(lineHeight * (rightLines.length - 1)) / 2 : 0;
    rightLines.forEach((line, i) => {
      const tspan = document.createElementNS(SVG_NS, 'tspan');
      tspan.setAttribute('x', String(rightBoxX + boxW / 2));
      tspan.setAttribute('dy', i === 0 ? String(rightOffset) : String(lineHeight));
      tspan.textContent = line;
      rightText.appendChild(tspan);
    });
    scaleGroup.appendChild(rightText);
  } else {
    const lines = wrapToLines(left, 18, 4);
    const w = Math.max(120, Math.min(220, Math.max(...lines.map((l) => l.length), 1) * 7));
    const h = Math.max(40, lineHeight * lines.length + 16);
    const card = document.createElementNS(SVG_NS, 'rect');
    card.setAttribute('x', String(-w / 2));
    card.setAttribute('y', String(-h / 2));
    card.setAttribute('width', String(w));
    card.setAttribute('height', String(h));
    card.setAttribute('rx', String(SHAPES.borderRadius));
    card.setAttribute('fill', `url(#${gradId})`);
    card.setAttribute('stroke', color);
    card.setAttribute('stroke-width', String(strokeWidth));
    scaleGroup.appendChild(card);

    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', '0');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(fontSize));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    text.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    const textOffset = lines.length > 1 ? -(lineHeight * (lines.length - 1)) / 2 : 0;
    lines.forEach((line, i) => {
      const tspan = document.createElementNS(SVG_NS, 'tspan');
      tspan.setAttribute('x', '0');
      tspan.setAttribute('dy', i === 0 ? String(textOffset) : String(lineHeight));
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
