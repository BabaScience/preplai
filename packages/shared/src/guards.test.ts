/**
 * @preplai/shared — Type Guards & Utility Functions Tests
 * TDD: Tests written FIRST, implementation follows.
 */
import { describe, it, expect } from 'vitest';
import {
  isVisualEntity,
  isVisualScript,
  isArrowType,
  isConnectionType,
  requiresMetadata,
  applyEntityDefaults,
  buildEntityMap,
  assignEntranceDelays,
  validateVisualScript,
  resolveEntityRef,
} from './guards.js';
import { ENTITY_DEFAULTS, INTER_ENTITY_STAGGER_MS } from './constants.js';
import type { VisualEntity, VisualScript } from './types.js';

// ── Test Fixtures ─────────────────────────────────────────────────────

function makeEntity(overrides: Partial<VisualEntity> = {}): VisualEntity {
  return {
    id: 'test-1',
    type: 'Server',
    position: { x: 50, y: 50 },
    ...overrides,
  } as VisualEntity;
}

function makeScript(overrides: Partial<VisualScript> = {}): VisualScript {
  return {
    sceneId: '550e8400-e29b-41d4-a716-446655440000',
    frames: [
      {
        id: 'frame-1',
        startTime: 0,
        endTime: 4000,
        entities: [makeEntity()],
        narrationSegment: 'Test narration',
        description: 'Test frame',
      },
    ],
    totalDuration: 4000,
    ...overrides,
  };
}

// ── isVisualEntity ────────────────────────────────────────────────────

describe('isVisualEntity', () => {
  it('should return true for valid VisualEntity', () => {
    expect(isVisualEntity(makeEntity())).toBe(true);
  });

  it('should return true for minimal entity (just id, type, position)', () => {
    expect(isVisualEntity({ id: 's1', type: 'Server', position: { x: 0, y: 0 } })).toBe(true);
  });

  it('should return false for null', () => {
    expect(isVisualEntity(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(isVisualEntity(undefined)).toBe(false);
  });

  it('should return false for string', () => {
    expect(isVisualEntity('Server')).toBe(false);
  });

  it('should return false for object missing id', () => {
    expect(isVisualEntity({ type: 'Server', position: { x: 0, y: 0 } })).toBe(false);
  });

  it('should return false for object missing type', () => {
    expect(isVisualEntity({ id: 's1', position: { x: 0, y: 0 } })).toBe(false);
  });

  it('should return false for object missing position', () => {
    expect(isVisualEntity({ id: 's1', type: 'Server' })).toBe(false);
  });
});

// ── isVisualScript ────────────────────────────────────────────────────

describe('isVisualScript', () => {
  it('should return true for valid VisualScript', () => {
    expect(isVisualScript(makeScript())).toBe(true);
  });

  it('should return false for null', () => {
    expect(isVisualScript(null)).toBe(false);
  });

  it('should return false for object missing sceneId', () => {
    expect(isVisualScript({ frames: [], totalDuration: 0 })).toBe(false);
  });

  it('should return false for object with non-array frames', () => {
    expect(isVisualScript({ sceneId: 'abc', frames: 'not-array', totalDuration: 0 })).toBe(false);
  });
});

// ── isArrowType ───────────────────────────────────────────────────────

describe('isArrowType', () => {
  it('should identify Arrow as arrow type', () => {
    expect(isArrowType('Arrow')).toBe(true);
  });

  it('should identify DataFlow as arrow type', () => {
    expect(isArrowType('DataFlow')).toBe(true);
  });

  it('should identify BidirectArrow as arrow type', () => {
    expect(isArrowType('BidirectArrow')).toBe(true);
  });

  it('should identify DottedArrow as arrow type', () => {
    expect(isArrowType('DottedArrow')).toBe(true);
  });

  it('should not identify Server as arrow type', () => {
    expect(isArrowType('Server')).toBe(false);
  });

  it('should not identify Database as arrow type', () => {
    expect(isArrowType('Database')).toBe(false);
  });
});

// ── isConnectionType ──────────────────────────────────────────────────

describe('isConnectionType', () => {
  it('should include Transition as connection type', () => {
    expect(isConnectionType('Transition')).toBe(true);
  });

  it('should include Bus as connection type', () => {
    expect(isConnectionType('Bus')).toBe(true);
  });

  it('should include all arrow types', () => {
    expect(isConnectionType('Arrow')).toBe(true);
    expect(isConnectionType('DataFlow')).toBe(true);
  });

  it('should not include Server', () => {
    expect(isConnectionType('Server')).toBe(false);
  });
});

// ── requiresMetadata ──────────────────────────────────────────────────

describe('requiresMetadata', () => {
  it('should require metadata for Graph2D', () => {
    expect(requiresMetadata('Graph2D')).toBe(true);
  });

  it('should require metadata for Equation', () => {
    expect(requiresMetadata('Equation')).toBe(true);
  });

  it('should require metadata for Table', () => {
    expect(requiresMetadata('Table')).toBe(true);
  });

  it('should not require metadata for Server', () => {
    expect(requiresMetadata('Server')).toBe(false);
  });

  it('should not require metadata for Arrow', () => {
    expect(requiresMetadata('Arrow')).toBe(false);
  });
});

// ── applyEntityDefaults ───────────────────────────────────────────────

describe('applyEntityDefaults', () => {
  it('should fill in default size', () => {
    const entity = makeEntity();
    const result = applyEntityDefaults(entity);
    expect(result.size).toBe(ENTITY_DEFAULTS.size);
  });

  it('should fill in default color', () => {
    const result = applyEntityDefaults(makeEntity());
    expect(result.color).toBe(ENTITY_DEFAULTS.color);
  });

  it('should fill in default highlight', () => {
    const result = applyEntityDefaults(makeEntity());
    expect(result.highlight).toBe(false);
  });

  it('should fill in default animation', () => {
    const result = applyEntityDefaults(makeEntity());
    expect(result.animation).toBeDefined();
    expect(result.animation!.delay).toBe(0);
    expect(result.animation!.duration).toBe(450);
    expect(result.animation!.entrance).toBe('entrance-fadeInUp');
  });

  it('should preserve agent-supplied values over defaults', () => {
    const entity = makeEntity({ color: '#FF0000', size: 2.0 });
    const result = applyEntityDefaults(entity);
    expect(result.color).toBe('#FF0000');
    expect(result.size).toBe(2.0);
  });

  it('should merge animation (agent partial + defaults)', () => {
    const entity = makeEntity({ animation: { delay: 500 } });
    const result = applyEntityDefaults(entity);
    expect(result.animation!.delay).toBe(500);
    expect(result.animation!.duration).toBe(450); // from defaults
    expect(result.animation!.entrance).toBe('entrance-fadeInUp'); // from defaults
  });

  it('should preserve required fields unchanged', () => {
    const entity = makeEntity({ id: 'my-server', type: 'Server', position: { x: 30, y: 70 } });
    const result = applyEntityDefaults(entity);
    expect(result.id).toBe('my-server');
    expect(result.type).toBe('Server');
    expect(result.position.x).toBe(30);
    expect(result.position.y).toBe(70);
  });
});

// ── buildEntityMap ────────────────────────────────────────────────────

describe('buildEntityMap', () => {
  it('should build a Map from entity array', () => {
    const entities = [
      makeEntity({ id: 'srv-1' }),
      makeEntity({ id: 'db-1', type: 'Database' }),
    ];
    const map = buildEntityMap(entities);
    expect(map.size).toBe(2);
    expect(map.get('srv-1')!.type).toBe('Server');
    expect(map.get('db-1')!.type).toBe('Database');
  });

  it('should return empty map for empty array', () => {
    expect(buildEntityMap([]).size).toBe(0);
  });

  it('should allow O(1) lookup by ID', () => {
    const entities = Array.from({ length: 100 }, (_, i) => makeEntity({ id: `e-${i}` }));
    const map = buildEntityMap(entities);
    expect(map.get('e-50')!.id).toBe('e-50');
    expect(map.has('e-999')).toBe(false);
  });
});

// ── assignEntranceDelays ──────────────────────────────────────────────

describe('assignEntranceDelays', () => {
  it('should assign staggered delays starting from 0', () => {
    const entities = [
      makeEntity({ id: 'a' }),
      makeEntity({ id: 'b' }),
      makeEntity({ id: 'c' }),
    ];
    const result = assignEntranceDelays(entities);
    expect(result[0].animation!.delay).toBe(0);
    expect(result[1].animation!.delay).toBe(INTER_ENTITY_STAGGER_MS);
    expect(result[2].animation!.delay).toBe(INTER_ENTITY_STAGGER_MS * 2);
  });

  it('should skip Arrow types when skipConnections=true', () => {
    const entities = [
      makeEntity({ id: 'a', type: 'Server' }),
      makeEntity({ id: 'b', type: 'Arrow' }),
      makeEntity({ id: 'c', type: 'Database' }),
    ];
    const result = assignEntranceDelays(entities, 0, INTER_ENTITY_STAGGER_MS, true);
    expect(result[0].animation!.delay).toBe(0);
    // Arrow skipped — no delay assigned
    expect(result[2].animation!.delay).toBe(INTER_ENTITY_STAGGER_MS);
  });

  it('should accept custom base delay', () => {
    const entities = [makeEntity({ id: 'a' })];
    const result = assignEntranceDelays(entities, 200);
    expect(result[0].animation!.delay).toBe(200);
  });

  it('should not overwrite existing delays', () => {
    const entities = [makeEntity({ id: 'a', animation: { delay: 999 } })];
    const result = assignEntranceDelays(entities);
    expect(result[0].animation!.delay).toBe(999);
  });
});

// ── resolveEntityRef ──────────────────────────────────────────────────

describe('resolveEntityRef', () => {
  const entities = [
    makeEntity({ id: 'srv-1', label: 'Auth Service' }),
    makeEntity({ id: 'db-1', label: 'Users DB', type: 'Database' }),
    makeEntity({ id: 'cache-1', label: 'Redis Cache', type: 'Cache' }),
  ];

  it('should resolve by exact ID match', () => {
    const result = resolveEntityRef('srv-1', entities);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('srv-1');
  });

  it('should resolve by exact label (case-insensitive)', () => {
    const result = resolveEntityRef('auth service', entities);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('srv-1');
  });

  it('should resolve by fuzzy label substring', () => {
    const result = resolveEntityRef('Redis', entities);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('cache-1');
  });

  it('should prefer exact ID over label match', () => {
    const withDup = [...entities, makeEntity({ id: 'Auth Service', label: 'Fake' })];
    const result = resolveEntityRef('Auth Service', withDup);
    // Should match by ID first, not label
    expect(result!.id).toBe('Auth Service');
  });

  it('should return null for unresolvable reference', () => {
    expect(resolveEntityRef('nonexistent', entities)).toBeNull();
  });

  it('should return null for empty ref', () => {
    expect(resolveEntityRef('', entities)).toBeNull();
  });
});

// ── validateVisualScript ──────────────────────────────────────────────

describe('validateVisualScript', () => {
  it('should return no warnings for valid script', () => {
    const script = makeScript();
    expect(validateVisualScript(script)).toHaveLength(0);
  });

  it('should warn if endTime <= startTime', () => {
    const script = makeScript({
      frames: [{
        id: 'f1',
        startTime: 5000,
        endTime: 3000, // invalid
        entities: [],
        narrationSegment: '',
        description: '',
      }],
    });
    const warnings = validateVisualScript(script);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('endTime');
  });

  it('should warn if entity count exceeds MAX_ENTITIES_PER_FRAME', () => {
    const entities = Array.from({ length: 200 }, (_, i) =>
      makeEntity({ id: `e-${i}` })
    );
    const script = makeScript({
      frames: [{
        id: 'f1',
        startTime: 0,
        endTime: 4000,
        entities,
        narrationSegment: '',
        description: '',
      }],
    });
    const warnings = validateVisualScript(script);
    expect(warnings.some(w => w.includes('entity count'))).toBe(true);
  });

  it('should warn if Arrow sourceEntityId is unresolvable', () => {
    const script = makeScript({
      frames: [{
        id: 'f1',
        startTime: 0,
        endTime: 4000,
        entities: [
          makeEntity({ id: 'srv-1', type: 'Server' }),
          makeEntity({
            id: 'arr-1',
            type: 'Arrow',
            sourceEntityId: 'nonexistent',
            targetEntityId: 'srv-1',
          }),
        ],
        narrationSegment: '',
        description: '',
      }],
    });
    const warnings = validateVisualScript(script);
    expect(warnings.some(w => w.includes('sourceEntityId'))).toBe(true);
  });
});
