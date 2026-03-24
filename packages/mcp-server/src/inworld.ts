/**
 * @preplai/mcp-server — Inworld TTS Provider
 *
 * Generates speech audio from text using Inworld's TTS 1.5 API.
 * Uses the synchronous endpoint with word-level timestamps.
 * No SDK dependency — uses raw fetch for minimal footprint.
 *
 * Docs: https://docs.inworld.ai/docs/quickstart-tts
 */

import type { TtsProvider, TtsResult, WordTimestamp } from './tts-provider.js';

// ── Config ───────────────────────────────────────────────────────────

export interface InworldConfig {
  /** Base64-encoded API key from Inworld Portal */
  apiKey: string;
  /** Default voice name (e.g. "Ashley") */
  voiceId: string;
  /** Model to use: "inworld-tts-1.5-max" or "inworld-tts-1.5-mini" */
  modelId: string;
}

// ── Inworld API Response Shapes ──────────────────────────────────────

interface InworldWordAlignment {
  words: string[];
  wordStartTimeSeconds: number[];
  wordEndTimeSeconds: number[];
  phoneticDetails?: unknown[];
}

interface InworldTimestampInfo {
  wordAlignment: InworldWordAlignment;
}

interface InworldResponse {
  /** Base64-encoded audio (MP3 for sync endpoint) */
  audioContent: string;
  /** Word-level timestamp data (when timestampType=WORD) */
  timestampInfo?: InworldTimestampInfo;
}

// ── Provider Implementation ──────────────────────────────────────────

export class InworldTtsProvider implements TtsProvider {
  readonly name = 'Inworld';

  constructor(private readonly config: InworldConfig) {}

  async generateSpeech(text: string, voiceId?: string): Promise<TtsResult> {
    const voice = voiceId || this.config.voiceId;
    const url = 'https://api.inworld.ai/tts/v1/voice';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${this.config.apiKey}`,
        Connection: 'keep-alive',
      },
      body: JSON.stringify({
        text,
        voiceId: voice,
        modelId: this.config.modelId,
        timestampType: 'WORD',
        timestampTransportStrategy: 'SYNC',
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'unknown');
      throw new Error(`Inworld API error ${response.status}: ${errorBody}`);
    }

    const data = (await response.json()) as InworldResponse;

    if (!data.audioContent) {
      throw new Error('Inworld response missing audioContent');
    }

    // Debug: log response keys to diagnose missing timestamps
    const responseKeys = Object.keys(data);
    const hasTimestamps = !!data.timestampInfo?.wordAlignment?.words?.length;
    console.log(`[Inworld] Response keys: [${responseKeys.join(', ')}], hasTimestamps: ${hasTimestamps}`);
    if (data.timestampInfo) {
      const wa = data.timestampInfo.wordAlignment;
      console.log(`[Inworld] wordAlignment: ${wa?.words?.length ?? 0} words`);
    }

    const audioBuffer = Buffer.from(data.audioContent, 'base64');
    let wordTimestamps = extractWordTimestamps(data.timestampInfo);

    // Duration: prefer word timestamps, fall back to MP3 estimate
    // MP3 at 128kbps: duration ≈ bufferBytes / (128000/8)
    let duration = computeDuration(wordTimestamps);
    if (duration <= 0 && audioBuffer.length > 0) {
      duration = audioBuffer.length / (128000 / 8);
    }

    // If Inworld returned no timestamps, synthesize them from the text + duration.
    // This gives the focus cue system words to match against entity labels.
    if (wordTimestamps.length === 0 && duration > 0) {
      wordTimestamps = synthesizeWordTimestamps(text, duration);
      console.log(`[Inworld] Synthesized ${wordTimestamps.length} word timestamps from text (${duration.toFixed(1)}s)`);
    }

    return { audioBuffer, duration, wordTimestamps };
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Extract word-level timestamps from Inworld's wordAlignment response.
 */
function extractWordTimestamps(
  timestampInfo?: InworldTimestampInfo,
): WordTimestamp[] {
  if (!timestampInfo?.wordAlignment) return [];

  const { words, wordStartTimeSeconds, wordEndTimeSeconds } =
    timestampInfo.wordAlignment;

  if (!words?.length) return [];

  const timestamps: WordTimestamp[] = [];
  for (let i = 0; i < words.length; i++) {
    timestamps.push({
      word: words[i],
      startTime: wordStartTimeSeconds[i] ?? 0,
      endTime: wordEndTimeSeconds[i] ?? 0,
    });
  }

  return timestamps;
}

/**
 * Compute total audio duration from word timestamps.
 * Falls back to the last word's end time.
 */
function computeDuration(wordTimestamps: WordTimestamp[]): number {
  if (wordTimestamps.length === 0) return 0;
  return wordTimestamps[wordTimestamps.length - 1].endTime;
}

/**
 * Synthesize word-level timestamps from narration text and estimated duration.
 *
 * When Inworld doesn't return timestamp data, we distribute words evenly
 * across the audio timeline weighted by character length. This gives the
 * focus cue system words to match against entity labels.
 *
 * Not as precise as real alignment, but sufficient for cinematic focus cues
 * where ~0.5s precision is acceptable.
 */
function synthesizeWordTimestamps(text: string, duration: number): WordTimestamp[] {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0 || duration <= 0) return [];

  // Weight each word by character length (longer words take more time to speak)
  const totalChars = words.reduce((sum, w) => sum + w.length, 0);
  if (totalChars === 0) return [];

  // Leave a small buffer at start (0.3s) and end (0.5s) for natural speech pacing
  const startPad = Math.min(0.3, duration * 0.02);
  const endPad = Math.min(0.5, duration * 0.03);
  const speakDuration = duration - startPad - endPad;
  if (speakDuration <= 0) return [];

  const timestamps: WordTimestamp[] = [];
  let cursor = startPad;

  for (const word of words) {
    const wordDuration = (word.length / totalChars) * speakDuration;
    timestamps.push({
      word,
      startTime: cursor,
      endTime: cursor + wordDuration,
    });
    cursor += wordDuration;
  }

  return timestamps;
}
