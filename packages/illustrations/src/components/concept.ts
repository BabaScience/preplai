/**
 * @preplai/illustrations — Concept Component
 *
 * Concept shape: rounded rectangle with gradient fill + inner dotted rectangle + centered label.
 * Like Annotation but with a dashed inner border accent.
 * Use for: key ideas, glossary terms, abstract concepts (short phrases).
 *
 * Layout in design units; uniform scale transform so size changes scale the whole illustration.
 *
 * @see METADATA_SCHEMAS.md#concept
 * @see ILLUSTRATIONS_AGENT_GUIDE.md
 *
 * Label behavior: short labels inside; longer labels wrap and stay inside. No truncation.
 * For longer explanations, use Definition, Callout, or Analogy instead.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, STROKE, LABEL_DEFAULTS, OPACITY } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

const CHAR_WIDTH_RATIO = 0.65;
const DESIGN_W_DEFAULT = 80;
const DESIGN_H = 44;
const INNER_INSET = 8;
const MAX_LINES_DEFAULT = 4;

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
  const color = entity.color ?? getCategoryColor('Concept');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-concept-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const label = (meta.label as string) ?? entity.label ?? '';
  const designW = (typeof meta.width === 'number' ? meta.width : DESIGN_W_DEFAULT);
  const maxLines = (typeof meta.maxLines === 'number' ? meta.maxLines : MAX_LINES_DEFAULT);

  const scale = s / 50;
  const scaleGroup = document.createElementNS(SVG_NS, 'g');
  scaleGroup.setAttribute('transform', `scale(${scale})`);

  const w = designW;
  const h = DESIGN_H;
  const hw = w / 2;
  const hh = h / 2;

  /** Fixed 15px rendered: compensate for scaleGroup so text stays 15px like Service */
  const fontSize = TYPOGRAPHY.fontSizeDefault / scale;
  const availableWidth = Math.max(40, w - 2 * INNER_INSET - 8);
  const maxCharsPerLine = Math.max(8, Math.floor(availableWidth / (fontSize * CHAR_WIDTH_RATIO)));
  const lines = wrapToLines(label, maxCharsPerLine, maxLines);
  const lineHeight = fontSize * LABEL_DEFAULTS.lineHeight;

  // Outer rounded rectangle with gradient fill (pill-like corners)
  const pillRx = Math.min(12, h / 3);
  const outerRect = document.createElementNS(SVG_NS, 'rect');
  outerRect.setAttribute('x', String(-hw));
  outerRect.setAttribute('y', String(-hh));
  outerRect.setAttribute('width', String(w));
  outerRect.setAttribute('height', String(h));
  outerRect.setAttribute('rx', String(pillRx));
  outerRect.setAttribute('fill', `url(#${gradId})`);
  outerRect.setAttribute('stroke', color);
  outerRect.setAttribute('stroke-width', String(STROKE.default));
  scaleGroup.appendChild(outerRect);

  // Solid inner border (replaces dashed — reads as "defined concept" not "optional")
  const innerInset = 4;
  const innerBorder = document.createElementNS(SVG_NS, 'rect');
  innerBorder.setAttribute('x', String(-hw + innerInset));
  innerBorder.setAttribute('y', String(-hh + innerInset));
  innerBorder.setAttribute('width', String(w - 2 * innerInset));
  innerBorder.setAttribute('height', String(h - 2 * innerInset));
  innerBorder.setAttribute('rx', String(Math.max(0, pillRx - 2)));
  innerBorder.setAttribute('fill', 'none');
  innerBorder.setAttribute('stroke', `${color}${OPACITY.fillLight}`);
  innerBorder.setAttribute('stroke-width', String(STROKE.emphasized));
  scaleGroup.appendChild(innerBorder);

  // Small 4-pointed star accent (top-right — subtle "idea" indicator)
  const starPath = document.createElementNS(SVG_NS, 'path');
  starPath.setAttribute('d', 'M 0,-5 L 1.5,0 L 0,5 L -1.5,0 Z');
  starPath.setAttribute('transform', `translate(${hw - 8}, ${-hh + 8})`);
  starPath.setAttribute('fill', color);
  starPath.setAttribute('opacity', '0.5');
  scaleGroup.appendChild(starPath);

  if (lines.length > 0) {
    const textGroup = document.createElementNS(SVG_NS, 'text');
    textGroup.setAttribute('x', '0');
    textGroup.setAttribute('y', '0');
    textGroup.setAttribute('text-anchor', LABEL_DEFAULTS.textAnchor);
    textGroup.setAttribute('dominant-baseline', 'central');
    textGroup.setAttribute('fill', color);
    textGroup.setAttribute('font-size', String(fontSize));
    textGroup.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightLabel));
    textGroup.setAttribute('font-family', TYPOGRAPHY.fontLabel);

    const textOffset = lines.length > 1 ? -(lineHeight * (lines.length - 1)) / 2 : 0;
    lines.forEach((line, i) => {
      const tspan = document.createElementNS(SVG_NS, 'tspan');
      tspan.setAttribute('x', '0');
      tspan.setAttribute('dy', i === 0 ? String(textOffset) : String(lineHeight));
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
