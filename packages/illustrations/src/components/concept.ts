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
 * Label behavior: ≤12 chars → inside shape; longer → below.
 * For longer explanations, use Definition, Callout, or Analogy instead.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createLinearGradient, ensureDefs, ensureGlowFilter } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

const MAX_INTERIOR_LABEL_CHARS = 18;
const DESIGN_W = 160;
const DESIGN_H = 72;
const INNER_INSET = 12;
const MAX_LABEL_BELOW_CHARS = 36;

export function renderConcept(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const color = entity.color ?? getCategoryColor('Concept');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-concept-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createLinearGradient(gradId, color, 'vertical', defs);

  const meta = entity.metadata ?? {};
  const label = (meta.label as string) ?? entity.label ?? '';
  const labelInside = label.length > 0 && label.length <= MAX_INTERIOR_LABEL_CHARS;
  const displayLabel =
    label.length > MAX_LABEL_BELOW_CHARS ? label.slice(0, MAX_LABEL_BELOW_CHARS - 1) + '…' : label;

  const scale = s / 50;
  const scaleGroup = document.createElementNS(SVG_NS, 'g');
  scaleGroup.setAttribute('transform', `scale(${scale})`);

  const w = DESIGN_W;
  const h = DESIGN_H;
  const hw = w / 2;
  const hh = h / 2;

  // Outer rounded rectangle with gradient fill + glow
  const outerRect = document.createElementNS(SVG_NS, 'rect');
  outerRect.setAttribute('x', String(-hw));
  outerRect.setAttribute('y', String(-hh));
  outerRect.setAttribute('width', String(w));
  outerRect.setAttribute('height', String(h));
  outerRect.setAttribute('rx', String(SHAPES.borderRadius));
  outerRect.setAttribute('fill', `url(#${gradId})`);
  outerRect.setAttribute('stroke', color);
  outerRect.setAttribute('stroke-width', String(SHAPES.strokeWidthHeavy));
  outerRect.setAttribute('filter', ensureGlowFilter(parentEl, color, 'pre-concept-glow'));
  scaleGroup.appendChild(outerRect);

  // Inner dotted rectangle (accent, like the dashed ring in the old circle)
  const innerRect = document.createElementNS(SVG_NS, 'rect');
  innerRect.setAttribute('x', String(-hw + INNER_INSET));
  innerRect.setAttribute('y', String(-hh + INNER_INSET));
  innerRect.setAttribute('width', String(w - 2 * INNER_INSET));
  innerRect.setAttribute('height', String(h - 2 * INNER_INSET));
  innerRect.setAttribute('rx', String(Math.max(0, SHAPES.borderRadius - 2)));
  innerRect.setAttribute('fill', 'none');
  innerRect.setAttribute('stroke', `${color}50`);
  innerRect.setAttribute('stroke-width', '1.5');
  innerRect.setAttribute('stroke-dasharray', '4,4');
  scaleGroup.appendChild(innerRect);

  if (displayLabel) {
    const fontSize = Math.min(TYPOGRAPHY.fontSizeTitle, Math.max(10, h * 0.45));
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', labelInside ? '0' : String(hh + 18));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', labelInside ? 'central' : 'auto');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(fontSize));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = displayLabel;
    scaleGroup.appendChild(text);
  }

  innerG.appendChild(scaleGroup);

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
