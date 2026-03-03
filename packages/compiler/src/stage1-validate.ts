/**
 * @preplai/compiler — Stage 1: Ingestion & Schema Validation
 *
 * Accepts raw unknown JSON, runs it through VisualScriptSchema (Zod),
 * checks for duplicate entity IDs and duplicate frame IDs.
 * Returns the validated VisualScript or an array of CompilerErrors.
 */

import { VisualScriptSchema } from '@preplai/shared';
import type { VisualScript } from '@preplai/shared';
import type { CompilerError } from './types.js';

export type Stage1Result =
  | { ok: true; script: VisualScript }
  | { ok: false; errors: CompilerError[] };

/**
 * Pre-sanitize NaN positions before Zod validation.
 * Zod rejects NaN (receives 'nan', not 'number'), so we replace NaN with 50
 * here. Stage 3 will then handle NaN detection by comparing the raw input
 * against the sanitized output — but since we sanitize at Stage 1,
 * Stage 3 emits NAN_POSITION_RESET via its own logic on the pre-sanitized script.
 *
 * The strategy: we deep-clone + sanitize the raw input before schema parsing,
 * then pass a special flag via metadata so Stage 3 knows to emit the warning.
 */
function sanitizeNaNPositions(raw: unknown): { sanitized: unknown; nanEntityIds: string[] } {
  if (typeof raw !== 'object' || raw === null) return { sanitized: raw, nanEntityIds: [] };

  const nanEntityIds: string[] = [];
  const obj = raw as Record<string, unknown>;
  const frames = Array.isArray(obj.frames) ? obj.frames : [];

  const sanitizedFrames = frames.map((frame: unknown) => {
    if (typeof frame !== 'object' || frame === null) return frame;
    const f = frame as Record<string, unknown>;
    const entities = Array.isArray(f.entities) ? f.entities : [];

    const sanitizedEntities = entities.map((entity: unknown) => {
      if (typeof entity !== 'object' || entity === null) return entity;
      const e = entity as Record<string, unknown>;
      const pos = e.position as Record<string, unknown> | undefined;
      if (pos && (typeof pos.x === 'number' && isNaN(pos.x) || typeof pos.y === 'number' && isNaN(pos.y))) {
        nanEntityIds.push(typeof e.id === 'string' ? e.id : 'unknown');
        return {
          ...e,
          position: {
            x: typeof pos.x === 'number' && isNaN(pos.x) ? 50 : pos.x,
            y: typeof pos.y === 'number' && isNaN(pos.y) ? 50 : pos.y,
          },
          // Mark for Stage 3 to emit NAN_POSITION_RESET warning
          metadata: {
            ...((typeof e.metadata === 'object' && e.metadata !== null) ? e.metadata as Record<string, unknown> : {}),
            _hadNaNPosition: true,
          },
        };
      }
      return entity;
    });

    return { ...f, entities: sanitizedEntities };
  });

  return {
    sanitized: { ...obj, frames: sanitizedFrames },
    nanEntityIds,
  };
}

export function stage1Validate(raw: unknown): Stage1Result {
  // ── Pre-sanitize NaN positions (Zod rejects NaN as invalid type) ──
  const { sanitized } = sanitizeNaNPositions(raw);

  // ── Zod schema validation ─────────────────────────────────────────
  const parsed = VisualScriptSchema.safeParse(sanitized);

  if (!parsed.success) {
    const zodErrors = parsed.error.errors;
    const errors: CompilerError[] = zodErrors.map(issue => ({
      code: 'SCHEMA_VALIDATION_FAILED' as const,
      message: issue.message,
      suggestion: buildSuggestion(issue.path, issue.message),
      path: issue.path.join('.'),
    }));
    return { ok: false, errors };
  }

  const script = parsed.data as VisualScript;

  // ── Duplicate frame ID check ──────────────────────────────────────
  const frameIds = new Set<string>();
  for (const frame of script.frames) {
    if (frameIds.has(frame.id)) {
      return {
        ok: false,
        errors: [{
          code: 'DUPLICATE_FRAME_ID',
          message: `Duplicate frame id "${frame.id}" found in frames array.`,
          suggestion: `Each frame must have a unique id. Rename one of the "${frame.id}" frames.`,
          path: 'frames',
        }],
      };
    }
    frameIds.add(frame.id);
  }

  // ── Duplicate entity ID check (within each frame) ─────────────────
  for (const frame of script.frames) {
    const entityIds = new Set<string>();
    for (const entity of frame.entities) {
      if (entityIds.has(entity.id)) {
        return {
          ok: false,
          errors: [{
            code: 'DUPLICATE_ENTITY_ID',
            message: `Duplicate entity id "${entity.id}" found in frame "${frame.id}".`,
            suggestion: `Each entity within a frame must have a unique id. Rename one of the "${entity.id}" entities in frame "${frame.id}".`,
            path: `frames.${frame.id}.entities`,
          }],
        };
      }
      entityIds.add(entity.id);
    }
  }

  return { ok: true, script };
}

// ── Helper ────────────────────────────────────────────────────────────

function buildSuggestion(path: (string | number)[], message: string): string {
  const pathStr = path.join('.');
  if (pathStr.includes('sceneId')) {
    return 'sceneId must be a valid UUID (e.g. "550e8400-e29b-41d4-a716-446655440000").';
  }
  if (pathStr.includes('frames') && message.includes('min')) {
    return 'frames array must contain at least 1 frame.';
  }
  if (pathStr.includes('entities') && pathStr.includes('id')) {
    return 'Each entity must have a non-empty string id.';
  }
  if (pathStr.includes('entities') && pathStr.includes('type')) {
    return 'Each entity must have a non-empty string type (e.g. "Server", "Database", "Arrow").';
  }
  if (pathStr.includes('position') && pathStr.includes('x')) {
    return 'Entity position.x must be a number in range [0, 100] (percentage of canvas width).';
  }
  if (pathStr.includes('position') && pathStr.includes('y')) {
    return 'Entity position.y must be a number in range [0, 100] (percentage of canvas height).';
  }
  if (pathStr.includes('totalDuration')) {
    return 'totalDuration must be >= last frame endTime and <= 3_600_000ms.';
  }
  if (message.includes('endTime')) {
    return 'Frame endTime must be greater than startTime.';
  }
  return `Validation failed at "${pathStr}": ${message}`;
}
