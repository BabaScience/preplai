/**
 * @pre/player — fuzzy-lookup tests (TDD: RED phase)
 *
 * Tests for resolveEntityRef() — 3-tier entity reference resolution.
 * Pure logic, no DOM dependency.
 */
import { describe, it, expect } from 'vitest';
import { resolveEntityRef } from './fuzzy-lookup.js';
import type { VisualEntity } from '@pre/shared';

// ── Helper ───────────────────────────────────────────────────────────
function entity(id: string, label?: string): VisualEntity {
  return {
    id,
    type: 'Server',
    position: { x: 50, y: 50 },
    label,
  } as VisualEntity;
}

const entities: VisualEntity[] = [
  entity('server-1', 'API Server'),
  entity('db-1', 'Postgres DB'),
  entity('cache-1', 'Redis Cache'),
  entity('lb-1', 'Load Balancer'),
];


// ═══════════════════════════════════════════════════════════════════════
// Tier 1: Exact ID match
// ═══════════════════════════════════════════════════════════════════════

describe('resolveEntityRef — Tier 1: Exact ID', () => {
  it('should resolve exact ID match', () => {
    const result = resolveEntityRef('server-1', entities);
    expect(result).toBe(entities[0]);
  });

  it('should return the entity by exact ID when multiple exist', () => {
    const result = resolveEntityRef('cache-1', entities);
    expect(result).toBe(entities[2]);
  });

  it('should prioritize ID match over label match', () => {
    // Add an entity whose label is "db-1" but id is different
    const extended = [
      ...entities,
      entity('special', 'db-1'),
    ];
    const result = resolveEntityRef('db-1', extended);
    // Should match the original db-1 by ID, not the one with label "db-1"
    expect(result!.id).toBe('db-1');
  });
});


// ═══════════════════════════════════════════════════════════════════════
// Tier 2: Exact label match (case-insensitive)
// ═══════════════════════════════════════════════════════════════════════

describe('resolveEntityRef — Tier 2: Exact Label', () => {
  it('should resolve by exact label (case-insensitive)', () => {
    const result = resolveEntityRef('api server', entities);
    expect(result).toBe(entities[0]);
  });

  it('should resolve by exact label with original casing', () => {
    const result = resolveEntityRef('API Server', entities);
    expect(result).toBe(entities[0]);
  });

  it('should resolve labels with different casing', () => {
    const result = resolveEntityRef('POSTGRES DB', entities);
    expect(result).toBe(entities[1]);
  });

  it('should resolve labels with mixed casing', () => {
    const result = resolveEntityRef('rEdIs CaChe', entities);
    expect(result).toBe(entities[2]);
  });
});


// ═══════════════════════════════════════════════════════════════════════
// Tier 3: Fuzzy substring match
// ═══════════════════════════════════════════════════════════════════════

describe('resolveEntityRef — Tier 3: Fuzzy Substring', () => {
  it('should resolve when ref is a substring of label', () => {
    const result = resolveEntityRef('Postgres', entities);
    expect(result).toBe(entities[1]);
  });

  it('should resolve when label is a substring of ref', () => {
    const result = resolveEntityRef('Redis Cache Cluster', entities);
    expect(result).toBe(entities[2]);
  });

  it('should resolve fuzzy match case-insensitively', () => {
    const result = resolveEntityRef('postgres', entities);
    expect(result).toBe(entities[1]);
  });

  it('should resolve partial matches like agent-style refs', () => {
    // Agent says "api-server" but label is "API Server"
    // "api-server" doesn't substring-match "api server" (hyphen vs space)
    // But "server" is in both, so let's test that
    const result = resolveEntityRef('server', entities);
    expect(result).toBe(entities[0]); // "server" is substring of "API Server"
  });

  it('should return first matching entity when multiple fuzzy matches', () => {
    // "Cache" matches both "Redis Cache" (index 2) — returns first match
    const result = resolveEntityRef('Cache', entities);
    expect(result).toBe(entities[2]);
  });
});


// ═══════════════════════════════════════════════════════════════════════
// Edge cases
// ═══════════════════════════════════════════════════════════════════════

describe('resolveEntityRef — Edge Cases', () => {
  it('should return null for empty ref', () => {
    expect(resolveEntityRef('', entities)).toBeNull();
  });

  it('should return null for null/undefined ref', () => {
    expect(resolveEntityRef(null as any, entities)).toBeNull();
    expect(resolveEntityRef(undefined as any, entities)).toBeNull();
  });

  it('should return null for empty entity array', () => {
    expect(resolveEntityRef('server-1', [])).toBeNull();
  });

  it('should return null for null entity array', () => {
    expect(resolveEntityRef('server-1', null as any)).toBeNull();
  });

  it('should return null when no match found at any tier', () => {
    expect(resolveEntityRef('nonexistent-entity', entities)).toBeNull();
  });

  it('should handle entities without labels gracefully', () => {
    const noLabelEntities = [
      entity('a'),
      entity('b'),
    ];
    // Can still match by ID
    expect(resolveEntityRef('a', noLabelEntities)!.id).toBe('a');
    // No label match possible
    expect(resolveEntityRef('some label', noLabelEntities)).toBeNull();
  });

  it('should handle mixed labeled and unlabeled entities', () => {
    const mixed = [
      entity('x'),  // no label
      entity('y', 'Target Label'),
    ];
    const result = resolveEntityRef('Target Label', mixed);
    expect(result!.id).toBe('y');
  });
});
