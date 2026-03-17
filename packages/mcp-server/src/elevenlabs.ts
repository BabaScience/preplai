/**
 * @preplai/mcp-server — ElevenLabs TTS Provider
 *
 * Generates speech audio from text with word-level timestamps.
 * Uses the /v1/text-to-speech/{voice_id}/with-timestamps endpoint.
 * No SDK dependency — uses raw fetch for minimal footprint.
 */

import type { TtsProvider, TtsResult, WordTimestamp } from './tts-provider.js';

// Re-export shared types so existing imports don't break
export type { WordTimestamp, TtsResult } from './tts-provider.js';

// ── Config ───────────────────────────────────────────────────────────

export interface ElevenLabsConfig {
  apiKey: string;
  voiceId: string;
  modelId: string;
}

// ── ElevenLabs API Response Shape ────────────────────────────────────

interface ElevenLabsAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

interface ElevenLabsResponse {
  audio_base64: string;
  alignment: ElevenLabsAlignment;
}

// ── Provider Implementation ──────────────────────────────────────────

export class ElevenLabsTtsProvider implements TtsProvider {
  readonly name = 'ElevenLabs';

  constructor(private readonly config: ElevenLabsConfig) {}

  async generateSpeech(text: string, voiceId?: string): Promise<TtsResult> {
    const voice = voiceId || this.config.voiceId;
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voice}/with-timestamps`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': this.config.apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: this.config.modelId,
        output_format: 'mp3_44100_128',
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'unknown');
      throw new Error(`ElevenLabs API error ${response.status}: ${errorBody}`);
    }

    const data = (await response.json()) as ElevenLabsResponse;

    if (!data.audio_base64) {
      throw new Error('ElevenLabs response missing audio_base64');
    }

    const audioBuffer = Buffer.from(data.audio_base64, 'base64');
    const wordTimestamps = aggregateWordTimestamps(data.alignment);
    const duration = computeDuration(data.alignment);

    return { audioBuffer, duration, wordTimestamps };
  }
}

// ── Legacy Function API (backward compat) ────────────────────────────

/**
 * Generate speech audio from text using ElevenLabs TTS API.
 * @deprecated Use ElevenLabsTtsProvider class instead.
 */
export async function generateSpeech(
  text: string,
  config: ElevenLabsConfig,
  voiceIdOverride?: string,
): Promise<TtsResult> {
  const provider = new ElevenLabsTtsProvider(config);
  return provider.generateSpeech(text, voiceIdOverride);
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Aggregate character-level timestamps into word-level timestamps.
 * Groups contiguous non-space characters into words.
 */
export function aggregateWordTimestamps(
  alignment: ElevenLabsAlignment,
): WordTimestamp[] {
  const { characters, character_start_times_seconds, character_end_times_seconds } = alignment;

  if (!characters?.length) return [];

  const words: WordTimestamp[] = [];
  let currentWord = '';
  let wordStart = -1;
  let wordEnd = -1;

  for (let i = 0; i < characters.length; i++) {
    const char = characters[i];
    const isSpace = char === ' ' || char === '\n' || char === '\t';

    if (isSpace) {
      // End current word if any
      if (currentWord.length > 0) {
        words.push({
          word: currentWord,
          startTime: wordStart,
          endTime: wordEnd,
        });
        currentWord = '';
        wordStart = -1;
        wordEnd = -1;
      }
    } else {
      // Continue or start a new word
      if (currentWord.length === 0) {
        wordStart = character_start_times_seconds[i] ?? 0;
      }
      currentWord += char;
      wordEnd = character_end_times_seconds[i] ?? 0;
    }
  }

  // Flush last word
  if (currentWord.length > 0) {
    words.push({
      word: currentWord,
      startTime: wordStart,
      endTime: wordEnd,
    });
  }

  return words;
}

/**
 * Compute total audio duration from the alignment data.
 */
function computeDuration(alignment: ElevenLabsAlignment): number {
  const endTimes = alignment.character_end_times_seconds;
  if (!endTimes?.length) return 0;
  return endTimes[endTimes.length - 1] ?? 0;
}
