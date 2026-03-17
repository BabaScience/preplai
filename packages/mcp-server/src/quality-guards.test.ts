/**
 * Unit tests for the Preventive Quality Guards.
 *
 * Tests each guard independently to ensure anti-patterns are caught.
 */
import { describe, it, expect } from 'vitest';
import type { VisualScript, IllustrationFrame, VisualEntity } from '@preplai/shared';
import { runQualityGuards } from './quality-guards.js';

// ── Helpers ──────────────────────────────────────────────────────────────

function makeEntity(overrides: Partial<VisualEntity> = {}): VisualEntity {
  return {
    id: overrides.id ?? `e-${Math.random().toString(36).slice(2, 8)}`,
    type: overrides.type ?? 'Server',
    position: overrides.position ?? { x: 50, y: 50 },
    ...overrides,
  } as VisualEntity;
}

function makeFrame(
  entities: VisualEntity[],
  narration = 'Test narration for this frame.',
): IllustrationFrame {
  return {
    id: `f-${Math.random().toString(36).slice(2, 8)}`,
    startTime: 0,
    endTime: 5000,
    entities,
    narrationSegment: narration,
    description: 'Test frame',
  } as IllustrationFrame;
}

function makeScript(frames: IllustrationFrame[]): VisualScript {
  return {
    sceneId: 'test-scene',
    frames,
    totalDuration: frames.length * 5000,
  };
}

// ── NO_HIGHLIGHT guard ──────────────────────────────────────────────────

describe('NO_HIGHLIGHT guard', () => {
  it('warns when no frame has highlight:true', () => {
    const script = makeScript([
      makeFrame([makeEntity({ id: 'a' }), makeEntity({ id: 'b' })]),
      makeFrame([makeEntity({ id: 'a' }), makeEntity({ id: 'c' })]),
    ]);
    const warnings = runQualityGuards(script);
    expect(warnings.some((w) => w.code === 'NO_HIGHLIGHT')).toBe(true);
  });

  it('does not warn when at least one frame has highlight', () => {
    const script = makeScript([
      makeFrame([makeEntity({ id: 'a', highlight: true } as any), makeEntity({ id: 'b' })]),
      makeFrame([makeEntity({ id: 'a' }), makeEntity({ id: 'c' })]),
    ]);
    const warnings = runQualityGuards(script);
    expect(warnings.some((w) => w.code === 'NO_HIGHLIGHT')).toBe(false);
  });

  it('does not warn for empty scripts', () => {
    const script = makeScript([]);
    const warnings = runQualityGuards(script);
    expect(warnings).toHaveLength(0);
  });
});

// ── OVERCROWDED_FRAME guard ──────────────────────────────────────────────

describe('OVERCROWDED_FRAME guard', () => {
  it('warns when a frame has >10 content entities', () => {
    const entities = Array.from({ length: 12 }, (_, i) =>
      makeEntity({ id: `e${i}`, position: { x: 8 + i * 7, y: 50 } }),
    );
    const script = makeScript([makeFrame(entities)]);
    const warnings = runQualityGuards(script);
    expect(warnings.some((w) => w.code === 'OVERCROWDED_FRAME')).toBe(true);
  });

  it('does not warn for frames with <=10 content entities', () => {
    const entities = Array.from({ length: 7 }, (_, i) =>
      makeEntity({ id: `e${i}`, position: { x: 10 + i * 12, y: 50 } }),
    );
    const script = makeScript([makeFrame(entities)]);
    const warnings = runQualityGuards(script);
    expect(warnings.some((w) => w.code === 'OVERCROWDED_FRAME')).toBe(false);
  });

  it('excludes connections and headings from content entity count', () => {
    const entities = [
      ...Array.from({ length: 9 }, (_, i) =>
        makeEntity({ id: `e${i}`, position: { x: 10 + i * 10, y: 50 } }),
      ),
      makeEntity({ id: 'h1', type: 'H1', position: { x: 50, y: 6 } }),
      makeEntity({ id: 'a1', type: 'Arrow', position: { x: 50, y: 50 }, sourceEntityId: 'e0', targetEntityId: 'e1' } as any),
      makeEntity({ id: 'lbl', type: 'Label', position: { x: 50, y: 80 } }),
    ];
    const script = makeScript([makeFrame(entities)]);
    const warnings = runQualityGuards(script);
    // 9 content entities (H1, Arrow, Label excluded) <= 10
    expect(warnings.some((w) => w.code === 'OVERCROWDED_FRAME')).toBe(false);
  });
});

// ── UNBALANCED_LAYOUT guard ──────────────────────────────────────────────

describe('UNBALANCED_LAYOUT guard', () => {
  it('warns when all entities are on the left side', () => {
    const script = makeScript([
      makeFrame([
        makeEntity({ id: 'a', position: { x: 10, y: 50 } }),
        makeEntity({ id: 'b', position: { x: 20, y: 40 } }),
        makeEntity({ id: 'c', position: { x: 30, y: 60 } }),
      ]),
    ]);
    const warnings = runQualityGuards(script);
    expect(warnings.some((w) => w.code === 'UNBALANCED_LAYOUT')).toBe(true);
  });

  it('warns when all entities are on the right side', () => {
    const script = makeScript([
      makeFrame([
        makeEntity({ id: 'a', position: { x: 60, y: 50 } }),
        makeEntity({ id: 'b', position: { x: 70, y: 40 } }),
        makeEntity({ id: 'c', position: { x: 80, y: 60 } }),
      ]),
    ]);
    const warnings = runQualityGuards(script);
    expect(warnings.some((w) => w.code === 'UNBALANCED_LAYOUT')).toBe(true);
  });

  it('does not warn when entities are spread across the canvas', () => {
    const script = makeScript([
      makeFrame([
        makeEntity({ id: 'a', position: { x: 20, y: 50 } }),
        makeEntity({ id: 'b', position: { x: 50, y: 50 } }),
        makeEntity({ id: 'c', position: { x: 80, y: 50 } }),
      ]),
    ]);
    const warnings = runQualityGuards(script);
    expect(warnings.some((w) => w.code === 'UNBALANCED_LAYOUT')).toBe(false);
  });

  it('does not warn for frames with fewer than 3 content entities', () => {
    const script = makeScript([
      makeFrame([
        makeEntity({ id: 'a', position: { x: 10, y: 50 } }),
        makeEntity({ id: 'b', position: { x: 20, y: 50 } }),
      ]),
    ]);
    const warnings = runQualityGuards(script);
    expect(warnings.some((w) => w.code === 'UNBALANCED_LAYOUT')).toBe(false);
  });
});

// ── NO_CONNECTIONS guard ─────────────────────────────────────────────────

describe('NO_CONNECTIONS guard', () => {
  it('warns when multi-entity frame has zero connections', () => {
    const script = makeScript([
      makeFrame([
        makeEntity({ id: 'a', position: { x: 20, y: 50 } }),
        makeEntity({ id: 'b', position: { x: 50, y: 50 } }),
        makeEntity({ id: 'c', position: { x: 80, y: 50 } }),
      ]),
    ]);
    const warnings = runQualityGuards(script);
    expect(warnings.some((w) => w.code === 'NO_CONNECTIONS')).toBe(true);
  });

  it('does not warn when frame has connections', () => {
    const script = makeScript([
      makeFrame([
        makeEntity({ id: 'a', position: { x: 20, y: 50 } }),
        makeEntity({ id: 'b', position: { x: 80, y: 50 } }),
        makeEntity({ id: 'arr', type: 'Arrow', position: { x: 50, y: 50 }, sourceEntityId: 'a', targetEntityId: 'b' } as any),
      ]),
    ]);
    const warnings = runQualityGuards(script);
    expect(warnings.some((w) => w.code === 'NO_CONNECTIONS')).toBe(false);
  });

  it('does not warn for single-entity frames', () => {
    const script = makeScript([
      makeFrame([makeEntity({ id: 'a', position: { x: 50, y: 50 } })]),
    ]);
    const warnings = runQualityGuards(script);
    expect(warnings.some((w) => w.code === 'NO_CONNECTIONS')).toBe(false);
  });
});

// ── Well-formed script ───────────────────────────────────────────────────

describe('well-formed script', () => {
  it('produces zero warnings for a good presentation', () => {
    const script = makeScript([
      makeFrame([
        makeEntity({ id: 'h1', type: 'H1', position: { x: 50, y: 6 } }),
        makeEntity({ id: 'srv', type: 'Server', position: { x: 30, y: 40 }, highlight: true } as any),
        makeEntity({ id: 'db', type: 'Database', position: { x: 70, y: 40 } }),
        makeEntity({ id: 'a1', type: 'Arrow', position: { x: 50, y: 40 }, sourceEntityId: 'srv', targetEntityId: 'db' } as any),
      ]),
      makeFrame([
        makeEntity({ id: 'h1', type: 'H1', position: { x: 50, y: 6 } }),
        makeEntity({ id: 'srv', type: 'Server', position: { x: 20, y: 40 } }),
        makeEntity({ id: 'db', type: 'Database', position: { x: 50, y: 40 }, highlight: true } as any),
        makeEntity({ id: 'cache', type: 'Cache', position: { x: 80, y: 40 } }),
        makeEntity({ id: 'a1', type: 'Arrow', position: { x: 35, y: 40 }, sourceEntityId: 'srv', targetEntityId: 'db' } as any),
        makeEntity({ id: 'a2', type: 'DataFlow', position: { x: 65, y: 40 }, sourceEntityId: 'db', targetEntityId: 'cache' } as any),
      ]),
    ]);
    const warnings = runQualityGuards(script);
    expect(warnings).toHaveLength(0);
  });
});
