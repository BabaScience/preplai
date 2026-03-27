/**
 * useShowcaseAudio — Hook for pre-generated ElevenLabs audio on landing page.
 *
 * Uses AudioEngine from @preplai/player with static MP3 files
 * pre-generated via scripts/generate-showcase-audio.mjs.
 *
 * Audio is OFF by default — user clicks a toggle to enable.
 * When enabled, plays pre-generated ElevenLabs audio with
 * focus cue synchronization for entity highlighting.
 *
 * All audio files are preloaded into browser cache on first page load
 * so playback is instant with zero network latency.
 *
 * Returns: { enabled, playing, enabledRef, enable, disable, playFrame, stop }
 */
import { useRef, useState, useCallback, useEffect } from 'react';
import { AudioEngine } from '@preplai/player';

// ── Module-level cache ────────────────────────────────────────────────
let metadataCache = null;
let metadataPromise = null;
let preloaded = false;

function loadMetadata() {
  if (metadataCache) return Promise.resolve(metadataCache);
  if (metadataPromise) return metadataPromise;

  // Cache-bust with build timestamp so stale browser caches don't serve old metadata
  const bust = typeof __VITE_BUILD_TIME__ !== 'undefined' ? __VITE_BUILD_TIME__ : Date.now();
  metadataPromise = fetch(`/audio/showcase/metadata.json?v=${bust}`)
    .then((r) => r.json())
    .then((data) => {
      metadataCache = data;
      return data;
    })
    .catch(() => {
      metadataPromise = null;
      return null;
    });

  return metadataPromise;
}

/**
 * Preload all audio files into the browser cache.
 * Called once on page load — uses <link rel="preload"> for zero-latency playback.
 */
function preloadAllAudio() {
  if (preloaded) return;
  preloaded = true;

  loadMetadata().then((metadata) => {
    if (!metadata) return;
    for (const entry of Object.values(metadata)) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'audio';
      link.href = entry.url;
      document.head.appendChild(link);
    }
  });
}

/**
 * @param {object} options
 * @param {function} options.onFocusCue - Called with focus cue when audio timestamp is reached
 * @param {function} options.onAudioEnd - Called when audio finishes playing a frame
 * @param {function} options.onAudioError - Called when audio playback fails (e.g., autoplay blocked)
 */
export default function useShowcaseAudio({ onFocusCue, onAudioEnd, onAudioError } = {}) {
  const [enabled, setEnabled] = useState(false);
  const [playing, setPlaying] = useState(false);
  const engineRef = useRef(null);
  const enabledRef = useRef(false);
  const onFocusCueRef = useRef(onFocusCue);
  const onAudioEndRef = useRef(onAudioEnd);
  const onAudioErrorRef = useRef(onAudioError);
  onFocusCueRef.current = onFocusCue;
  onAudioEndRef.current = onAudioEnd;
  onAudioErrorRef.current = onAudioError;

  // Initialize AudioEngine once + trigger preload of all audio files
  useEffect(() => {
    const engine = new AudioEngine({
      onFocusCue: (cue) => {
        onFocusCueRef.current?.(cue);
      },
      onAudioEnd: () => {
        setPlaying(false);
        if (enabledRef.current) {
          onAudioEndRef.current?.();
        }
      },
      onAudioError: (error) => {
        setPlaying(false);
        onAudioErrorRef.current?.(error);
      },
    });

    engine.setEnabled(false);
    engineRef.current = engine;

    // Preload metadata + all audio files into browser cache
    preloadAllAudio();

    return () => {
      engine.stop();
      engineRef.current = null;
    };
  }, []);

  // Play audio for a specific script/frame
  const playFrame = useCallback(async (scriptName, frameIndex) => {
    const engine = engineRef.current;
    if (!engine || !enabledRef.current) return;

    const metadata = await loadMetadata();
    if (!metadata) return;
    if (!enabledRef.current) return;

    const key = `${scriptName}/${frameIndex}`;
    const entry = metadata[key];
    if (!entry) return;

    setPlaying(true);
    engine.play(entry.url, entry.focusCues || []);
  }, []);

  // Stop current playback
  const stop = useCallback(() => {
    const engine = engineRef.current;
    if (engine) engine.stop();
    setPlaying(false);
  }, []);

  // Enable audio — synchronous
  const enable = useCallback(() => {
    const engine = engineRef.current;
    if (engine) engine.setEnabled(true);
    enabledRef.current = true;
    setEnabled(true);
  }, []);

  // Disable audio — synchronous
  const disable = useCallback(() => {
    const engine = engineRef.current;
    if (engine) {
      engine.stop();
      engine.setEnabled(false);
    }
    enabledRef.current = false;
    setEnabled(false);
    setPlaying(false);
  }, []);

  return {
    enabled,
    enabledRef,
    playing,
    enable,
    disable,
    playFrame,
    stop,
  };
}
