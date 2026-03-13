/**
 * Unit tests for the LLM-as-Judge module.
 *
 * Uses a mock LLM provider to test parsing, scoring, and error handling
 * without actual API calls.
 */
import { describe, it, expect } from 'vitest';
import { judgeVisualScript, combineScores } from './llm-judge.js';
import type { LlmJudgeOptions } from './llm-judge.js';

// ── Mock provider ────────────────────────────────────────────────────────

function mockProvider(response: string) {
  return async (_system: string, _user: string) => response;
}

function makeVisualScript(frames: any[] = []) {
  return {
    sceneId: 'test',
    totalDuration: frames.length * 5000,
    frames,
  };
}

function makeFrame(entities: any[], narration = 'Test narration.') {
  return {
    id: `f-${Math.random().toString(36).slice(2, 6)}`,
    startTime: 0,
    endTime: 5000,
    entities,
    narrationSegment: narration,
    description: 'Test frame',
  };
}

// ── judgeVisualScript ─────────────────────────────────────────────────

describe('judgeVisualScript', () => {
  it('parses a well-formed judge response', async () => {
    const provider = mockProvider(JSON.stringify({
      contentAccuracy: { score: 9, reasoning: 'All key concepts present.' },
      coherence: { score: 8, reasoning: 'Clear story arc.' },
      entityAppropriateness: { score: 7, reasoning: 'Mostly appropriate types.' },
    }));

    const script = makeVisualScript([
      makeFrame([{ id: 'srv', type: 'Server', label: 'API Server' }]),
    ]);

    const report = await judgeVisualScript({
      prompt: 'Explain REST API architecture',
      visualScript: script,
      provider,
      model: 'test-model',
    });

    expect(report.contentAccuracy.score).toBe(9);
    expect(report.coherence.score).toBe(8);
    expect(report.entityAppropriateness.score).toBe(7);
    expect(report.overall).toBeGreaterThan(7);
    expect(report.overall).toBeLessThan(9);
    expect(report.prompt).toBe('Explain REST API architecture');
    expect(report.model).toBe('test-model');
    expect(report.timestamp).toBeTruthy();
  });

  it('handles response wrapped in markdown fences', async () => {
    const provider = mockProvider('```json\n' + JSON.stringify({
      contentAccuracy: { score: 8, reasoning: 'Good coverage.' },
      coherence: { score: 7, reasoning: 'Logical flow.' },
      entityAppropriateness: { score: 9, reasoning: 'Perfect entity types.' },
    }) + '\n```');

    const report = await judgeVisualScript({
      prompt: 'Binary search',
      visualScript: makeVisualScript([]),
      provider,
      model: 'test',
    });

    expect(report.contentAccuracy.score).toBe(8);
    expect(report.coherence.score).toBe(7);
    expect(report.entityAppropriateness.score).toBe(9);
  });

  it('clamps scores to 1-10 range', async () => {
    const provider = mockProvider(JSON.stringify({
      contentAccuracy: { score: 15, reasoning: 'Overflow.' },
      coherence: { score: -3, reasoning: 'Underflow.' },
      entityAppropriateness: { score: 0, reasoning: 'Zero.' },
    }));

    const report = await judgeVisualScript({
      prompt: 'Test',
      visualScript: makeVisualScript([]),
      provider,
      model: 'test',
    });

    expect(report.contentAccuracy.score).toBe(10);
    expect(report.coherence.score).toBe(1);
    expect(report.entityAppropriateness.score).toBe(1);
  });

  it('handles missing dimension gracefully', async () => {
    const provider = mockProvider(JSON.stringify({
      contentAccuracy: { score: 8, reasoning: 'Good.' },
      // coherence missing
      entityAppropriateness: { score: 7, reasoning: 'Fine.' },
    }));

    const report = await judgeVisualScript({
      prompt: 'Test',
      visualScript: makeVisualScript([]),
      provider,
      model: 'test',
    });

    expect(report.contentAccuracy.score).toBe(8);
    expect(report.coherence.score).toBe(5); // Default fallback
    expect(report.entityAppropriateness.score).toBe(7);
  });

  it('calculates weighted overall score correctly', async () => {
    // Weights: contentAccuracy=0.45, coherence=0.30, entityAppropriateness=0.25
    const provider = mockProvider(JSON.stringify({
      contentAccuracy: { score: 10, reasoning: 'Perfect.' },
      coherence: { score: 10, reasoning: 'Perfect.' },
      entityAppropriateness: { score: 10, reasoning: 'Perfect.' },
    }));

    const report = await judgeVisualScript({
      prompt: 'Test',
      visualScript: makeVisualScript([]),
      provider,
      model: 'test',
    });

    expect(report.overall).toBe(10);
  });

  it('throws on completely unparseable response', async () => {
    const provider = mockProvider('This is not JSON at all, just random text with no braces.');

    await expect(judgeVisualScript({
      prompt: 'Test',
      visualScript: makeVisualScript([]),
      provider,
      model: 'test',
    })).rejects.toThrow();
  });

  it('includes entity labels and types in serialised script', async () => {
    let capturedUserPrompt = '';
    const provider = async (_system: string, user: string) => {
      capturedUserPrompt = user;
      return JSON.stringify({
        contentAccuracy: { score: 8, reasoning: 'Good.' },
        coherence: { score: 8, reasoning: 'Good.' },
        entityAppropriateness: { score: 8, reasoning: 'Good.' },
      });
    };

    const script = makeVisualScript([
      makeFrame([
        { id: 'srv', type: 'Server', label: 'API Gateway' },
        { id: 'db', type: 'Database', label: 'PostgreSQL', highlight: true },
      ], 'The API Gateway routes requests to PostgreSQL.'),
    ]);

    await judgeVisualScript({
      prompt: 'REST API architecture',
      visualScript: script,
      provider,
      model: 'test',
    });

    expect(capturedUserPrompt).toContain('API Gateway');
    expect(capturedUserPrompt).toContain('PostgreSQL');
    expect(capturedUserPrompt).toContain('REST API architecture');
    expect(capturedUserPrompt).toContain('Server');
    expect(capturedUserPrompt).toContain('Database');
  });
});

// ── combineScores ────────────────────────────────────────────────────────

describe('combineScores', () => {
  it('returns 100 when both scores are perfect', () => {
    // heuristic=100, judge=10 (maps to 100)
    expect(combineScores(100, 10)).toBe(100);
  });

  it('returns 0 when both scores are minimum', () => {
    // heuristic=0, judge=1 (maps to 0)
    expect(combineScores(0, 1)).toBe(0);
  });

  it('weights judge more heavily (60%) than heuristic (40%)', () => {
    // heuristic=100, judge=1 (maps to 0)
    const highHeuristic = combineScores(100, 1);
    // heuristic=0, judge=10 (maps to 100)
    const highJudge = combineScores(0, 10);

    // Judge should contribute more
    expect(highJudge).toBe(60);
    expect(highHeuristic).toBe(40);
  });

  it('produces expected mid-range score', () => {
    // heuristic=50, judge=5.5 (maps to 50)
    const result = combineScores(50, 5.5);
    expect(result).toBe(50);
  });
});
