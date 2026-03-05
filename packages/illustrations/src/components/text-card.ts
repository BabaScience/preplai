/**
 * @preplai/illustrations — Text Card Base Component
 *
 * Shared base for rounded-rect card illustrations with wrapped text.
 * Used by Analogy, Annotation, and other card-like types.
 *
 * Rules (no overflow):
 * 1. Longer text → smaller font so all text stays visible (no truncation).
 * 2. Conservative CHAR_WIDTH_RATIO so we wrap before hitting actual pixel width.
 * 3. clipPath clips any content that might extend outside the card.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

/** Conservative: assume wider chars so we wrap sooner. Prevents horizontal overflow. */
const CHAR_WIDTH_RATIO = 0.65;

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 24;

function wrapText(
  text: string,
  maxCharsPerLine: number,
  maxLines: number,
): { lines: string[]; truncated: boolean } {
  if (!text.trim()) return { lines: [], truncated: false };
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';
  let truncated = false;

  for (const w of words) {
    const next = current ? `${current} ${w}` : w;
    if (next.length <= maxCharsPerLine) {
      current = next;
    } else {
      if (current) {
        lines.push(current);
        if (lines.length >= maxLines) {
          truncated = true;
          break;
        }
      }
      current = w.length <= maxCharsPerLine ? w : w.slice(0, maxCharsPerLine - 3) + '...';
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (truncated && lines.length > 0) {
    const last = lines[lines.length - 1];
    const suffix = '...';
    if (last.length + suffix.length > maxCharsPerLine) {
      lines[lines.length - 1] = last.slice(0, maxCharsPerLine - suffix.length) + suffix;
    } else {
      lines[lines.length - 1] = last + suffix;
    }
  }
  return { lines, truncated };
}

export type TextCardConfig = {
  typeName: string;
  defaultColor: string;
  fallbackText: string;
  defaultWidth?: number;
  defaultMaxLines?: number;
};

/**
 * Creates a render function for text-card illustrations.
 * All card-like types (Analogy, Annotation, etc.) inherit from this.
 */
export function createTextCardRenderer(config: TextCardConfig) {
  const {
    typeName,
    defaultColor,
    fallbackText,
    defaultWidth = 56,
    defaultMaxLines = 3,
  } = config;

  return function renderTextCard(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
    const { outerG, innerG } = buildEntityGroup(entity);

    const s = getSizeParam(entity, 1.5);
    const color = entity.color ?? defaultColor;
    const defs = ensureDefs(parentEl);
    const gradId = `grad-${typeName.toLowerCase()}-${color.replace(/[^a-fA-F0-9]/g, '')}`;
    createLinearGradient(gradId, color, 'vertical', defs);

    const meta = entity.metadata ?? {};
    const label = (meta.label as string) ?? entity.label ?? fallbackText;
    const widthUnits = (meta.width as number) ?? defaultWidth;
    const maxLines = Math.max(1, Math.min(6, ((meta.maxLines as number) ?? defaultMaxLines) | 0));

    const scale = s / 50;
    const w = widthUnits * scale;
    const padX = 10 * scale;
    const padY = 8 * scale;
    const availableWidth = Math.max(30, w - 2 * padX);

    // Find largest font size that fits all text (no truncation). Longer text → smaller font.
    let fontSize = MAX_FONT_SIZE;
    let lines: string[] = [];
    for (; fontSize >= MIN_FONT_SIZE; fontSize--) {
      const maxCharsPerLine = Math.max(10, Math.floor(availableWidth / (fontSize * CHAR_WIDTH_RATIO)));
      const result = wrapText(label, maxCharsPerLine, maxLines);
      lines = result.lines;
      if (!result.truncated) break;
    }

    const lineHeight = fontSize * 1.2;
    const h = 2 * padY + lineHeight * Math.max(1, lines.length);

    const card = document.createElementNS(SVG_NS, 'rect');
    card.setAttribute('x', String(-w / 2));
    card.setAttribute('y', String(-h / 2));
    card.setAttribute('width', String(w));
    card.setAttribute('height', String(h));
    card.setAttribute('rx', String(SHAPES.borderRadius));
    card.setAttribute('fill', `url(#${gradId})`);
    card.setAttribute('stroke', color);
    card.setAttribute('stroke-width', String(1.5 * scale));
    innerG.appendChild(card);

    // Clip content to card bounds — guarantees no overflow
    const clipId = `clip-${typeName.toLowerCase()}-${entity.id}`;
    let clipEl = defs.querySelector(`#${clipId}`) as SVGClipPathElement | null;
    if (!clipEl) {
      clipEl = document.createElementNS(SVG_NS, 'clipPath');
      clipEl.setAttribute('id', clipId);
      defs.appendChild(clipEl);
    }
    clipEl.innerHTML = '';
    const clipRect = document.createElementNS(SVG_NS, 'rect');
    clipRect.setAttribute('x', String(-w / 2));
    clipRect.setAttribute('y', String(-h / 2));
    clipRect.setAttribute('width', String(w));
    clipRect.setAttribute('height', String(h));
    clipRect.setAttribute('rx', String(SHAPES.borderRadius));
    clipEl.appendChild(clipRect);

    const textGroup = document.createElementNS(SVG_NS, 'text');
    textGroup.setAttribute('clip-path', `url(#${clipId})`);
    textGroup.setAttribute('x', '0');
    textGroup.setAttribute('y', String(-h / 2 + padY + lineHeight));
    textGroup.setAttribute('text-anchor', 'middle');
    textGroup.setAttribute('fill', color);
    textGroup.setAttribute('font-size', String(fontSize));
    textGroup.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    textGroup.setAttribute('font-family', TYPOGRAPHY.fontLabel);

    lines.forEach((line, i) => {
      const tspan = document.createElementNS(SVG_NS, 'tspan');
      tspan.setAttribute('x', '0');
      tspan.setAttribute('dy', i === 0 ? '0' : String(lineHeight));
      tspan.textContent = line;
      textGroup.appendChild(tspan);
    });

    innerG.appendChild(textGroup);

    applyEntranceAnimation(innerG, entity);
    parentEl.appendChild(outerG);
    return outerG;
  };
}
