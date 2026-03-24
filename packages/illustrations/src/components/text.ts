/**
 * @preplai/illustrations — Text (Paragraph) & Span (Inline) Components
 *
 * Two text rendering modes:
 *
 * **Text (Paragraph):** Wide multi-line body text with word wrapping.
 *   - Default maxWidth: 400px, fontSize: ~15px, left-aligned
 *   - Use for: paragraphs, explanations, body copy, descriptions
 *   - Supports `metadata.background: true` for card backing
 *
 * **Span (Inline):** Small single/few-line text for annotations.
 *   - Default maxWidth: 180px, fontSize: ~11px, center-aligned
 *   - Use for: labels next to entities, short notes, annotations, captions
 *   - Compact, designed to sit beside illustrations without overwhelming
 *
 * Both use `textContent` or `label` for content. Color cascade for theming.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, wrapBodyText } from '../utils.js';
import { TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import { resolveColorCascade, applyShapeColors, applyGlowColors } from '../color-cascade.js';
import type { VisualEntity } from '@preplai/shared';

// ── Word wrap utility (delegates to canonical wrapBodyText) ──────

function wrapText(text: string, maxCharsPerLine: number): string[] {
  return wrapBodyText(text, maxCharsPerLine, 999).lines;
}

// ── Shared text renderer ───────────────────────────────────────────

interface TextConfig {
  defaultMaxWidth: number;
  defaultMaxLines: number;
  defaultAlign: string;
  defaultFontSize: number;
  defaultFontWeight: number;
  defaultLineHeight: number;
  defaultBackground: boolean;
  padding: number;
  /** Opacity multiplier for text (Span uses slightly lighter text) */
  textOpacity: number;
}

const PARAGRAPH_CONFIG: TextConfig = {
  defaultMaxWidth: 800,
  defaultMaxLines: 8,
  defaultAlign: 'left',
  defaultFontSize: 22,
  defaultFontWeight: 400,
  defaultLineHeight: 1.5,
  defaultBackground: false,
  padding: 16,
  textOpacity: 1.0,
};

const SPAN_CONFIG: TextConfig = {
  defaultMaxWidth: 250,
  defaultMaxLines: 2,
  defaultAlign: 'center',
  defaultFontSize: 15,
  defaultFontWeight: 400,
  defaultLineHeight: 1.4,
  defaultBackground: false,
  padding: 6,
  textOpacity: 0.85,
};

function createTextRenderer(config: TextConfig) {
  return function renderTextVariant(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
    const { outerG, innerG } = buildEntityGroup(entity);

    const cc = resolveColorCascade(entity);
    const meta = entity.metadata ?? {};

    // Text content: prefer textContent, fall back to label
    const rawText = entity.textContent ?? entity.label ?? '';

    // Configuration from metadata, with config defaults
    // Width and font size use raw pixel values — NOT scaled by entity size
    const maxWidth = (meta.maxWidth as number | undefined) ?? (meta.width as number | undefined) ?? config.defaultMaxWidth;
    const maxLines = (meta.maxLines as number | undefined) ?? config.defaultMaxLines;
    const align = (meta.align as string | undefined) ?? config.defaultAlign;
    const fontSize = (meta.fontSize as number | undefined) ?? config.defaultFontSize;
    const fontWeight = (meta.fontWeight as number | undefined) ?? config.defaultFontWeight;
    const lineHeightMultiplier = (meta.lineHeight as number | undefined) ?? config.defaultLineHeight;
    const showBackground = (meta.background as boolean | undefined) ?? config.defaultBackground;

    // Estimate chars per line based on maxWidth and fontSize
    const avgCharWidth = fontSize * 0.55;
    const charsPerLine = Math.max(10, Math.floor(maxWidth / avgCharWidth));

    // Word wrap
    let lines = wrapText(rawText, charsPerLine);

    // Truncate to maxLines
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      const lastLine = lines[maxLines - 1];
      if (lastLine.length > 3) {
        lines[maxLines - 1] = lastLine.slice(0, -3) + '…';
      }
    }

    const lineHeight = fontSize * lineHeightMultiplier;
    const totalHeight = lines.length * lineHeight;
    const hw = maxWidth / 2;
    const hh = totalHeight / 2;

    // Text anchor based on alignment
    const anchorMap: Record<string, string> = {
      left: 'start',
      center: 'middle',
      right: 'end',
    };
    const textAnchor = anchorMap[align] ?? 'start';
    const textX = align === 'left' ? -hw : align === 'right' ? hw : 0;

    const pad = config.padding;

    // Background card (optional)
    if (showBackground) {
      if (entity.highlight) {
        const glow = document.createElementNS(SVG_NS, 'rect');
        glow.setAttribute('x', String(-hw - pad - 3));
        glow.setAttribute('y', String(-hh - pad - 3));
        glow.setAttribute('width', String(maxWidth + pad * 2 + 6));
        glow.setAttribute('height', String(totalHeight + pad * 2 + 6));
        glow.setAttribute('rx', String(SHAPES.borderRadius + 2));
        applyGlowColors(glow, cc);
        innerG.appendChild(glow);
      }

      const card = document.createElementNS(SVG_NS, 'rect');
      card.setAttribute('x', String(-hw - pad));
      card.setAttribute('y', String(-hh - pad));
      card.setAttribute('width', String(maxWidth + pad * 2));
      card.setAttribute('height', String(totalHeight + pad * 2));
      card.setAttribute('rx', String(SHAPES.borderRadius));
      applyShapeColors(card, cc);
      innerG.appendChild(card);
    } else if (entity.highlight) {
      const glow = document.createElementNS(SVG_NS, 'rect');
      glow.setAttribute('x', String(-hw - 6));
      glow.setAttribute('y', String(-hh - 6));
      glow.setAttribute('width', String(maxWidth + 12));
      glow.setAttribute('height', String(totalHeight + 12));
      glow.setAttribute('rx', String(SHAPES.borderRadius));
      applyGlowColors(glow, cc);
      innerG.appendChild(glow);
    }

    // Render each line
    for (let i = 0; i < lines.length; i++) {
      const textEl = document.createElementNS(SVG_NS, 'text');
      const y = -hh + (i + 0.7) * lineHeight;
      textEl.setAttribute('x', String(textX));
      textEl.setAttribute('y', String(y));
      textEl.setAttribute('text-anchor', textAnchor);
      textEl.setAttribute('fill', cc.textPrimary);
      if (config.textOpacity < 1) {
        textEl.setAttribute('opacity', String(config.textOpacity));
      }
      textEl.setAttribute('font-size', String(fontSize));
      textEl.setAttribute('font-weight', String(fontWeight));
      textEl.setAttribute('font-family', TYPOGRAPHY.fontLabel);
      textEl.textContent = lines[i];
      innerG.appendChild(textEl);
    }

    applyEntranceAnimation(innerG, entity);
    parentEl.appendChild(outerG);
    return outerG;
  };
}

// ── Exports ────────────────────────────────────────────────────────

/** Paragraph — wide body text, multi-line, left-aligned */
export const renderText = createTextRenderer(PARAGRAPH_CONFIG);

/** Span — compact inline text, few lines, center-aligned */
export const renderSpan = createTextRenderer(SPAN_CONFIG);
