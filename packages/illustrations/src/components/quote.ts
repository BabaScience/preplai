/**
 * @preplai/illustrations — Quote Component
 *
 * Blockquote-style illustration with left accent bar, optional decorative quote mark,
 * and optional attribution (author/source).
 *
 * Metadata:
 *   label?: string — quote text (or use entity.label)
 *   author?: string — attribution (e.g. "— Albert Einstein")
 *   source?: string — alternative to author (e.g. "— RFC 2616")
 *   width?: number — card width in design units (default 200)
 *   maxLines?: number — max lines for quote text (default 6)
 */

import {
  SVG_NS,
  buildEntityGroup,
  applyEntranceAnimation,
  getSizeParam,
  wrapBodyText,
  CHAR_WIDTH_RATIO,
} from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import {
  getCategoryColor,
  getStrokeWidth,
  getLabelFontSize,
  colorWithAlpha,
  OPACITY,
  TYPOGRAPHY,
  SHAPES,
  LABEL_DEFAULTS,
} from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

export function renderQuote(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const scale = s / 50;
  const color = entity.color ?? getCategoryColor('Quote');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-quote-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const quoteText = (meta.label as string) ?? entity.label ?? 'Quote';
  const author = meta.author as string | undefined;
  const source = meta.source as string | undefined;
  const attribution = author ?? source;
  const widthUnits = (meta.width as number) ?? 200;
  const maxLines = Math.max(1, Math.min(8, ((meta.maxLines as number) ?? 6) | 0));

  const padX = 14;
  const padY = 10;
  const accentWidth = 4;
  const quoteMarkSize = 28;
  const w = widthUnits;
  const availableWidth = Math.max(60, w - 2 * padX - accentWidth - 8);

  const quoteFontSize = Math.min(14, getLabelFontSize('value', scale));
  const maxCharsPerLine = Math.max(10, Math.floor(availableWidth / (quoteFontSize * CHAR_WIDTH_RATIO)));
  const { lines } = wrapBodyText(quoteText, maxCharsPerLine, maxLines);
  const lineHeight = quoteFontSize * LABEL_DEFAULTS.lineHeight;

  const quoteHeight = lines.length * lineHeight;
  const attributionHeight = attribution ? quoteFontSize * 1.1 + 6 : 0;
  const h = 2 * padY + quoteHeight + attributionHeight;

  const sizeScale = 0.7;
  const scaleTransform = (s / 50) * sizeScale;
  const scaleGroup = document.createElementNS(SVG_NS, 'g');
  scaleGroup.setAttribute('transform', `scale(${scaleTransform})`);

  const clipId = `clip-quote-${entity.id.replace(/[^a-zA-Z0-9-]/g, '')}`;
  let clipEl = defs.querySelector(`#${clipId}`) as SVGClipPathElement | null;
  if (!clipEl) {
    clipEl = document.createElementNS(SVG_NS, 'clipPath');
    clipEl.setAttribute('id', clipId);
    defs.appendChild(clipEl);
  }
  clipEl.innerHTML = '';
  const clipRect = document.createElementNS(SVG_NS, 'rect');
  clipRect.setAttribute('x', String((-w / 2) * scaleTransform));
  clipRect.setAttribute('y', String((-h / 2) * scaleTransform));
  clipRect.setAttribute('width', String(w * scaleTransform));
  clipRect.setAttribute('height', String(h * scaleTransform));
  clipRect.setAttribute('rx', String(SHAPES.borderRadius * scaleTransform));
  clipEl.appendChild(clipRect);

  innerG.setAttribute('clip-path', `url(#${clipId})`);

  const card = document.createElementNS(SVG_NS, 'rect');
  card.setAttribute('x', String(-w / 2));
  card.setAttribute('y', String(-h / 2));
  card.setAttribute('width', String(w));
  card.setAttribute('height', String(h));
  card.setAttribute('rx', String(SHAPES.borderRadius));
  card.setAttribute('fill', `url(#${gradId})`);
  card.setAttribute('stroke', color);
  card.setAttribute('stroke-width', String(getStrokeWidth('minimal', scale)));
  card.setAttribute('stroke-linejoin', 'round');
  scaleGroup.appendChild(card);

  const accentBar = document.createElementNS(SVG_NS, 'rect');
  accentBar.setAttribute('x', String(-w / 2));
  accentBar.setAttribute('y', String(-h / 2));
  accentBar.setAttribute('width', String(accentWidth));
  accentBar.setAttribute('height', String(h));
  accentBar.setAttribute('rx', '2');
  accentBar.setAttribute('fill', color);
  accentBar.setAttribute('opacity', String(OPACITY.strokeSoft));
  scaleGroup.appendChild(accentBar);

  const quoteMark = document.createElementNS(SVG_NS, 'text');
  quoteMark.setAttribute('x', String(-w / 2 + accentWidth + 6));
  quoteMark.setAttribute('y', String(-h / 2 + padY + quoteMarkSize * 0.75));
  quoteMark.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
  quoteMark.setAttribute('font-size', String(quoteMarkSize));
  quoteMark.setAttribute('font-family', 'Georgia, serif');
  quoteMark.setAttribute('font-weight', '700');
  quoteMark.textContent = '"';
  scaleGroup.appendChild(quoteMark);

  const textStartX = -w / 2 + accentWidth + 12;
  const textStartY = -h / 2 + padY + 4;

  const quoteGroup = document.createElementNS(SVG_NS, 'text');
  quoteGroup.setAttribute('text-anchor', 'start');
  quoteGroup.setAttribute('fill', color);
  quoteGroup.setAttribute('font-size', String(quoteFontSize));
  quoteGroup.setAttribute('font-family', TYPOGRAPHY.fontLabel);
  quoteGroup.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
  quoteGroup.setAttribute('font-style', 'italic');

  lines.forEach((line, i) => {
    const tspan = document.createElementNS(SVG_NS, 'tspan');
    tspan.setAttribute('x', String(textStartX));
    tspan.setAttribute('y', String(textStartY + i * lineHeight));
    tspan.textContent = line;
    quoteGroup.appendChild(tspan);
  });
  scaleGroup.appendChild(quoteGroup);

  if (attribution) {
    const attrText = document.createElementNS(SVG_NS, 'text');
    attrText.setAttribute('x', String(textStartX));
    attrText.setAttribute('y', String(textStartY + quoteHeight + 10));
    attrText.setAttribute('text-anchor', 'start');
    attrText.setAttribute('fill', colorWithAlpha(color, OPACITY.strokeSoft));
    attrText.setAttribute('font-size', String(quoteFontSize * 0.9));
    attrText.setAttribute('font-family', TYPOGRAPHY.fontLabel);
    attrText.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    attrText.setAttribute('font-style', 'normal');
    attrText.textContent = attribution.length > 35 ? attribution.slice(0, 33) + '…' : attribution;
    scaleGroup.appendChild(attrText);
  }

  innerG.appendChild(scaleGroup);
  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
