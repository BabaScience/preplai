/**
 * @pre/player — apply-defaults
 *
 * Pure functions for defaulting entity properties and assigning
 * CSS animation-delay stagger values. No DOM dependency.
 */
import type { VisualEntity } from '@pre/shared';
import { ENTITY_DEFAULTS, INTER_ENTITY_STAGGER_MS } from '@pre/shared';

/**
 * Merge a (possibly partial) entity with ENTITY_DEFAULTS.
 * Entity fields take precedence. Animation sub-object is merged shallowly.
 *
 * Returns a NEW object — never mutates the input.
 */
export function applyDefaults(entity: Partial<VisualEntity> & Pick<VisualEntity, 'id' | 'type' | 'position'>): VisualEntity {
  return {
    ...ENTITY_DEFAULTS,
    ...entity,
    animation: {
      ...ENTITY_DEFAULTS.animation,
      ...(entity.animation ?? {}),
    },
  } as VisualEntity;
}

/**
 * Assign CSS animation-delay values to entities sequentially.
 *
 * - Entities that already have an explicit delay keep it.
 * - The stagger counter advances by INTER_ENTITY_STAGGER_MS (80ms) per entity.
 * - When an entity has an explicit delay, the counter jumps to
 *   max(counter, entity.delay + STAGGER) so subsequent entities don't overlap.
 *
 * Returns a NEW array of shallow-copied entities with animation.delay set.
 */
export function assignEntranceDelays(entities: VisualEntity[]): VisualEntity[] {
  let delay = 0;

  return entities.map((e) => {
    const copy = { ...e, animation: { ...(e.animation ?? {}) } };

    if (e.animation?.delay !== undefined && e.animation.delay !== null) {
      // Entity has explicit delay — preserve it, advance counter past it
      copy.animation.delay = e.animation.delay;
      delay = Math.max(delay, e.animation.delay + INTER_ENTITY_STAGGER_MS);
    } else {
      // Auto-assign delay
      copy.animation.delay = delay;
      delay += INTER_ENTITY_STAGGER_MS;
    }

    return copy as VisualEntity;
  });
}
