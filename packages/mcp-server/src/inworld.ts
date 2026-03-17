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

    const audioBuffer = Buffer.from(data.audioContent, 'base64');
    const wordTimestamps = extractWordTimestamps(data.timestampInfo);
    const duration = computeDuration(wordTimestamps);

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
