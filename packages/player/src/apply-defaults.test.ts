/**
 * @pre/player — apply-defaults tests (TDD: RED phase)
 *
 * Tests for applyDefaults() and assignEntranceDelays().
 * These are pure functions with no DOM dependency.
 */
import { describe, it, expect } from 'vitest';
import { applyDefaults, assignEntranceDelays } from './apply-defaults.js';
import type { VisualEntity } from '@pre/shared';
import { ENTITY_DEFAULTS, INTER_ENTITY_STAGGER_MS } from '@pre/shared';

// ── Helper: create a minimal entity ──────────────────────────────────
function entity(overrides: Partial<VisualEntity> = {}): VisualEntity {
  return {
    id: overrides.id ?? 'e1',
    type: overrides.type ?? 'Server',
    position: overrides.position ?? { x: 50, y: 50 },
    ...overrides,
  } as VisualEntity;
}

// ═══════════════════════════════════════════════════════════════════════
// applyDefaults
// ═══════════════════════════════════════════════════════════════════════

describe('applyDefaults', () => {
  it('should fill in all defaults for a minimal entity', () => {
    const e = entity();
    const full = applyDefaults(e);

    expect(full.size).toBe(ENTITY_DEFAULTS.size);
    expect(full.color).toBe(ENTITY_DEFAULTS.color);
    expect(full.highlight).toBe(ENTITY_DEFAULTS.highlight);
    expect(full.animation).toBeDefined();
    expect(full.animation!.delay).toBe(ENTITY_DEFAULTS.animation.delay);
    expect(full.animation!.duration).toBe(ENTITY_DEFAULTS.animation.duration);
    expect(full.animation!.easing).toBe(ENTITY_DEFAULTS.animation.easing);
    expect(full.animation!.entrance).toBe(ENTITY_DEFAULTS.animation.entrance);
  });

  it('should preserve explicit entity fields over defaults', () => {
    const e = entity({ size: 2.0, color: '#FF0000', highlight: true });
    const full = applyDefaults(e);

    expect(full.size).toBe(2.0);
    expect(full.color).toBe('#FF0000');
    expect(full.highlight).toBe(true);
  });

  it('should merge animation shallowly — entity animation keys override defaults', () => {
    const e = entity({ animation: { delay: 200 } });
    const full = applyDefaults(e);

    // Explicitly set
    expect(full.animation!.delay).toBe(200);
    // Filled from defaults
    expect(full.animation!.duration).toBe(ENTITY_DEFAULTS.animation.duration);
    expect(full.animation!.easing).toBe(ENTITY_DEFAULTS.animation.easing);
    expect(full.animation!.entrance).toBe(ENTITY_DEFAULTS.animation.entrance);
  });

  it('should preserve all original fields like id, type, position', () => {
    const e = entity({ id: 'srv-1', type: 'Database', position: { x: 10, y: 90 } });
    const full = applyDefaults(e);

    expect(full.id).toBe('srv-1');
    expect(full.type).toBe('Database');
    expect(full.position).toEqual({ x: 10, y: 90 });
  });

  it('should preserve metadata, label, and optional fields', () => {
    const e = entity({
      label: 'My Server',
      metadata: { port: 8080 },
      sourceEntityId: 'src',
      targetEntityId: 'tgt',
      parentEntityId: 'parent',
    });
    const full = applyDefaults(e);

    expect(full.label).toBe('My Server');
    expect(full.metadata).toEqual({ port: 8080 });
    expect(full.sourceEntityId).toBe('src');
    expect(full.targetEntityId).toBe('tgt');
    expect(full.parentEntityId).toBe('parent');
  });

  it('should not mutate the original entity object', () => {
    const e = entity({ size: 3.0 });
    const original = { ...e };
    applyDefaults(e);

    expect(e.size).toBe(original.size);
    expect(e.animation).toEqual(original.animation);
  });

  it('should handle entity with explicit animation entrance override', () => {
    const e = entity({ animation: { entrance: 'entrance-drawIn', duration: 600 } });
    const full = applyDefaults(e);

    expect(full.animation!.entrance).toBe('entrance-drawIn');
    expect(full.animation!.duration).toBe(600);
    expect(full.animation!.delay).toBe(ENTITY_DEFAULTS.animation.delay);
  });
});


// ═══════════════════════════════════════════════════════════════════════
// assignEntranceDelays
// ═══════════════════════════════════════════════════════════════════════

describe('assignEntranceDelays', () => {
  it('should assign staggered delays starting from 0ms', () => {
    const entities = [entity({ id: 'a' }), entity({ id: 'b' }), entity({ id: 'c' })];
    const result = assignEntranceDelays(entities);

    expect(result[0].animation!.delay).toBe(0);
    expect(result[1].animation!.delay).toBe(INTER_ENTITY_STAGGER_MS);
    expect(result[2].animation!.delay).toBe(INTER_ENTITY_STAGGER_MS * 2);
  });

  it('should skip entities that already have an explicit delay', () => {
    const entities = [
      entity({ id: 'a' }),
      entity({ id: 'b', animation: { delay: 500 } }),
      entity({ id: 'c' }),
    ];
    const result = assignEntranceDelays(entities);

    expect(result[0].animation!.delay).toBe(0);
    // Entity 'b' keeps its explicit delay
    expect(result[1].animation!.delay).toBe(500);
    // Entity 'c' continues from max(current, b.delay + stagger)
    expect(result[2].animation!.delay).toBe(500 + INTER_ENTITY_STAGGER_MS);
  });

  it('should handle empty arrays', () => {
    const result = assignEntranceDelays([]);
    expect(result).toEqual([]);
  });

  it('should handle single entity', () => {
    const entities = [entity({ id: 'only' })];
    const result = assignEntranceDelays(entities);

    expect(result[0].animation!.delay).toBe(0);
  });

  it('should initialize animation object if missing', () => {
    const e = entity({ id: 'no-anim' });
    delete (e as any).animation;
    const result = assignEntranceDelays([e]);

    expect(result[0].animation).toBeDefined();
    expect(result[0].animation!.delay).toBe(0);
  });

  it('should produce delays consistent with 80ms stagger for 10 entities', () => {
    const entities = Array.from({ length: 10 }, (_, i) => entity({ id: `e${i}` }));
    const result = assignEntranceDelays(entities);

    result.forEach((e, i) => {
      expect(e.animation!.delay).toBe(i * INTER_ENTITY_STAGGER_MS);
    });

    // Last entity delay: 9 * 80 = 720ms
    expect(result[9].animation!.delay).toBe(720);
  });

  it('should return new array (not mutate input)', () => {
    const entities = [entity({ id: 'a' }), entity({ id: 'b' })];
    const result = assignEntranceDelays(entities);

    // Returns a new array
    expect(result).not.toBe(entities);
  });
});
