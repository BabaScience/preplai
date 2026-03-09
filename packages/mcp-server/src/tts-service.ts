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

        // Generate focus cues
        const focusCues = generateFocusCues(
          result.wordTimestamps,
          frame.entities,
          frame.focusCues, // agent-provided overrides
        );

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
 * Strategy:
 * 1. If agent provided explicit focusCues, use those directly.
 * 2. Otherwise, auto-detect by matching words in the narration to entity labels.
 *    - Case-insensitive matching
 *    - Multi-word labels split into individual words
 *    - 2-second cooldown per entity to avoid rapid re-cueing
 */
export function generateFocusCues(
  wordTimestamps: WordTimestamp[],
  entities: VisualEntity[],
  agentCues?: FocusCue[],
): FocusCue[] {
  // Agent-provided cues take priority
  if (agentCues && agentCues.length > 0) {
    return agentCues;
  }

  // Build label → entityId lookup map
  const labelMap = buildLabelMap(entities);
  if (labelMap.size === 0) return [];

  // Match word timestamps against labels
  const cues: FocusCue[] = [];
  const lastCueTime = new Map<string, number>();

  for (const wt of wordTimestamps) {
    const normalized = wt.word.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalized.length < MIN_WORD_LENGTH) continue;

    const entityId = labelMap.get(normalized);
    if (!entityId) continue;

    // Enforce cooldown per entity
    const lastTime = lastCueTime.get(entityId) ?? -Infinity;
    if (wt.startTime - lastTime < MIN_CUE_GAP_S) continue;

    cues.push({
      time: wt.startTime,
      entityId,
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
