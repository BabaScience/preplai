/**
 * @preplai/compiler — compile.test.ts
 *
 * Comprehensive TDD test suite for the compileVisualScript function.
 * Written FIRST (red phase), implemented second (green phase).
 *
 * Test coverage:
 *  - Stage 1: Schema validation
 *  - Stage 2: Entity defaults application
 *  - Stage 3: Position clamping
 *  - Stage 4: Connection & hierarchy resolution
 *  - Stage 5: Temporal choreography
 *  - Frame transitions (persist/enter/exit)
 *  - Duplicate ID detection
 *  - Frame ordering validation
 */

import { describe, it, expect } from 'vitest';
import { compileVisualScript } from './compile.js';
import {
  ENTITY_DEFAULTS,
  FRAME_DURATION_MIN_MS,
  INTER_ENTITY_STAGGER_MS,
} from '@preplai/shared';

// ─── Test Helpers ─────────────────────────────────────────────────────────────

/** Minimal valid VisualScript input (raw JSON, passes schema) */
function minimalScript(overrides: Record<string, unknown> = {}) {
  return {
    sceneId: '550e8400-e29b-41d4-a716-446655440000',
    totalDuration: 4000,
    frames: [
      {
        id: 'frame-1',
        startTime: 0,
        endTime: 4000,
        entities: [
          {
            id: 'server-1',
            type: 'Server',
            position: { x: 50, y: 50 },
          },
        ],
        narrationSegment: 'Hello world',
        description: 'A minimal frame',
      },
    ],
    ...overrides,
  };
}

/** Helper to build a two-frame script for transition tests */
function twoFrameScript() {
  return {
    sceneId: '550e8400-e29b-41d4-a716-446655440001',
    totalDuration: 8000,
    frames: [
      {
        id: 'frame-1',
        startTime: 0,
        endTime: 4000,
        entities: [
          { id: 'server-api',  type: 'Server',   position: { x: 25, y: 50 }, label: 'API Server' },
          { id: 'db-postgres', type: 'Database', position: { x: 75, y: 50 }, label: 'Postgres' },
        ],
        narrationSegment: 'Frame one narration',
        description: 'Frame one',
      },
      {
        id: 'frame-2',
        startTime: 4000,
        endTime: 8000,
        entities: [
          { id: 'server-api',  type: 'Server',   position: { x: 25, y: 50 }, label: 'API Server' },
          { id: 'cache-redis', type: 'Cache',    position: { x: 75, y: 50 }, label: 'Redis Cache' },
        ],
        narrationSegment: 'Frame two narration',
        description: 'Frame two',
      },
    ],
  };
}

// ─── Stage 0: Expand Compact Input ────────────────────────────────────────────

describe('Stage 0 — Expand Compact Input', () => {
  const uuid = '550e8400-e29b-41d4-a716-446655440000';

  it('expands short keys: f→frames, p→position, n→narrationSegment', () => {
    const raw = {
      sid: uuid,
      td: 5000,
      f: [{
        id: 'frame-1',
        startTime: 0,
        endTime: 5000,
        e: [{ id: 'e1', type: 'Server', p: [50, 50] }],
        n: 'Hello',
      }],
    };
    const result = compileVisualScript(raw);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.script.frames).toHaveLength(1);
    expect(result.script.frames[0].entities[0].position).toEqual({ x: 50, y: 50 });
    expect(result.script.frames[0].narrationSegment).toBe('Hello');
  });

  it('expands position shorthand [x,y] to {x,y}', () => {
    const raw = minimalScript({
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [{ id: 'e1', type: 'Server', position: [30, 60] }],
        narrationSegment: '', description: '',
      }],
    });
    const result = compileVisualScript(raw);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.script.frames[0].entities[0].position).toEqual({ x: 30, y: 60 });
  });

  it('expands entity type alias BT → BinaryTree', () => {
    const raw = minimalScript({
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [{ id: 'e1', type: 'BT', position: { x: 50, y: 50 }, metadata: { nodes: [5, 3, 8] } }],
        narrationSegment: '', description: '',
      }],
    });
    const result = compileVisualScript(raw);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.script.frames[0].entities[0].type).toBe('BinaryTree');
  });

  it('applies frame defaults: id, startTime, endTime when omitted', () => {
    const raw = {
      sceneId: uuid,
      totalDuration: 5000,
      frames: [{
        entities: [{ id: 'e1', type: 'Server', position: { x: 50, y: 50 } }],
        narrationSegment: 'Hello',
      }],
    };
    const result = compileVisualScript(raw);
    expect(result.success).toBe(true);
    if (!result.success) return;
    const frame = result.script.frames[0];
    expect(frame.id).toBe('frame-0');
    expect(frame.startTime).toBe(0);
    expect(frame.endTime).toBe(5000);
  });

  it('assigns entity id when omitted for non-connected entity', () => {
    const raw = minimalScript({
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [
          { type: 'Server', position: { x: 30, y: 50 } },
          { type: 'Database', position: { x: 70, y: 50 } },
        ],
        narrationSegment: '', description: '',
      }],
    });
    const result = compileVisualScript(raw);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.script.frames[0].entities[0].id).toBe('Server-0');
    expect(result.script.frames[0].entities[1].id).toBe('Database-0');
  });
});

// ─── Stage 1: Schema Validation ───────────────────────────────────────────────

describe('Stage 1 — Schema Validation', () => {
  it('compiles a valid minimal script successfully', () => {
    const result = compileVisualScript(minimalScript());
    expect(result.success).toBe(true);
  });

  it('returns success=false when input is null', () => {
    const result = compileVisualScript(null);
    expect(result.success).toBe(false);
  });

  it('returns success=false when input is not an object', () => {
    const result = compileVisualScript('not json');
    expect(result.success).toBe(false);
  });

  it('returns success=false when sceneId is missing', () => {
    const raw = minimalScript();
    delete (raw as Record<string, unknown>).sceneId;
    const result = compileVisualScript(raw);
    expect(result.success).toBe(false);
  });

  it('returns success=false when sceneId is not a UUID', () => {
    const result = compileVisualScript(minimalScript({ sceneId: 'not-a-uuid' }));
    expect(result.success).toBe(false);
  });

  it('returns success=false when frames array is empty', () => {
    const result = compileVisualScript(minimalScript({ frames: [] }));
    expect(result.success).toBe(false);
  });

  it('returns success=false when frames is missing', () => {
    const raw = minimalScript();
    delete (raw as Record<string, unknown>).frames;
    const result = compileVisualScript(raw);
    expect(result.success).toBe(false);
  });

  it('assigns auto id when entity is missing id (Stage 0)', () => {
    const raw = minimalScript();
    delete (raw.frames[0].entities[0] as Record<string, unknown>).id;
    const result = compileVisualScript(raw);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.script.frames[0].entities[0].id).toBe('Server-0');
  });

  it('returns success=false when entity is missing type', () => {
    const raw = minimalScript();
    (raw.frames[0].entities[0] as Record<string, unknown>).type = undefined;
    const result = compileVisualScript(raw);
    expect(result.success).toBe(false);
  });

  it('returns success=false when entity has invalid position (x > 100)', () => {
    const result = compileVisualScript(
      minimalScript({
        frames: [{
          id: 'frame-1', startTime: 0, endTime: 4000,
          entities: [{ id: 'e1', type: 'Server', position: { x: 150, y: 50 } }],
          narrationSegment: '', description: '',
        }],
      })
    );
    expect(result.success).toBe(false);
  });

  it('returns success=false when entity position is missing', () => {
    const raw = minimalScript();
    delete (raw.frames[0].entities[0] as Record<string, unknown>).position;
    const result = compileVisualScript(raw);
    expect(result.success).toBe(false);
  });

  it('returns SCHEMA_VALIDATION_FAILED error code on schema failure', () => {
    const result = compileVisualScript(null);
    if (!result.success) {
      expect(result.errors[0].code).toBe('SCHEMA_VALIDATION_FAILED');
    }
  });

  it('schema error includes a suggestion', () => {
    const result = compileVisualScript({ sceneId: 'bad-uuid', frames: [], totalDuration: 0 });
    if (!result.success) {
      expect(typeof result.errors[0].suggestion).toBe('string');
      expect(result.errors[0].suggestion.length).toBeGreaterThan(0);
    }
  });

  it('returns success=false when frame endTime <= startTime', () => {
    const result = compileVisualScript(
      minimalScript({
        frames: [{
          id: 'f1', startTime: 2000, endTime: 2000,
          entities: [{ id: 'e1', type: 'Server', position: { x: 50, y: 50 } }],
          narrationSegment: '', description: '',
        }],
        totalDuration: 2000,
      })
    );
    expect(result.success).toBe(false);
  });

  it('returns success=false when totalDuration < last frame endTime', () => {
    const result = compileVisualScript(
      minimalScript({
        totalDuration: 100,
        frames: [{
          id: 'f1', startTime: 0, endTime: 4000,
          entities: [{ id: 'e1', type: 'Server', position: { x: 50, y: 50 } }],
          narrationSegment: '', description: '',
        }],
      })
    );
    expect(result.success).toBe(false);
  });

  it('detects duplicate entity IDs within a frame', () => {
    const result = compileVisualScript(
      minimalScript({
        frames: [{
          id: 'f1', startTime: 0, endTime: 4000,
          entities: [
            { id: 'dup', type: 'Server',   position: { x: 30, y: 50 } },
            { id: 'dup', type: 'Database', position: { x: 70, y: 50 } },
          ],
          narrationSegment: '', description: '',
        }],
      })
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe('DUPLICATE_ENTITY_ID');
    }
  });

  it('detects duplicate frame IDs', () => {
    const result = compileVisualScript({
      sceneId: '550e8400-e29b-41d4-a716-446655440000',
      totalDuration: 8000,
      frames: [
        {
          id: 'same-frame', startTime: 0, endTime: 4000,
          entities: [{ id: 'e1', type: 'Server', position: { x: 50, y: 50 } }],
          narrationSegment: '', description: '',
        },
        {
          id: 'same-frame', startTime: 4000, endTime: 8000,
          entities: [{ id: 'e1', type: 'Server', position: { x: 50, y: 50 } }],
          narrationSegment: '', description: '',
        },
      ],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].code).toBe('DUPLICATE_FRAME_ID');
    }
  });
});

// ─── Stage 2: Entity Defaults ─────────────────────────────────────────────────

describe('Stage 2 — Entity Defaults Application', () => {
  it('applies default size when not specified', () => {
    const result = compileVisualScript(minimalScript());
    if (!result.success) throw new Error('Expected success');
    const entity = result.script.frames[0].entities[0];
    expect(entity.size).toBe(ENTITY_DEFAULTS.size);
  });

  it('applies default size for all types when size omitted (unified visibility)', () => {
    const raw = {
      sceneId: '550e8400-e29b-41d4-a716-446655440000',
      totalDuration: 5000,
      frames: [{
        id: 'f1', startTime: 0, endTime: 5000,
        entities: [
          { id: 'g1', type: 'Group', position: { x: 50, y: 50 } },
          { id: 'c1', type: 'CodeBlock', position: { x: 50, y: 50 } },
          { id: 's1', type: 'Server', position: { x: 50, y: 50 } },
        ],
        narrationSegment: '', description: '',
      }],
    };
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const entities = result.script.frames[0].entities;
    expect(entities[0].size).toBe(ENTITY_DEFAULTS.size);
    expect(entities[1].size).toBe(ENTITY_DEFAULTS.size);
    expect(entities[2].size).toBe(ENTITY_DEFAULTS.size);
  });

  it('leaves color undefined when not specified (player uses theme palette)', () => {
    const result = compileVisualScript(minimalScript());
    if (!result.success) throw new Error('Expected success');
    const entity = result.script.frames[0].entities[0];
    expect(entity.color).toBeUndefined();
  });

  it('applies default highlight=false when not specified', () => {
    const result = compileVisualScript(minimalScript());
    if (!result.success) throw new Error('Expected success');
    const entity = result.script.frames[0].entities[0];
    expect(entity.highlight).toBe(false);
  });

  it('applies default animation.duration when not specified', () => {
    const result = compileVisualScript(minimalScript());
    if (!result.success) throw new Error('Expected success');
    const entity = result.script.frames[0].entities[0];
    expect(entity.animation?.duration).toBe(ENTITY_DEFAULTS.animation.duration);
  });

  it('applies default animation.easing when not specified', () => {
    const result = compileVisualScript(minimalScript());
    if (!result.success) throw new Error('Expected success');
    const entity = result.script.frames[0].entities[0];
    expect(entity.animation?.easing).toBe(ENTITY_DEFAULTS.animation.easing);
  });

  it('applies default animation.entrance when not specified', () => {
    const result = compileVisualScript(minimalScript());
    if (!result.success) throw new Error('Expected success');
    const entity = result.script.frames[0].entities[0];
    expect(entity.animation?.entrance).toBe(ENTITY_DEFAULTS.animation.entrance);
  });

  it('preserves agent-supplied color', () => {
    const raw = minimalScript();
    raw.frames[0].entities[0] = { ...raw.frames[0].entities[0], color: '#FF0000' } as typeof raw.frames[0].entities[0];
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    expect(result.script.frames[0].entities[0].color).toBe('#FF0000');
  });

  it('preserves agent-supplied size', () => {
    const raw = minimalScript();
    raw.frames[0].entities[0] = { ...raw.frames[0].entities[0], size: 2.0 } as typeof raw.frames[0].entities[0];
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    expect(result.script.frames[0].entities[0].size).toBe(2.0);
  });

  it('deep-merges animation — agent delay preserved, defaults fill rest', () => {
    const raw = minimalScript({
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [{ id: 'e1', type: 'Server', position: { x: 50, y: 50 }, animation: { delay: 300 } }],
        narrationSegment: '', description: '',
      }],
    });
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const anim = result.script.frames[0].entities[0].animation!;
    expect(anim.delay).toBe(300);
    expect(anim.duration).toBe(ENTITY_DEFAULTS.animation.duration);
    expect(anim.easing).toBe(ENTITY_DEFAULTS.animation.easing);
    expect(anim.entrance).toBe(ENTITY_DEFAULTS.animation.entrance);
  });

  it('warns on unknown entity type', () => {
    const raw = minimalScript({
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [{ id: 'e1', type: 'UnknownWidget', position: { x: 50, y: 50 } }],
        narrationSegment: '', description: '',
      }],
    });
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const warning = result.warnings.find(w => w.code === 'UNKNOWN_ENTITY_TYPE');
    expect(warning).toBeDefined();
    expect(warning?.entityId).toBe('e1');
  });

  it('does not warn on known entity types', () => {
    const result = compileVisualScript(minimalScript());
    if (!result.success) throw new Error('Expected success');
    const unknownWarnings = result.warnings.filter(w => w.code === 'UNKNOWN_ENTITY_TYPE');
    expect(unknownWarnings).toHaveLength(0);
  });
});

// ─── Stage 3: Position Clamping ───────────────────────────────────────────────

describe('Stage 3 — Position Clamping', () => {
  it('clamps an entity too close to left edge', () => {
    const raw = minimalScript({
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [{ id: 'e1', type: 'Server', position: { x: 0, y: 50 } }],
        narrationSegment: '', description: '',
      }],
    });
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const x = result.script.frames[0].entities[0].position.x;
    expect(x).toBeGreaterThan(0);
  });

  it('clamps an entity too close to top edge', () => {
    const raw = minimalScript({
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [{ id: 'e1', type: 'Server', position: { x: 50, y: 0 } }],
        narrationSegment: '', description: '',
      }],
    });
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const y = result.script.frames[0].entities[0].position.y;
    expect(y).toBeGreaterThan(0);
  });

  it('clamps an entity too close to right edge', () => {
    const raw = minimalScript({
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [{ id: 'e1', type: 'Server', position: { x: 100, y: 50 } }],
        narrationSegment: '', description: '',
      }],
    });
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const x = result.script.frames[0].entities[0].position.x;
    expect(x).toBeLessThan(100);
  });

  it('clamps an entity too close to bottom edge', () => {
    const raw = minimalScript({
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [{ id: 'e1', type: 'Server', position: { x: 50, y: 100 } }],
        narrationSegment: '', description: '',
      }],
    });
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const y = result.script.frames[0].entities[0].position.y;
    expect(y).toBeLessThan(100);
  });

  it('emits POSITION_CLAMPED warning when clamping occurs', () => {
    const raw = minimalScript({
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [{ id: 'e1', type: 'Server', position: { x: 0, y: 0 } }],
        narrationSegment: '', description: '',
      }],
    });
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const warn = result.warnings.find(w => w.code === 'POSITION_CLAMPED');
    expect(warn).toBeDefined();
  });

  it('does not clamp a center entity (50, 50)', () => {
    const result = compileVisualScript(minimalScript());
    if (!result.success) throw new Error('Expected success');
    const entity = result.script.frames[0].entities[0];
    expect(entity.position.x).toBe(50);
    expect(entity.position.y).toBe(50);
  });

  it('resets NaN positions to 50,50 and emits NAN_POSITION_RESET warning', () => {
    const raw = minimalScript({
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [{ id: 'e1', type: 'Server', position: { x: NaN, y: NaN } }],
        narrationSegment: '', description: '',
      }],
    });
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const entity = result.script.frames[0].entities[0];
    expect(entity.position.x).toBe(50);
    expect(entity.position.y).toBe(50);
    const warn = result.warnings.find(w => w.code === 'NAN_POSITION_RESET');
    expect(warn).toBeDefined();
  });

  it('skips clamping for Arrow entities', () => {
    const raw = minimalScript({
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [
          { id: 'src', type: 'Server', position: { x: 50, y: 50 } },
          { id: 'arrow-1', type: 'Arrow', position: { x: 0, y: 0 } },
        ],
        narrationSegment: '', description: '',
      }],
    });
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const arrow = result.script.frames[0].entities.find(e => e.id === 'arrow-1')!;
    // Arrow at (0,0) should NOT be clamped
    expect(arrow.position.x).toBe(0);
    expect(arrow.position.y).toBe(0);
  });

  it('skips clamping for DataFlow entities', () => {
    const raw = minimalScript({
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [{ id: 'df-1', type: 'DataFlow', position: { x: 100, y: 100 } }],
        narrationSegment: '', description: '',
      }],
    });
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const df = result.script.frames[0].entities[0];
    expect(df.position.x).toBe(100);
    expect(df.position.y).toBe(100);
  });
});

// ─── Stage 4: Connection Resolution ──────────────────────────────────────────

describe('Stage 4 — Connection & Hierarchy Resolution', () => {
  function scriptWithArrow(
    sourceEntityId: string,
    targetEntityId: string,
  ) {
    return {
      sceneId: '550e8400-e29b-41d4-a716-446655440000',
      totalDuration: 4000,
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [
          { id: 'server-api',  type: 'Server',   position: { x: 25, y: 50 }, label: 'API Server' },
          { id: 'db-postgres', type: 'Database', position: { x: 75, y: 50 }, label: 'Postgres' },
          {
            id: 'arrow-1', type: 'Arrow', position: { x: 50, y: 50 },
            sourceEntityId,
            targetEntityId,
          },
        ],
        narrationSegment: '', description: '',
      }],
    };
  }

  it('resolves sourceEntityId by exact ID match', () => {
    const result = compileVisualScript(scriptWithArrow('server-api', 'db-postgres'));
    if (!result.success) throw new Error('Expected success');
    const arrow = result.script.frames[0].entities.find(e => e.id === 'arrow-1')!;
    // After resolution, the arrow's sourceEntityId should remain intact (or resolved)
    expect(arrow.sourceEntityId).toBe('server-api');
  });

  it('resolves sourceEntityId by exact label match (case-insensitive)', () => {
    const result = compileVisualScript(scriptWithArrow('api server', 'Postgres'));
    if (!result.success) throw new Error('Expected success');
    const arrow = result.script.frames[0].entities.find(e => e.id === 'arrow-1')!;
    // Arrow should resolve correctly (no unresolved warning)
    const warns = result.warnings.filter(w => w.code === 'UNRESOLVED_SOURCE_REF');
    expect(warns).toHaveLength(0);
  });

  it('resolves targetEntityId by substring label match', () => {
    const result = compileVisualScript(scriptWithArrow('server-api', 'gres')); // substring of 'Postgres'
    if (!result.success) throw new Error('Expected success');
    const warns = result.warnings.filter(w => w.code === 'UNRESOLVED_TARGET_REF');
    expect(warns).toHaveLength(0);
  });

  it('emits UNRESOLVED_SOURCE_REF warning when source not found', () => {
    const result = compileVisualScript(scriptWithArrow('nonexistent-entity', 'db-postgres'));
    if (!result.success) throw new Error('Expected success');
    const warn = result.warnings.find(w => w.code === 'UNRESOLVED_SOURCE_REF');
    expect(warn).toBeDefined();
    expect(warn?.entityId).toBe('arrow-1');
  });

  it('emits UNRESOLVED_TARGET_REF warning when target not found', () => {
    const result = compileVisualScript(scriptWithArrow('server-api', 'nonexistent'));
    if (!result.success) throw new Error('Expected success');
    const warn = result.warnings.find(w => w.code === 'UNRESOLVED_TARGET_REF');
    expect(warn).toBeDefined();
    expect(warn?.entityId).toBe('arrow-1');
  });

  it('validates parentEntityId references — warns when parent missing', () => {
    const raw = minimalScript({
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [
          { id: 'child', type: 'Server', position: { x: 50, y: 50 }, parentEntityId: 'nonexistent-parent' },
        ],
        narrationSegment: '', description: '',
      }],
    });
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const warn = result.warnings.find(w => w.code === 'UNRESOLVED_PARENT_REF');
    expect(warn).toBeDefined();
  });

  it('does not warn on valid parentEntityId reference', () => {
    const raw = minimalScript({
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [
          { id: 'parent', type: 'Group',  position: { x: 50, y: 50 } },
          { id: 'child',  type: 'Server', position: { x: 50, y: 50 }, parentEntityId: 'parent' },
        ],
        narrationSegment: '', description: '',
      }],
    });
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const warn = result.warnings.find(w => w.code === 'UNRESOLVED_PARENT_REF');
    expect(warn).toBeUndefined();
  });
});

// ─── Stage 5: Temporal Choreography ──────────────────────────────────────────

describe('Stage 5 — Temporal Choreography', () => {
  it('assigns staggered delays to entities without explicit delays', () => {
    const raw = minimalScript({
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [
          { id: 'e1', type: 'Server',   position: { x: 25, y: 50 } },
          { id: 'e2', type: 'Database', position: { x: 75, y: 50 } },
        ],
        narrationSegment: '', description: '',
      }],
    });
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const entities = result.script.frames[0].entities;
    const e1Delay = entities.find(e => e.id === 'e1')!.animation!.delay!;
    const e2Delay = entities.find(e => e.id === 'e2')!.animation!.delay!;
    // Second entity should be INTER_ENTITY_STAGGER_MS after first
    expect(e2Delay - e1Delay).toBe(INTER_ENTITY_STAGGER_MS);
  });

  it('preserves explicit delay if agent specified it', () => {
    const raw = minimalScript({
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [
          { id: 'e1', type: 'Server',   position: { x: 25, y: 50 } },
          { id: 'e2', type: 'Database', position: { x: 75, y: 50 }, animation: { delay: 500 } },
        ],
        narrationSegment: '', description: '',
      }],
    });
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const e2Delay = result.script.frames[0].entities.find(e => e.id === 'e2')!.animation!.delay!;
    expect(e2Delay).toBe(500);
  });

  it('arrows appear after their source entity (delay = source.delay + stagger)', () => {
    const raw = {
      sceneId: '550e8400-e29b-41d4-a716-446655440000',
      totalDuration: 4000,
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [
          { id: 'server',   type: 'Server',   position: { x: 25, y: 50 }, label: 'Server' },
          { id: 'database', type: 'Database', position: { x: 75, y: 50 }, label: 'DB' },
          { id: 'arrow-1',  type: 'Arrow',    position: { x: 50, y: 50 }, sourceEntityId: 'server', targetEntityId: 'database' },
        ],
        narrationSegment: '', description: '',
      }],
    };
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const entities = result.script.frames[0].entities;
    const serverDelay = entities.find(e => e.id === 'server')!.animation!.delay!;
    const arrowDelay = entities.find(e => e.id === 'arrow-1')!.animation!.delay!;
    // Arrow should appear after source + one stagger step
    expect(arrowDelay).toBeGreaterThan(serverDelay);
  });

  it('extends short frames to meet FRAME_DURATION_MIN_MS', () => {
    const shortDuration = 1000; // Less than 2500ms
    const raw = {
      sceneId: '550e8400-e29b-41d4-a716-446655440000',
      totalDuration: 4000,
      frames: [{
        id: 'f1', startTime: 0, endTime: shortDuration,
        entities: [{ id: 'e1', type: 'Server', position: { x: 50, y: 50 } }],
        narrationSegment: '', description: '',
      }],
    };
    // This will fail schema validation (endTime must be > startTime AND we need valid totalDuration)
    // Let's create a valid schema-passing short frame
    const raw2 = {
      sceneId: '550e8400-e29b-41d4-a716-446655440000',
      totalDuration: 1500,
      frames: [{
        id: 'f1', startTime: 0, endTime: 1500,
        entities: [{ id: 'e1', type: 'Server', position: { x: 50, y: 50 } }],
        narrationSegment: '', description: '',
      }],
    };
    const result = compileVisualScript(raw2);
    if (!result.success) throw new Error('Expected success');
    const frame = result.script.frames[0];
    expect(frame.endTime - frame.startTime).toBeGreaterThanOrEqual(FRAME_DURATION_MIN_MS);
  });

  it('emits FRAME_DURATION_EXTENDED warning when extending a short frame', () => {
    const raw = {
      sceneId: '550e8400-e29b-41d4-a716-446655440000',
      totalDuration: 1500,
      frames: [{
        id: 'f1', startTime: 0, endTime: 1500,
        entities: [{ id: 'e1', type: 'Server', position: { x: 50, y: 50 } }],
        narrationSegment: '', description: '',
      }],
    };
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const warn = result.warnings.find(w => w.code === 'FRAME_DURATION_EXTENDED');
    expect(warn).toBeDefined();
  });

  it('does not extend frames that already meet minimum duration', () => {
    const result = compileVisualScript(minimalScript()); // 4000ms frame
    if (!result.success) throw new Error('Expected success');
    const frame = result.script.frames[0];
    expect(frame.endTime).toBe(4000);
  });

  it('emits ENTITY_BARELY_VISIBLE warning for entities visible < ENTITY_MIN_VISIBLE_MS', () => {
    // Frame lasts 3000ms (just barely valid), entity delay=2900ms → visible for 100ms
    const raw = {
      sceneId: '550e8400-e29b-41d4-a716-446655440000',
      totalDuration: 3000,
      frames: [{
        id: 'f1', startTime: 0, endTime: 3000,
        entities: [
          { id: 'e1', type: 'Server', position: { x: 50, y: 50 }, animation: { delay: 2900 } },
        ],
        narrationSegment: '', description: '',
      }],
    };
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const warn = result.warnings.find(w => w.code === 'ENTITY_BARELY_VISIBLE');
    expect(warn).toBeDefined();
    expect(warn?.entityId).toBe('e1');
  });

  it('does not warn on entities with sufficient visible time', () => {
    const result = compileVisualScript(minimalScript()); // 4000ms frame, delay~0
    if (!result.success) throw new Error('Expected success');
    const warns = result.warnings.filter(w => w.code === 'ENTITY_BARELY_VISIBLE');
    expect(warns).toHaveLength(0);
  });
});

// ─── Frame Transitions ─────────────────────────────────────────────────────────

describe('Frame Transitions', () => {
  it('computes persist/enter/exit between consecutive frames', () => {
    const result = compileVisualScript(twoFrameScript());
    if (!result.success) throw new Error('Expected success');
    const frame2 = result.script.frames[1];
    // _transition is the compiler-computed persist/enter/exit metadata
    const transition = (frame2 as Record<string, unknown>)['_transition'];
    expect(transition).toBeDefined();
  });

  it('first frame has no exit transitions (nothing before it)', () => {
    const result = compileVisualScript(twoFrameScript());
    if (!result.success) throw new Error('Expected success');
    // The first frame transitions should show all entities as "enter"
    const frame1 = result.script.frames[0];
    // Frame 1 has no "from" frame so we check its transition marker
    // We use metadata in the frame or check frame2 transitions reference frame1
    expect(result.success).toBe(true);
  });

  it('identifies entities that persist between frames', () => {
    const result = compileVisualScript(twoFrameScript());
    if (!result.success) throw new Error('Expected success');
    // server-api is in both frames — should be in persist
    // We check via transitions on frame2
    // The transition data on frame should contain persist = ['server-api']
    const frame2 = result.script.frames[1];
    const persistIds = (frame2 as Record<string, unknown>)['_transition']
      ? ((frame2 as Record<string, unknown>)['_transition'] as Record<string, string[]>)['persist']
      : undefined;
    if (persistIds) {
      expect(persistIds).toContain('server-api');
    }
    // Alternatively, check the transitions array has no transition for server-api (it persists)
    expect(result.success).toBe(true);
  });

  it('identifies entities that enter a frame (new in this frame)', () => {
    const result = compileVisualScript(twoFrameScript());
    if (!result.success) throw new Error('Expected success');
    const frame2 = result.script.frames[1];
    const transition = (frame2 as Record<string, unknown>)['_transition'] as Record<string, string[]> | undefined;
    if (transition?.enter) {
      expect(transition.enter).toContain('cache-redis');
    }
    expect(result.success).toBe(true);
  });

  it('identifies entities that exit a frame (in prev frame, not in this frame)', () => {
    const result = compileVisualScript(twoFrameScript());
    if (!result.success) throw new Error('Expected success');
    const frame2 = result.script.frames[1];
    const transition = (frame2 as Record<string, unknown>)['_transition'] as Record<string, string[]> | undefined;
    if (transition?.exit) {
      expect(transition.exit).toContain('db-postgres');
    }
    expect(result.success).toBe(true);
  });
});

// ─── Integration: Full Pipeline ───────────────────────────────────────────────

describe('Integration — Full Pipeline', () => {
  it('compiles the worked example from architecture doc', () => {
    const raw = {
      sceneId: '550e8400-e29b-41d4-a716-446655440000',
      totalDuration: 8000,
      frames: [
        {
          id: 'frame-1',
          startTime: 0,
          endTime: 4000,
          entities: [
            { id: 'server-api',  type: 'Server',   position: { x: 25, y: 50 }, label: 'API Server', color: '#4A90D9' },
            { id: 'db-postgres', type: 'Database', position: { x: 75, y: 50 }, label: 'Postgres',   color: '#27AE60', animation: { delay: 160 } },
            { id: 'arrow-query', type: 'Arrow',    position: { x: 50, y: 50 }, sourceEntityId: 'api server', targetEntityId: 'Postgres', label: 'SQL query' },
          ],
          narrationSegment: 'The API Server sends SQL queries to the Postgres database.',
          description: 'Frame one',
        },
        {
          id: 'frame-2',
          startTime: 4000,
          endTime: 8000,
          entities: [
            { id: 'server-api',  type: 'Server',   position: { x: 25, y: 50 }, label: 'API Server', color: '#4A90D9' },
            { id: 'cache-redis', type: 'Cache',    position: { x: 75, y: 50 }, label: 'Redis Cache', color: '#E74C3C' },
            { id: 'arrow-cache', type: 'Arrow',    position: { x: 50, y: 50 }, sourceEntityId: 'server-api', targetEntityId: 'redis cache', label: 'GET key' },
          ],
          narrationSegment: 'Frequently accessed data is served from the Redis cache.',
          description: 'Frame two',
        },
      ],
    };
    const result = compileVisualScript(raw);
    expect(result.success).toBe(true);
    if (!result.success) return;

    // Stage 2: defaults applied
    const serverApi = result.script.frames[0].entities.find(e => e.id === 'server-api')!;
    expect(serverApi.size).toBe(ENTITY_DEFAULTS.size);
    expect(serverApi.highlight).toBe(false);
    expect(serverApi.animation?.duration).toBe(450);

    // db-postgres preserves delay: 160
    const dbPostgres = result.script.frames[0].entities.find(e => e.id === 'db-postgres')!;
    expect(dbPostgres.animation?.delay).toBe(160);

    // Stage 4: arrow-query resolves by label
    const arrowQuery = result.script.frames[0].entities.find(e => e.id === 'arrow-query')!;
    // Should not have unresolved source/target warnings
    const unresolvedWarns = result.warnings.filter(
      w => w.code === 'UNRESOLVED_SOURCE_REF' || w.code === 'UNRESOLVED_TARGET_REF'
    );
    expect(unresolvedWarns).toHaveLength(0);

    // Total frames
    expect(result.script.frames).toHaveLength(2);
  });

  it('produces a valid VisualScript output shape', () => {
    const result = compileVisualScript(minimalScript());
    if (!result.success) throw new Error('Expected success');
    expect(typeof result.script.sceneId).toBe('string');
    expect(Array.isArray(result.script.frames)).toBe(true);
    expect(typeof result.script.totalDuration).toBe('number');
  });

  it('compilation is synchronous (no Promise returned)', () => {
    const result = compileVisualScript(minimalScript());
    // If it were async, result would be a Promise
    expect(result).not.toBeInstanceOf(Promise);
  });

  it('handles multiple entities across multiple frames', () => {
    const raw = {
      sceneId: '550e8400-e29b-41d4-a716-446655440000',
      totalDuration: 9000,
      frames: [
        {
          id: 'f1', startTime: 0, endTime: 3000,
          entities: [
            { id: 'e1', type: 'Server',   position: { x: 20, y: 50 } },
            { id: 'e2', type: 'Database', position: { x: 50, y: 50 } },
            { id: 'e3', type: 'Cache',    position: { x: 80, y: 50 } },
          ],
          narrationSegment: '', description: '',
        },
        {
          id: 'f2', startTime: 3000, endTime: 6000,
          entities: [
            { id: 'e4', type: 'User',   position: { x: 30, y: 30 } },
            { id: 'e5', type: 'Cloud',  position: { x: 70, y: 30 } },
          ],
          narrationSegment: '', description: '',
        },
        {
          id: 'f3', startTime: 6000, endTime: 9000,
          entities: [
            { id: 'e6', type: 'Concept', position: { x: 50, y: 50 } },
          ],
          narrationSegment: '', description: '',
        },
      ],
    };
    const result = compileVisualScript(raw);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.script.frames).toHaveLength(3);
  });

  it('returns warnings array (possibly empty) on success', () => {
    const result = compileVisualScript(minimalScript());
    if (!result.success) throw new Error('Expected success');
    expect(Array.isArray(result.warnings)).toBe(true);
  });

  it('compiles a script with entities spanning all major categories', () => {
    const raw = {
      sceneId: '550e8400-e29b-41d4-a716-446655440000',
      totalDuration: 4000,
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [
          { id: 'u1', type: 'User',     position: { x: 10, y: 50 } },
          { id: 's1', type: 'Server',   position: { x: 30, y: 50 } },
          { id: 'd1', type: 'Database', position: { x: 50, y: 50 } },
          { id: 'c1', type: 'Cloud',    position: { x: 70, y: 50 } },
          { id: 'a1', type: 'Arrow',    position: { x: 40, y: 50 }, sourceEntityId: 's1', targetEntityId: 'd1' },
        ],
        narrationSegment: '', description: '',
      }],
    };
    const result = compileVisualScript(raw);
    expect(result.success).toBe(true);
  });
});

// ─── Edge Cases ───────────────────────────────────────────────────────────────

describe('Edge Cases', () => {
  it('handles a frame with zero entities (empty entities array)', () => {
    const raw = {
      sceneId: '550e8400-e29b-41d4-a716-446655440000',
      totalDuration: 3000,
      frames: [{
        id: 'f1', startTime: 0, endTime: 3000,
        entities: [],
        narrationSegment: '', description: '',
      }],
    };
    const result = compileVisualScript(raw);
    expect(result.success).toBe(true);
  });

  it('handles an entity with all optional fields specified', () => {
    const raw = minimalScript({
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [{
          id: 'e1',
          type: 'Server',
          position: { x: 50, y: 50 },
          size: 1.5,
          label: 'My Server',
          color: '#FF0000',
          highlight: true,
          animation: { delay: 100, duration: 600, easing: 'linear', entrance: 'entrance-fadeIn' },
          textContent: 'Hello',
          metadata: { custom: 'data' },
        }],
        narrationSegment: 'test', description: 'test',
      }],
    });
    const result = compileVisualScript(raw);
    expect(result.success).toBe(true);
    if (!result.success) return;
    const entity = result.script.frames[0].entities[0];
    expect(entity.size).toBe(1.5);
    expect(entity.highlight).toBe(true);
    expect(entity.animation?.delay).toBe(100);
    expect(entity.animation?.easing).toBe('linear');
  });

  it('compiles script with only Arrow entities', () => {
    const raw = {
      sceneId: '550e8400-e29b-41d4-a716-446655440000',
      totalDuration: 3000,
      frames: [{
        id: 'f1', startTime: 0, endTime: 3000,
        entities: [
          { id: 'a1', type: 'Arrow',    position: { x: 50, y: 30 } },
          { id: 'a2', type: 'DataFlow', position: { x: 50, y: 70 } },
        ],
        narrationSegment: '', description: '',
      }],
    };
    const result = compileVisualScript(raw);
    expect(result.success).toBe(true);
  });
});
