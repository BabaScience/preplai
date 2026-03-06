/**
 * @preplai/illustrations — Concept Component
 *
 * Concept bubble: gradient circle + radial glow + double-ring accent + centered label.
 * Use for: key ideas, glossary terms, abstract concepts (short phrases).
 *
 * @see METADATA_SCHEMAS.md#concept
 * @see ILLUSTRATIONS_AGENT_GUIDE.md
 *
 * Label behavior: ≤12 chars → inside circle; longer → below circle.
 * For longer explanations, use Definition, Callout, or Analogy instead.
 */

import { SVG_NS, buildEntityGroup, applyEntranceAnimation, getSizeParam } from '../utils.js';
import { createRadialGradient, ensureDefs, ensureGlowFilter } from '../visual-utils.js';
import { getCategoryColor, TYPOGRAPHY, SHAPES } from '../design-tokens.js';
import type { VisualEntity } from '@preplai/shared';

const MAX_INTERIOR_LABEL_CHARS = 12;

export function renderConcept(entity: VisualEntity, parentEl: SVGElement): SVGGElement {
  const { outerG, innerG } = buildEntityGroup(entity);

  const s = getSizeParam(entity);
  const r = s / 2;
  const color = entity.color ?? getCategoryColor('Concept');
  const defs = ensureDefs(parentEl);
  const gradId = `grad-concept-${color.replace(/[^a-fA-F0-9]/g, '')}`;
  createRadialGradient(gradId, color, defs);

  // Outer circle with gradient fill + subtle glow (design: "radial gradient glow")
  const outerCircle = document.createElementNS(SVG_NS, 'circle');
  outerCircle.setAttribute('cx', '0');
  outerCircle.setAttribute('cy', '0');
  outerCircle.setAttribute('r', String(r));
  outerCircle.setAttribute('fill', `url(#${gradId})`);
  outerCircle.setAttribute('stroke', color);
  outerCircle.setAttribute('stroke-width', String(SHAPES.strokeWidthHeavy));
  outerCircle.setAttribute('filter', ensureGlowFilter(parentEl, color, 'pre-concept-glow'));
  innerG.appendChild(outerCircle);

  // Inner dashed ring (accent) — scales with size
  const innerRingR = Math.max(r * 0.7, r - 10);
  const innerRing = document.createElementNS(SVG_NS, 'circle');
  innerRing.setAttribute('cx', '0');
  innerRing.setAttribute('cy', '0');
  innerRing.setAttribute('r', String(innerRingR));
  innerRing.setAttribute('fill', 'none');
  innerRing.setAttribute('stroke', `${color}50`);
  innerRing.setAttribute('stroke-width', '1.5');
  innerRing.setAttribute('stroke-dasharray', '4,4');
  innerG.appendChild(innerRing);

  const labelInside = entity.label && entity.label.length <= MAX_INTERIOR_LABEL_CHARS;

  if (entity.label) {
    const fontSize = Math.min(TYPOGRAPHY.fontSizeTitle, Math.max(10, s / 4));
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '0');
    text.setAttribute('y', labelInside ? '0' : String(r + 18));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', labelInside ? 'central' : 'auto');
    text.setAttribute('fill', color);
    text.setAttribute('font-size', String(fontSize));
    text.setAttribute('font-weight', String(TYPOGRAPHY.fontWeightTitle));
    text.setAttribute('font-family', TYPOGRAPHY.fontBadge);
    text.textContent = entity.label;
    innerG.appendChild(text);
  }

  applyEntranceAnimation(innerG, entity);
  parentEl.appendChild(outerG);
  return outerG;
}
