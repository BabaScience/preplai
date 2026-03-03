/**
 * @preplai/compiler — Stage 3: Position Resolution & Entity Clamping
 *
 * For each entity (except Arrow/DataFlow types):
 *  1. Guard against NaN positions — reset to (50, 50) and warn
 *  2. Clamp position so entity stays within 1920x1080 canvas bounds
 *     using half-width/height of the entity's base size in % units
 *
 * Arrow/DataFlow entities skip clamping because their visual extent
 * is determined by source/target, not their own position property.
 */

import type { VisualScript, VisualEntity } from '@preplai/shared';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@preplai/shared';
import type { CompilerWarning } from './types.js';
import { BASE_ENTITY_SIZES, SKIP_CLAMP_TYPES } from './types.js';

export interface Stage3Result {
  script: VisualScript;
  warnings: CompilerWarning[];
}

export function stage3ClampPositions(script: VisualScript): Stage3Result {
  const warnings: CompilerWarning[] = [];

  const frames = script.frames.map(frame => {
    const entities = frame.entities.map(entity =>
      clampEntityPosition(entity, frame.id, warnings)
    );
    return { ...frame, entities };
  });

  return {
    script: { ...script, frames },
    warnings,
  };
}

// ── Internal helpers ──────────────────────────────────────────────────

function clampEntityPosition(
  entity: VisualEntity,
  frameId: string,
  warnings: CompilerWarning[],
): VisualEntity {
  // Arrow-like types skip clamping entirely
  if (SKIP_CLAMP_TYPES.has(entity.type)) {
    return entity;
  }

  let { x, y } = entity.position;

  // Guard against NaN positions (or positions sanitized from NaN by Stage 1)
  const hadNaN = entity.metadata?._hadNaNPosition === true;
  if (hadNaN || isNaN(x) || isNaN(y)) {
    warnings.push({
      code: 'NAN_POSITION_RESET',
      message: `Entity "${entity.id}" in frame "${frameId}" had NaN position. Reset to (50, 50).`,
      entityId: entity.id,
      frameId,
    });
    // Clean the metadata flag and reset position
    const { _hadNaNPosition: _, ...cleanMeta } = (entity.metadata ?? {}) as Record<string, unknown>;
    return {
      ...entity,
      position: { x: 50, y: 50 },
      metadata: Object.keys(cleanMeta).length > 0 ? cleanMeta : undefined,
    };
  }

  // Get base size for this entity type
  const baseSize = BASE_ENTITY_SIZES.get(entity.type) ?? BASE_ENTITY_SIZES.get('_default')!;
  const sizeMult = entity.size ?? 1.0;

  // Convert half-pixel extents to percentage of canvas
  const halfWPct = (baseSize.w * sizeMult / 2) / CANVAS_WIDTH * 100;
  const halfHPct = (baseSize.h * sizeMult / 2) / CANVAS_HEIGHT * 100;

  const minX = halfWPct;
  const maxX = 100 - halfWPct;
  const minY = halfHPct;
  const maxY = 100 - halfHPct;

  const clampedX = Math.max(minX, Math.min(maxX, x));
  const clampedY = Math.max(minY, Math.min(maxY, y));

  if (clampedX !== x || clampedY !== y) {
    warnings.push({
      code: 'POSITION_CLAMPED',
      message: `Entity "${entity.id}" in frame "${frameId}" was clamped from (${x.toFixed(1)}, ${y.toFixed(1)}) to (${clampedX.toFixed(1)}, ${clampedY.toFixed(1)}) to stay within canvas bounds.`,
      entityId: entity.id,
      frameId,
    });
    return { ...entity, position: { x: clampedX, y: clampedY } };
  }

  return entity;
}
