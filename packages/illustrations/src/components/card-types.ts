/**
 * @preplai/illustrations — Card-like types (inherit from text-card)
 *
 * Analogy, Annotation, Label, etc. share the same shape and rules.
 * Difference: only defaultColor and fallbackText (semantic, not visual).
 *
 * Rules (text-card.ts): text stays inside; no overflow; clipPath enforces bounds.
 */

import { createTextCardRenderer } from './text-card.js';
import { getCategoryColor } from '../design-tokens.js';

export const renderAnalogy = createTextCardRenderer({
  typeName: 'Analogy',
  defaultColor: getCategoryColor('Analogy'),
  fallbackText: 'Analogy',
  defaultWidth: 56,
  defaultMaxLines: 3,
});

export const renderAnnotation = createTextCardRenderer({
  typeName: 'Annotation',
  defaultColor: getCategoryColor('Annotation'),
  fallbackText: 'Annotation',
  defaultWidth: 56,
  defaultMaxLines: 3,
});

export const renderLabel = createTextCardRenderer({
  typeName: 'Label',
  defaultColor: getCategoryColor('Label'),
  fallbackText: 'Label',
  defaultWidth: 56,
  defaultMaxLines: 3,
});

export const renderComparison = createTextCardRenderer({
  typeName: 'Comparison',
  defaultColor: getCategoryColor('Comparison'),
  fallbackText: 'Comparison',
  defaultWidth: 56,
  defaultMaxLines: 3,
});

export const renderProof = createTextCardRenderer({
  typeName: 'Proof',
  defaultColor: getCategoryColor('Proof'),
  fallbackText: 'Proof',
  defaultWidth: 56,
  defaultMaxLines: 3,
});

export const renderQuote = createTextCardRenderer({
  typeName: 'Quote',
  defaultColor: getCategoryColor('Quote'),
  fallbackText: 'Quote',
  defaultWidth: 56,
  defaultMaxLines: 3,
});
