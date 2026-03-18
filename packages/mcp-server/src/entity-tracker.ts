/**
 * @preplai/mcp-server — Entity Type Usage Tracker
 *
 * Tracks which illustration types agents use in presentations.
 * Runs as fire-and-forget after each add_scene call.
 *
 * Three categories:
 * - known_type: existing illustrations (popularity ranking)
 * - unknown_type: requested but don't exist (demand signal for new illustrations)
 * - generic_fallback: Concept/Entity/Group used as substitute (hidden demand)
 */

import type { VisualScript } from '@preplai/shared';
import { KNOWN_ENTITY_TYPES } from '@preplai/compiler';
import { IllustrationDemand } from '@preplai/db';

/** Types that indicate the agent couldn't find a better illustration */
const GENERIC_TYPES = new Set(['Concept', 'Entity', 'Group']);

/** Connection types — skip tracking (not illustrations) */
const CONNECTION_TYPES = new Set(['Arrow', 'DataFlow', 'BidirectArrow', 'DottedArrow', 'Transition', 'Bus']);

/** Heading types — skip tracking (structural, not demand-driven) */
const HEADING_TYPES = new Set(['H1', 'H2', 'H3', 'Label']);

/** Max sample labels to store per type */
const MAX_SAMPLE_LABELS = 5;

/**
 * Track entity types used in a visual script.
 * Uses bulkWrite for efficiency (single DB round-trip).
 */
export async function trackEntityTypes(script: VisualScript, apiKeyId: string): Promise<void> {
  const frames = script.frames ?? [];
  if (frames.length === 0) return;

  // Collect unique types with their labels
  const typeMap = new Map<string, { source: string; labels: Set<string> }>();

  for (const frame of frames) {
    for (const entity of frame.entities) {
      const type = entity.type;
      if (!type || CONNECTION_TYPES.has(type) || HEADING_TYPES.has(type)) continue;

      const label = (entity as any).label || '';

      if (!KNOWN_ENTITY_TYPES.has(type)) {
        // Unknown type — demand signal
        const entry = typeMap.get(type) ?? { source: 'unknown_type', labels: new Set<string>() };
        entry.source = 'unknown_type';
        if (label) entry.labels.add(label);
        typeMap.set(type, entry);
      } else if (GENERIC_TYPES.has(type) && label) {
        // Generic fallback — track the label as hidden demand
        const key = `${type}:${label}`;
        const entry = typeMap.get(key) ?? { source: 'generic_fallback', labels: new Set<string>() };
        entry.source = 'generic_fallback';
        entry.labels.add(label);
        typeMap.set(key, entry);
      } else {
        // Known type — popularity tracking
        const entry = typeMap.get(type) ?? { source: 'known_type', labels: new Set<string>() };
        entry.source = 'known_type';
        if (label) entry.labels.add(label);
        typeMap.set(type, entry);
      }
    }
  }

  if (typeMap.size === 0) return;

  // Build bulk operations
  const now = new Date();
  const ops = [...typeMap.entries()].map(([typeName, { source, labels }]) => ({
    updateOne: {
      filter: { typeName },
      update: {
        $inc: { requestCount: 1 },
        $set: { lastSeen: now, source },
        $setOnInsert: { firstSeen: now },
        $addToSet: {
          uniqueUsers: apiKeyId,
          ...(labels.size > 0
            ? { sampleLabels: { $each: [...labels].slice(0, MAX_SAMPLE_LABELS) } }
            : {}),
        },
      },
      upsert: true,
    },
  }));

  try {
    await IllustrationDemand.bulkWrite(ops, { ordered: false });
  } catch (err) {
    // Silent failure — tracking should never break add_scene
    console.error('[entity-tracker] bulkWrite failed:', err);
  }
}
