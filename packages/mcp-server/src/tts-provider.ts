/**
 * @preplai/mcp-server — TTS Provider Interface
 *
 * Abstracts TTS generation so the orchestrator (TtsService) is
 * provider-agnostic. Implementations: ElevenLabs, Inworld.
 */

// ── Shared Types ─────────────────────────────────────────────────────

export interface WordTimestamp {
  word: string;
  /** Start time in seconds */
  startTime: number;
  /** End time in seconds */
  endTime: number;
}

export interface TtsResult {
  /** Raw MP3 audio as a Buffer */
  audioBuffer: Buffer;
  /** Audio duration in seconds */
  duration: number;
  /** Word-level timestamps aggregated from alignment data */
  wordTimestamps: WordTimestamp[];
}

// ── Provider Interface ───────────────────────────────────────────────

export interface TtsProvider {
  /** Human-readable name for logging */
  readonly name: string;

  /**
   * Generate speech audio from text.
   * @param text        — narration text to synthesize
   * @param voiceId     — provider-specific voice identifier
   * @returns             MP3 buffer + duration + word timestamps
   */
  generateSpeech(text: string, voiceId: string): Promise<TtsResult>;
}
