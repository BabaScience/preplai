/**
 * @preplai/mcp-server — Preventive Quality Guards
 *
 * Lightweight O(n) checks that catch the worst design anti-patterns
 * before quality scoring. Returns warnings (not errors) that propagate
 * to the add_scene response alongside quality hints.
 *
 * Mapped to the Four Pillars of Good Design:
 *   NO_HIGHLIGHT       → Pillar I  (Perceptual Clarity: no focal point)
 *   OVERCROWDED_FRAME  → Pillar II (Compositional Structure: density overwhelms grid)
 *   UNBALANCED_LAYOUT  → Pillar II (Compositional Structure: off-center mass)
 *   NO_CONNECTIONS      → Pillar III (Communication: no verbs, only nouns)
 */

import type { VisualScript, VisualEntity } from '@preplai/shared';
import { CONNECTION_TYPES, HEADING_TYPES } from '@preplai/shared';

// ── Types ────────────────────────────────────────────────────────────────

export interface QualityWarning {
  code: string;
  message: string;
  frameIndex?: number;
}

// ── Constants ────────────────────────────────────────────────────────────

/** Content entities above this threshold trigger overcrowded warning */
const OVERCROWDED_THRESHOLD = 10;

// ── Helpers ──────────────────────────────────────────────────────────────

function getContentEntities(entities: VisualEntity[]): VisualEntity[] {
  return entities.filter(
    (e) => !CONNECTION_TYPES.has(e.type) && !HEADING_TYPES.has(e.type) && e.type !== 'Label',
  );
}

function getEntityX(entity: VisualEntity): number {
  const pos = entity.position;
  if (Array.isArray(pos)) return (pos as number[])[0] ?? 50;
  return pos?.x ?? 50;
}

// ── Main ─────────────────────────────────────────────────────────────────

export function runQualityGuards(script: VisualScript): QualityWarning[] {
  const warnings: QualityWarning[] = [];
  const frames = script.frames ?? [];

  if (frames.length === 0) return warnings;

  // ── Guard 1: No highlight in any frame (Pillar I) ──
  const anyHighlight = frames.some((f) =>
    f.entities.some((e) => (e as any).highlight === true),
  );
  if (!anyHighlight) {
    warnings.push({
      code: 'NO_HIGHLIGHT',
      message:
        'No frame uses highlight:true. Add highlight to one entity per frame ' +
        'for cinematic depth-of-field focus — the engine dims non-highlighted entities automatically.',
    });
  }

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];
    const content = getContentEntities(frame.entities);

    // ── Guard 2: Overcrowded frame (Pillar II) ──
    if (content.length > OVERCROWDED_THRESHOLD) {
      warnings.push({
        code: 'OVERCROWDED_FRAME',
        message:
          `Frame ${i} has ${content.length} content entities. ` +
          `Split into multiple frames with persistent anchor entities for clarity (aim for 5–7).`,
        frameIndex: i,
      });
    }

    // ── Guard 3: All entities on one side (Pillar II) ──
    if (content.length >= 3) {
      const xPositions = content.map(getEntityX);
      const allLeft = xPositions.every((x) => x < 45);
      const allRight = xPositions.every((x) => x > 55);
      if (allLeft || allRight) {
        warnings.push({
          code: 'UNBALANCED_LAYOUT',
          message:
            `Frame ${i}: all entities are on the ${allLeft ? 'left' : 'right'} side. ` +
            `Spread across x: 20–80 for visual balance. The center of mass should be near [50, 50].`,
          frameIndex: i,
        });
      }
    }

    // ── Guard 4: Multi-entity frame with zero connections (Pillar III) ──
    const connections = frame.entities.filter((e) => CONNECTION_TYPES.has(e.type));
    if (content.length > 1 && connections.length === 0) {
      warnings.push({
        code: 'NO_CONNECTIONS',
        message:
          `Frame ${i} has ${content.length} entities but no Arrow/DataFlow connections. ` +
          `Connect entities to show relationships — connections are the verbs of visual communication.`,
        frameIndex: i,
      });
    }
  }

  return warnings;
}
