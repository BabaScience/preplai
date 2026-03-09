/**
 * @preplai/mcp-server — ElevenLabs TTS Service
 *
 * Generates speech audio from text with word-level timestamps.
 * Uses the /v1/text-to-speech/{voice_id}/with-timestamps endpoint.
 * No SDK dependency — uses raw fetch for minimal footprint.
 */

// ── Types ────────────────────────────────────────────────────────────

export interface ElevenLabsConfig {
  apiKey: string;
  voiceId: string;
  modelId: string;
}

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
  /** Word-level timestamps aggregated from character timestamps */
  wordTimestamps: WordTimestamp[];
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

// ── Public API ───────────────────────────────────────────────────────

/**
 * Generate speech audio from text using ElevenLabs TTS API.
 * Returns the audio buffer, duration, and word-level timestamps.
 */
export async function generateSpeech(
  text: string,
  config: ElevenLabsConfig,
): Promise<TtsResult> {
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}/with-timestamps`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': config.apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: config.modelId,
      output_format: 'mp3_44100_128',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => 'unknown');
    throw new Error(
      `ElevenLabs API error ${response.status}: ${errorBody}`,
    );
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
