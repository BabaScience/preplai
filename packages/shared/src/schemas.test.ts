/**
 * @preplai/shared — Zod Schema Validation Tests
 * TDD: Tests written FIRST, implementation follows.
 */
import { describe, it, expect } from 'vitest';
import {
  VisualEntitySchema,
  IllustrationFrameSchema,
  VisualScriptSchema,
  EntityTransitionSchema,
  VisualEntityPatchSchema,
  CreateSessionSchema,
} from './schemas.js';

// ── VisualEntitySchema ────────────────────────────────────────────────

describe('VisualEntitySchema', () => {
  const validEntity = {
    id: 'server-1',
    type: 'Server',
    position: { x: 50, y: 50 },
  };

  it('should accept minimal valid entity', () => {
    const result = VisualEntitySchema.safeParse(validEntity);
    expect(result.success).toBe(true);
  });

  it('should accept full entity with all optional fields', () => {
    const full = {
      ...validEntity,
      size: 1.5,
      label: 'Auth Server',
      color: '#4A90D9',
      highlight: true,
      animation: {
        delay: 200,
        duration: 450,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        entrance: 'entrance-fadeInUp',
      },
      sourceEntityId: 'src-1',
      targetEntityId: 'tgt-1',
      parentEntityId: 'group-1',
      textContent: 'console.log("hello")',
      codeLanguage: 'typescript',
      metadata: { latex: 'E = mc^2' },
    };
    expect(VisualEntitySchema.safeParse(full).success).toBe(true);
  });

  it('should reject entity with empty id', () => {
    const result = VisualEntitySchema.safeParse({ ...validEntity, id: '' });
    expect(result.success).toBe(false);
  });

  it('should reject entity with empty type', () => {
    const result = VisualEntitySchema.safeParse({ ...validEntity, type: '' });
    expect(result.success).toBe(false);
  });

  it('should reject position.x < 0', () => {
    const result = VisualEntitySchema.safeParse({
      ...validEntity,
      position: { x: -1, y: 50 },
    });
    expect(result.success).toBe(false);
  });

  it('should reject position.x > 100', () => {
    const result = VisualEntitySchema.safeParse({
      ...validEntity,
      position: { x: 101, y: 50 },
    });
    expect(result.success).toBe(false);
  });

  it('should reject size > 10', () => {
    const result = VisualEntitySchema.safeParse({ ...validEntity, size: 11 });
    expect(result.success).toBe(false);
  });

  it('should reject size <= 0', () => {
    const result = VisualEntitySchema.safeParse({ ...validEntity, size: 0 });
    expect(result.success).toBe(false);
  });

  it('should reject animation.delay > 60000', () => {
    const result = VisualEntitySchema.safeParse({
      ...validEntity,
      animation: { delay: 70_000 },
    });
    expect(result.success).toBe(false);
  });

  it('should accept edge position values (0 and 100)', () => {
    expect(VisualEntitySchema.safeParse({ ...validEntity, position: { x: 0, y: 0 } }).success).toBe(true);
    expect(VisualEntitySchema.safeParse({ ...validEntity, position: { x: 100, y: 100 } }).success).toBe(true);
  });
});

// ── IllustrationFrameSchema ───────────────────────────────────────────

describe('IllustrationFrameSchema', () => {
  const validFrame = {
    id: 'frame-1',
    startTime: 0,
    endTime: 4000,
    entities: [
      { id: 'srv-1', type: 'Server', position: { x: 50, y: 50 } },
    ],
    narrationSegment: 'Test narration text',
    description: 'Test frame description',
  };

  it('should accept valid frame', () => {
    expect(IllustrationFrameSchema.safeParse(validFrame).success).toBe(true);
  });

  it('should accept frame with empty entities array', () => {
    expect(IllustrationFrameSchema.safeParse({ ...validFrame, entities: [] }).success).toBe(true);
  });

  it('should reject frame where endTime <= startTime', () => {
    const result = IllustrationFrameSchema.safeParse({
      ...validFrame,
      startTime: 5000,
      endTime: 3000,
    });
    expect(result.success).toBe(false);
  });

  it('should reject frame with > 150 entities', () => {
    const entities = Array.from({ length: 151 }, (_, i) => ({
      id: `e-${i}`,
      type: 'Server',
      position: { x: 50, y: 50 },
    }));
    const result = IllustrationFrameSchema.safeParse({
      ...validFrame,
      entities,
    });
    expect(result.success).toBe(false);
  });

  it('should accept frame with transitions', () => {
    const result = IllustrationFrameSchema.safeParse({
      ...validFrame,
      transitions: [{
        entityId: 'srv-1',
        from: { position: { x: 50, y: 50 } },
        to: { position: { x: 25, y: 50 } },
        duration: 500,
      }],
    });
    expect(result.success).toBe(true);
  });
});

// ── VisualScriptSchema ────────────────────────────────────────────────

describe('VisualScriptSchema', () => {
  const validScript = {
    sceneId: '550e8400-e29b-41d4-a716-446655440000',
    frames: [{
      id: 'frame-1',
      startTime: 0,
      endTime: 4000,
      entities: [{ id: 's1', type: 'Server', position: { x: 50, y: 50 } }],
      narrationSegment: 'Test',
      description: 'Test',
    }],
    totalDuration: 4000,
  };

  it('should accept valid script', () => {
    expect(VisualScriptSchema.safeParse(validScript).success).toBe(true);
  });

  it('should reject script with no frames', () => {
    const result = VisualScriptSchema.safeParse({ ...validScript, frames: [] });
    expect(result.success).toBe(false);
  });

  it('should reject script with invalid UUID sceneId', () => {
    const result = VisualScriptSchema.safeParse({ ...validScript, sceneId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('should reject script where totalDuration < last frame endTime', () => {
    const result = VisualScriptSchema.safeParse({ ...validScript, totalDuration: 2000 });
    expect(result.success).toBe(false);
  });

  it('should reject totalDuration > 1 hour', () => {
    const result = VisualScriptSchema.safeParse({
      ...validScript,
      totalDuration: 3_600_001,
    });
    expect(result.success).toBe(false);
  });
});

// ── EntityTransitionSchema ────────────────────────────────────────────

describe('EntityTransitionSchema', () => {
  it('should accept valid transition', () => {
    const result = EntityTransitionSchema.safeParse({
      entityId: 'srv-1',
      from: { position: { x: 50, y: 50 } },
      to: { position: { x: 25, y: 50 } },
      duration: 600,
      easing: 'power2.inOut',
    });
    expect(result.success).toBe(true);
  });

  it('should accept transition without easing (optional)', () => {
    const result = EntityTransitionSchema.safeParse({
      entityId: 'srv-1',
      from: {},
      to: {},
      duration: 300,
    });
    expect(result.success).toBe(true);
  });

  it('should reject transition with negative duration', () => {
    const result = EntityTransitionSchema.safeParse({
      entityId: 'srv-1',
      from: {},
      to: {},
      duration: -100,
    });
    expect(result.success).toBe(false);
  });
});

// ── VisualEntityPatchSchema ───────────────────────────────────────────

describe('VisualEntityPatchSchema', () => {
  it('should accept partial patch', () => {
    expect(VisualEntityPatchSchema.safeParse({ color: '#FF0000' }).success).toBe(true);
    expect(VisualEntityPatchSchema.safeParse({ highlight: true }).success).toBe(true);
    expect(VisualEntityPatchSchema.safeParse({ position: { x: 30, y: 40 } }).success).toBe(true);
  });

  it('should accept empty patch', () => {
    expect(VisualEntityPatchSchema.safeParse({}).success).toBe(true);
  });

  it('should reject invalid size in patch', () => {
    expect(VisualEntityPatchSchema.safeParse({ size: 0 }).success).toBe(false);
  });
});

// ── CreateSessionSchema ───────────────────────────────────────────────

describe('CreateSessionSchema', () => {
  it('should accept valid session creation', () => {
    expect(CreateSessionSchema.safeParse({ title: 'BFS Explained' }).success).toBe(true);
  });

  it('should accept session with domain', () => {
    expect(CreateSessionSchema.safeParse({
      title: 'BFS Explained',
      domain: 'distributed systems',
    }).success).toBe(true);
  });

  it('should reject empty title', () => {
    expect(CreateSessionSchema.safeParse({ title: '' }).success).toBe(false);
  });

  it('should accept custom TTL within bounds', () => {
    expect(CreateSessionSchema.safeParse({ title: 'T', ttlSeconds: 3600 }).success).toBe(true);
  });

  it('should reject TTL below minimum (60s)', () => {
    expect(CreateSessionSchema.safeParse({ title: 'T', ttlSeconds: 30 }).success).toBe(false);
  });

  it('should reject TTL above maximum (86400s)', () => {
    expect(CreateSessionSchema.safeParse({ title: 'T', ttlSeconds: 100_000 }).success).toBe(false);
  });
});
