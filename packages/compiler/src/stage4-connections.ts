/**
 * @preplai/compiler — Stage 4: Connection & Hierarchy Resolution
 *
 * For each entity with sourceEntityId / targetEntityId / parentEntityId:
 *  - Resolves via three-tier fuzzy lookup:
 *      Tier 1: exact ID match
 *      Tier 2: exact label match (case-insensitive)
 *      Tier 3: substring label match
 *  - Warns on unresolved references
 *  - Does NOT replace the original field; resolved IDs are stored
 *    in a _resolvedSourceId / _resolvedTargetId metadata field.
 *    (The original strings are kept for debuggability.)
 *
 * Performance: builds a label-to-entity Map once per frame (O(n)),
 * so Tier-2 lookups are O(1). Only Tier-3 is O(n) per miss.
 */

import type { VisualScript, VisualEntity } from '@preplai/shared';
import { resolveEntityRef } from '@preplai/shared';
import type { CompilerWarning } from './types.js';

export interface Stage4Result {
  script: VisualScript;
  warnings: CompilerWarning[];
}

export function stage4ResolveConnections(script: VisualScript): Stage4Result {
  const warnings: CompilerWarning[] = [];

  const frames = script.frames.map(frame => {
    const allEntities = frame.entities;
    const entityIds = new Set(allEntities.map(e => e.id));

    const entities = allEntities.map(entity =>
      resolveEntityConnections(entity, allEntities, entityIds, frame.id, warnings)
    );
    return { ...frame, entities };
  });

  return {
    script: { ...script, frames },
    warnings,
  };
}

// ── Internal helpers ──────────────────────────────────────────────────

function resolveEntityConnections(
  entity: VisualEntity,
  allEntities: VisualEntity[],
  entityIds: Set<string>,
  frameId: string,
  warnings: CompilerWarning[],
): VisualEntity {
  let updated = { ...entity };

  // Resolve sourceEntityId
  if (entity.sourceEntityId) {
    const resolved = resolveEntityRef(entity.sourceEntityId, allEntities);
    if (resolved) {
      // Store resolved ID in metadata for downstream stages / player
      updated = {
        ...updated,
        metadata: {
          ...updated.metadata,
          _resolvedSourceId: resolved.id,
        },
      };
    } else {
      warnings.push({
        code: 'UNRESOLVED_SOURCE_REF',
        message: `Entity "${entity.id}" in frame "${frameId}" references sourceEntityId "${entity.sourceEntityId}" which could not be resolved (no match by ID, label, or substring).`,
        entityId: entity.id,
        frameId,
      });
    }
  }

  // Resolve targetEntityId
  if (entity.targetEntityId) {
    const resolved = resolveEntityRef(entity.targetEntityId, allEntities);
    if (resolved) {
      updated = {
        ...updated,
        metadata: {
          ...updated.metadata,
          _resolvedTargetId: resolved.id,
        },
      };
    } else {
      warnings.push({
        code: 'UNRESOLVED_TARGET_REF',
        message: `Entity "${entity.id}" in frame "${frameId}" references targetEntityId "${entity.targetEntityId}" which could not be resolved.`,
        entityId: entity.id,
        frameId,
      });
    }
  }

  // Validate parentEntityId (must be an ID that exists in the same frame)
  if (entity.parentEntityId) {
    if (!entityIds.has(entity.parentEntityId)) {
      // Try fuzzy lookup for parent too
      const resolved = resolveEntityRef(entity.parentEntityId, allEntities);
      if (resolved) {
        updated = {
          ...updated,
          metadata: {
            ...updated.metadata,
            _resolvedParentId: resolved.id,
          },
        };
      } else {
        warnings.push({
          code: 'UNRESOLVED_PARENT_REF',
          message: `Entity "${entity.id}" in frame "${frameId}" references parentEntityId "${entity.parentEntityId}" which does not exist in this frame.`,
          entityId: entity.id,
          frameId,
        });
      }
    }
  }

  return updated;
}
