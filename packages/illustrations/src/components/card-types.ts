/**
 * @preplai/illustrations — Card-like types (inherit from text-card)
 *
 * Quote uses a dedicated component (quote.ts).
 * Comparison has a dedicated left vs right layout (see comparison.ts).
 * Analogy and Annotation have custom implementations (two-part layout, sticky-note).
 *
 * Rules (text-card.ts): text stays inside; no overflow; clipPath enforces bounds.
 */

export { renderComparison } from './comparison.js';
