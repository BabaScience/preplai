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
import { CANVAS_WIDTH, CANVAS_HEIGHT, ENTITY_DEFAULTS } from '@preplai/shared';
import type { CompilerWarning } from './types.js';
import { BASE_ENTITY_SIZES, SKIP_CLAMP_TYPES } from './types.js';

// ── AABB Overlap Resolver ────────────────────────────────────────────

const MAX_OVERLAP_ITERATIONS = 8;

/**
 * Resolve entity overlaps using AABB collision detection and MTV (minimum
 * translation vector) resolution. Iterates up to MAX_OVERLAP_ITERATIONS
 * times, exiting early when no overlaps remain.
 *
 * Connection types (Arrow, DataFlow, etc.) are excluded — their position
 * is determined by source/target, not the position property.
 */
export function resolveEntityOverlaps(entities: VisualEntity[]): VisualEntity[] {
  const content = entities.filter(e => !SKIP_CLAMP_TYPES.has(e.type));
  if (content.length < 2) return entities;

  // Pre-compute half-extents and clamp bounds per entity
  interface EntityState {
    id: string;
    x: number;
    y: number;
    halfW: number; // overlap detection half-extent (includes 1.5% margin)
    halfH: number;
    minX: number;  // canvas clamp bounds (without margin)
    maxX: number;
    minY: number;
    maxY: number;
  }

  const states: EntityState[] = content.map(e => {
    const base = BASE_ENTITY_SIZES.get(e.type) ?? BASE_ENTITY_SIZES.get('_default')!;
    const mult = e.size ?? ENTITY_DEFAULTS.size;
    const hwPct = (base.w * mult / CANVAS_WIDTH) * 100 / 2;
    const hhPct = (base.h * mult / CANVAS_HEIGHT) * 100 / 2;
    return {
      id: e.id,
      x: e.position.x,
      y: e.position.y,
      halfW: hwPct + 1.5,
      halfH: hhPct + 1.5,
      minX: hwPct,
      maxX: 100 - hwPct,
      minY: hhPct,
      maxY: 100 - hhPct,
    };
  });

  for (let iter = 0; iter < MAX_OVERLAP_ITERATIONS; iter++) {
    let anyOverlap = false;

    for (let i = 0; i < states.length; i++) {
      for (let j = i + 1; j < states.length; j++) {
        const a = states[i];
        const b = states[j];

        const overlapX = (a.halfW + b.halfW) - Math.abs(a.x - b.x);
        const overlapY = (a.halfH + b.halfH) - Math.abs(a.y - b.y);

        if (overlapX > 0 && overlapY > 0) {
          anyOverlap = true;
          const dx = b.x - a.x;
          const dy = b.y - a.y;

          if (overlapX < overlapY) {
            // Push apart horizontally
            const push = overlapX / 2 + 0.5;
            if (dx >= 0) { a.x -= push; b.x += push; }
            else         { a.x += push; b.x -= push; }
          } else {
            // Push apart vertically
            const push = overlapY / 2 + 0.5;
            if (dy >= 0) { a.y -= push; b.y += push; }
            else         { a.y += push; b.y -= push; }
          }

          // Re-clamp both entities to canvas bounds
          a.x = Math.max(a.minX, Math.min(a.maxX, a.x));
          a.y = Math.max(a.minY, Math.min(a.maxY, a.y));
          b.x = Math.max(b.minX, Math.min(b.maxX, b.x));
          b.y = Math.max(b.minY, Math.min(b.maxY, b.y));
        }
      }
    }

    if (!anyOverlap) break;
  }

  // Apply resolved positions back — only update entities that actually moved
  const posMap = new Map(states.map(s => [s.id, { x: s.x, y: s.y }]));
  return entities.map(e => {
    const np = posMap.get(e.id);
    if (np && (Math.abs(np.x - e.position.x) > 0.001 || Math.abs(np.y - e.position.y) > 0.001)) {
      return { ...e, position: { x: np.x, y: np.y } };
    }
    return e;
  });
}

export interface Stage3Result {
  script: VisualScript;
  warnings: CompilerWarning[];
}

export function stage3ClampPositions(script: VisualScript): Stage3Result {
  const warnings: CompilerWarning[] = [];

  const frames = script.frames.map(frame => {
    // Step 1: Clamp positions to canvas bounds
    let entities = frame.entities.map(entity =>
      clampEntityPosition(entity, frame.id, warnings)
    );

    // Step 2: Snap to 5-unit grid for consistent alignment
    entities = entities.map(entity => snapToGrid(entity));

    // Step 3: Align tiers — entities within 5 units of same Y get aligned
    entities = alignTiers(entities);

    // Step 4: Resolve any remaining AABB overlaps
    entities = resolveEntityOverlaps(entities);

    return { ...frame, entities };
  });

  return {
    script: { ...script, frames },
    warnings,
  };
}

// ── Snap-to-grid ────────────────────────────────────────────────────

const GRID_SIZE = 5; // 5-unit grid (20x20 on 0-100 space)

/**
 * Snap entity position to the nearest 5-unit grid point.
 * Connections skip snapping (their position is determined by source/target).
 */
function snapToGrid(entity: VisualEntity): VisualEntity {
  if (SKIP_CLAMP_TYPES.has(entity.type)) return entity;

  const { x, y } = entity.position;
  const snappedX = Math.round(x / GRID_SIZE) * GRID_SIZE;
  const snappedY = Math.round(y / GRID_SIZE) * GRID_SIZE;

  if (snappedX === x && snappedY === y) return entity;
  return { ...entity, position: { x: snappedX, y: snappedY } };
}

// ── Tier alignment ──────────────────────────────────────────────────

const TIER_THRESHOLD = 5; // entities within 5 units of same Y get aligned

/**
 * Align entities that are nearly on the same Y to the exact same Y.
 * Groups entities into tiers (within TIER_THRESHOLD of each other),
 * then sets all entities in a tier to the median Y of that tier.
 *
 * This ensures horizontal arrows between same-tier entities are perfectly straight.
 */
function alignTiers(entities: VisualEntity[]): VisualEntity[] {
  // Separate connections (skip) from content entities
  const content = entities.filter(e => !SKIP_CLAMP_TYPES.has(e.type));
  const connections = entities.filter(e => SKIP_CLAMP_TYPES.has(e.type));

  if (content.length < 2) return entities;

  // Sort by Y position
  const sorted = [...content].sort((a, b) => a.position.y - b.position.y);

  // Group into tiers: consecutive entities within TIER_THRESHOLD of each other
  const tiers: VisualEntity[][] = [];
  let currentTier: VisualEntity[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prevY = sorted[i - 1].position.y;
    const currY = sorted[i].position.y;

    if (currY - prevY <= TIER_THRESHOLD) {
      currentTier.push(sorted[i]);
    } else {
      tiers.push(currentTier);
      currentTier = [sorted[i]];
    }
  }
  tiers.push(currentTier);

  // For each tier with 2+ entities, align to median Y
  const yOverrides = new Map<string, number>();
  for (const tier of tiers) {
    if (tier.length < 2) continue;

    const ys = tier.map(e => e.position.y);
    ys.sort((a, b) => a - b);
    const medianY = ys[Math.floor(ys.length / 2)];

    // Snap median to grid
    const alignedY = Math.round(medianY / GRID_SIZE) * GRID_SIZE;

    for (const entity of tier) {
      yOverrides.set(entity.id, alignedY);
    }
  }

  // Apply overrides
  if (yOverrides.size === 0) return entities;

  return entities.map(entity => {
    const newY = yOverrides.get(entity.id);
    if (newY != null && newY !== entity.position.y) {
      return { ...entity, position: { x: entity.position.x, y: newY } };
    }
    return entity;
  });
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
  const sizeMult = entity.size ?? ENTITY_DEFAULTS.size;

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
