/**
 * @preplai/illustrations — Text Card Base Component
 *
 * Shared base for rounded-rect card illustrations with wrapped text.
 * Used by Analogy, Annotation, and other card-like types.
 *
 * Layout is done in design units; a uniform scale transform scales the whole
 * card (rectangle + text) so size changes preserve aspect ratio.
 *
 * Rules (no overflow):
 * 1. Longer text → smaller font so all text stays visible (no truncation).
 * 2. Conservative CHAR_WIDTH_RATIO so we wrap before hitting actual pixel width.
 * 3. clipPath clips any content that might extend outside the card.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam, wrapBodyText } from '../utils.js';
import { ensureDefs } from '../visual-utils.js';
import { TYPOGRAPHY, SHAPES, getStrokeWidth, colorWithAlpha, OPACITY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

/** Conservative: assume wider chars so we wrap sooner. Prevents horizontal overflow. */
const CHAR_WIDTH_RATIO = 0.65;

const MIN_FONT_SIZE = 8;
const MAX_FONT_SIZE = 24;

/** Wrap text into lines with truncation (delegates to canonical wrapBodyText). */
function wrapText(
  text: string,
  maxCharsPerLine: number,
  maxLines: number,
): { lines: string[]; truncated: boolean } {
  return wrapBodyText(text, maxCharsPerLine, maxLines);
}

export type TextCardConfig = {
  typeName: string;
  defaultColor: string;
  fallbackText: string;
  defaultWidth?: number;
  defaultMaxLines?: number;
  /** Minimum font size for readability (default: 8). */
  minFontSize?: number;
  /** Font weight: 'label' for lighter, 'title' for emphasis (default: 'title'). */
  fontWeight?: 'label' | 'title';
  /** Visual variant: 'card' (default), 'pill' (capsule), 'minimal' (soft fill, no stroke). */
  variant?: 'card' | 'pill' | 'minimal';
  /** Compact mode: smaller padding and font (for Label). */
  compact?: boolean;
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
    minFontSize: configMinFont = MIN_FONT_SIZE,
    fontWeight: weightStyle = 'title',
    variant = 'card',
    compact = false,
  } = config;
  const textFontWeight = weightStyle === 'label' ? TYPOGRAPHY.fontWeightLabel : TYPOGRAPHY.fontWeightTitle;

  return function renderTextCard(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
    const { outerG, innerG } = buildEntityGroup(entity);

    const s = getSizeParam(entity);
    const color = entity.color ?? defaultColor;
    const defs = ensureDefs(parentEl);

    const meta = entity.metadata ?? {};
    const label = (meta.label as string) ?? entity.label ?? fallbackText;
    const widthUnits = (meta.width as number) ?? defaultWidth;
    const maxLines = Math.max(1, Math.min(6, ((meta.maxLines as number) ?? defaultMaxLines) | 0));

    // Layout in design units (scale=1). Uniform scale transform applied at the end.
    const padX = compact ? 6 : 10;
    const padY = compact ? 4 : 8;
    const w = widthUnits;
    const availableWidth = Math.max(30, w - 2 * padX);

    // Find largest font size that fits all text (no truncation). Longer text → smaller font.
    const effectiveMinFont = Math.max(MIN_FONT_SIZE, configMinFont);
    const maxFont = compact ? 14 : MAX_FONT_SIZE;
    let fontSize = maxFont;
    let lines: string[] = [];
    for (; fontSize >= effectiveMinFont; fontSize--) {
      const maxCharsPerLine = Math.max(10, Math.floor(availableWidth / (fontSize * CHAR_WIDTH_RATIO)));
      const result = wrapText(label, maxCharsPerLine, maxLines);
      lines = result.lines;
      if (!result.truncated) break;
    }

    const lineHeight = fontSize * 1.2;
    const h = 2 * padY + lineHeight * Math.max(1, lines.length);

    // Scale group: uniform scaling so rectangle and text scale together (no disproportionate widening)
    const scale = s / 50;
    const strokeWidth = getStrokeWidth('minimal', 1);
    const scaleGroup = document.createElementNS(SVG_NS, 'g');
    scaleGroup.setAttribute('transform', `scale(${scale})`);

    const rx = variant === 'pill' ? h / 2 : SHAPES.borderRadius;
    const useMinimal = variant === 'minimal';
    const card = document.createElementNS(SVG_NS, 'rect');
    card.setAttribute('x', String(-w / 2));
    card.setAttribute('y', String(-h / 2));
    card.setAttribute('width', String(w));
    card.setAttribute('height', String(h));
    card.setAttribute('rx', String(rx));
    card.setAttribute('fill', colorWithAlpha(color, OPACITY.fillLight));
    if (!useMinimal) {
      card.setAttribute('stroke', color);
      card.setAttribute('stroke-width', String(strokeWidth));
      card.setAttribute('stroke-linejoin', 'round');
    }
    scaleGroup.appendChild(card);

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
    clipRect.setAttribute('rx', String(rx));
    clipEl.appendChild(clipRect);

    const textGroup = document.createElementNS(SVG_NS, 'text');
    textGroup.setAttribute('clip-path', `url(#${clipId})`);
    textGroup.setAttribute('x', '0');
    textGroup.setAttribute('text-anchor', 'middle');
    textGroup.setAttribute('fill', color);
    textGroup.setAttribute('font-size', String(fontSize));
    textGroup.setAttribute('font-weight', String(textFontWeight));
    textGroup.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    const textY = -(lines.length - 1) * lineHeight / 2;
    textGroup.setAttribute('y', '0');
    lines.forEach((line, i) => {
      const tspan = document.createElementNS(SVG_NS, 'tspan');
      tspan.setAttribute('x', '0');
      tspan.setAttribute('dy', i === 0 ? String(textY) : String(lineHeight));
      tspan.textContent = line;
      textGroup.appendChild(tspan);
    });

    scaleGroup.appendChild(textGroup);
    innerG.appendChild(scaleGroup);

    applyEntranceAnimation(innerG, entity);
    parentEl.appendChild(outerG);
    return outerG;
  };
}
