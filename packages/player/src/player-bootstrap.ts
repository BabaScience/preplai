/**
 * @preplai/player — Browser Bootstrap (Illustrations-based)
 *
 * Entry point for the player when using @preplai/illustrations for rendering.
 * Connects SSE, initializes SceneController, handles frame nav and narrator.
 */
import type { VisualScript } from '@preplai/shared';
import { SceneController, NarratorController, resolveSessionId, createSSEHandler } from '@preplai/player';

const SVG_NS = 'http://www.w3.org/2000/svg';
const CW = 1920;
const CH = 1080;

function main(): void {
  const sessionId = resolveSessionId();
  if (!sessionId) {
    console.error('[PRE] No data-session-id on <body>.');
    return;
  }

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
    const colors = ['#4ECDC4', '#9B59B6', '#F1C40F', '#3498DB', '#E67E22'];
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
  const synth = typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis : null;
  let ttsEnabled = (() => {
    try {
      const stored = localStorage.getItem('preplai-tts-enabled');
      return stored === null ? true : stored === 'true';
    } catch {
      return true;
    }
  })();

  function speakNarration(text: string): void {
    if (!synth || !ttsEnabled || !text?.trim()) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text.trim());
    u.rate = 0.95;
    u.pitch = 1;
    u.volume = 1;
    synth.speak(u);
  }

  function stopTTS(): void {
    if (synth) synth.cancel();
  }

  // ── SceneController + Narrator ───────────────────────────────────
  const narrator = new NarratorController(narratorText);
  const sceneController = new SceneController({
    entityLayer,
    connectionLayer,
    onNarratorUpdate: (text) => {
      narrator.update(text);
      if (ttsEnabled && synth && text?.trim()) speakNarration(text);
    },
    onFrameChange: () => updateFrameCounter(),
  });

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
        const dot = document.createElement('div');
        dot.className = 'frame-dot';
        if (i < currentFrame) dot.classList.add('visited');
        if (i === currentFrame) dot.classList.add('current');
        const idx = i;
        dot.addEventListener('click', () => {
          if (currentScript && idx >= 0 && idx < currentScript.frames.length) {
            currentFrame = idx;
            sceneController.seekToFrame(idx);
          }
        });
        dotsContainer.appendChild(dot);
      }
    }
  }

  function applyScript(script: VisualScript | null): void {
    if (!script?.frames?.length) return;
    hideEmptyState();
    currentScript = script;
    currentFrame = 0;
    sceneController.loadScript(script);
  }

  function goNext(): void {
    if (!currentScript) return;
    if (currentFrame < currentScript.frames.length - 1) {
      currentFrame++;
      sceneController.seekToFrame(currentFrame);
    }
  }

  function goPrev(): void {
    if (!currentScript) return;
    if (currentFrame > 0) {
      currentFrame--;
      sceneController.seekToFrame(currentFrame);
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
      if (!ttsEnabled) stopTTS();
      else if (narratorText?.textContent?.trim()) speakNarration(narratorText.textContent);
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

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      goNext();
    }
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      goPrev();
    }
    if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      setNarratorOverlayVisible(!narratorOverlayVisible);
    }
  });

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
  };

  console.log('[PRE] Player (illustrations) initialized for session:', sessionId);
}

main();
