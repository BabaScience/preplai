/**
 * @preplai/player — Browser Bootstrap (Illustrations-based)
 *
 * Entry point for the player when using @preplai/illustrations for rendering.
 * Connects SSE, initializes SceneController, handles frame nav and narrator.
 */
import type { VisualScript, FrameAudio } from '@preplai/shared';
import type { FocusInfo } from '@preplai/player';
import { SceneController, NarratorController, AudioEngine, resolveSessionId, createSSEHandler } from '@preplai/player';
import { setActivePalette, setActiveTheme, getParticleColors } from '@preplai/illustrations';

const SVG_NS = 'http://www.w3.org/2000/svg';
const CW = 1920;
const CH = 1080;

function main(): void {
  const sessionId = resolveSessionId();
  if (!sessionId) {
    console.error('[PRE] No data-session-id on <body>.');
    return;
  }

  // ── Palette initialization (must run before any rendering) ────────
  const paletteName = document.body.getAttribute('data-palette') || 'default';
  const themeName = (document.body.getAttribute('data-theme') || 'cinema') as 'cinema' | 'light';
  setActivePalette(paletteName);
  setActiveTheme(themeName);

  // ── GA4 analytics helper (uses gtag injected by server template) ──
  const gtag = (window as any).__preGtag as ((...args: any[]) => void) | undefined;
  const baseParams = { session_id: sessionId, palette: paletteName, style: document.body.getAttribute('data-theme') || 'cinema' };
  function trackPlayerEvent(name: string, params: Record<string, any> = {}): void {
    if (!gtag) return;
    gtag('event', name, { ...baseParams, ...params });
  }
  trackPlayerEvent('player_loaded');

  const canvas = document.getElementById('canvas');
  const entityLayer = document.getElementById('entity-layer') as SVGGElement | null;
  const connectionLayer = document.getElementById('connection-layer') as SVGGElement | null;
  const narratorText = document.getElementById('narrator-text');
  const dotGrid = document.getElementById('dot-grid');
  const frameCounter = document.getElementById('frame-counter');
  const prevBtn = document.getElementById('prev-frame');
  const nextBtn = document.getElementById('next-frame');

  if (!entityLayer || !connectionLayer) {
    console.error('[PRE] Missing entity-layer or connection-layer.');
    return;
  }

  const entityLayerEl = entityLayer;

  // ── Dot grid ─────────────────────────────────────────────────────
  if (dotGrid) {
    const spacing = 80;
    for (let x = spacing; x < CW; x += spacing) {
      for (let y = spacing; y < CH; y += spacing) {
        const dot = document.createElementNS(SVG_NS, 'circle');
        dot.setAttribute('cx', String(x));
        dot.setAttribute('cy', String(y));
        dot.setAttribute('r', '1.2');
        dot.setAttribute('fill', 'rgba(255,255,255,0.05)');
        dotGrid.appendChild(dot);
      }
    }
  }

  // ── Ambient particles ───────────────────────────────────────────
  const ambientLayer = document.getElementById('ambient-layer');
  if (ambientLayer) {
    const colors = getParticleColors();
    for (let i = 0; i < 12; i++) {
      const c = document.createElementNS(SVG_NS, 'circle');
      c.setAttribute('cx', String(100 + Math.random() * (CW - 200)));
      c.setAttribute('cy', String(100 + Math.random() * (CH - 200)));
      c.setAttribute('r', String(2 + Math.random() * 4));
      c.setAttribute('fill', colors[i % colors.length]);
      c.setAttribute('opacity', String(0.03 + Math.random() * 0.04));
      c.classList.add('ambient-particle');
      c.style.animationDelay = Math.random() * 6 + 's';
      ambientLayer.appendChild(c);
    }
  }

  // ── TTS (must be defined before SceneController for closure) ───────
  // Web Speech API fallback disabled — only HD audio (Inworld/ElevenLabs) is used.
  // When no HD audio is available, the player stays silent with text narration only.
  const synth = null as SpeechSynthesis | null;
  let ttsEnabled = (() => {
    try {
      const stored = localStorage.getItem('preplai-tts-enabled');
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  })();

  // ── Playback speed ─────────────────────────────────────────────────
  const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2];
  let currentSpeedIndex = (() => {
    try {
      const stored = localStorage.getItem('preplai-playback-speed');
      if (stored) {
        const idx = SPEED_OPTIONS.indexOf(parseFloat(stored));
        if (idx >= 0) return idx;
      }
    } catch { /* ignore */ }
    return 1; // default 1x
  })();

  function getPlaybackRate(): number {
    return SPEED_OPTIONS[currentSpeedIndex];
  }

  function updateSpeedUI(): void {
    const btn = document.getElementById('speed-toggle');
    if (!btn) return;
    const label = btn.querySelector('.speed-label');
    if (label) label.textContent = `${SPEED_OPTIONS[currentSpeedIndex]}x`;
    btn.title = `Playback speed: ${SPEED_OPTIONS[currentSpeedIndex]}x (S)`;
  }

  function speakNarration(text: string): void {
    if (!synth || !ttsEnabled || !text?.trim()) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text.trim());
    u.rate = 0.95 * getPlaybackRate();
    u.pitch = 1;
    u.volume = 1;
    synth.speak(u);
  }

  function stopTTS(): void {
    if (synth) synth.cancel();
  }

  // ── SceneController + Narrator ───────────────────────────────────
  const narrator = new NarratorController(narratorText);
  const narratorOverlayEl = document.getElementById('narrator-overlay');

  function positionNarratorSpatial(focus: FocusInfo | null): void {
    if (!narratorOverlayEl) return;

    if (focus) {
      // Position narrator near the focused entity (above it)
      const margin = 24;
      const top = Math.max(16, focus.screenY - margin);
      const left = focus.screenX;

      narratorOverlayEl.classList.add('narrator-spatial');
      narratorOverlayEl.style.setProperty('--spatial-top', `${top}px`);
      narratorOverlayEl.style.setProperty('--spatial-left', `${left}px`);
    } else {
      // Return to default bottom bar
      narratorOverlayEl.classList.remove('narrator-spatial');
    }
  }

  // ── Toast notifications ──────────────────────────────────────────
  let toastEl: HTMLDivElement | null = null;
  let toastTimer: ReturnType<typeof setTimeout> | null = null;

  function showToast(message: string, duration = 4000): void {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.id = 'player-toast';
      toastEl.style.cssText = `
        position: fixed; top: 24px; left: 50%; transform: translateX(-50%) translateY(-100%);
        padding: 10px 20px; background: rgba(18,20,28,0.85); backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1);
        border-radius: 10px; color: rgba(255,255,255,0.8); font-size: 13px; font-family: Inter, sans-serif;
        z-index: 200; transition: transform 0.35s cubic-bezier(0.16,1,0.3,1), opacity 0.35s ease;
        opacity: 0; pointer-events: none; white-space: nowrap;
      `;
      document.body.appendChild(toastEl);
    }
    if (toastTimer) clearTimeout(toastTimer);
    toastEl.textContent = message;
    // Force reflow then animate in
    void toastEl.offsetHeight;
    toastEl.style.opacity = '1';
    toastEl.style.transform = 'translateX(-50%) translateY(0)';
    toastTimer = setTimeout(() => {
      if (toastEl) {
        toastEl.style.opacity = '0';
        toastEl.style.transform = 'translateX(-50%) translateY(-100%)';
      }
      toastTimer = null;
    }, duration);
  }

  // ── Voice source indicator ──────────────────────────────────────
  let voiceIndicatorEl: HTMLDivElement | null = null;
  let voiceIndicatorTimer: ReturnType<typeof setTimeout> | null = null;

  function showVoiceSource(source: 'hd' | 'system'): void {
    if (!voiceIndicatorEl) {
      voiceIndicatorEl = document.createElement('div');
      voiceIndicatorEl.id = 'voice-source';
      voiceIndicatorEl.style.cssText = `
        position: fixed; bottom: 54px; left: 50%; transform: translateX(-50%);
        padding: 4px 12px; background: rgba(18,20,28,0.7); backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.08);
        border-radius: 8px; color: rgba(255,255,255,0.5); font-size: 11px; font-family: Inter, sans-serif;
        z-index: 140; transition: opacity 0.4s ease; pointer-events: none;
      `;
      document.body.appendChild(voiceIndicatorEl);
    }
    if (voiceIndicatorTimer) clearTimeout(voiceIndicatorTimer);
    voiceIndicatorEl.textContent = source === 'hd' ? 'HD voice' : 'System voice';
    voiceIndicatorEl.style.opacity = '1';
    voiceIndicatorTimer = setTimeout(() => {
      if (voiceIndicatorEl) voiceIndicatorEl.style.opacity = '0';
      voiceIndicatorTimer = null;
    }, 3000);
  }

  // ── Audio loading indicator on play button ──────────────────────
  function setAudioLoadingUI(loading: boolean): void {
    const btn = document.getElementById('play-pause-toggle');
    if (!btn) return;
    btn.classList.toggle('audio-loading', loading);
  }

  // ── AudioEngine (TTS — Inworld / ElevenLabs) ───────────────────
  const audioMetadata = new Map<number, FrameAudio>();
  let autoPlayEnabled = true;
  let autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null;
  /** Resolves when audio_ready SSE arrives for the awaited frame */
  let audioReadyResolve: ((ready: boolean) => void) | null = null;
  let awaitingAudioForFrame = -1;

  // Forward-declared — assigned after sceneController is created
  let audioEngine: AudioEngine;

  const sceneController = new SceneController({
    entityLayer,
    connectionLayer,
    onNarratorUpdate: (text) => {
      narrator.update(text);
      // Don't speak via Web Speech API if ElevenLabs audio is available for current frame
      const frameAudio = audioMetadata.get(currentFrame);
      if (frameAudio?.status === 'ready') {
        // ElevenLabs audio will be played by goToFrame()
        return;
      }
      if (ttsEnabled && synth && text?.trim()) speakNarration(text);
    },
    onFrameChange: () => updateFrameCounter(),
    onFocusChange: positionNarratorSpatial,
  });

  audioEngine = new AudioEngine({
    onLoadingChange: (loading) => setAudioLoadingUI(loading),
    onFocusCue: (cue) => {
      // Multi-entity focus: prefer entityIds, fall back to entityId
      const ids = cue.entityIds?.length ? cue.entityIds : cue.entityId ? [cue.entityId] : null;
      sceneController.shiftFocus(ids, cue.confidences);
      // Swap narrator text to the cue's narration segment
      if (cue.segment) {
        narrator.update(cue.segment);
      }
    },
    onAudioEnd: () => {
      // Clear focus and restore full narration text when audio ends
      sceneController.shiftFocus(null);
      if (currentScript?.frames?.[currentFrame]) {
        narrator.update(currentScript.frames[currentFrame].narrationSegment);
      }
      updatePlayPauseUI(false);
      // Auto-advance to next frame after a short pause
      if (autoPlayEnabled && currentScript) {
        if (currentFrame >= currentScript.frames.length - 1) {
          // Last frame — show end screen
          setTimeout(() => showEndScreen(), 800);
        } else {
          autoAdvanceTimer = setTimeout(() => {
            autoAdvanceTimer = null;
            if (currentScript && currentFrame < currentScript.frames.length - 1) {
              goNext();
            }
          }, 1200);
        }
      }
    },
    onAudioError: (error) => {
      console.warn('[PRE] Audio error:', error);
      updatePlayPauseUI(false);
      // Fall back to Web Speech API
      if (error === 'autoplay_blocked') {
        if (ttsEnabled && synth && narratorText?.textContent?.trim()) {
          speakNarration(narratorText.textContent);
          showVoiceSource('system');
        }
      } else {
        showToast('Audio unavailable \u2014 using system voice');
        showVoiceSource('system');
        // Try Web Speech fallback
        if (ttsEnabled && synth) {
          playFrameWithWebSpeech(currentFrame);
        }
      }
    },
  });

  function updatePlayPauseUI(playing: boolean): void {
    const btn = document.getElementById('play-pause-toggle');
    if (!btn) return;
    btn.classList.toggle('play-state', !playing);
    btn.classList.toggle('pause-state', playing);
    btn.setAttribute('title', playing ? 'Pause (Space)' : 'Play (Space)');
  }

  // ── Timer-based focus cues (fallback when no ElevenLabs audio) ────
  let focusCueTimers: ReturnType<typeof setTimeout>[] = [];

  function clearFocusCueTimers(): void {
    for (const t of focusCueTimers) clearTimeout(t);
    focusCueTimers = [];
  }

  /**
   * Simulate focus cues using estimated timing from narration word count.
   * Entities with highlight=true in the frame get focused sequentially,
   * spaced evenly across the estimated narration duration.
   */
  function scheduleTimerFocusCues(frameIndex: number, estimatedDuration: number): void {
    clearFocusCueTimers();
    if (!currentScript) return;

    const frame = currentScript.frames[frameIndex] as any;
    if (!frame?.entities) return;

    const rate = getPlaybackRate();

    // Use frame-level focusCues if available (from script data)
    if (frame.focusCues?.length) {
      const scale = estimatedDuration / (frame.focusCues[frame.focusCues.length - 1].time || estimatedDuration);
      for (const cue of frame.focusCues) {
        const delay = (cue.time * scale * 1000) / rate;
        focusCueTimers.push(setTimeout(() => {
          const ids = cue.entityIds?.length ? cue.entityIds : cue.entityId ? [cue.entityId] : null;
          sceneController.shiftFocus(ids, cue.confidences);
          if (cue.segment) narrator.update(cue.segment);
        }, delay));
      }
      return;
    }

    // Fallback: focus on highlighted entities sequentially
    const highlightedIds = frame.entities
      .filter((e: any) => e.highlight && e.id)
      .map((e: any) => e.id as string);

    if (highlightedIds.length === 0) return;

    const interval = ((estimatedDuration * 1000) / (highlightedIds.length + 1)) / rate;
    for (let i = 0; i < highlightedIds.length; i++) {
      const delay = interval * (i + 1);
      const entityId = highlightedIds[i];
      focusCueTimers.push(setTimeout(() => {
        sceneController.shiftFocus([entityId]);
      }, delay));
    }
  }

  /** Estimate narration duration from word count (~150 words/min). */
  function estimateNarrationDuration(text: string): number {
    const words = text.trim().split(/\s+/).length;
    return Math.max(2, (words / 150) * 60); // seconds, minimum 2s
  }

  // ── Web Speech fallback with focus cues + auto-advance ────────────
  let webSpeechPlaying = false;

  function playFrameWithWebSpeech(frameIndex: number): void {
    if (!synth || !currentScript) return;
    stopTTS();
    clearFocusCueTimers();

    const frame = currentScript.frames[frameIndex] as any;
    const narrationText = frame?.narrationSegment?.text || frame?.narrationSegment || '';
    if (!narrationText?.trim()) {
      // No narration — just schedule auto-advance after a short pause
      if (autoPlayEnabled) {
        if (currentScript && currentFrame >= currentScript.frames.length - 1) {
          setTimeout(() => showEndScreen(), 800);
        } else {
          autoAdvanceTimer = setTimeout(() => {
            autoAdvanceTimer = null;
            if (currentScript && currentFrame < currentScript.frames.length - 1) {
              goNext();
            }
          }, 2000);
        }
      }
      return;
    }

    const estimatedDuration = estimateNarrationDuration(narrationText);

    // Schedule timer-based focus cues
    scheduleTimerFocusCues(frameIndex, estimatedDuration);

    // Speak narration via Web Speech API
    const utterance = new SpeechSynthesisUtterance(narrationText);
    utterance.rate = 0.95 * getPlaybackRate();
    utterance.pitch = 1;
    utterance.volume = 1;
    webSpeechPlaying = true;
    updatePlayPauseUI(true);

    utterance.onend = () => {
      webSpeechPlaying = false;
      sceneController.shiftFocus(null); // Clear focus
      clearFocusCueTimers();
      updatePlayPauseUI(false);

      // Auto-advance to next frame
      if (autoPlayEnabled && currentScript) {
        if (currentFrame >= currentScript.frames.length - 1) {
          // Last frame — show end screen
          setTimeout(() => showEndScreen(), 800);
        } else {
          autoAdvanceTimer = setTimeout(() => {
            autoAdvanceTimer = null;
            if (currentScript && currentFrame < currentScript.frames.length - 1) {
              goNext();
            }
          }, 1200);
        }
      }
    };

    utterance.onerror = () => {
      webSpeechPlaying = false;
      clearFocusCueTimers();
      updatePlayPauseUI(false);
    };

    synth.speak(utterance);
  }

  /**
   * Wait up to `timeoutMs` for audio_ready SSE event for this frame.
   * Returns true if audio became available, false on timeout.
   */
  function waitForAudio(frameIndex: number, timeoutMs = 4000): Promise<boolean> {
    // Already available?
    const existing = audioMetadata.get(frameIndex);
    if (existing?.status === 'ready') return Promise.resolve(true);
    if (existing?.status === 'error') return Promise.resolve(false);

    return new Promise<boolean>((resolve) => {
      awaitingAudioForFrame = frameIndex;
      audioReadyResolve = resolve;
      setTimeout(() => {
        if (awaitingAudioForFrame === frameIndex) {
          awaitingAudioForFrame = -1;
          audioReadyResolve = null;
          resolve(false);
        }
      }, timeoutMs);
    });
  }

  async function playFrameAudio(frameIndex: number): Promise<void> {
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }
    audioEngine.stop();
    stopTTS();
    clearFocusCueTimers();
    sceneController.shiftFocus(null);

    if (!ttsEnabled) {
      updatePlayPauseUI(false);
      return;
    }

    // Check if TTS audio is already available
    let audio = audioMetadata.get(frameIndex);
    if (audio?.status === 'ready' && audio.url) {
      // HD audio available immediately
      audioEngine.play(audio.url, audio.focusCues);
      updatePlayPauseUI(true);
      showVoiceSource('hd');
      preloadNextFrame(frameIndex);
      return;
    }

    // Audio not ready yet — show loading state and wait
    setAudioLoadingUI(true);
    const audioReady = await waitForAudio(frameIndex);
    setAudioLoadingUI(false);

    // Re-check in case frame changed while waiting
    if (currentFrame !== frameIndex) return;

    audio = audioMetadata.get(frameIndex);
    if (audioReady && audio?.status === 'ready' && audio.url) {
      audioEngine.play(audio.url, audio.focusCues);
      updatePlayPauseUI(true);
      showVoiceSource('hd');
      preloadNextFrame(frameIndex);
    } else if (synth) {
      // Fall back to Web Speech + timer-based focus cues
      showVoiceSource('system');
      playFrameWithWebSpeech(frameIndex);
    } else {
      updatePlayPauseUI(false);
    }
  }

  /** Preload audio for the next frame if available. */
  function preloadNextFrame(currentFrameIndex: number): void {
    if (!currentScript) return;
    const nextIdx = currentFrameIndex + 1;
    if (nextIdx >= currentScript.frames.length) return;
    const nextAudio = audioMetadata.get(nextIdx);
    if (nextAudio?.status === 'ready' && nextAudio.url) {
      audioEngine.preload(nextAudio.url);
    }
  }

  /** Populate audio metadata from script frames (when script already has audio data). */
  function populateAudioFromScript(script: VisualScript): void {
    audioMetadata.clear();
    for (let i = 0; i < script.frames.length; i++) {
      const frame = script.frames[i] as any;
      if (frame?.audio?.status === 'ready') {
        audioMetadata.set(i, frame.audio);
      }
    }
  }

  let currentScript: VisualScript | null = null;
  let currentFrame = 0;

  function updateFrameCounter(): void {
    if (!frameCounter || !currentScript) return;
    const total = currentScript.frames.length;
    frameCounter.textContent = `${currentFrame + 1} / ${total}`;
    if (prevBtn) prevBtn.setAttribute('aria-disabled', currentFrame === 0 ? 'true' : 'false');
    if (nextBtn) nextBtn.setAttribute('aria-disabled', currentFrame >= total - 1 ? 'true' : 'false');

    const dotsContainer = document.getElementById('frame-dots');
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      for (let i = 0; i < total; i++) {
        const seg = document.createElement('div');
        seg.className = 'frame-segment';
        if (i <= currentFrame) seg.classList.add('visited');
        if (i === currentFrame) seg.classList.add('current');

        // Add tooltip with frame title (H1 entity label)
        const frame = currentScript?.frames[i];
        if (frame) {
          const h1 = (frame as any).entities?.find((e: any) => e.type === 'H1');
          if (h1) {
            const tooltip = document.createElement('span');
            tooltip.className = 'segment-tooltip';
            tooltip.textContent = (h1 as any).label || `Frame ${i + 1}`;
            seg.appendChild(tooltip);
          }
        }

        // Add progress fill bar inside current segment
        if (i === currentFrame && autoPlayEnabled) {
          const fill = document.createElement('div');
          fill.className = 'segment-fill';
          // Estimate frame duration from script or default 5s, adjusted for speed
          const frameDur = currentScript ? (currentScript.totalDuration || 5000) / total : 5000;
          fill.style.animationDuration = `${frameDur / getPlaybackRate()}ms`;
          seg.appendChild(fill);
        }

        const idx = i;
        seg.addEventListener('click', () => {
          if (currentScript && idx >= 0 && idx < currentScript.frames.length) {
            hideEndScreen();
            currentFrame = idx;
            sceneController.seekToFrame(idx);
            playFrameAudio(idx);
          }
        });
        dotsContainer.appendChild(seg);
      }
    }
  }

  function applyScript(script: VisualScript | null): void {
    if (!script?.frames?.length) return;
    hideEmptyState();
    hideLoadingState();
    hideEndScreen();
    currentScript = script;
    currentFrame = 0;
    populateAudioFromScript(script);
    sceneController.loadScript(script);
    // Play audio for the first frame if available
    playFrameAudio(0);
  }

  function goNext(): void {
    if (!currentScript) return;
    hideEndScreen();
    if (currentFrame < currentScript.frames.length - 1) {
      currentFrame++;
      sceneController.seekToFrame(currentFrame);
      playFrameAudio(currentFrame);
      trackPlayerEvent('frame_navigate', { direction: 'next', frame_index: currentFrame });
    } else if (currentFrame >= currentScript.frames.length - 1) {
      // Already on last frame — show end screen
      showEndScreen();
    }
  }

  function goPrev(): void {
    if (!currentScript) return;
    hideEndScreen();
    if (currentFrame > 0) {
      currentFrame--;
      sceneController.seekToFrame(currentFrame);
      playFrameAudio(currentFrame);
      trackPlayerEvent('frame_navigate', { direction: 'prev', frame_index: currentFrame });
    }
  }

  if (prevBtn) prevBtn.addEventListener('click', goPrev);
  if (nextBtn) nextBtn.addEventListener('click', goNext);

  function updateTTSToggleUI(): void {
    const btn = document.getElementById('tts-toggle');
    if (!btn) return;
    if (!synth) {
      btn.style.display = 'none';
      return;
    }
    btn.style.display = '';
    btn.setAttribute('aria-pressed', String(ttsEnabled));
    btn.setAttribute('title', ttsEnabled ? 'Voice narration on (click to mute)' : 'Voice narration off (click to enable)');
    btn.classList.toggle('tts-on', ttsEnabled);
    btn.classList.toggle('tts-off', !ttsEnabled);
  }

  const ttsToggle = document.getElementById('tts-toggle');
  if (ttsToggle) {
    updateTTSToggleUI();
    ttsToggle.addEventListener('click', () => {
      ttsEnabled = !ttsEnabled;
      try {
        localStorage.setItem('preplai-tts-enabled', String(ttsEnabled));
      } catch {}
      updateTTSToggleUI();
      audioEngine.setEnabled(ttsEnabled);
      trackPlayerEvent('tts_toggle', { tts_enabled: ttsEnabled });
      if (!ttsEnabled) {
        stopTTS();
        updatePlayPauseUI(false);
      } else if (narratorText?.textContent?.trim()) {
        // Try ElevenLabs first, fall back to Web Speech API
        const audio = audioMetadata.get(currentFrame);
        if (audio?.status === 'ready') {
          playFrameAudio(currentFrame);
        } else {
          speakNarration(narratorText.textContent);
        }
      }
    });
  }

  // ── Speed toggle ───────────────────────────────────────────────────
  const speedToggle = document.getElementById('speed-toggle');
  // Apply initial playback rate
  audioEngine.setPlaybackRate(getPlaybackRate());
  updateSpeedUI();

  function cycleSpeed(): void {
    currentSpeedIndex = (currentSpeedIndex + 1) % SPEED_OPTIONS.length;
    const rate = SPEED_OPTIONS[currentSpeedIndex];
    audioEngine.setPlaybackRate(rate);
    try {
      localStorage.setItem('preplai-playback-speed', String(rate));
    } catch { /* ignore */ }
    updateSpeedUI();
    // Refresh progress bar to reflect new speed
    updateFrameCounter();
    trackPlayerEvent('speed_change', { speed: rate });
  }

  if (speedToggle) {
    speedToggle.addEventListener('click', cycleSpeed);
  }

  // ── Play/Pause toggle ─────────────────────────────────────────────
  const playPauseBtn = document.getElementById('play-pause-toggle');
  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', () => {
      if (audioEngine.isPlaying) {
        audioEngine.pause();
        updatePlayPauseUI(false);
      } else {
        audioEngine.resume();
        if (audioEngine.isPlaying) {
          updatePlayPauseUI(true);
        } else {
          // No audio loaded — try playing current frame
          playFrameAudio(currentFrame);
        }
      }
    });
  }

  // ── Narrator overlay visibility toggle ───────────────────────────
  const narratorOverlay = document.getElementById('narrator-overlay');
  const narratorOverlayToggle = document.getElementById('narrator-overlay-toggle');
  let narratorOverlayVisible = true;
  try {
    const stored = localStorage.getItem('preplai-narrator-overlay-visible');
    if (stored !== null) narratorOverlayVisible = stored === 'true';
  } catch {}

  function setNarratorOverlayVisible(visible: boolean): void {
    narratorOverlayVisible = visible;
    if (narratorOverlay) {
      narratorOverlay.classList.toggle('hidden', !visible);
    }
    if (narratorOverlayToggle) {
      narratorOverlayToggle.classList.toggle('narrator-hidden', !visible);
      narratorOverlayToggle.setAttribute('aria-label', visible ? 'Hide narrator overlay' : 'Show narrator overlay');
    }
    try {
      localStorage.setItem('preplai-narrator-overlay-visible', String(visible));
    } catch {}
  }
  setNarratorOverlayVisible(narratorOverlayVisible);

  if (narratorOverlayToggle) {
    narratorOverlayToggle.addEventListener('click', () => setNarratorOverlayVisible(!narratorOverlayVisible));
  }

  // ── Fullscreen + orientation lock ─────────────────────────────────
  const fullscreenBtn = document.getElementById('fullscreen-toggle');
  const rotateFullscreenBtn = document.getElementById('rotate-fullscreen-btn');

  function enterFullscreen(): void {
    const el = document.documentElement as any;
    const rfs = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen;
    if (!rfs) return;
    try {
      const result = rfs.call(el);
      // Standard requestFullscreen returns a Promise; webkit may return undefined
      if (result && typeof result.then === 'function') {
        result.then(() => {
          try { (screen.orientation as any).lock('landscape').catch(() => {}); } catch {}
        }).catch(() => {});
      } else {
        // Fallback: try orientation lock immediately for webkit
        try { (screen.orientation as any).lock('landscape').catch(() => {}); } catch {}
      }
    } catch {}
  }

  function exitFullscreen(): void {
    const doc = document as any;
    const efs = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen;
    if (!efs) return;
    try {
      const result = efs.call(doc);
      if (result && typeof result.then === 'function') {
        result.then(() => {
          try { screen.orientation.unlock(); } catch {}
        }).catch(() => {});
      } else {
        try { screen.orientation.unlock(); } catch {}
      }
    } catch {}
  }

  function isFullscreen(): boolean {
    const doc = document as any;
    return !!(doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement);
  }

  function toggleFullscreen(): void {
    const entering = !isFullscreen();
    if (entering) enterFullscreen();
    else exitFullscreen();
    trackPlayerEvent('fullscreen_toggle', { fullscreen: entering });
  }

  function updateFullscreenUI(): void {
    if (fullscreenBtn) fullscreenBtn.classList.toggle('is-fullscreen', isFullscreen());
  }

  if (fullscreenBtn) fullscreenBtn.addEventListener('click', toggleFullscreen);
  if (rotateFullscreenBtn) rotateFullscreenBtn.addEventListener('click', enterFullscreen);
  document.addEventListener('fullscreenchange', updateFullscreenUI);
  document.addEventListener('webkitfullscreenchange', updateFullscreenUI);

  // ── Touch swipe navigation ────────────────────────────────────────
  let touchStartX = 0;
  let touchStartY = 0;

  document.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx < 0) goNext();
      else goPrev();
    }
  }, { passive: true });

  document.addEventListener('keydown', (e) => {
    // Skip all shortcuts when feedback overlay is open (user is typing)
    const feedbackOverlay = document.getElementById('feedback-overlay');
    if (feedbackOverlay && !feedbackOverlay.classList.contains('hidden')) return;

    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      goNext();
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      goPrev();
    }
    if (e.key === ' ') {
      e.preventDefault();
      if (audioEngine.isPlaying) {
        audioEngine.pause();
        updatePlayPauseUI(false);
      } else if (webSpeechPlaying && synth) {
        // Pause/stop Web Speech playback
        synth.cancel();
        webSpeechPlaying = false;
        clearFocusCueTimers();
        updatePlayPauseUI(false);
      } else {
        audioEngine.resume();
        if (audioEngine.isPlaying) {
          updatePlayPauseUI(true);
        } else {
          // No audio loaded — try playing current frame (ElevenLabs or Web Speech fallback)
          playFrameAudio(currentFrame);
        }
      }
    }
    if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      setNarratorOverlayVisible(!narratorOverlayVisible);
    }
    if ((e.key === 'f' || e.key === 'F') && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      toggleFullscreen();
    }
    if ((e.key === 's' || e.key === 'S') && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      cycleSpeed();
    }
  });

  // ── Auto-hide controls (video-player style) ──────────────────────
  const frameNav = document.getElementById('frame-nav');
  const progressBar = document.getElementById('progress-bar');
  const keyboardHint = document.getElementById('keyboard-hint');
  let hideTimer: ReturnType<typeof setTimeout> | null = null;
  let userHasInteracted = false;
  const AUTO_HIDE_DELAY = 3000;
  const FIRST_VISIT_DELAY = 6000; // Keep controls visible longer for first-time users

  function showControls(): void {
    frameNav?.classList.remove('auto-hidden');
    if (progressBar) progressBar.style.removeProperty('opacity');
    // Only show keyboard hint if user hasn't interacted yet
    if (!userHasInteracted && keyboardHint) keyboardHint.style.removeProperty('opacity');
  }

  function hideControls(): void {
    if (frameNav?.matches(':hover')) return;
    frameNav?.classList.add('auto-hidden');
    if (progressBar) progressBar.style.opacity = '0';
    if (keyboardHint) keyboardHint.style.opacity = '0';
  }

  function resetHideTimer(): void {
    // Once user interacts, permanently hide keyboard hint and use shorter delay
    if (!userHasInteracted) {
      userHasInteracted = true;
      if (keyboardHint) {
        keyboardHint.style.transition = 'opacity 0.6s ease';
        keyboardHint.style.opacity = '0';
      }
    }
    showControls();
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(hideControls, AUTO_HIDE_DELAY);
  }

  document.addEventListener('mousemove', resetHideTimer);
  document.addEventListener('touchstart', resetHideTimer);
  document.addEventListener('keydown', resetHideTimer);
  // Start with longer delay so first-time users see controls + hint
  showControls();
  hideTimer = setTimeout(hideControls, FIRST_VISIT_DELAY);

  // Touch gestures already handled above (swipe nav at line ~752)

  // ── Empty state ──────────────────────────────────────────────────
  let emptyState: SVGGElement | null = null;
  function showEmptyState(): void {
    if (emptyState) return;
    emptyState = document.createElementNS(SVG_NS, 'g');
    emptyState.setAttribute('id', 'empty-state');
    const circle = document.createElementNS(SVG_NS, 'circle');
    circle.setAttribute('cx', '960');
    circle.setAttribute('cy', '480');
    circle.setAttribute('r', '60');
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', 'rgba(255,255,255,0.15)');
    circle.setAttribute('stroke-width', '2');
    emptyState.appendChild(circle);
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', '960');
    dot.setAttribute('cy', '480');
    dot.setAttribute('r', '8');
    dot.setAttribute('fill', 'rgba(255,255,255,0.25)');
    emptyState.appendChild(dot);
    const text = document.createElementNS(SVG_NS, 'text');
    text.setAttribute('x', '960');
    text.setAttribute('y', '570');
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('fill', 'rgba(255,255,255,0.4)');
    text.setAttribute('font-size', '28');
    text.textContent = 'Waiting for content…';
    emptyState.appendChild(text);
    entityLayerEl.appendChild(emptyState);
  }

  function hideEmptyState(): void {
    if (emptyState) {
      emptyState.remove();
      emptyState = null;
    }
  }

  // ── Loading state ─────────────────────────────────────────────
  function hideLoadingState(): void {
    const loadingState = document.getElementById('loading-state');
    if (loadingState) {
      loadingState.classList.add('hidden');
      // Remove from DOM after fade-out completes so it never bleeds through
      setTimeout(() => loadingState.remove(), 700);
    }
  }

  // ── End screen ────────────────────────────────────────────────
  function showEndScreen(): void {
    const endScreen = document.getElementById('end-screen');
    const endStats = document.getElementById('end-stats');
    if (endScreen) {
      endScreen.classList.add('visible');
      if (endStats && currentScript) {
        const frames = currentScript.frames.length;
        const mins = Math.round((currentScript.totalDuration || 0) / 60000);
        endStats.textContent = `${frames} frames · ${mins > 0 ? mins + ' min' : 'under 1 min'}`;
      }
    }
  }

  function hideEndScreen(): void {
    const endScreen = document.getElementById('end-screen');
    if (endScreen) endScreen.classList.remove('visible');
  }

  // Wire end screen buttons
  document.getElementById('end-replay')?.addEventListener('click', () => {
    hideEndScreen();
    if (currentScript) {
      currentFrame = 0;
      sceneController.seekToFrame(0);
      playFrameAudio(0);
      updateFrameCounter();
    }
  });

  document.getElementById('end-share')?.addEventListener('click', () => {
    const shareUrl = window.location.href;
    const btn = document.getElementById('end-share');
    const showCopied = () => {
      if (btn) {
        btn.textContent = 'Copied!';
        setTimeout(() => {
          btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Share';
        }, 2000);
      }
    };
    // Try modern clipboard API first, fall back to execCommand for HTTP
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(shareUrl).then(showCopied).catch(() => {
        // Fallback: create temporary input, select, copy
        const tmp = document.createElement('input');
        tmp.value = shareUrl;
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand('copy');
        document.body.removeChild(tmp);
        showCopied();
      });
    } else {
      const tmp = document.createElement('input');
      tmp.value = shareUrl;
      document.body.appendChild(tmp);
      tmp.select();
      document.execCommand('copy');
      document.body.removeChild(tmp);
      showCopied();
    }
  });

  showEmptyState();

  // ── SSE ───────────────────────────────────────────────────────────
  const eventsBase = document.body.getAttribute('data-events-base') || '';
  const base = eventsBase ? eventsBase.replace(/\/$/, '') : '';
  const eventsUrl = base
    ? `${base}/session/${sessionId}/events`
    : `/session/${sessionId}/events`;

  const evtSource = new EventSource(eventsUrl);

  evtSource.addEventListener('message', (e) => {
    try {
      const event = JSON.parse(e.data);
      if (event.type === 'connected') {
        console.log('[PRE] SSE connected for session:', event.sessionId);
        return;
      }
      if (event.type === 'script_update') {
        applyScript(event.script);
        return;
      }
      if (event.type === 'audio_ready') {
        const { frameIndex, audio } = event as { frameIndex: number; audio: FrameAudio };
        if (audio?.status === 'ready') {
          audioMetadata.set(frameIndex, audio);
          // Resolve any pending wait-for-audio promise
          if (awaitingAudioForFrame === frameIndex && audioReadyResolve) {
            audioReadyResolve(true);
            audioReadyResolve = null;
            awaitingAudioForFrame = -1;
          } else if (frameIndex === currentFrame && !audioEngine.isPlaying && ttsEnabled) {
            // If we're on this frame and nothing is playing, play it
            stopTTS(); // Stop any Web Speech API narration
            playFrameAudio(frameIndex);
          }
        } else if (audio?.status === 'error') {
          audioMetadata.set(frameIndex, audio);
          // Resolve pending wait as failed
          if (awaitingAudioForFrame === frameIndex && audioReadyResolve) {
            audioReadyResolve(false);
            audioReadyResolve = null;
            awaitingAudioForFrame = -1;
          }
          if (frameIndex === currentFrame) {
            showToast('Voice generation failed \u2014 using system voice');
          }
        }
        return;
      }
      if (event.type === 'narration_update') {
        narrator.update(event.text);
        if (ttsEnabled && synth && event.text?.trim()) speakNarration(event.text);
        return;
      }
    } catch (err) {
      console.error('[PRE] Failed to parse SSE event:', err);
    }
  });

  evtSource.addEventListener('error', () => {
    console.warn('[PRE] SSE connection interrupted — auto-reconnecting.');
  });

  // Fallback fetch
  setTimeout(() => {
    if (currentScript?.frames?.length) return;
    const scriptUrl = base ? `${base}/session/${sessionId}/script` : `/session/${sessionId}/script`;
    fetch(scriptUrl)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.script?.frames?.length) {
          console.log('[PRE] Script loaded via fallback fetch');
          applyScript(data.script);
        }
      })
      .catch(() => {});
  }, 2500);

  // ── postMessage bridge ───────────────────────────────────────────
  window.addEventListener('message', (e) => {
    if (!e.data?.type) return;
    if (e.data.type === 'pre:seek' && currentScript) {
      const idx = e.data.frameIndex;
      if (typeof idx === 'number' && idx >= 0 && idx < currentScript.frames.length) {
        currentFrame = idx;
        sceneController.seekToFrame(idx);
        playFrameAudio(idx);
        updateFrameCounter();
      }
    }
    if (e.data.type === 'pre:next') goNext();
    if (e.data.type === 'pre:prev') goPrev();
  });

  (window as any).__PRE = {
    sessionId,
    getScript: () => currentScript,
    getFrame: () => currentFrame,
    loadScript: applyScript,
  };

  // ── Feedback panel ──────────────────────────────────────────────
  function initFeedback(): void {
    const btn = document.getElementById('feedback-btn');
    const overlay = document.getElementById('feedback-overlay');
    const panel = document.getElementById('feedback-panel');
    const closeBtn = document.getElementById('feedback-close');
    const form = document.getElementById('feedback-form') as HTMLFormElement | null;
    const emailInput = document.getElementById('feedback-email') as HTMLInputElement | null;
    const descInput = document.getElementById('feedback-desc') as HTMLTextAreaElement | null;
    const imageInput = document.getElementById('feedback-image-input') as HTMLInputElement | null;
    const imagePreview = document.getElementById('feedback-image-preview');
    const imageThumb = document.getElementById('feedback-image-thumb') as HTMLImageElement | null;
    const imageRemove = document.getElementById('feedback-image-remove');
    const imageLabel = document.getElementById('feedback-image-label');
    const submitBtn = document.getElementById('feedback-submit') as HTMLButtonElement | null;
    const successDiv = document.getElementById('feedback-success');
    const typeBtns = document.querySelectorAll('.fb-type-btn');

    if (!btn || !overlay || !form) return;

    // Detect authenticated user from lightweight identity cookie
    // preplai_user is set on login (non-httpOnly, contains only the email)
    let authenticatedEmail: string | null = null;
    try {
      const cookies = document.cookie.split(';').map(c => c.trim());
      const userCookie = cookies.find(c => c.startsWith('preplai_user='));
      if (userCookie) {
        const email = decodeURIComponent(userCookie.split('=')[1]);
        if (email && email.includes('@')) {
          authenticatedEmail = email;
        }
      }
    } catch { /* ignore */ }

    // If authenticated, hide email input and show identity badge
    if (authenticatedEmail && emailInput) {
      const emailWrapper = emailInput.parentElement || emailInput;
      emailInput.style.display = 'none';
      emailInput.value = authenticatedEmail;
      emailInput.removeAttribute('required');
      // Insert identity badge
      const badge = document.createElement('div');
      badge.id = 'feedback-identity';
      badge.style.cssText = 'font-size:12px;color:rgba(255,255,255,0.5);padding:6px 0;';
      badge.textContent = `Sending as ${authenticatedEmail}`;
      emailWrapper.insertAdjacentElement('afterend', badge);
      // Light theme adjustment
      if (document.documentElement.dataset.theme === 'light') {
        badge.style.color = 'rgba(0,0,0,0.4)';
      }
    }

    let selectedType = 'bug';
    let feedbackImageData: string | null = null;

    btn.addEventListener('click', () => {
      overlay.classList.toggle('hidden');
      // Auto-focus the first input when opening
      if (!overlay.classList.contains('hidden')) {
        const firstInput = (authenticatedEmail ? descInput : emailInput) as HTMLElement | null;
        firstInput?.focus();
      }
    });

    closeBtn?.addEventListener('click', () => {
      overlay.classList.add('hidden');
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.add('hidden');
    });

    // Escape key closes feedback overlay
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay && !overlay.classList.contains('hidden')) {
        overlay.classList.add('hidden');
      }
    });

    // Type selector
    typeBtns.forEach(b => {
      b.addEventListener('click', () => {
        typeBtns.forEach(x => x.classList.remove('fb-type-active'));
        b.classList.add('fb-type-active');
        selectedType = (b as HTMLElement).dataset.type || 'bug';
      });
    });

    // Image handling
    imageInput?.addEventListener('change', () => {
      const file = imageInput.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be under 5MB');
        imageInput.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        feedbackImageData = reader.result as string;
        if (imageThumb) imageThumb.src = feedbackImageData;
        imagePreview?.classList.remove('hidden');
        imageLabel?.classList.add('hidden');
      };
      reader.readAsDataURL(file);
    });

    imageRemove?.addEventListener('click', () => {
      feedbackImageData = null;
      if (imageInput) imageInput.value = '';
      imagePreview?.classList.add('hidden');
      imageLabel?.classList.remove('hidden');
    });

    // Submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (submitBtn) {
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
      }

      try {
        const fbSessionId = window.location.pathname.split('/player/')[1]?.split('?')[0] || '';
        const titleEl = document.querySelector('#entity-layer text');
        const presentationTitle = titleEl?.textContent || document.title || '';

        const res = await fetch('/api/player-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: selectedType === 'suggestion' ? 'feature' : selectedType,
            description: descInput?.value || '',
            email: authenticatedEmail || emailInput?.value || '',
            sessionId: fbSessionId,
            presentationTitle,
            imageData: feedbackImageData,
            browserInfo: navigator.userAgent,
            pageUrl: window.location.href,
          }),
        });

        if (!res.ok) throw new Error('Failed');

        // Show success
        form.classList.add('hidden');
        successDiv?.classList.remove('hidden');

        // Auto-close after 2s
        setTimeout(() => {
          overlay.classList.add('hidden');
          form.classList.remove('hidden');
          successDiv?.classList.add('hidden');
          if (descInput) descInput.value = '';
          feedbackImageData = null;
          if (imageInput) imageInput.value = '';
          imagePreview?.classList.add('hidden');
          imageLabel?.classList.remove('hidden');
          if (submitBtn) {
            submitBtn.textContent = 'Send Feedback';
            submitBtn.disabled = false;
          }
        }, 2000);
      } catch (err) {
        alert('Failed to send feedback. Please try again.');
        if (submitBtn) {
          submitBtn.textContent = 'Send Feedback';
          submitBtn.disabled = false;
        }
      }
    });
  }

  initFeedback();

  console.log('[PRE] Player (illustrations) initialized for session:', sessionId);
}

main();
