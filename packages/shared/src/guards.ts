/**
 * @pre/shared — Type Guards & Utility Functions
 *
 * Runtime type checks, entity defaults application, stagger assignment,
 * entity reference resolution, and VisualScript validation.
 */
import type { VisualEntity, VisualEntityType, VisualScript } from './types.js';
import {
  ENTITY_DEFAULTS,
  INTER_ENTITY_STAGGER_MS,
  MAX_ENTITIES_PER_FRAME,
} from './constants.js';

// ── Arrow / Connection Type Sets ──────────────────────────────────────

const ARROW_TYPES: ReadonlySet<string> = new Set([
  'Arrow', 'DataFlow', 'BidirectArrow', 'DottedArrow',
]);

const CONNECTION_TYPES: ReadonlySet<string> = new Set([
  ...ARROW_TYPES,
  'Transition', 'Bus',
]);

const METADATA_REQUIRED_TYPES: ReadonlySet<string> = new Set([
  'Graph2D', 'Equation', 'Matrix', 'Table', 'Circuit',
  'FreeBodyDiagram', 'Comparison', 'Proof', 'Timeline',
  'Stack', 'PieChart', 'Histogram', 'BarChart', 'ScatterPlot',
  'VennDiagram', 'StepList', 'Definition',
]);

// ── Entity Guards ─────────────────────────────────────────────────────

export const isVisualEntity = (v: unknown): v is VisualEntity =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as VisualEntity).id === 'string' &&
  typeof (v as VisualEntity).type === 'string' &&
  typeof (v as VisualEntity).position === 'object' &&
  (v as VisualEntity).position !== null;

export const isArrowType = (type: string): boolean =>
  ARROW_TYPES.has(type);

export const isConnectionType = (type: string): boolean =>
  CONNECTION_TYPES.has(type);

export const requiresMetadata = (type: string): boolean =>
  METADATA_REQUIRED_TYPES.has(type);

// ── VisualScript Guards ───────────────────────────────────────────────

export const isVisualScript = (v: unknown): v is VisualScript =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as VisualScript).sceneId === 'string' &&
  Array.isArray((v as VisualScript).frames) &&
  typeof (v as VisualScript).totalDuration === 'number';

// ── Utility Functions ─────────────────────────────────────────────────

/**
 * Apply defaults to a minimal entity emitted by an agent.
 * Merges ENTITY_DEFAULTS with any agent-supplied values.
 */
export function applyEntityDefaults(
  entity: Partial<VisualEntity> & Pick<VisualEntity, 'id' | 'type' | 'position'>,
): VisualEntity {
  return {
    ...entity,
    size: entity.size ?? ENTITY_DEFAULTS.size,
    color: entity.color ?? ENTITY_DEFAULTS.color,
    highlight: entity.highlight ?? ENTITY_DEFAULTS.highlight,
    animation: {
      ...ENTITY_DEFAULTS.animation,
      ...(entity.animation ?? {}),
    },
  } as VisualEntity;
}

/**
 * Build a lookup map from an entity array.
 * O(n) construction, O(1) lookup.
 */
export function buildEntityMap(entities: VisualEntity[]): Map<string, VisualEntity> {
  return new Map(entities.map(e => [e.id, e]));
}

/**
 * Assign staggered entrance delays to entities.
 * Modifies entities in place. Connection types are skipped.
 */
export function assignEntranceDelays(
  entities: VisualEntity[],
  baseDelayMs = 0,
  staggerMs = INTER_ENTITY_STAGGER_MS,
): void {
  let delay = baseDelayMs;
  for (const entity of entities) {
    if (isConnectionType(entity.type)) continue;
    entity.animation = entity.animation ?? {};
    entity.animation.delay = entity.animation.delay ?? delay;
    delay += staggerMs;
  }
}

/**
 * Resolve an entity reference string (ID or label) to a VisualEntity.
 * Three-tier lookup: exact ID → exact label (case-insensitive) → substring label.
 */
export function resolveEntityRef(ref: string, allEntities: VisualEntity[]): VisualEntity | null {
  if (!ref) return null;

  // Tier 1: Exact ID match
  let found = allEntities.find(e => e.id === ref);
  if (found) return found;

  // Tier 2: Exact label match (case-insensitive)
  const refLower = ref.toLowerCase();
  found = allEntities.find(e => e.label?.toLowerCase() === refLower);
  if (found) return found;

  // Tier 3: Substring match
  found = allEntities.find(e => e.label?.toLowerCase().includes(refLower));
  return found ?? null;
}

/**
 * Validate that a VisualScript's internal references are consistent.
 * Returns an array of validation warnings (empty = valid).
 */
export function validateVisualScript(script: VisualScript): string[] {
  const warnings: string[] = [];

  for (const frame of script.frames) {
    if (frame.endTime <= frame.startTime) {
      warnings.push(
        `Frame "${frame.id}": endTime (${frame.endTime}) must be > startTime (${frame.startTime})`,
      );
    }
    if (frame.entities.length > MAX_ENTITIES_PER_FRAME) {
      warnings.push(
        `Frame "${frame.id}": entity count (${frame.entities.length}) exceeds MAX_ENTITIES_PER_FRAME (${MAX_ENTITIES_PER_FRAME})`,
      );
    }

    const entityIds = new Set(frame.entities.map(e => e.id));
    for (const entity of frame.entities) {
      if (isConnectionType(entity.type)) {
        if (entity.sourceEntityId && !entityIds.has(entity.sourceEntityId)) {
          warnings.push(
            `Frame "${frame.id}", entity "${entity.id}": sourceEntityId "${entity.sourceEntityId}" not found in frame`,
          );
        }
        if (entity.targetEntityId && !entityIds.has(entity.targetEntityId)) {
          warnings.push(
            `Frame "${frame.id}", entity "${entity.id}": targetEntityId "${entity.targetEntityId}" not found in frame`,
          );
        }
      }
    }
  }

  return warnings;
}
