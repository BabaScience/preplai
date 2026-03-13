/**
 * Unit tests for the Visual Script Quality Scorer.
 *
 * Tests each scoring dimension independently, then the aggregate scorer.
 */
import { describe, it, expect } from 'vitest';
import type { VisualScript, IllustrationFrame, VisualEntity } from '@preplai/shared';
import {
  scoreEntityDensity,
  scoreLayoutQuality,
  scoreVisualBalance,
  scoreEntityPersistence,
  scoreNarrationCoverage,
  scoreFormatCompliance,
  scoreNarrationQuality,
  scoreNarrativeArc,
  scoreConnectionCompleteness,
  scoreVisualScript,
} from './quality-scorer.js';

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

// ── Entity Density ───────────────────────────────────────────────────────

describe('scoreEntityDensity', () => {
  it('returns 0 for empty frames array', () => {
    expect(scoreEntityDensity([]).score).toBe(0);
  });

  it('scores 100 for ideal density (5-7 content entities)', () => {
    const frame = makeFrame(
      Array.from({ length: 6 }, (_, i) =>
        makeEntity({ id: `e${i}`, position: { x: 15 + i * 15, y: 50 } }),
      ),
    );
    const result = scoreEntityDensity([frame]);
    expect(result.score).toBe(100);
  });

  it('scores 100 when frame has 5 content entities', () => {
    const frame = makeFrame(
      Array.from({ length: 5 }, (_, i) =>
        makeEntity({ id: `e${i}`, position: { x: 10 + i * 20, y: 50 } }),
      ),
    );
    expect(scoreEntityDensity([frame]).score).toBe(100);
  });

  it('scores 100 when frame has 7 content entities', () => {
    const frame = makeFrame(
      Array.from({ length: 7 }, (_, i) =>
        makeEntity({ id: `e${i}`, position: { x: 10 + i * 12, y: 50 } }),
      ),
    );
    expect(scoreEntityDensity([frame]).score).toBe(100);
  });

  it('penalises sparse frames (< 3 entities)', () => {
    const frame = makeFrame([makeEntity({ id: 'e1' })]);
    const result = scoreEntityDensity([frame]);
    expect(result.score).toBeLessThan(50);
  });

  it('penalises overcrowded frames (> 10 entities)', () => {
    const frame = makeFrame(
      Array.from({ length: 12 }, (_, i) =>
        makeEntity({ id: `e${i}`, position: { x: 5 + i * 7, y: 50 } }),
      ),
    );
    const result = scoreEntityDensity([frame]);
    expect(result.score).toBeLessThan(60);
  });

  it('excludes connection types from density count', () => {
    const frame = makeFrame([
      makeEntity({ id: 'srv', type: 'Server', position: { x: 20, y: 50 } }),
      makeEntity({ id: 'db', type: 'Database', position: { x: 40, y: 50 } }),
      makeEntity({ id: 'cache', type: 'Cache', position: { x: 60, y: 50 } }),
      makeEntity({ id: 'user', type: 'User', position: { x: 80, y: 50 } }),
      makeEntity({ id: 'q', type: 'Queue', position: { x: 50, y: 30 } }),
      // These should not count toward density:
      makeEntity({ id: 'a1', type: 'Arrow', position: { x: 30, y: 50 }, sourceEntityId: 'srv', targetEntityId: 'db' } as any),
      makeEntity({ id: 'a2', type: 'DataFlow', position: { x: 50, y: 50 }, sourceEntityId: 'db', targetEntityId: 'cache' } as any),
    ]);
    const result = scoreEntityDensity([frame]);
    // 5 content entities = ideal
    expect(result.score).toBe(100);
  });

  it('excludes headings and labels from density count', () => {
    const frame = makeFrame([
      makeEntity({ id: 'h', type: 'H1', position: { x: 50, y: 10 } }),
      makeEntity({ id: 'l', type: 'Label', position: { x: 50, y: 90 } }),
      makeEntity({ id: 'e1', type: 'Server', position: { x: 25, y: 50 } }),
      makeEntity({ id: 'e2', type: 'Database', position: { x: 50, y: 50 } }),
      makeEntity({ id: 'e3', type: 'Cache', position: { x: 75, y: 50 } }),
      makeEntity({ id: 'e4', type: 'User', position: { x: 25, y: 30 } }),
      makeEntity({ id: 'e5', type: 'Queue', position: { x: 75, y: 30 } }),
    ]);
    // 5 content entities (H1 and Label excluded)
    expect(scoreEntityDensity([frame]).score).toBe(100);
  });
});

// ── Layout Quality ───────────────────────────────────────────────────────

describe('scoreLayoutQuality', () => {
  it('returns 0 for empty frames', () => {
    expect(scoreLayoutQuality([]).score).toBe(0);
  });

  it('scores 100 for single-entity frames', () => {
    const frame = makeFrame([makeEntity({ id: 'e1' })]);
    expect(scoreLayoutQuality([frame]).score).toBe(100);
  });

  it('scores high for well-spaced entities', () => {
    const frame = makeFrame([
      makeEntity({ id: 'e1', position: { x: 20, y: 50 } }),
      makeEntity({ id: 'e2', position: { x: 50, y: 50 } }),
      makeEntity({ id: 'e3', position: { x: 80, y: 50 } }),
    ]);
    const result = scoreLayoutQuality([frame]);
    expect(result.score).toBeGreaterThanOrEqual(70);
  });

  it('penalises overlapping entities', () => {
    const frame = makeFrame([
      makeEntity({ id: 'e1', position: { x: 50, y: 50 } }),
      makeEntity({ id: 'e2', position: { x: 51, y: 50 } }),
      makeEntity({ id: 'e3', position: { x: 52, y: 50 } }),
    ]);
    const result = scoreLayoutQuality([frame]);
    expect(result.score).toBeLessThan(70);
  });

  it('penalises highly uneven spacing', () => {
    const frame = makeFrame([
      makeEntity({ id: 'e1', position: { x: 10, y: 50 } }),
      makeEntity({ id: 'e2', position: { x: 11, y: 50 } }),
      makeEntity({ id: 'e3', position: { x: 90, y: 50 } }),
    ]);
    const result = scoreLayoutQuality([frame]);
    // Two entities very close, one very far = high spacing variance
    expect(result.score).toBeLessThan(80);
  });
});

// ── Visual Balance ───────────────────────────────────────────────────────

describe('scoreVisualBalance', () => {
  it('returns 0 for empty frames', () => {
    expect(scoreVisualBalance([]).score).toBe(0);
  });

  it('scores high for centered layout', () => {
    const frame = makeFrame([
      makeEntity({ id: 'e1', position: { x: 40, y: 45 } }),
      makeEntity({ id: 'e2', position: { x: 60, y: 55 } }),
      makeEntity({ id: 'e3', position: { x: 50, y: 50 } }),
    ]);
    const result = scoreVisualBalance([frame]);
    expect(result.score).toBeGreaterThanOrEqual(90);
  });

  it('penalises corner-clustered layout', () => {
    const frame = makeFrame([
      makeEntity({ id: 'e1', position: { x: 5, y: 5 } }),
      makeEntity({ id: 'e2', position: { x: 10, y: 5 } }),
      makeEntity({ id: 'e3', position: { x: 5, y: 10 } }),
    ]);
    const result = scoreVisualBalance([frame]);
    expect(result.score).toBeLessThan(30);
  });

  it('returns 50 for empty-entity frames', () => {
    const frame = makeFrame([]);
    expect(scoreVisualBalance([frame]).score).toBe(50);
  });
});

// ── Entity Persistence ───────────────────────────────────────────────────

describe('scoreEntityPersistence', () => {
  it('returns 100 for single frame', () => {
    const frame = makeFrame([makeEntity({ id: 'e1' })]);
    expect(scoreEntityPersistence([frame]).score).toBe(100);
  });

  it('scores high when entities persist across frames', () => {
    const frame1 = makeFrame([
      makeEntity({ id: 'srv', position: { x: 25, y: 50 } }),
      makeEntity({ id: 'db', position: { x: 50, y: 50 } }),
      makeEntity({ id: 'cache', position: { x: 75, y: 50 } }),
    ]);
    const frame2 = makeFrame([
      makeEntity({ id: 'srv', position: { x: 25, y: 50 } }),
      makeEntity({ id: 'db', position: { x: 50, y: 50 } }),
      makeEntity({ id: 'cache', position: { x: 75, y: 50 } }),
      makeEntity({ id: 'user', position: { x: 50, y: 20 } }),
    ]);
    const result = scoreEntityPersistence([frame1, frame2]);
    // 3 out of 4 unique entities persist = 75% Jaccard
    expect(result.score).toBeGreaterThanOrEqual(70);
  });

  it('scores low when no entities persist', () => {
    const frame1 = makeFrame([
      makeEntity({ id: 'a', position: { x: 25, y: 50 } }),
      makeEntity({ id: 'b', position: { x: 75, y: 50 } }),
    ]);
    const frame2 = makeFrame([
      makeEntity({ id: 'c', position: { x: 25, y: 50 } }),
      makeEntity({ id: 'd', position: { x: 75, y: 50 } }),
    ]);
    const result = scoreEntityPersistence([frame1, frame2]);
    // 0% intersection = 0 score
    expect(result.score).toBe(0);
  });

  it('scores correctly across multiple transitions', () => {
    const frame1 = makeFrame([makeEntity({ id: 'a' }), makeEntity({ id: 'b' })]);
    const frame2 = makeFrame([makeEntity({ id: 'a' }), makeEntity({ id: 'c' })]);
    const frame3 = makeFrame([makeEntity({ id: 'a' }), makeEntity({ id: 'c' })]);
    // Transition 1: a persists, b->c = 1/3 Jaccard = 33%
    // Transition 2: a,c persist = 2/2 = 100%
    // Average: ~67%
    const result = scoreEntityPersistence([frame1, frame2, frame3]);
    expect(result.score).toBeGreaterThanOrEqual(50);
    expect(result.score).toBeLessThanOrEqual(100);
  });
});

// ── Narration Coverage ───────────────────────────────────────────────────

describe('scoreNarrationCoverage', () => {
  it('returns 0 for empty frames', () => {
    expect(scoreNarrationCoverage([]).score).toBe(0);
  });

  it('scores 100 when all frames have narration', () => {
    const frames = [
      makeFrame([makeEntity()], 'Frame 1 narration'),
      makeFrame([makeEntity()], 'Frame 2 narration'),
    ];
    expect(scoreNarrationCoverage(frames).score).toBe(100);
  });

  it('scores 50 when half the frames have narration', () => {
    const frames = [
      makeFrame([makeEntity()], 'Has narration'),
      makeFrame([makeEntity()], ''),
    ];
    expect(scoreNarrationCoverage(frames).score).toBe(50);
  });

  it('scores 0 when no frames have narration', () => {
    const frames = [
      makeFrame([makeEntity()], ''),
      makeFrame([makeEntity()], ''),
    ];
    expect(scoreNarrationCoverage(frames).score).toBe(0);
  });

  it('treats whitespace-only narration as missing', () => {
    const frames = [makeFrame([makeEntity()], '   ')];
    expect(scoreNarrationCoverage(frames).score).toBe(0);
  });
});

// ── Format Compliance ────────────────────────────────────────────────────

describe('scoreFormatCompliance', () => {
  it('returns 0 for empty frames', () => {
    expect(scoreFormatCompliance([]).score).toBe(0);
  });

  it('scores 100 for well-formed entities', () => {
    const frame = makeFrame([
      makeEntity({ id: 'srv', type: 'Server', position: { x: 25, y: 50 } }),
      makeEntity({ id: 'db', type: 'Database', position: { x: 75, y: 50 } }),
    ]);
    expect(scoreFormatCompliance([frame]).score).toBe(100);
  });

  it('penalises out-of-range positions', () => {
    const frame = makeFrame([
      makeEntity({ id: 'e1', type: 'Server', position: { x: 150, y: 50 } }),
    ]);
    const result = scoreFormatCompliance([frame]);
    expect(result.score).toBeLessThan(100);
  });

  it('penalises connections missing source/target', () => {
    const frame = makeFrame([
      makeEntity({ id: 'a1', type: 'Arrow', position: { x: 50, y: 50 } }),
    ]);
    const result = scoreFormatCompliance([frame]);
    expect(result.score).toBeLessThan(100);
    expect(result.details).toContain('missing source/target');
  });

  it('passes connections with source and target', () => {
    const frame = makeFrame([
      makeEntity({
        id: 'a1',
        type: 'Arrow',
        position: { x: 50, y: 50 },
        sourceEntityId: 'srv',
        targetEntityId: 'db',
      } as any),
    ]);
    expect(scoreFormatCompliance([frame]).score).toBe(100);
  });
});

// ── Narration Quality ────────────────────────────────────────────────────

describe('scoreNarrationQuality', () => {
  it('returns 0 for empty frames', () => {
    expect(scoreNarrationQuality([]).score).toBe(0);
  });

  it('scores 0 for frames with no narration', () => {
    const frame = makeFrame([makeEntity()], '');
    expect(scoreNarrationQuality([frame]).score).toBe(0);
  });

  it('scores low for very short narration', () => {
    const frame = makeFrame([makeEntity()], 'This is short.');
    const result = scoreNarrationQuality([frame]);
    expect(result.score).toBeLessThan(50);
  });

  it('scores high for ideal-length narration with technical terms', () => {
    const frame = makeFrame(
      [makeEntity()],
      'Binary search halves the search space each iteration by maintaining two pointers, lo and hi. Each comparison eliminates half the remaining elements, giving O(log n) time complexity.',
    );
    const result = scoreNarrationQuality([frame]);
    expect(result.score).toBeGreaterThanOrEqual(60);
  });

  it('rewards narration with specific technical terms', () => {
    const technical = makeFrame(
      [makeEntity()],
      'The PostgreSQL database handles 10000 req/s with Redis caching, reducing p95 latency from 200ms to 5ms across the API gateway.',
    );
    const generic = makeFrame(
      [makeEntity()],
      'The database is very fast and handles many requests well with good performance and great caching capabilities throughout the system.',
    );
    const techScore = scoreNarrationQuality([technical]).score;
    const genScore = scoreNarrationQuality([generic]).score;
    expect(techScore).toBeGreaterThan(genScore);
  });

  it('gives alignment bonus when narration mentions highlighted entity label', () => {
    const aligned = makeFrame(
      [
        makeEntity({ id: 'srv', type: 'Server', label: 'API Server' } as any),
        makeEntity({ id: 'db', type: 'Database', label: 'PostgreSQL', highlight: true } as any),
      ],
      'PostgreSQL handles the primary data storage, providing ACID compliance and supporting complex queries across multiple tables.',
    );
    const misaligned = makeFrame(
      [
        makeEntity({ id: 'srv', type: 'Server', label: 'API Server' } as any),
        makeEntity({ id: 'db', type: 'Database', label: 'PostgreSQL', highlight: true } as any),
      ],
      'The server handles incoming requests and routes them to the appropriate backend services for processing and response generation.',
    );
    const alignedScore = scoreNarrationQuality([aligned]).score;
    const misalignedScore = scoreNarrationQuality([misaligned]).score;
    expect(alignedScore).toBeGreaterThanOrEqual(misalignedScore);
  });

  it('penalises excessively long narration', () => {
    const longText = Array(30).fill('The system processes data through multiple layers.').join(' ');
    const frame = makeFrame([makeEntity()], longText);
    const result = scoreNarrationQuality([frame]);
    expect(result.score).toBeLessThan(80);
  });
});

// ── Narrative Arc ────────────────────────────────────────────────────────

describe('scoreNarrativeArc', () => {
  it('returns 0 for empty frames', () => {
    expect(scoreNarrativeArc([]).score).toBe(0);
  });

  it('returns 50 for single frame', () => {
    const frame = makeFrame([makeEntity()]);
    expect(scoreNarrativeArc([frame]).score).toBe(50);
  });

  it('scores high for presentations with growing complexity', () => {
    const frame1 = makeFrame([
      makeEntity({ id: 'srv', position: { x: 50, y: 50 } }),
    ]);
    const frame2 = makeFrame([
      makeEntity({ id: 'srv', position: { x: 30, y: 50 } }),
      makeEntity({ id: 'db', position: { x: 70, y: 50 } }),
    ]);
    const frame3 = makeFrame([
      makeEntity({ id: 'srv', position: { x: 20, y: 50 } }),
      makeEntity({ id: 'db', position: { x: 50, y: 50 } }),
      makeEntity({ id: 'cache', position: { x: 80, y: 50 } }),
    ]);
    const result = scoreNarrativeArc([frame1, frame2, frame3]);
    expect(result.score).toBeGreaterThanOrEqual(40);
  });

  it('rewards highlight progression across frames', () => {
    const withProgression = [
      makeFrame([
        makeEntity({ id: 'a', highlight: true } as any),
        makeEntity({ id: 'b' }),
        makeEntity({ id: 'c' }),
      ]),
      makeFrame([
        makeEntity({ id: 'a' }),
        makeEntity({ id: 'b', highlight: true } as any),
        makeEntity({ id: 'c' }),
      ]),
      makeFrame([
        makeEntity({ id: 'a' }),
        makeEntity({ id: 'b' }),
        makeEntity({ id: 'c', highlight: true } as any),
      ]),
    ];
    const withoutProgression = [
      makeFrame([
        makeEntity({ id: 'a', highlight: true } as any),
        makeEntity({ id: 'b' }),
        makeEntity({ id: 'c' }),
      ]),
      makeFrame([
        makeEntity({ id: 'a', highlight: true } as any),
        makeEntity({ id: 'b' }),
        makeEntity({ id: 'c' }),
      ]),
      makeFrame([
        makeEntity({ id: 'a', highlight: true } as any),
        makeEntity({ id: 'b' }),
        makeEntity({ id: 'c' }),
      ]),
    ];
    const progScore = scoreNarrativeArc(withProgression).score;
    const staticScore = scoreNarrativeArc(withoutProgression).score;
    expect(progScore).toBeGreaterThan(staticScore);
  });

  it('penalises too many new entities at once', () => {
    const frame1 = makeFrame([makeEntity({ id: 'a' })]);
    // Frame 2 introduces 8 new entities at once — overwhelming
    const frame2 = makeFrame(
      Array.from({ length: 9 }, (_, i) =>
        makeEntity({ id: i === 0 ? 'a' : `new${i}`, position: { x: 10 + i * 10, y: 50 } }),
      ),
    );
    const result = scoreNarrativeArc([frame1, frame2]);
    expect(result.details).toContain('introRate=');
  });

  it('penalises too few frames', () => {
    const frames = [
      makeFrame([makeEntity({ id: 'a' }), makeEntity({ id: 'b' })]),
      makeFrame([makeEntity({ id: 'a' }), makeEntity({ id: 'b' }), makeEntity({ id: 'c' })]),
    ];
    const result = scoreNarrativeArc(frames);
    expect(result.details).toContain('frameCount=');
    // 2 frames < ideal minimum of 3
    expect(result.score).toBeLessThan(80);
  });

  it('scores well for ideal frame count (3-7)', () => {
    const frames = Array.from({ length: 5 }, (_, i) =>
      makeFrame(
        Array.from({ length: 3 + i }, (__, j) =>
          makeEntity({ id: `e${j}`, position: { x: 20 + j * 15, y: 50 } }),
        ),
      ),
    );
    // Add highlights that progress
    (frames[0].entities[0] as any).highlight = true;
    (frames[1].entities[1] as any).highlight = true;
    (frames[2].entities[2] as any).highlight = true;
    (frames[3].entities[3] as any).highlight = true;
    (frames[4].entities[4] as any).highlight = true;

    const result = scoreNarrativeArc(frames);
    expect(result.score).toBeGreaterThanOrEqual(60);
  });
});

// ── Connection Completeness ──────────────────────────────────────────────

describe('scoreConnectionCompleteness', () => {
  it('returns 0 for empty frames', () => {
    expect(scoreConnectionCompleteness([]).score).toBe(0);
  });

  it('scores 100 for single-entity frames', () => {
    const frame = makeFrame([makeEntity({ id: 'e1' })]);
    expect(scoreConnectionCompleteness([frame]).score).toBe(100);
  });

  it('scores high when all entities are connected', () => {
    const frame = makeFrame([
      makeEntity({ id: 'srv', type: 'Server', position: { x: 25, y: 50 } }),
      makeEntity({ id: 'db', type: 'Database', position: { x: 75, y: 50 } }),
      makeEntity({
        id: 'a1', type: 'Arrow', position: { x: 50, y: 50 },
        sourceEntityId: 'srv', targetEntityId: 'db',
      } as any),
    ]);
    const result = scoreConnectionCompleteness([frame]);
    expect(result.score).toBeGreaterThanOrEqual(80);
  });

  it('penalises orphan entities', () => {
    const connected = makeFrame([
      makeEntity({ id: 'srv', type: 'Server', position: { x: 25, y: 50 } }),
      makeEntity({ id: 'db', type: 'Database', position: { x: 75, y: 50 } }),
      makeEntity({
        id: 'a1', type: 'Arrow', position: { x: 50, y: 50 },
        sourceEntityId: 'srv', targetEntityId: 'db',
      } as any),
    ]);
    const orphaned = makeFrame([
      makeEntity({ id: 'srv', type: 'Server', position: { x: 25, y: 50 } }),
      makeEntity({ id: 'db', type: 'Database', position: { x: 50, y: 50 } }),
      makeEntity({ id: 'cache', type: 'Cache', position: { x: 75, y: 50 } }),
      // No connections at all
    ]);
    const connScore = scoreConnectionCompleteness([connected]).score;
    const orphanScore = scoreConnectionCompleteness([orphaned]).score;
    expect(connScore).toBeGreaterThan(orphanScore);
  });

  it('penalises broken connection references', () => {
    const valid = makeFrame([
      makeEntity({ id: 'srv', type: 'Server', position: { x: 25, y: 50 } }),
      makeEntity({ id: 'db', type: 'Database', position: { x: 75, y: 50 } }),
      makeEntity({
        id: 'a1', type: 'Arrow', position: { x: 50, y: 50 },
        sourceEntityId: 'srv', targetEntityId: 'db',
      } as any),
    ]);
    const broken = makeFrame([
      makeEntity({ id: 'srv', type: 'Server', position: { x: 25, y: 50 } }),
      makeEntity({ id: 'db', type: 'Database', position: { x: 75, y: 50 } }),
      makeEntity({
        id: 'a1', type: 'Arrow', position: { x: 50, y: 50 },
        sourceEntityId: 'srv', targetEntityId: 'nonexistent',
      } as any),
    ]);
    const validScore = scoreConnectionCompleteness([valid]).score;
    const brokenScore = scoreConnectionCompleteness([broken]).score;
    expect(validScore).toBeGreaterThanOrEqual(brokenScore);
  });

  it('reports orphan and broken ref counts in details', () => {
    const frame = makeFrame([
      makeEntity({ id: 'a', type: 'Server', position: { x: 25, y: 50 } }),
      makeEntity({ id: 'b', type: 'Database', position: { x: 50, y: 50 } }),
      makeEntity({ id: 'c', type: 'Cache', position: { x: 75, y: 50 } }),
    ]);
    const result = scoreConnectionCompleteness([frame]);
    expect(result.details).toContain('orphan entities');
    expect(result.details).toContain('broken refs');
  });
});

// ── Aggregate Scorer ─────────────────────────────────────────────────────

describe('scoreVisualScript', () => {
  it('returns a complete quality report', () => {
    const script = makeScript([
      makeFrame(
        [
          makeEntity({ id: 'srv', type: 'Server', position: { x: 25, y: 45 } }),
          makeEntity({ id: 'db', type: 'Database', position: { x: 50, y: 45 } }),
          makeEntity({ id: 'cache', type: 'Cache', position: { x: 75, y: 45 } }),
          makeEntity({ id: 'user', type: 'User', position: { x: 50, y: 20 } }),
          makeEntity({ id: 'queue', type: 'Queue', position: { x: 50, y: 70 } }),
          makeEntity({ id: 'h1', type: 'H1', position: { x: 50, y: 6 } }),
          makeEntity({
            id: 'a1',
            type: 'Arrow',
            position: { x: 37, y: 45 },
            sourceEntityId: 'srv',
            targetEntityId: 'db',
          } as any),
        ],
        'The API server queries the database through a caching layer.',
      ),
      makeFrame(
        [
          makeEntity({ id: 'srv', type: 'Server', position: { x: 25, y: 45 } }),
          makeEntity({ id: 'db', type: 'Database', position: { x: 65, y: 45 } }),
          makeEntity({ id: 'cache', type: 'Cache', position: { x: 45, y: 45 } }),
          makeEntity({ id: 'user', type: 'User', position: { x: 50, y: 20 } }),
          makeEntity({ id: 'queue', type: 'Queue', position: { x: 50, y: 70 } }),
          makeEntity({ id: 'h1', type: 'H1', position: { x: 50, y: 6 } }),
          makeEntity({
            id: 'a2',
            type: 'Arrow',
            position: { x: 55, y: 45 },
            sourceEntityId: 'cache',
            targetEntityId: 'db',
          } as any),
        ],
        'Adding a Redis cache reduces database load by 90%.',
      ),
    ]);

    const report = scoreVisualScript(script);

    // Structure checks
    expect(report.overall).toBeGreaterThanOrEqual(0);
    expect(report.overall).toBeLessThanOrEqual(100);
    expect(report.frameCount).toBe(2);
    expect(report.totalEntities).toBe(14);
    expect(report.timestamp).toBeTruthy();
    expect(report.dimensions).toHaveProperty('entityDensity');
    expect(report.dimensions).toHaveProperty('layoutQuality');
    expect(report.dimensions).toHaveProperty('visualBalance');
    expect(report.dimensions).toHaveProperty('entityPersistence');
    expect(report.dimensions).toHaveProperty('narrationCoverage');
    expect(report.dimensions).toHaveProperty('formatCompliance');
    expect(report.dimensions).toHaveProperty('narrationQuality');
    expect(report.dimensions).toHaveProperty('narrativeArc');
    expect(report.dimensions).toHaveProperty('connectionCompleteness');

    // Each dimension should have score and details
    for (const dim of Object.values(report.dimensions)) {
      expect(dim.score).toBeGreaterThanOrEqual(0);
      expect(dim.score).toBeLessThanOrEqual(100);
      expect(dim.details).toBeTruthy();
    }

    // Good script should score well
    expect(report.overall).toBeGreaterThanOrEqual(60);
    expect(report.dimensions.narrationCoverage.score).toBe(100);
    expect(report.dimensions.formatCompliance.score).toBe(100);
  });

  it('handles empty script gracefully', () => {
    const script = makeScript([]);
    const report = scoreVisualScript(script);
    // Persistence returns 100 for ≤1 frame (N/A), so overall won't be exactly 0
    expect(report.overall).toBeLessThanOrEqual(30);
    expect(report.frameCount).toBe(0);
    expect(report.totalEntities).toBe(0);
  });

  it('overall score is weighted average of dimensions', () => {
    const script = makeScript([
      makeFrame(
        Array.from({ length: 6 }, (_, i) =>
          makeEntity({ id: `e${i}`, position: { x: 15 + i * 14, y: 50 } }),
        ),
        'Good narration here.',
      ),
    ]);
    const report = scoreVisualScript(script);

    // Manually compute expected weighted average
    const d = report.dimensions;
    const expected = Math.round(
      d.entityDensity.score * 0.12 +
      d.layoutQuality.score * 0.12 +
      d.visualBalance.score * 0.06 +
      d.entityPersistence.score * 0.12 +
      d.narrationCoverage.score * 0.10 +
      d.formatCompliance.score * 0.06 +
      d.narrationQuality.score * 0.16 +
      d.narrativeArc.score * 0.14 +
      d.connectionCompleteness.score * 0.12,
    );
    expect(report.overall).toBe(expected);
  });
});
