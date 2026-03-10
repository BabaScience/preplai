/**
 * @preplai/mcp-server — TTS Orchestrator Service
 *
 * Coordinates async audio generation for frames:
 * 1. Calls ElevenLabs TTS for each frame's narration text
 * 2. Generates focus cues by matching entity labels to word timestamps
 * 3. Stores audio buffers and updates frame metadata
 * 4. Emits SSE events when audio is ready
 *
 * Fire-and-forget from add_scene handler — never blocks the agent's call.
 */

import type { IllustrationFrame, VisualEntity, FocusCue, FrameAudio } from '@preplai/shared';
import { generateSpeech, type ElevenLabsConfig, type WordTimestamp } from './elevenlabs.js';
import { generateSemanticFocusCues } from './semantic-focus.js';
import type { AudioStore } from './audio-store.js';
import type { SessionStore } from './session-store.js';
import type { SseRegistry } from './sse.js';

// ── Constants ────────────────────────────────────────────────────────

/** Minimum word length to consider for auto-matching (skip "a", "to", etc.) */
const MIN_WORD_LENGTH = 3;

/** Minimum seconds between cues for the same entity */
const MIN_CUE_GAP_S = 2.0;

/** Per-language ElevenLabs voice IDs */
const VOICE_MAP: Record<string, string> = {
  en: 'uh5qBlKfjqFl7XXhFnJi',
  fr: 'oziFLKtaxVDHQAh7o45V',
  it: 'osWtKxGwfZZUMhr77HFc',
};

// ── Public API ───────────────────────────────────────────────────────

export class TtsService {
  constructor(
    private readonly config: ElevenLabsConfig,
    private readonly audioStore: AudioStore,
    private readonly sessionStore: SessionStore,
    private readonly sse: SseRegistry,
  ) {}

  /**
   * Generate audio for frames that have narrationSegment text.
   * Runs asynchronously — does not block the caller.
   * Only processes frames at indices >= startIndex.
   * @param scriptLanguage - Script-level language (frame.language overrides)
   */
  generateForFrames(
    sessionId: string,
    frames: IllustrationFrame[],
    startIndex: number,
    scriptLanguage?: string,
  ): void {
    // Fire-and-forget
    this._processFrames(sessionId, frames, startIndex, scriptLanguage).catch(err => {
      console.error(`[TTS] Error generating audio for session ${sessionId}:`, err);
    });
  }

  // ── Private ──────────────────────────────────────────────────────────

  private async _processFrames(
    sessionId: string,
    frames: IllustrationFrame[],
    startIndex: number,
    scriptLanguage?: string,
  ): Promise<void> {
    for (let i = startIndex; i < frames.length; i++) {
      const frame = frames[i];
      // narrationSegment can be a string or { text: '...' } from expanded format
      const seg = frame?.narrationSegment;
      const narrationText = typeof seg === 'string' ? seg : (seg as any)?.text;
      if (!narrationText?.trim()) continue;

      try {
        // Resolve per-frame voice: frame language > script language > 'en'
        const lang = (frame as any).language ?? scriptLanguage ?? 'en';
        const voiceId = VOICE_MAP[lang] ?? VOICE_MAP.en;
        const result = await generateSpeech(narrationText, this.config, voiceId);

        // Store audio buffer (async — GridFS backed)
        await this.audioStore.set(sessionId, i, result.audioBuffer);

        // Generate focus cues (semantic LLM → string matching fallback)
        const focusCues = await generateFocusCues(
          result.wordTimestamps,
          frame.entities,
          frame.focusCues, // agent-provided overrides
          narrationText,
        );

        // Attach narration segments to each cue using word timestamps
        assignNarrationSegments(focusCues, result.wordTimestamps);

        // Build audio metadata
        const audio: FrameAudio = {
          url: `/audio/${sessionId}/${i}.mp3`,
          duration: result.duration,
          focusCues,
          status: 'ready',
        };

        // Update stored script with audio metadata
        this._updateFrameAudio(sessionId, i, audio);

        // Emit SSE
        this.sse.emit(sessionId, {
          type: 'audio_ready',
          frameIndex: i,
          audio,
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown TTS error';
        console.error(`[TTS] Frame ${i} failed for session ${sessionId}:`, errorMessage);

        const errorAudio: FrameAudio = {
          url: '',
          duration: 0,
          focusCues: [],
          status: 'error',
          errorMessage,
        };

        this.sse.emit(sessionId, {
          type: 'audio_ready',
          frameIndex: i,
          audio: errorAudio,
        });
      }
    }
  }

  private _updateFrameAudio(sessionId: string, frameIndex: number, audio: FrameAudio): void {
    const session = this.sessionStore.getSession(sessionId);
    if (!session?.script?.frames?.[frameIndex]) return;

    (session.script.frames[frameIndex] as any).audio = audio;

    // Persist to DB (fire-and-forget, don't block the loop)
    this.sessionStore.setScript(sessionId, session.script).catch(err => {
      console.error(`[TTS] Failed to persist audio metadata for frame ${frameIndex}:`, err);
    });
  }
}

// ── Focus Cue Generation ─────────────────────────────────────────────

/**
 * Generate timed focus cues from word timestamps and entity labels.
 *
 * Fallback chain:
 * 1. Agent-provided explicit focusCues → use verbatim (always wins)
 * 2. LLM semantic analysis → multi-entity cues with confidence scores
 * 3. String matching → zero external deps, always available
 */
export async function generateFocusCues(
  wordTimestamps: WordTimestamp[],
  entities: VisualEntity[],
  agentCues?: FocusCue[],
  narration?: string,
): Promise<FocusCue[]> {
  // Agent-provided cues take priority
  if (agentCues && agentCues.length > 0) {
    return agentCues.map(normalizeFocusCue);
  }

  // Try semantic LLM-based cue generation
  if (narration) {
    try {
      const semanticCues = await generateSemanticFocusCues(narration, entities, wordTimestamps);
      if (semanticCues && semanticCues.length > 0) {
        return semanticCues;
      }
    } catch (err) {
      console.warn('[TTS] Semantic focus failed, falling back to string matching:', err);
    }
  }

  // Fallback: string matching
  return generateStringMatchCues(wordTimestamps, entities);
}

/**
 * Normalize a FocusCue to ensure entityIds is always populated.
 * Handles both old (entityId: string) and new (entityIds: string[]) formats.
 */
export function normalizeFocusCue(cue: FocusCue): FocusCue {
  if (cue.entityIds && cue.entityIds.length > 0) {
    return { ...cue, entityId: cue.entityIds[0] };
  }
  if (cue.entityId) {
    return { ...cue, entityIds: [cue.entityId], confidences: cue.confidences ?? [1.0] };
  }
  return { ...cue, entityIds: [] };
}

/**
 * String-matching focus cue generation (fallback strategy).
 * Matches narration words to entity labels via buildLabelMap.
 */
function generateStringMatchCues(
  wordTimestamps: WordTimestamp[],
  entities: VisualEntity[],
): FocusCue[] {
  const labelMap = buildLabelMap(entities);
  if (labelMap.size === 0) return [];

  const cues: FocusCue[] = [];
  const lastCueTime = new Map<string, number>();

  for (const wt of wordTimestamps) {
    const normalized = wt.word.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalized.length < MIN_WORD_LENGTH) continue;

    const entityId = labelMap.get(normalized);
    if (!entityId) continue;

    const lastTime = lastCueTime.get(entityId) ?? -Infinity;
    if (wt.startTime - lastTime < MIN_CUE_GAP_S) continue;

    cues.push({
      time: wt.startTime,
      entityIds: [entityId],
      entityId,
      confidences: [1.0],
      word: wt.word,
    });
    lastCueTime.set(entityId, wt.startTime);
  }

  return cues;
}

/**
 * Build a map from normalized label words to entity IDs.
 * Indexes both full labels and individual words within labels.
 */
export function buildLabelMap(entities: VisualEntity[]): Map<string, string> {
  const map = new Map<string, string>();

  // Skip connection-type entities (arrows don't get focus)
  const CONNECTION_TYPES = new Set(['Arrow', 'DataFlow', 'BidirectArrow', 'DottedArrow']);

  for (const entity of entities) {
    if (CONNECTION_TYPES.has(entity.type)) continue;
    if (!entity.label) continue;

    const fullLabel = entity.label.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

    // Index the full label (e.g., "api server" → entityId)
    const fullNormalized = fullLabel.replace(/\s+/g, '');
    if (fullNormalized.length >= MIN_WORD_LENGTH) {
      map.set(fullNormalized, entity.id);
    }

    // Index individual words (e.g., "api" → entityId, "server" → entityId)
    for (const word of fullLabel.split(/\s+/)) {
      if (word.length >= MIN_WORD_LENGTH) {
        // Don't overwrite existing entries (first entity wins)
        if (!map.has(word)) {
          map.set(word, entity.id);
        }
      }
    }
  }

  return map;
}

// ── Narration Segment Assignment ────────────────────────────────────

/**
 * Assign narration text segments to focus cues using word timestamps.
 *
 * Each cue gets the words spoken from its time until the next cue's time.
 * Words before the first cue are prepended to cue[0].
 * Words after the last cue are appended to the last cue.
 *
 * Mutates cues in place (adds `segment` field).
 */
export function assignNarrationSegments(
  cues: FocusCue[],
  wordTimestamps: WordTimestamp[],
): void {
  if (cues.length === 0 || wordTimestamps.length === 0) return;

  // Sort cues by time (should already be sorted, but be safe)
  cues.sort((a, b) => a.time - b.time);

  // For each cue, collect words from cue[i].time to cue[i+1].time
  for (let i = 0; i < cues.length; i++) {
    const startTime = i === 0 ? 0 : cues[i].time;
    const endTime = i < cues.length - 1 ? cues[i + 1].time : Infinity;

    const words: string[] = [];
    for (const wt of wordTimestamps) {
      if (wt.startTime >= startTime && wt.startTime < endTime) {
        words.push(wt.word);
      }
    }

    cues[i].segment = words.join(' ').trim() || undefined;
  }
}
