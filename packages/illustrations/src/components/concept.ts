/**
 * @preplai/illustrations — Concept Component
 *
 * Clean pill-shaped rounded rectangle with gradient fill and centered label.
 * Use for: key ideas, glossary terms, abstract concepts (short phrases).
 *
 * Minimalist style matching the Composable engine aesthetic:
 * - Single clean shape with subtle gradient
 * - Thin stroke
 * - Interior label (short text) or exterior below (long text)
 * - Optional highlight glow
 *
 * @see METADATA_SCHEMAS.md#concept
 * @see ILLUSTRATIONS_AGENT_GUIDE.md
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { TYPOGRAPHY, STROKE, LABEL_DEFAULTS } from '../design-tokens.js';
import { resolveColorCascade, applyShapeColors, applyGlowColors } from '../color-cascade.js';
import type { VisualEntity } from '@preplai/shared';

const CHAR_WIDTH_RATIO = 0.55;
const DESIGN_W_DEFAULT = 80;
const DESIGN_H = 44;
const MAX_LINES_DEFAULT = 4;
const CONCEPT_FONT = 8;  // design-space font size for legibility

/** Wrap text into lines. No truncation — long words break across lines. */
function wrapToLines(text: string, maxCharsPerLine: number, maxLines: number): string[] {
  if (!text.trim()) return [];
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const w of words) {
    const next = current ? `${current} ${w}` : w;
    if (next.length <= maxCharsPerLine) {
      current = next;
    } else {
      if (current) {
        lines.push(current);
        if (lines.length >= maxLines) return lines;
        current = '';
      }
      if (w.length <= maxCharsPerLine) {
        current = w;
      } else {
        const chunks = w.match(new RegExp(`.{1,${maxCharsPerLine}}`, 'g')) ?? [w];
        for (let i = 0; i < chunks.length; i++) {
          if (i < chunks.length - 1) {
            lines.push(chunks[i]);
            if (lines.length >= maxLines) return lines;
          } else {
            current = chunks[i];
          }
        }
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

export function renderConcept(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const cc = resolveColorCascade(entity);

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

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
