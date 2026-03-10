/**
 * @preplai/compiler — Stage 2b: Deterministic Frame Enrichment
 *
 * Adds supporting entities to sparse frames:
 *  1. Auto-adds H2 heading when frame has narration but no heading entity
 *  2. Auto-adds Label with key insight when non-connector entity count < 4
 *
 * All added entities use `_auto-` prefix for ID to distinguish from agent entities.
 * Enrichment is deterministic: same input always produces same output.
 */

import type { VisualScript, VisualEntity } from '@preplai/shared';
import { ENTITY_DEFAULTS } from '@preplai/shared';
import type { CompilerWarning } from './types.js';

export interface Stage2bResult {
  script: VisualScript;
  warnings: CompilerWarning[];
}

// ── Constants ────────────────────────────────────────────────────────

const HEADING_TYPES: ReadonlySet<string> = new Set(['H1', 'H2', 'H3']);

const CONNECTION_TYPES: ReadonlySet<string> = new Set([
  'Arrow', 'DataFlow', 'BidirectArrow', 'DottedArrow', 'Transition', 'Bus',
]);

/** Minimum non-connector entities for a frame to be considered "dense enough" */
const SPARSE_ENTITY_THRESHOLD = 4;

/** Max words for auto-generated heading */
const HEADING_MAX_WORDS = 5;

/** Max chars for auto-generated label insight */
const LABEL_MAX_CHARS = 80;

/** Min narration length to extract a meaningful insight */
const LABEL_MIN_NARRATION_CHARS = 20;

// ── Main ─────────────────────────────────────────────────────────────

export function stage2bEnrich(script: VisualScript): Stage2bResult {
  const warnings: CompilerWarning[] = [];

  const frames = script.frames.map(frame => {
    const enrichedEntities = [...frame.entities];
    let enriched = false;

    const hasNarration = typeof frame.narrationSegment === 'string'
      && frame.narrationSegment.trim().length > 0;

    // ── Rule 1: Auto-add H2 heading ──────────────────────────────
    const hasHeading = frame.entities.some(e => HEADING_TYPES.has(e.type));

    if (!hasHeading && hasNarration) {
      const headingLabel = extractHeadingFromNarration(frame.narrationSegment);
      enrichedEntities.unshift(makeEntity(
        `_auto-h2-${frame.id}`,
        'H2',
        { x: 50, y: 6 },
        headingLabel,
      ));
      enriched = true;
    }

    // ── Rule 2: Auto-add Label with key insight ──────────────────
    const nonConnectorCount = enrichedEntities.filter(
      e => !CONNECTION_TYPES.has(e.type),
    ).length;

    if (nonConnectorCount < SPARSE_ENTITY_THRESHOLD && hasNarration) {
      const insightText = extractInsightFromNarration(frame.narrationSegment);
      if (insightText) {
        enrichedEntities.push(makeEntity(
          `_auto-label-${frame.id}`,
          'Label',
          { x: 50, y: 88 },
          insightText,
        ));
        enriched = true;
      }
    }

    if (enriched) {
      warnings.push({
        code: 'FRAME_ENRICHED',
        message: `Frame "${frame.id}" was enriched with auto-generated entities to improve visual density.`,
        frameId: frame.id,
      });
    }

    return enriched ? { ...frame, entities: enrichedEntities } : frame;
  });

  return {
    script: { ...script, frames },
    warnings,
  };
}

// ── Internal helpers (pure, deterministic) ───────────────────────────

function makeEntity(
  id: string,
  type: string,
  position: { x: number; y: number },
  label: string,
): VisualEntity {
  return {
    id,
    type: type as VisualEntity['type'],
    position,
    label,
    size: ENTITY_DEFAULTS.size,
    highlight: false,
    animation: {
      delay: ENTITY_DEFAULTS.animation.delay,
      duration: ENTITY_DEFAULTS.animation.duration,
      easing: ENTITY_DEFAULTS.animation.easing,
      entrance: ENTITY_DEFAULTS.animation.entrance,
    },
  };
}

/**
 * Extract a short heading from narration text.
 * Takes first N words, strips trailing punctuation, capitalizes.
 */
function extractHeadingFromNarration(narration: string): string {
  const trimmed = narration.trim();
  const words = trimmed.split(/\s+/);
  const headingWords = words.slice(0, HEADING_MAX_WORDS);
  let heading = headingWords.join(' ');

  // Remove trailing punctuation
  heading = heading.replace(/[.,;:!?]+$/, '');

  // Capitalize first character
  if (heading.length > 0) {
    heading = heading.charAt(0).toUpperCase() + heading.slice(1);
  }

  // Ellipsis if truncated
  if (words.length > HEADING_MAX_WORDS) {
    heading += '...';
  }

  return heading;
}

/**
 * Extract a key insight sentence from narration for the Label entity.
 * Uses first sentence (up to first period/exclamation/question mark).
 * Returns null if narration is too short.
 */
function extractInsightFromNarration(narration: string): string | null {
  const trimmed = narration.trim();

  if (trimmed.length < LABEL_MIN_NARRATION_CHARS) return null;

  // Extract first sentence
  const sentenceMatch = trimmed.match(/^[^.!?]+[.!?]/);
  let insight = sentenceMatch ? sentenceMatch[0].trim() : trimmed;

  // Truncate if too long
  if (insight.length > LABEL_MAX_CHARS) {
    insight = insight.slice(0, LABEL_MAX_CHARS - 3).replace(/\s+\S*$/, '') + '...';
  }

  return insight;
}
