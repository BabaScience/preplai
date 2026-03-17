/**
 * @preplai/player — MCP App Bootstrap
 *
 * Entry point for the player when embedded inline in Claude.ai / ChatGPT
 * via MCP Apps SDK. Receives presentation data through the MCP App lifecycle
 * (ontoolinput / ontoolresult) instead of SSE.
 *
 * Reuses SceneController, NarratorController, and all illustration components
 * from @preplai/player and @preplai/illustrations.
 */
import { App } from '@modelcontextprotocol/ext-apps';
import type { VisualScript, FrameAudio } from '@preplai/shared';
import { SceneController, NarratorController, AudioEngine } from '@preplai/player';
import { setActivePalette, getParticleColors } from '@preplai/illustrations';

// Import player CSS — Vite will inline this into the single-file HTML
import './mcp-app-styles.css';

const SVG_NS = 'http://www.w3.org/2000/svg';
const CW = 1920;
const CH = 1080;

// ── GSAP dynamic loading ──────────────────────────────────────────────
// External <script src="..."> tags don't work in srcdoc iframes,
// so we load GSAP dynamically. CSP resourceDomains allows the CDN.
async function loadGSAP(): Promise<void> {
  if ((window as any).gsap) return;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load GSAP from CDN'));
    document.head.appendChild(script);
  });
}

// ── Google Fonts dynamic loading ──────────────────────────────────────
function loadFonts(): void {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap';
  document.head.appendChild(link);
}

// ── Canvas setup ──────────────────────────────────────────────────────
function setupDotGrid(): void {
  const dotGrid = document.getElementById('dot-grid');
  if (!dotGrid) return;
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

function setupAmbientParticles(): void {
  const ambientLayer = document.getElementById('ambient-layer');
  if (!ambientLayer) return;
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

function hideLoading(): void {
  const el = document.getElementById('loading-indicator');
  if (el) el.style.display = 'none';
}

// ── Main initialization ───────────────────────────────────────────────
async function main(): Promise<void> {
  // Load external resources
  loadFonts();
  await loadGSAP();

  // Initialize canvas
  setupDotGrid();
  setupAmbientParticles();

  const entityLayer = document.getElementById('entity-layer') as SVGGElement | null;
  const connectionLayer = document.getElementById('connection-layer') as SVGGElement | null;
  const narratorText = document.getElementById('narrator-text');
  const frameCounter = document.getElementById('frame-counter');
  const prevBtn = document.getElementById('prev-frame');
  const nextBtn = document.getElementById('next-frame');
  const playPauseBtn = document.getElementById('play-pause-toggle');
  const openPlayerLink = document.getElementById('open-player-link') as HTMLButtonElement | null;
  const fullscreenBtn = document.getElementById('fullscreen-toggle');

  if (!entityLayer || !connectionLayer) {
    console.error('[PRE-MCP] Missing SVG layers.');
    return;
  }

  // ── Audio engine (Inworld TTS via server, with Web Speech API fallback) ──
  const audioMetadata = new Map<number, FrameAudio>();
  let isAutoPlaying = false;
  let autoAdvanceTimer: ReturnType<typeof setTimeout> | null = null;
  let ttsEnabled = true; // controlled by TTS toggle button

  // Web Speech API fallback (used when no server audio is available)
  const synth = window.speechSynthesis;
  let isSpeakingFallback = false;

  const audioEngine = new AudioEngine({
    onFocusCue: (cue) => {
      sceneController.shiftFocus(cue.entityIds ?? (cue.entityId ? [cue.entityId] : null), cue.confidences);
    },
    onAudioEnd: () => {
      if (isAutoPlaying) {
        autoAdvanceTimer = setTimeout(() => {
          if (currentScript && currentFrame < currentScript.frames.length - 1) {
            goNext();
            playCurrentFrame();
          } else {
            isAutoPlaying = false;
            updatePlayPauseUI(false);
          }
        }, 800);
      } else {
        updatePlayPauseUI(false);
      }
    },
    onAudioError: (_error) => {
      // HD audio failed — fall back to Web Speech API
      playCurrentFrameFallback();
    },
    onLoadingChange: (loading) => {
      if (playPauseBtn) {
        playPauseBtn.classList.toggle('audio-loading', loading);
      }
    },
  });

  function stopSpeech(): void {
    audioEngine.stop();
    if (synth) synth.cancel();
    isSpeakingFallback = false;
    if (autoAdvanceTimer) {
      clearTimeout(autoAdvanceTimer);
      autoAdvanceTimer = null;
    }
  }

  function updatePlayPauseUI(playing: boolean): void {
    if (!playPauseBtn) return;
    playPauseBtn.classList.toggle('play-state', !playing);
    playPauseBtn.classList.toggle('pause-state', playing);
    playPauseBtn.title = playing ? 'Pause (Space)' : 'Play (Space)';
    playPauseBtn.setAttribute('aria-label', playing ? 'Pause' : 'Play');
  }

  /** Play current frame using HD audio if available, else Web Speech API. */
  function playCurrentFrame(): void {
    if (!currentScript || !ttsEnabled) return;
    const audio = audioMetadata.get(currentFrame);
    if (audio?.status === 'ready' && audio.url) {
      // HD audio from Inworld
      audioEngine.play(audio.url, audio.focusCues);
      updatePlayPauseUI(true);
      // Preload next frame
      const nextAudio = audioMetadata.get(currentFrame + 1);
      if (nextAudio?.status === 'ready' && nextAudio.url) {
        audioEngine.preload(nextAudio.url);
      }
    } else {
      // Fallback to Web Speech API
      playCurrentFrameFallback();
    }
  }

  /** Web Speech API fallback for when server audio isn't available. */
  function playCurrentFrameFallback(): void {
    if (!currentScript || !synth || !ttsEnabled) return;
    const frame = currentScript.frames[currentFrame];
    const seg = frame?.narrationSegment;
    const narration = typeof seg === 'string' ? seg : (seg as any)?.text || '';
    if (!narration) return;

    if (synth) synth.cancel();
    const utterance = new SpeechSynthesisUtterance(narration);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    isSpeakingFallback = true;
    updatePlayPauseUI(true);

    utterance.onend = () => {
      isSpeakingFallback = false;
      if (isAutoPlaying) {
        autoAdvanceTimer = setTimeout(() => {
          if (currentScript && currentFrame < currentScript.frames.length - 1) {
            goNext();
            playCurrentFrame();
          } else {
            isAutoPlaying = false;
            updatePlayPauseUI(false);
          }
        }, 800);
      } else {
        updatePlayPauseUI(false);
      }
    };

    utterance.onerror = () => {
      isSpeakingFallback = false;
      updatePlayPauseUI(false);
    };

    synth.speak(utterance);
  }

  function togglePlayPause(): void {
    if (audioEngine.isPlaying || isSpeakingFallback) {
      // Stop playback
      stopSpeech();
      isAutoPlaying = false;
      updatePlayPauseUI(false);
    } else {
      // Start autoplay from current frame
      isAutoPlaying = true;
      playCurrentFrame();
    }
  }

  /** Populate audio metadata from script frames. */
  function populateAudioFromScript(script: VisualScript): void {
    audioMetadata.clear();
    for (let i = 0; i < script.frames.length; i++) {
      const frame = script.frames[i] as any;
      if (frame?.audio?.status === 'ready') {
        audioMetadata.set(i, frame.audio);
      }
    }
    console.log(`[PRE-MCP] Audio metadata: ${audioMetadata.size}/${script.frames.length} frames have HD audio`);
  }

  // ── Scene + Narrator controllers ──────────────────────────────────
  const narrator = new NarratorController(narratorText);

  let currentScript: VisualScript | null = null;
  let currentFrame = 0;

  function updateFrameCounter(): void {
    if (!frameCounter || !currentScript) return;
    const total = currentScript.frames.length;
    frameCounter.textContent = `${currentFrame + 1} / ${total}`;
    if (prevBtn) prevBtn.setAttribute('aria-disabled', currentFrame === 0 ? 'true' : 'false');
    if (nextBtn) nextBtn.setAttribute('aria-disabled', currentFrame >= total - 1 ? 'true' : 'false');

    // Update dot indicators
    const dotsContainer = document.getElementById('frame-dots');
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      for (let i = 0; i < total; i++) {
        const dot = document.createElement('div');
        dot.className = 'frame-dot';
        if (i < currentFrame) dot.classList.add('visited');
        if (i === currentFrame) dot.classList.add('current');
        const idx = i;
        dot.addEventListener('click', () => {
          if (currentScript && idx >= 0 && idx < currentScript.frames.length) {
            stopSpeech();
            isAutoPlaying = false;
            updatePlayPauseUI(false);
            currentFrame = idx;
            sceneController.seekToFrame(idx);
            updateFrameCounter();
          }
        });
        dotsContainer.appendChild(dot);
      }
    }

    // Update progress bar
    const progressFill = document.getElementById('progress-fill');
    if (progressFill && total > 1) {
      progressFill.style.width = `${(currentFrame / (total - 1)) * 100}%`;
    }
  }

  const sceneController = new SceneController({
    entityLayer,
    connectionLayer,
    onNarratorUpdate: (text) => narrator.update(text),
    onFrameChange: () => updateFrameCounter(),
  });

  function applyScript(script: VisualScript | null): void {
    if (!script?.frames?.length) return;
    hideLoading();
    currentScript = script;
    currentFrame = 0;
    populateAudioFromScript(script);
    sceneController.loadScript(script);
    updateFrameCounter();
  }

  function goNext(): void {
    if (!currentScript || currentFrame >= currentScript.frames.length - 1) return;
    currentFrame++;
    sceneController.seekToFrame(currentFrame);
    updateFrameCounter();
  }

  function goPrev(): void {
    if (!currentScript || currentFrame <= 0) return;
    currentFrame--;
    sceneController.seekToFrame(currentFrame);
    updateFrameCounter();
  }

  if (prevBtn) prevBtn.addEventListener('click', () => {
    stopSpeech();
    isAutoPlaying = false;
    updatePlayPauseUI(false);
    goPrev();
  });
  if (nextBtn) nextBtn.addEventListener('click', () => {
    stopSpeech();
    isAutoPlaying = false;
    updatePlayPauseUI(false);
    goNext();
  });
  if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlayPause);

  // ── TTS toggle button ───────────────────────────────────────────
  const ttsToggleBtn = document.getElementById('tts-toggle');

  function updateTtsUI(): void {
    if (!ttsToggleBtn) return;
    ttsToggleBtn.classList.toggle('tts-on', ttsEnabled);
    ttsToggleBtn.classList.toggle('tts-off', !ttsEnabled);
    ttsToggleBtn.setAttribute('aria-pressed', String(ttsEnabled));
    ttsToggleBtn.title = ttsEnabled ? 'Voice narration on (click to mute)' : 'Voice narration off (click to unmute)';
  }

  if (ttsToggleBtn) {
    ttsToggleBtn.addEventListener('click', () => {
      ttsEnabled = !ttsEnabled;
      audioEngine.setEnabled(ttsEnabled);
      updateTtsUI();
      if (!ttsEnabled) stopSpeech();
    });
  }

  // ── Narrator overlay toggle button ──────────────────────────────
  const narratorToggleBtn = document.getElementById('narrator-overlay-toggle');
  let narratorVisible = true;

  function toggleNarratorOverlay(): void {
    const overlay = document.getElementById('narrator-overlay');
    narratorVisible = !narratorVisible;
    overlay?.classList.toggle('hidden', !narratorVisible);
    narratorToggleBtn?.classList.toggle('narrator-hidden', !narratorVisible);
  }

  if (narratorToggleBtn) {
    narratorToggleBtn.addEventListener('click', toggleNarratorOverlay);
  }

  // ── Keyboard navigation ─────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      stopSpeech();
      isAutoPlaying = false;
      updatePlayPauseUI(false);
      goNext();
    } else if (e.key === 'ArrowLeft') {
      stopSpeech();
      isAutoPlaying = false;
      updatePlayPauseUI(false);
      goPrev();
    } else if (e.key === ' ') {
      e.preventDefault();
      togglePlayPause();
    } else if (e.key === 'n' || e.key === 'N') {
      toggleNarratorOverlay();
    } else if (e.key === 'm' || e.key === 'M') {
      ttsEnabled = !ttsEnabled;
      updateTtsUI();
      if (!ttsEnabled) stopSpeech();
    }
  });

  // ── Auto-hide controls (video-player style) ──────────────────────
  const frameNav = document.getElementById('frame-nav');
  const progressBar = document.getElementById('progress-bar');
  let hideTimer: ReturnType<typeof setTimeout> | null = null;
  const AUTO_HIDE_DELAY = 3000; // 3 seconds of inactivity

  function showControls(): void {
    frameNav?.classList.remove('auto-hidden');
    progressBar?.style.removeProperty('opacity');
  }

  function hideControls(): void {
    // Don't hide if user is hovering the nav bar
    if (frameNav?.matches(':hover')) return;
    frameNav?.classList.add('auto-hidden');
    if (progressBar) progressBar.style.opacity = '0';
  }

  function resetHideTimer(): void {
    showControls();
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(hideControls, AUTO_HIDE_DELAY);
  }

  // Show controls on any mouse movement, touch, or keyboard input
  document.addEventListener('mousemove', resetHideTimer);
  document.addEventListener('touchstart', resetHideTimer);
  document.addEventListener('keydown', resetHideTimer);

  // Start the timer
  resetHideTimer();

  // ── MCP App lifecycle ─────────────────────────────────────────────
  const app = new App(
    { name: 'Preplai Player', version: '1.0.0' },
    {},
    { autoResize: true },
  );

  let currentDisplayMode: 'inline' | 'fullscreen' | 'pip' = 'inline';

  // Show loading state when tool is invoked
  app.ontoolinput = (_params) => {
    // Tool was called — the result with script data is coming
  };

  // Render the presentation when tool result arrives
  app.ontoolresult = (result) => {
    const meta = result._meta as Record<string, unknown> | undefined;
    if (!meta) return;

    // Apply theme
    const theme = (meta.theme as string) || 'cinema';
    document.body.setAttribute('data-theme', theme);

    // Apply palette
    const palette = (meta.palette as string) || 'default';
    document.body.setAttribute('data-palette', palette);
    setActivePalette(palette);

    // Re-init ambient particles with palette colors
    const ambientLayer = document.getElementById('ambient-layer');
    if (ambientLayer) {
      ambientLayer.innerHTML = '';
      setupAmbientParticles();
    }

    // Set the events base URL for AudioEngine to resolve audio URLs
    const metaBaseUrl = meta.baseUrl as string | undefined;
    if (metaBaseUrl) {
      document.body.setAttribute('data-events-base', metaBaseUrl.replace(/\/$/, ''));
      console.log('[PRE-MCP] Audio base URL:', metaBaseUrl);
    }

    // Set player URL link (uses SDK openLink to bypass sandbox restrictions)
    const playerUrl = meta.playerUrl as string | undefined;
    if (playerUrl && openPlayerLink) {
      openPlayerLink.style.display = 'flex';
      openPlayerLink.addEventListener('click', async () => {
        try {
          const result = await app.openLink({ url: playerUrl });
          if (result.isError) {
            console.warn('[PRE-MCP] Host denied openLink request, falling back to clipboard');
            await navigator.clipboard.writeText(playerUrl).catch(() => {});
          }
        } catch (err) {
          console.warn('[PRE-MCP] openLink failed:', err);
          // Fallback: copy URL to clipboard so user can paste in browser
          await navigator.clipboard.writeText(playerUrl).catch(() => {});
        }
      });
    }

    // Load and render the script
    const script = meta.script as VisualScript | undefined;
    if (script) {
      applyScript(script);
    }
  };

  // Handle host context changes (theme, display mode)
  app.onhostcontextchanged = (ctx) => {
    if (ctx.displayMode) {
      currentDisplayMode = ctx.displayMode as 'inline' | 'fullscreen' | 'pip';
    }

    // Show/hide fullscreen button based on available modes
    if (ctx.availableDisplayModes && fullscreenBtn) {
      const canFullscreen = ctx.availableDisplayModes.includes('fullscreen');
      fullscreenBtn.style.display = canFullscreen ? 'flex' : 'none';
    }

    // Apply safe area insets
    if (ctx.safeAreaInsets) {
      const { top, right, bottom, left } = ctx.safeAreaInsets;
      document.body.style.padding = `${top}px ${right}px ${bottom}px ${left}px`;
    }
  };

  app.onteardown = async () => {
    stopSpeech();
    audioEngine.setEnabled(false);
    return {};
  };

  // Fullscreen toggle
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', async () => {
      const targetMode = currentDisplayMode === 'fullscreen' ? 'inline' : 'fullscreen';
      try {
        const result = await app.requestDisplayMode({ mode: targetMode });
        currentDisplayMode = result.mode as 'inline' | 'fullscreen' | 'pip';
        fullscreenBtn.classList.toggle('is-fullscreen', currentDisplayMode === 'fullscreen');
      } catch (e) {
        console.warn('[PRE-MCP] Display mode change failed:', e);
      }
    });
  }

  // Connect to host — MUST happen after all handlers are registered
  await app.connect();

  // Explicitly report preferred size to host so it allocates enough iframe height.
  // autoResize may not measure correctly with overflow:hidden + height:100%.
  try {
    app.sendSizeChanged({ width: 960, height: 540 });
  } catch (_) {
    // sendSizeChanged may not be supported by all hosts — ignore
  }

  console.log('[PRE-MCP] Player connected to host');
}

main().catch((err) => {
  console.error('[PRE-MCP] Initialization failed:', err);
  const el = document.getElementById('loading-indicator');
  if (el) el.textContent = `Error: ${err.message}`;
});
