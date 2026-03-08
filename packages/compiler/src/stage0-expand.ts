/**
 * @preplai/compiler — Stage 0: Expand Compact Input
 *
 * Runs before validation. Expands short keys, position shorthand, entity type
 * aliases, and applies frame/entity defaults. Produces full VisualScript-shaped
 * output for Stage 1 validation.
 *
 * Token-reducing features:
 * - Short keys: f→frames, p→position, src→sourceEntityId, etc.
 * - Position shorthand: [x,y] → {x,y}
 * - Entity type aliases: BT→BinaryTree, CST→CallStack, etc.
 * - Frame defaults: id, startTime, endTime, description
 * - Entity id: auto-assign for non-referenced entities
 */

import { DEFAULT_FRAME_DURATION_MS } from '@preplai/shared';
import type { CompilerError } from './types.js';

export type Stage0Result =
  | { ok: true; expanded: unknown }
  | { ok: false; errors: CompilerError[] };

// ── Short key mappings (context-based) ───────────────────────────────────

const SCRIPT_KEYS: Record<string, string> = {
  f: 'frames',
  td: 'totalDuration',
  sid: 'sceneId',
};

const FRAME_KEYS: Record<string, string> = {
  e: 'entities',
  n: 'narrationSegment',
  d: 'description',
  tr: 'transitions',
};

const ENTITY_KEYS: Record<string, string> = {
  p: 'position',
  m: 'metadata',
  l: 'label',
  c: 'color',
  sz: 'size',
  src: 'sourceEntityId',
  tgt: 'targetEntityId',
  par: 'parentEntityId',
  a: 'animation',
  tc: 'textContent',
  hl: 'highlight',
};

export const AGENT_SHORT_KEYS: Record<string, string> = {
  ...SCRIPT_KEYS,
  ...FRAME_KEYS,
  ...ENTITY_KEYS,
};

// ── Entity type aliases (no overlapping) ──────────────────────────────────

export const ENTITY_TYPE_ALIASES: Record<string, string> = {
  // Data structures
  BT: 'BinaryTree',
  BTR: 'BTree',
  LL: 'LinkedList',
  HT: 'HashTable',
  ARR: 'Array',
  LST: 'List',
  TUP: 'Tuple',
  ST: 'Set',
  // Infrastructure (Service with metadata.kind for second level)
  SVC: 'Service',
  GW: 'Service',
  API: 'Service',
  APIGateway: 'Service',
  LB: 'LoadBalancer',
  DNS: 'DNSResolver',
  // Pedagogical / UI
  CB: 'CodeBlock',
  DF: 'Definition',
  SL: 'StepList',
  CST: 'CallStack',
  COORD: 'CoordinateSystem',
  G2: 'Graph2D',
  G3: 'Graph3D',
  GRP: 'Group',
  // Charts / viz
  BC: 'BarChart',
  CM: 'ConfusionMatrix',
  CH: 'CacheHierarchy',
  ML: 'MemoryLayout',
  GC: 'GanttChart',
  PS: 'ProcessState',
  BIGO: 'BigO',
  // Physics / misc
  CKT: 'Circuit',
  CYC: 'Cycle',
};

// ── Expand helpers ──────────────────────────────────────────────────────

function expandKeys<T extends Record<string, unknown>>(
  obj: T,
  keyMap: Record<string, string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    const outKey = keyMap[k] ?? k;
    out[outKey] = v;
  }
  return out;
}

function expandPosition(val: unknown): { x: number; y: number } | null {
  if (Array.isArray(val) && val.length >= 2) {
    const x = Number(val[0]);
    const y = Number(val[1]);
    if (!Number.isNaN(x) && !Number.isNaN(y)) {
      return { x, y };
    }
  }
  if (typeof val === 'object' && val !== null && 'x' in val && 'y' in val) {
    const v = val as { x: unknown; y: unknown };
    const x = Number(v.x);
    const y = Number(v.y);
    if (!Number.isNaN(x) && !Number.isNaN(y)) {
      return { x, y };
    }
  }
  return null;
}

function expandEntity(raw: unknown, frameEntityIndex: number): unknown {
  if (typeof raw !== 'object' || raw === null) return raw;
  const obj = raw as Record<string, unknown>;
  const expanded = expandKeys(obj, ENTITY_KEYS) as Record<string, unknown>;

  // Position shorthand: [x,y] → {x,y}
  const pos = expanded.position;
  if (pos !== undefined) {
    const expandedPos = expandPosition(pos);
    if (expandedPos) {
      expanded.position = expandedPos;
    }
  }

  // Entity type alias + metadata.kind for Service second level
  const typeVal = expanded.type;
  if (typeof typeVal === 'string' && ENTITY_TYPE_ALIASES[typeVal]) {
    const resolved = ENTITY_TYPE_ALIASES[typeVal];
    expanded.type = resolved;
    // GW, API, APIGateway → Service with metadata.kind
    if (resolved === 'Service' && (typeVal === 'GW' || typeVal === 'API' || typeVal === 'APIGateway')) {
      const meta = (expanded.metadata as Record<string, unknown>) ?? {};
      if (meta.kind === undefined) {
        meta.kind = typeVal === 'GW' ? 'APIGateway' : typeVal === 'API' ? 'API' : 'APIGateway';
        expanded.metadata = meta;
      }
    }
  }

  // Recursively expand animation if present
  if (expanded.animation && typeof expanded.animation === 'object') {
    expanded.animation = { ...(expanded.animation as object) };
  }

  return expanded;
}

function expandFrame(
  raw: unknown,
  frameIndex: number,
  prevEndTime: number,
): { frame: Record<string, unknown>; errors: CompilerError[] } {
  const errors: CompilerError[] = [];
  if (typeof raw !== 'object' || raw === null) {
    return { frame: {}, errors };
  }
  const obj = raw as Record<string, unknown>;
  const expanded = expandKeys(obj, FRAME_KEYS) as Record<string, unknown>;

  // Frame defaults
  if (expanded.id === undefined || expanded.id === '') {
    expanded.id = `frame-${frameIndex}`;
  }
  if (expanded.startTime === undefined) {
    expanded.startTime = prevEndTime;
  }
  const startTime = Number(expanded.startTime) || 0;
  if (expanded.endTime === undefined) {
    expanded.endTime = startTime + DEFAULT_FRAME_DURATION_MS;
  }
  if (expanded.transitions === undefined) {
    expanded.transitions = [];
  }

  // Expand entities
  const entitiesRaw = expanded.entities ?? expanded.e;
  const entitiesArr = Array.isArray(entitiesRaw) ? entitiesRaw : [];
  expanded.entities = entitiesArr.map((e, i) => expandEntity(e, i));
  delete expanded.e;

  return { frame: expanded, errors };
}

/**
 * Assign ids to entities that don't have one.
 * Non-referenced entities get auto-assigned {type}-{index}.
 * Entities that are referenced (sourceEntityId/targetEntityId/parentEntityId)
 * should have explicit ids from the agent; references by label still resolve in stage4.
 */
function assignEntityIds(
  frames: Record<string, unknown>[],
): Record<string, unknown>[] {
  const framesOut: Record<string, unknown>[] = [];

  for (const frame of frames) {
    const entities = (frame.entities as unknown[]) ?? [];
    const entitiesOut: unknown[] = [];
    const typeCounts = new Map<string, number>();

    for (const ent of entities) {
      const e = ent as Record<string, unknown>;
      const id = e.id as string | undefined;
      const type = String(e.type ?? 'Entity');

      if (id === undefined || id === '') {
        const count = (typeCounts.get(type) ?? 0) + 1;
        typeCounts.set(type, count);
        const autoId = `${type}-${count - 1}`;
        entitiesOut.push({ ...e, id: autoId });
      } else {
        entitiesOut.push(ent);
      }
    }

    framesOut.push({ ...frame, entities: entitiesOut });
  }

  return framesOut;
}

/**
 * Stage 0: Expand compact input to full VisualScript shape.
 */
export function stage0Expand(raw: unknown): Stage0Result {
  const errors: CompilerError[] = [];

  if (typeof raw !== 'object' || raw === null) {
    return {
      ok: false,
      errors: [{
        code: 'SCHEMA_VALIDATION_FAILED',
        message: 'Input must be an object.',
        suggestion: 'Pass a VisualScript object with sceneId, frames, and totalDuration.',
        path: '',
      }],
    };
  }

  const obj = raw as Record<string, unknown>;
  const script = expandKeys(obj, SCRIPT_KEYS) as Record<string, unknown>;

  // Expand frames
  const framesRaw = script.frames ?? script.f;
  const framesArr = Array.isArray(framesRaw) ? framesRaw : [];
  if (framesArr.length === 0) {
    return {
      ok: false,
      errors: [{
        code: 'SCHEMA_VALIDATION_FAILED',
        message: 'frames array is required and must have at least one frame.',
        suggestion: 'Add a frames array with at least one frame.',
        path: 'frames',
      }],
    };
  }

  let prevEndTime = 0;
  const expandedFrames: Record<string, unknown>[] = [];
  for (let i = 0; i < framesArr.length; i++) {
    const { frame, errors: fe } = expandFrame(framesArr[i], i, prevEndTime);
    errors.push(...fe);
    expandedFrames.push(frame);
    prevEndTime = Number(frame.endTime) ?? prevEndTime;
  }

  script.frames = expandedFrames;
  delete script.f;

  // Ensure totalDuration
  if (script.totalDuration === undefined && script.td === undefined) {
    script.totalDuration = Math.max(
      prevEndTime,
      (expandedFrames[expandedFrames.length - 1]?.endTime as number) ?? 0,
    );
  } else if (script.td !== undefined) {
    script.totalDuration = script.td;
    delete script.td;
  }

  // Ensure sceneId (required by schema; we don't default it - agent/session provides)
  if (script.sceneId === undefined && script.sid !== undefined) {
    script.sceneId = script.sid;
    delete script.sid;
  }

  // Assign entity ids for entities without one
  script.frames = assignEntityIds(expandedFrames);

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return { ok: true, expanded: script };
}
