/**
 * @preplai/compiler — Stage 2: Entity Validation & Defaults Application
 *
 * For each entity in each frame:
 *  - Warns on unknown entity types
 *  - Deep-merges ENTITY_DEFAULTS (agent values take precedence)
 *  - Applies type-specific size defaults (TYPE_SIZE_DEFAULTS)
 *
 * Returns a mutated copy of the script with defaults applied + warnings.
 */

import type { VisualScript, VisualEntity } from '@preplai/shared';
import { ENTITY_DEFAULTS } from '@preplai/shared';
import type { CompilerWarning } from './types.js';
import { KNOWN_ENTITY_TYPES, TYPE_SIZE_DEFAULTS } from './types.js';

export interface Stage2Result {
  script: VisualScript;
  warnings: CompilerWarning[];
}

export function stage2ApplyDefaults(script: VisualScript): Stage2Result {
  const warnings: CompilerWarning[] = [];

  const frames = script.frames.map(frame => {
    const entities = frame.entities.map(entity =>
      applyEntityDefaults(entity, frame.id, warnings)
    );
    return { ...frame, entities };
  });

  return {
    script: { ...script, frames },
    warnings,
  };
}

// ── Internal helpers ──────────────────────────────────────────────────

function applyEntityDefaults(
  entity: VisualEntity,
  frameId: string,
  warnings: CompilerWarning[],
): VisualEntity {
  // Warn on unknown entity types
  if (!KNOWN_ENTITY_TYPES.has(entity.type)) {
    warnings.push({
      code: 'UNKNOWN_ENTITY_TYPE',
      message: `Unknown entity type "${entity.type}" on entity "${entity.id}" in frame "${frameId}". It will still compile but may not render.`,
      entityId: entity.id,
      frameId,
    });
  }

  // Determine default size — type-specific override or global default
  const sizeDefault = TYPE_SIZE_DEFAULTS.get(entity.type) ?? ENTITY_DEFAULTS.size;

  // Deep-merge animation (agent values take precedence)
  const animation: Required<NonNullable<VisualEntity['animation']>> = {
    delay: entity.animation?.delay ?? ENTITY_DEFAULTS.animation.delay,
    duration: entity.animation?.duration ?? ENTITY_DEFAULTS.animation.duration,
    easing: entity.animation?.easing ?? ENTITY_DEFAULTS.animation.easing,
    entrance: entity.animation?.entrance ?? ENTITY_DEFAULTS.animation.entrance,
  };

  return {
    ...entity,
    size: entity.size ?? sizeDefault,
    color: entity.color,
    highlight: entity.highlight ?? ENTITY_DEFAULTS.highlight,
    animation,
  };
}
