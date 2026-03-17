/**
 * @preplai/mcp-server — Semantic Focus Cue Generator
 *
 * Uses Anthropic Claude Haiku to analyze narration text + entity context
 * and produce intelligent multi-entity focus cues with confidence scores.
 *
 * Falls back to string-matching (generateStringMatchCues) on any failure.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { VisualEntity, FocusCue } from '@preplai/shared';
import type { WordTimestamp } from './tts-provider.js';
import { semanticFallbackTotal } from './metrics.js';

// ── Types ────────────────────────────────────────────────────────────

interface EntityInfo {
  id: string;
  type: string;
  label: string;
}

interface LLMFocusSegment {
  startTime: number;
  entityIds: string[];
  confidences: number[];
  phrase: string;
}

// ── Constants ────────────────────────────────────────────────────────

const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 1024;
const TEMPERATURE = 0;

// ── LLM Prompt ──────────────────────────────────────────────────────

function buildPrompt(
  narration: string,
  entities: EntityInfo[],
  wordTimestamps: WordTimestamp[],
): string {
  const entityList = entities
    .map(e => `  - id:"${e.id}" type:${e.type} label:"${e.label}"`)
    .join('\n');

  const transcript = wordTimestamps
    .map(wt => `[${wt.startTime.toFixed(2)}s] ${wt.word}`)
    .join(' ');

  return `You are a focus cue generator for a cinematic presentation engine.
Given narration text with word-level timestamps and a list of visual entities on screen,
determine which entities should be visually highlighted at each moment.

ENTITIES ON SCREEN:
${entityList}

NARRATION WITH TIMESTAMPS:
${transcript}

FULL NARRATION: "${narration}"

RULES:
1. Output JSON array of focus segments. Each segment has startTime, entityIds, confidences, phrase.
2. startTime MUST match an exact word timestamp from the transcript.
3. entityIds: array of entity IDs being discussed at that moment (1-5 entities).
4. confidences: same length as entityIds, each 0.0-1.0. Primary entity gets 0.8-1.0, related entities get 0.3-0.7.
5. phrase: the narration words that correspond to this focus.
6. Minimum 2 seconds between segments mentioning the same primary entity.
7. Only include segments where entities are meaningfully referenced.
8. Consider semantic meaning: "the cache layer" should focus on a Cache entity even if "cache" doesn't appear exactly. Resolve synonyms, pronouns, and group references.

Respond with ONLY a JSON array, no markdown, no explanation:
[{"startTime":0.5,"entityIds":["srv"],"confidences":[1.0],"phrase":"API server"},...]`;
}

// ── Public API ──────────────────────────────────────────────────────

let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic | null {
  if (anthropicClient) return anthropicClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  anthropicClient = new Anthropic({ apiKey });
  return anthropicClient;
}

/**
 * Generate semantic focus cues using LLM analysis.
 * Returns null if LLM is unavailable or fails (caller should fall back to string matching).
 */
export async function generateSemanticFocusCues(
  narration: string,
  entities: VisualEntity[],
  wordTimestamps: WordTimestamp[],
): Promise<FocusCue[] | null> {
  const client = getClient();
  if (!client) {
    semanticFallbackTotal.inc({ reason: 'no_api_key' });
    return null;
  }

  // Filter to non-connection entities with labels
  const CONNECTION_TYPES = new Set(['Arrow', 'DataFlow', 'BidirectArrow', 'DottedArrow']);
  const entityInfos: EntityInfo[] = entities
    .filter(e => !CONNECTION_TYPES.has(e.type) && e.label)
    .map(e => ({ id: e.id, type: e.type, label: e.label! }));

  if (entityInfos.length === 0 || wordTimestamps.length === 0) return null;

  try {
    const prompt = buildPrompt(narration, entityInfos, wordTimestamps);

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: TEMPERATURE,
      messages: [{ role: 'user', content: prompt }],
    });

    let text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map(block => block.text)
      .join('');

    // Strip markdown code fences if present (```json ... ```)
    text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

    const segments = JSON.parse(text) as LLMFocusSegment[];
    if (!Array.isArray(segments)) return null;

    // Validate and convert to FocusCue[]
    const validEntityIds = new Set(entityInfos.map(e => e.id));
    const cues: FocusCue[] = [];

    for (const seg of segments) {
      if (typeof seg.startTime !== 'number') continue;
      if (!Array.isArray(seg.entityIds) || seg.entityIds.length === 0) continue;

      // Filter to valid entity IDs
      const validIds: string[] = [];
      const validConfs: number[] = [];
      for (let i = 0; i < seg.entityIds.length; i++) {
        if (validEntityIds.has(seg.entityIds[i])) {
          validIds.push(seg.entityIds[i]);
          validConfs.push(seg.confidences?.[i] ?? 1.0);
        }
      }
      if (validIds.length === 0) continue;

      // Snap startTime to nearest word timestamp
      const snapped = snapToWordTimestamp(seg.startTime, wordTimestamps);

      cues.push({
        time: snapped,
        entityIds: validIds,
        entityId: validIds[0],
        confidences: validConfs,
        word: seg.phrase,
      });
    }

    cues.sort((a, b) => a.time - b.time);
    return cues.length > 0 ? cues : null;
  } catch (err) {
    console.warn(
      '[SemanticFocus] LLM call failed, falling back to string matching:',
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

function snapToWordTimestamp(time: number, timestamps: WordTimestamp[]): number {
  let closest = timestamps[0]?.startTime ?? time;
  let minDist = Math.abs(time - closest);

  for (const wt of timestamps) {
    const dist = Math.abs(time - wt.startTime);
    if (dist < minDist) {
      minDist = dist;
      closest = wt.startTime;
    }
  }

  return closest;
}
