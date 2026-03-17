/**
 * @preplai/player — AudioEngine
 *
 * Manages TTS audio playback (Inworld / ElevenLabs) for frame narration.
 * Syncs focus cues to audio currentTime for narration-driven highlight shifting.
 * Fires onAudioEnd callback for auto-advance mode.
 *
 * Features:
 * - Loading state with callback (for UI spinner)
 * - Audio preloading (next frame buffered in background)
 * - Graceful fallback when audio is unavailable (e.g., autoplay blocked)
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
  /** Fired when audio loading state changes (true = loading, false = ready/error) */
  onLoadingChange?: (loading: boolean) => void;
}

// ── AudioEngine ──────────────────────────────────────────────────────

export class AudioEngine {
  private audio: HTMLAudioElement;
  private currentCues: FocusCue[] = [];
  private cueIndex = 0;
  private timeUpdateHandler: (() => void) | null = null;
  private enabled = true;
  private playing = false;
  private _loading = false;
  private preloadAudio: HTMLAudioElement | null = null;

  constructor(private readonly options: AudioEngineOptions) {
    this.audio = new Audio();
    this.audio.addEventListener('ended', () => {
      this.playing = false;
      this.setLoading(false);
      if (this.enabled) {
        this.options.onAudioEnd();
      }
    });
    this.audio.addEventListener('error', () => {
      this.playing = false;
      this.setLoading(false);
      this.options.onAudioError('Audio playback failed');
    });
  }

  private setLoading(loading: boolean): void {
    if (this._loading !== loading) {
      this._loading = loading;
      this.options.onLoadingChange?.(loading);
    }
  }

  /** Resolve an audio URL relative to the events base. */
  private resolveUrl(audioUrl: string): string {
    const base = document.body.getAttribute('data-events-base') || '';
    return base ? `${base.replace(/\/$/, '')}${audioUrl}` : audioUrl;
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

    const resolvedUrl = this.resolveUrl(audioUrl);
    this.audio.src = resolvedUrl;
    this.setLoading(true);

    // Fire loading=false once audio can play through
    const onCanPlay = () => {
      this.setLoading(false);
      this.audio.removeEventListener('canplaythrough', onCanPlay);
    };
    this.audio.addEventListener('canplaythrough', onCanPlay);

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
        this.setLoading(false);
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
    this.setLoading(false);
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

  /**
   * Preload audio for the next frame in the background.
   * Uses a separate Audio element so it doesn't interfere with current playback.
   */
  preload(audioUrl: string): void {
    // Clean up previous preload
    if (this.preloadAudio) {
      this.preloadAudio.removeAttribute('src');
      this.preloadAudio = null;
    }
    const resolved = this.resolveUrl(audioUrl);
    this.preloadAudio = new Audio();
    this.preloadAudio.preload = 'auto';
    this.preloadAudio.src = resolved;
    // Just load it into the browser cache — don't play
    this.preloadAudio.load();
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

  /** Whether audio is currently loading. */
  get isLoading(): boolean {
    return this._loading;
  }
}
