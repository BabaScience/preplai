/**
 * @preplai/player — AudioEngine
 *
 * Manages ElevenLabs audio playback for frame narration.
 * Syncs focus cues to audio currentTime for narration-driven highlight shifting.
 * Fires onAudioEnd callback for auto-advance mode.
 *
 * Falls back gracefully when audio is unavailable (e.g., autoplay blocked).
 */

import type { FocusCue } from '@preplai/shared';

// ── Types ────────────────────────────────────────────────────────────

export interface AudioEngineOptions {
  /** Fired when a focus cue's timestamp is reached during playback */
  onFocusCue: (cue: FocusCue) => void;
  /** Fired when audio playback ends naturally (not when stopped) */
  onAudioEnd: () => void;
  /** Fired on playback errors (e.g., autoplay blocked) */
  onAudioError: (error: string) => void;
}

// ── AudioEngine ──────────────────────────────────────────────────────

export class AudioEngine {
  private audio: HTMLAudioElement;
  private currentCues: FocusCue[] = [];
  private cueIndex = 0;
  private timeUpdateHandler: (() => void) | null = null;
  private enabled = true;
  private playing = false;

  constructor(private readonly options: AudioEngineOptions) {
    this.audio = new Audio();
    this.audio.addEventListener('ended', () => {
      this.playing = false;
      if (this.enabled) {
        this.options.onAudioEnd();
      }
    });
    this.audio.addEventListener('error', () => {
      this.playing = false;
      this.options.onAudioError('Audio playback failed');
    });
  }

  /**
   * Load and play audio for a frame.
   * @param audioUrl  URL path to the audio file (e.g., /audio/sessionId/0.mp3)
   * @param focusCues Sorted array of focus cues to fire during playback
   */
  play(audioUrl: string, focusCues: FocusCue[]): void {
    this.stop();
    this.currentCues = [...focusCues].sort((a, b) => a.time - b.time);
    this.cueIndex = 0;

    // Resolve audio URL relative to events base
    const base = document.body.getAttribute('data-events-base') || '';
    this.audio.src = base ? `${base.replace(/\/$/, '')}${audioUrl}` : audioUrl;

    // Sync focus cues to audio currentTime
    this.timeUpdateHandler = () => {
      const t = this.audio.currentTime;
      while (
        this.cueIndex < this.currentCues.length &&
        this.currentCues[this.cueIndex].time <= t
      ) {
        this.options.onFocusCue(this.currentCues[this.cueIndex]);
        this.cueIndex++;
      }
    };
    this.audio.addEventListener('timeupdate', this.timeUpdateHandler);

    if (this.enabled) {
      this.playing = true;
      this.audio.play().catch(() => {
        this.playing = false;
        // Autoplay blocked — browser requires user interaction first
        this.options.onAudioError('autoplay_blocked');
      });
    }
  }

  /** Stop current playback and reset state. */
  stop(): void {
    if (this.timeUpdateHandler) {
      this.audio.removeEventListener('timeupdate', this.timeUpdateHandler);
      this.timeUpdateHandler = null;
    }
    this.audio.pause();
    this.audio.currentTime = 0;
    this.audio.removeAttribute('src');
    this.currentCues = [];
    this.cueIndex = 0;
    this.playing = false;
  }

  /** Pause current playback without resetting position. */
  pause(): void {
    if (this.playing) {
      this.audio.pause();
      this.playing = false;
    }
  }

  /** Resume playback from current position. */
  resume(): void {
    if (!this.playing && this.audio.src && this.enabled) {
      this.playing = true;
      this.audio.play().catch(() => {
        this.playing = false;
      });
    }
  }

  /** Enable or disable the audio engine. */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) this.stop();
  }

  /** Whether the audio engine is enabled. */
  get isEnabled(): boolean {
    return this.enabled;
  }

  /** Whether audio is currently playing. */
  get isPlaying(): boolean {
    return this.playing;
  }
}
