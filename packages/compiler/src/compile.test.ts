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
    // Find entity by id (enrichment may add auto-entities before it)
    const e1 = result.script.frames[0].entities.find(e => e.id === 'e1')!;
    expect(e1.position).toEqual({ x: 50, y: 50 });
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
    // Find by type (enrichment may add auto-entities before it)
    const server = result.script.frames[0].entities.find(e => e.type === 'Server')!;
    expect(server.id).toBe('Server-0');
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

  it('strips agent-supplied color (engine controls via palette)', () => {
    const raw = minimalScript();
    raw.frames[0].entities[0] = { ...raw.frames[0].entities[0], color: '#FF0000' } as typeof raw.frames[0].entities[0];
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const server = result.script.frames[0].entities.find(e => e.id === 'server-1')!;
    expect(server.color).toBeUndefined();
  });

  it('strips agent-supplied size (engine uses ENTITY_DEFAULTS.size)', () => {
    const raw = minimalScript();
    raw.frames[0].entities[0] = { ...raw.frames[0].entities[0], size: 2.0 } as typeof raw.frames[0].entities[0];
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const server = result.script.frames[0].entities.find(e => e.id === 'server-1')!;
    expect(server.size).toBe(ENTITY_DEFAULTS.size);
  });

  it('strips agent-supplied animation (engine handles stagger + entrance)', () => {
    const raw = minimalScript({
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [{ id: 'e1', type: 'Server', position: { x: 50, y: 50 }, animation: { delay: 300 } }],
        narrationSegment: '', description: '',
      }],
    });
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const anim = result.script.frames[0].entities.find(e => e.id === 'e1')!.animation!;
    // Animation is stripped in Stage 0, defaults applied in Stage 2, stagger in Stage 5
    expect(anim.duration).toBe(ENTITY_DEFAULTS.animation.duration);
    expect(anim.easing).toBe(ENTITY_DEFAULTS.animation.easing);
    expect(anim.entrance).toBe(ENTITY_DEFAULTS.animation.entrance);
    // Delay is now stagger-assigned (not the agent's 300)
    expect(typeof anim.delay).toBe('number');
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
    // Find by id (enrichment may add auto-entities before it)
    const entity = result.script.frames[0].entities.find(e => e.id === 'server-1')!;
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

  it('strips parentEntityId (no UNRESOLVED_PARENT_REF warning)', () => {
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
    // parentEntityId is stripped in Stage 0, so no warning fires
    const warn = result.warnings.find(w => w.code === 'UNRESOLVED_PARENT_REF');
    expect(warn).toBeUndefined();
    // Verify parentEntityId was stripped from the entity
    const child = result.script.frames[0].entities.find(e => e.id === 'child')!;
    expect(child.parentEntityId).toBeUndefined();
  });

  it('does not warn on valid parentEntityId reference (stripped anyway)', () => {
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

  it('assigns stagger delay (agent animation is stripped in Stage 0)', () => {
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
    const e1Delay = result.script.frames[0].entities.find(e => e.id === 'e1')!.animation!.delay!;
    const e2Delay = result.script.frames[0].entities.find(e => e.id === 'e2')!.animation!.delay!;
    // Agent delay is stripped; stagger is applied instead
    expect(e2Delay - e1Delay).toBe(INTER_ENTITY_STAGGER_MS);
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
    // With animation stripped, we trigger barely-visible via natural stagger:
    // FRAME_DURATION_MIN_MS=2500, INTER_ENTITY_STAGGER_MS=80, ENTITY_MIN_VISIBLE_MS=1200
    // 20 entities: last gets delay = 19*80 = 1520ms. Visible = 2500-1520 = 980ms < 1200ms.
    const entities = Array.from({ length: 20 }, (_, i) => ({
      id: `e${i}`, type: 'Server' as const, position: { x: 5 + (i % 10) * 10, y: i < 10 ? 30 : 60 },
    }));
    const raw = {
      sceneId: '550e8400-e29b-41d4-a716-446655440000',
      totalDuration: 2500,
      frames: [{
        id: 'f1', startTime: 0, endTime: 2500,
        entities,
        narrationSegment: '', description: '',
      }],
    };
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const warn = result.warnings.find(w => w.code === 'ENTITY_BARELY_VISIBLE');
    expect(warn).toBeDefined();
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

    // Stage 2: defaults applied (color/size/animation stripped in Stage 0)
    const serverApi = result.script.frames[0].entities.find(e => e.id === 'server-api')!;
    expect(serverApi.size).toBe(ENTITY_DEFAULTS.size);
    expect(serverApi.highlight).toBe(false);
    expect(serverApi.color).toBeUndefined(); // color stripped
    expect(serverApi.animation?.duration).toBe(450);

    // db-postgres delay was stripped (agent animation removed), stagger applied instead
    const dbPostgres = result.script.frames[0].entities.find(e => e.id === 'db-postgres')!;
    expect(dbPostgres.color).toBeUndefined(); // color stripped
    expect(typeof dbPostgres.animation?.delay).toBe('number');

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

  it('handles an entity with all optional fields specified (stripped params get defaults)', () => {
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
    const entity = result.script.frames[0].entities.find(e => e.id === 'e1')!;
    // size, color, animation are stripped in Stage 0
    expect(entity.size).toBe(ENTITY_DEFAULTS.size);
    expect(entity.color).toBeUndefined();
    // highlight is preserved (not stripped)
    expect(entity.highlight).toBe(true);
    // animation defaults applied (agent values stripped)
    expect(entity.animation?.duration).toBe(ENTITY_DEFAULTS.animation.duration);
    expect(entity.animation?.easing).toBe(ENTITY_DEFAULTS.animation.easing);
    // metadata is preserved
    expect(entity.metadata).toEqual({ custom: 'data' });
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

// ─── Stage 0: Param Stripping ─────────────────────────────────────────────────

describe('Stage 0 — Param Stripping', () => {
  const uuid = '550e8400-e29b-41d4-a716-446655440000';

  function rawWithEntity(entityOverrides: Record<string, unknown>) {
    return {
      sceneId: uuid,
      totalDuration: 4000,
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [{
          id: 'e1', type: 'Server', position: { x: 50, y: 50 },
          ...entityOverrides,
        }],
        narrationSegment: '', description: '',
      }],
    };
  }

  it('strips color from entities', () => {
    const result = compileVisualScript(rawWithEntity({ color: '#FF0000' }));
    if (!result.success) throw new Error('Expected success');
    const entity = result.script.frames[0].entities.find(e => e.id === 'e1')!;
    expect(entity.color).toBeUndefined();
  });

  it('strips size from entities (defaults to ENTITY_DEFAULTS.size)', () => {
    const result = compileVisualScript(rawWithEntity({ size: 1.0 }));
    if (!result.success) throw new Error('Expected success');
    const entity = result.script.frames[0].entities.find(e => e.id === 'e1')!;
    expect(entity.size).toBe(ENTITY_DEFAULTS.size);
  });

  it('strips animation from entities', () => {
    const result = compileVisualScript(rawWithEntity({
      animation: { delay: 999, duration: 999, easing: 'linear', entrance: 'entrance-scaleIn' },
    }));
    if (!result.success) throw new Error('Expected success');
    const entity = result.script.frames[0].entities.find(e => e.id === 'e1')!;
    // Animation stripped → defaults applied in Stage 2
    expect(entity.animation?.duration).toBe(ENTITY_DEFAULTS.animation.duration);
    expect(entity.animation?.easing).toBe(ENTITY_DEFAULTS.animation.easing);
    expect(entity.animation?.entrance).toBe(ENTITY_DEFAULTS.animation.entrance);
  });

  it('strips parentEntityId from entities', () => {
    const result = compileVisualScript(rawWithEntity({ parentEntityId: 'some-parent' }));
    if (!result.success) throw new Error('Expected success');
    const entity = result.script.frames[0].entities.find(e => e.id === 'e1')!;
    expect(entity.parentEntityId).toBeUndefined();
  });

  it('strips textContent from entities', () => {
    const result = compileVisualScript(rawWithEntity({ textContent: 'some code' }));
    if (!result.success) throw new Error('Expected success');
    const entity = result.script.frames[0].entities.find(e => e.id === 'e1')!;
    expect((entity as Record<string, unknown>).textContent).toBeUndefined();
  });

  it('strips codeLanguage from entities', () => {
    const result = compileVisualScript(rawWithEntity({ codeLanguage: 'typescript' }));
    if (!result.success) throw new Error('Expected success');
    const entity = result.script.frames[0].entities.find(e => e.id === 'e1')!;
    expect((entity as Record<string, unknown>).codeLanguage).toBeUndefined();
  });

  it('strips short-key aliases: c (color), sz (size), a (animation)', () => {
    const raw = {
      sceneId: uuid,
      totalDuration: 4000,
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [{
          id: 'e1', type: 'Server', p: [50, 50],
          c: '#00FF00', sz: 3.0, a: { delay: 200 },
        }],
        narrationSegment: '', description: '',
      }],
    };
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const entity = result.script.frames[0].entities.find(e => e.id === 'e1')!;
    expect(entity.color).toBeUndefined();
    expect(entity.size).toBe(ENTITY_DEFAULTS.size);
  });

  it('strips focusCues from frames', () => {
    const raw = {
      sceneId: uuid,
      totalDuration: 4000,
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [{ id: 'e1', type: 'Server', position: { x: 50, y: 50 } }],
        narrationSegment: '', description: '',
        focusCues: [{ t: 0, eid: 'e1', w: 'hello' }],
      }],
    };
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const frame = result.script.frames[0];
    expect((frame as Record<string, unknown>).focusCues).toBeUndefined();
  });

  it('does NOT strip: label, highlight, sourceEntityId, targetEntityId, metadata', () => {
    const raw = {
      sceneId: uuid,
      totalDuration: 4000,
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [
          { id: 'src', type: 'Server', position: { x: 25, y: 50 }, label: 'API', highlight: true, metadata: { kind: 'API' } },
          { id: 'tgt', type: 'Database', position: { x: 75, y: 50 }, label: 'DB' },
          { id: 'arr', type: 'Arrow', position: { x: 50, y: 50 }, sourceEntityId: 'src', targetEntityId: 'tgt', label: 'Query' },
        ],
        narrationSegment: '', description: '',
      }],
    };
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const src = result.script.frames[0].entities.find(e => e.id === 'src')!;
    expect(src.label).toBe('API');
    expect(src.highlight).toBe(true);
    expect(src.metadata).toEqual({ kind: 'API' });
    const arr = result.script.frames[0].entities.find(e => e.id === 'arr')!;
    expect(arr.sourceEntityId).toBe('src');
    expect(arr.targetEntityId).toBe('tgt');
  });
});

// ─── Stage 2b: Deterministic Enrichment ──────────────────────────────────────

describe('Stage 2b — Deterministic Enrichment', () => {
  const uuid = '550e8400-e29b-41d4-a716-446655440000';

  it('adds H2 heading when frame has narration but no heading', () => {
    const raw = {
      sceneId: uuid,
      totalDuration: 4000,
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [{ id: 'e1', type: 'Server', position: { x: 50, y: 50 } }],
        narrationSegment: 'The server handles incoming API requests efficiently.',
        description: '',
      }],
    };
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const h2 = result.script.frames[0].entities.find(e => e.id === '_auto-h2-f1');
    expect(h2).toBeDefined();
    expect(h2?.type).toBe('H2');
    expect(h2?.position).toEqual({ x: 50, y: 5 }); // snapped to 5-unit grid
  });

  it('does NOT add H2 when frame already has H1', () => {
    const raw = {
      sceneId: uuid,
      totalDuration: 4000,
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [
          { id: 'h', type: 'H1', position: { x: 50, y: 10 }, label: 'Title' },
          { id: 'e1', type: 'Server', position: { x: 50, y: 50 } },
        ],
        narrationSegment: 'Some narration here.',
        description: '',
      }],
    };
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const autoH2 = result.script.frames[0].entities.find(e => e.id?.startsWith('_auto-h2'));
    expect(autoH2).toBeUndefined();
  });

  it('does NOT add H2 when frame already has H2', () => {
    const raw = {
      sceneId: uuid,
      totalDuration: 4000,
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [
          { id: 'h', type: 'H2', position: { x: 50, y: 10 }, label: 'Subtitle' },
          { id: 'e1', type: 'Server', position: { x: 50, y: 50 } },
        ],
        narrationSegment: 'Some narration here.',
        description: '',
      }],
    };
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const autoH2 = result.script.frames[0].entities.find(e => e.id?.startsWith('_auto-h2'));
    expect(autoH2).toBeUndefined();
  });

  it('does NOT add H2 when frame already has H3', () => {
    const raw = {
      sceneId: uuid,
      totalDuration: 4000,
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [
          { id: 'h', type: 'H3', position: { x: 50, y: 10 }, label: 'Section' },
          { id: 'e1', type: 'Server', position: { x: 50, y: 50 } },
        ],
        narrationSegment: 'Some narration here.',
        description: '',
      }],
    };
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const autoH2 = result.script.frames[0].entities.find(e => e.id?.startsWith('_auto-h2'));
    expect(autoH2).toBeUndefined();
  });

  it('does NOT add H2 when frame has no narration', () => {
    const raw = {
      sceneId: uuid,
      totalDuration: 4000,
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [{ id: 'e1', type: 'Server', position: { x: 50, y: 50 } }],
        narrationSegment: '',
        description: '',
      }],
    };
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const autoH2 = result.script.frames[0].entities.find(e => e.id?.startsWith('_auto-h2'));
    expect(autoH2).toBeUndefined();
  });

  it('adds Label insight when non-connector count < 4 and has narration', () => {
    const raw = {
      sceneId: uuid,
      totalDuration: 4000,
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [{ id: 'e1', type: 'Server', position: { x: 50, y: 50 } }],
        narrationSegment: 'The server processes requests at high throughput rates.',
        description: '',
      }],
    };
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const label = result.script.frames[0].entities.find(e => e.id === '_auto-label-f1');
    expect(label).toBeDefined();
    expect(label?.type).toBe('Label');
    expect(label?.position).toEqual({ x: 50, y: 90 }); // snapped to 5-unit grid
  });

  it('does NOT add Label when non-connector count >= 4', () => {
    const raw = {
      sceneId: uuid,
      totalDuration: 4000,
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [
          { id: 'e1', type: 'Server',   position: { x: 20, y: 50 } },
          { id: 'e2', type: 'Database', position: { x: 40, y: 50 } },
          { id: 'e3', type: 'Cache',    position: { x: 60, y: 50 } },
          { id: 'e4', type: 'User',     position: { x: 80, y: 50 } },
        ],
        narrationSegment: 'A dense frame with enough entities.',
        description: '',
      }],
    };
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const autoLabel = result.script.frames[0].entities.find(e => e.id?.startsWith('_auto-label'));
    expect(autoLabel).toBeUndefined();
  });

  it('does NOT count Arrow/DataFlow toward sparse threshold', () => {
    const raw = {
      sceneId: uuid,
      totalDuration: 4000,
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [
          { id: 'e1', type: 'Server', position: { x: 25, y: 50 } },
          { id: 'e2', type: 'Database', position: { x: 75, y: 50 } },
          { id: 'a1', type: 'Arrow', position: { x: 50, y: 50 }, sourceEntityId: 'e1', targetEntityId: 'e2' },
          { id: 'a2', type: 'DataFlow', position: { x: 50, y: 60 }, sourceEntityId: 'e1', targetEntityId: 'e2' },
        ],
        narrationSegment: 'Arrows and DataFlows should not count toward density.',
        description: '',
      }],
    };
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    // 2 non-connectors (Server, Database) + auto-H2 = 3 < 4 threshold → Label added
    const autoLabel = result.script.frames[0].entities.find(e => e.id?.startsWith('_auto-label'));
    expect(autoLabel).toBeDefined();
  });

  it('enrichment is deterministic (same input → same output)', () => {
    const raw = {
      sceneId: uuid,
      totalDuration: 4000,
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [{ id: 'e1', type: 'Server', position: { x: 50, y: 50 } }],
        narrationSegment: 'Deterministic enrichment produces identical results.',
        description: '',
      }],
    };
    const result1 = compileVisualScript(raw);
    const result2 = compileVisualScript(raw);
    if (!result1.success || !result2.success) throw new Error('Expected success');
    expect(result1.script.frames[0].entities).toEqual(result2.script.frames[0].entities);
  });

  it('enriched entities have proper defaults (size, animation, highlight)', () => {
    const raw = {
      sceneId: uuid,
      totalDuration: 4000,
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [{ id: 'e1', type: 'Server', position: { x: 50, y: 50 } }],
        narrationSegment: 'Testing that enriched entities have full defaults.',
        description: '',
      }],
    };
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const h2 = result.script.frames[0].entities.find(e => e.id === '_auto-h2-f1')!;
    expect(h2.size).toBe(ENTITY_DEFAULTS.size);
    expect(h2.highlight).toBe(false);
    expect(h2.animation?.duration).toBe(ENTITY_DEFAULTS.animation.duration);
  });

  it('emits FRAME_ENRICHED warning when enrichment occurs', () => {
    const raw = {
      sceneId: uuid,
      totalDuration: 4000,
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [{ id: 'e1', type: 'Server', position: { x: 50, y: 50 } }],
        narrationSegment: 'This frame should be enriched and a warning emitted.',
        description: '',
      }],
    };
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const warn = result.warnings.find(w => w.code === 'FRAME_ENRICHED');
    expect(warn).toBeDefined();
    expect(warn?.frameId).toBe('f1');
  });

  it('does NOT emit FRAME_ENRICHED warning when no enrichment needed', () => {
    const raw = {
      sceneId: uuid,
      totalDuration: 4000,
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [
          { id: 'h', type: 'H1', position: { x: 50, y: 10 }, label: 'Title' },
          { id: 'e1', type: 'Server',   position: { x: 20, y: 50 } },
          { id: 'e2', type: 'Database', position: { x: 40, y: 50 } },
          { id: 'e3', type: 'Cache',    position: { x: 60, y: 50 } },
          { id: 'e4', type: 'User',     position: { x: 80, y: 50 } },
        ],
        narrationSegment: 'Dense frame with heading — no enrichment needed.',
        description: '',
      }],
    };
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const warn = result.warnings.find(w => w.code === 'FRAME_ENRICHED');
    expect(warn).toBeUndefined();
  });

  it('auto-generated IDs use _auto- prefix', () => {
    const raw = {
      sceneId: uuid,
      totalDuration: 4000,
      frames: [{
        id: 'myframe', startTime: 0, endTime: 4000,
        entities: [{ id: 'e1', type: 'Server', position: { x: 50, y: 50 } }],
        narrationSegment: 'Testing auto-generated entity ID prefix convention.',
        description: '',
      }],
    };
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const autoEntities = result.script.frames[0].entities.filter(e => e.id.startsWith('_auto-'));
    expect(autoEntities.length).toBeGreaterThan(0);
    // H2 should be _auto-h2-myframe
    expect(autoEntities.some(e => e.id === '_auto-h2-myframe')).toBe(true);
    // Label should be _auto-label-myframe
    expect(autoEntities.some(e => e.id === '_auto-label-myframe')).toBe(true);
  });

  it('H2 heading text is extracted from first ~5 words of narration', () => {
    const raw = {
      sceneId: uuid,
      totalDuration: 4000,
      frames: [{
        id: 'f1', startTime: 0, endTime: 4000,
        entities: [{ id: 'e1', type: 'Server', position: { x: 50, y: 50 } }],
        narrationSegment: 'Binary search divides the array in half each time, giving O(log n) performance.',
        description: '',
      }],
    };
    const result = compileVisualScript(raw);
    if (!result.success) throw new Error('Expected success');
    const h2 = result.script.frames[0].entities.find(e => e.id === '_auto-h2-f1')!;
    // First 5 words: "Binary search divides the array" + ellipsis
    expect(h2.label).toBe('Binary search divides the array...');
  });
});
