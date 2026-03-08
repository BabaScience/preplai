/**
 * @preplai/illustrations — Card-like types (inherit from text-card)
 *
 * Proof, Quote share the same shape and rules.
 * Comparison has a dedicated left vs right layout (see comparison.ts).
 * Analogy and Annotation have custom implementations (two-part layout, sticky-note).
 *
 * Rules (text-card.ts): text stays inside; no overflow; clipPath enforces bounds.
 */

import { createTextCardRenderer } from './text-card.js';
import { getCategoryColor } from '../design-tokens.js';

export { renderComparison } from './comparison.js';

export const renderProof = createTextCardRenderer({
  typeName: 'Proof',
  defaultColor: getCategoryColor('Proof'),
  fallbackText: 'Proof',
  defaultWidth: 200,
  defaultMaxLines: 6,
  minFontSize: 10,
});

export const renderQuote = createTextCardRenderer({
  typeName: 'Quote',
  defaultColor: getCategoryColor('Quote'),
  fallbackText: 'Quote',
  defaultWidth: 200,
  defaultMaxLines: 6,
  minFontSize: 10,
});
