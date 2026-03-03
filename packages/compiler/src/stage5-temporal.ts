/**
 * @preplai/compiler — Stage 5: Temporal Choreography & Frame Timing
 *
 * 1. Assigns staggered animation.delay to entities without explicit delays
 *    (80ms stagger between non-connector entities, ANIMATION_DELAY_MIN_MS base)
 * 2. Arrow/connection entities appear after their source entity
 * 3. Enforces minimum frame duration (FRAME_DURATION_MIN_MS = 2500ms)
 * 4. Warns on barely-visible entities (visible time < ENTITY_MIN_VISIBLE_MS)
 *
 * Rules:
 *  - Non-connectors are staggered first, in order
 *  - Connectors with a resolved source get delay = source.delay + INTER_ENTITY_STAGGER_MS
 *  - Connectors without a resolved source get the next stagger slot
 *  - Entities with explicit agent-set delay are preserved
 */

import type { VisualScript, VisualEntity } from '@preplai/shared';
import {
  INTER_ENTITY_STAGGER_MS,
  ANIMATION_DELAY_MIN_MS,
  FRAME_DURATION_MIN_MS,
  ENTITY_MIN_VISIBLE_MS,
} from '@preplai/shared';
import { isConnectionType } from '@preplai/shared';
import type { CompilerWarning } from './types.js';

export interface Stage5Result {
  script: VisualScript;
  warnings: CompilerWarning[];
}

export function stage5Temporal(script: VisualScript): Stage5Result {
  const warnings: CompilerWarning[] = [];

  const frames = script.frames.map(frame => {
    // Step 1: Assign stagger delays
    const entitiesWithDelays = assignStaggerDelays(frame.entities);

    // Step 2: Enforce minimum frame duration
    let endTime = frame.endTime;
    const frameDuration = endTime - frame.startTime;
    if (frameDuration < FRAME_DURATION_MIN_MS) {
      endTime = frame.startTime + FRAME_DURATION_MIN_MS;
      warnings.push({
        code: 'FRAME_DURATION_EXTENDED',
        message: `Frame "${frame.id}" duration was ${frameDuration}ms (< minimum ${FRAME_DURATION_MIN_MS}ms). endTime auto-extended to ${endTime}ms.`,
        frameId: frame.id,
      });
    }

    const finalDuration = endTime - frame.startTime;

    // Step 3: Warn on barely-visible entities
    for (const entity of entitiesWithDelays) {
      const delay = entity.animation?.delay ?? 0;
      const visibleMs = finalDuration - delay;
      if (visibleMs < ENTITY_MIN_VISIBLE_MS) {
        warnings.push({
          code: 'ENTITY_BARELY_VISIBLE',
          message: `Entity "${entity.id}" in frame "${frame.id}" has delay=${delay}ms but frame lasts ${finalDuration}ms — visible for only ${visibleMs}ms (minimum: ${ENTITY_MIN_VISIBLE_MS}ms). Reduce delay or extend endTime.`,
          entityId: entity.id,
          frameId: frame.id,
        });
      }
    }

    return {
      ...frame,
      endTime,
      entities: entitiesWithDelays,
    };
  });

  // Update totalDuration to account for any extended frames
  const lastFrame = frames[frames.length - 1];
  const totalDuration = Math.max(script.totalDuration, lastFrame?.endTime ?? script.totalDuration);

  return {
    script: { ...script, frames, totalDuration },
    warnings,
  };
}

// ── Internal helpers ──────────────────────────────────────────────────

function assignStaggerDelays(entities: VisualEntity[]): VisualEntity[] {
  // Build an ID→entity map (post-stage2 entities already have defaults applied)
  const entityById = new Map(entities.map(e => [e.id, e]));

  // Track which entities already have an explicit delay
  // An entity has an "explicit" delay if it was set by the agent (non-zero OR explicitly set to 0)
  // Since we can't distinguish "agent set delay=0" from "default delay=0" here,
  // we treat delay=undefined as "needs assignment" and anything else as "explicit".
  // After stage2, all entities have animation.delay set (defaulted to 0).
  // We need to re-read from the original input... but we only have the post-default entity.
  //
  // CONVENTION: Stage 2 always sets delay to a numeric value.
  // We use the following heuristic:
  //   - If the entity was a connector AND has delay==0 (the default) → assign based on source
  //   - If the entity was a non-connector AND has delay==0 → assign staggered delay
  //   - If delay is non-zero → it was explicitly set by the agent, preserve it
  //
  // For first entity: if delay is 0, assign 0 (first stagger slot = 0 is fine)
  // We need to be careful: ANIMATION_DELAY_MIN_MS is the minimum for staggered entities,
  // but the architecture shows the first entity gets delay=0.
  // Per the worked example: server-api gets delay=0, db-postgres gets delay=160 (explicit).

  let staggerCursor = 0; // starts at 0 for first entity
  const assignedDelays = new Map<string, number>();

  // Pass 1: assign delays to non-connectors
  const result: VisualEntity[] = entities.map(entity => {
    if (isConnectionType(entity.type)) {
      return entity; // skip connectors in pass 1
    }

    const currentDelay = entity.animation?.delay ?? 0;
    if (currentDelay !== 0) {
      // Agent-specified delay — preserve
      assignedDelays.set(entity.id, currentDelay);
      // Advance cursor past this entity's delay
      staggerCursor = Math.max(staggerCursor, currentDelay + INTER_ENTITY_STAGGER_MS);
      return entity;
    }

    // Assign staggered delay
    const newDelay = staggerCursor;
    assignedDelays.set(entity.id, newDelay);
    staggerCursor += INTER_ENTITY_STAGGER_MS;

    return {
      ...entity,
      animation: {
        ...entity.animation,
        delay: newDelay,
      },
    };
  });

  // Pass 2: assign delays to connectors (after their source)
  return result.map(entity => {
    if (!isConnectionType(entity.type)) {
      return entity;
    }

    // If connector has an explicit non-zero delay, preserve it
    const currentDelay = entity.animation?.delay ?? 0;
    if (currentDelay !== 0) {
      assignedDelays.set(entity.id, currentDelay);
      return entity;
    }

    // Find the resolved source entity
    const resolvedSourceId = (entity.metadata?._resolvedSourceId as string | undefined)
      ?? entity.sourceEntityId;

    let connectorDelay: number;
    if (resolvedSourceId && assignedDelays.has(resolvedSourceId)) {
      const sourceDelay = assignedDelays.get(resolvedSourceId)!;
      connectorDelay = sourceDelay + INTER_ENTITY_STAGGER_MS;
    } else {
      // No source → use current stagger cursor
      connectorDelay = staggerCursor;
      staggerCursor += INTER_ENTITY_STAGGER_MS;
    }

    assignedDelays.set(entity.id, connectorDelay);

    return {
      ...entity,
      animation: {
        ...entity.animation,
        delay: connectorDelay,
      },
    };
  });
}
