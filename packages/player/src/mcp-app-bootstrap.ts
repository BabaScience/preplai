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
import type { VisualScript } from '@preplai/shared';
import { SceneController, NarratorController } from '@preplai/player';
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
  const fullscreenBtn = document.getElementById('fullscreen-toggle');

  if (!entityLayer || !connectionLayer) {
    console.error('[PRE-MCP] Missing SVG layers.');
    return;
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

  if (prevBtn) prevBtn.addEventListener('click', goPrev);
  if (nextBtn) nextBtn.addEventListener('click', goNext);

  // ── Keyboard navigation ─────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') goNext();
    else if (e.key === 'ArrowLeft') goPrev();
    else if (e.key === 'n' || e.key === 'N') {
      const overlay = document.getElementById('narrator-overlay');
      overlay?.classList.toggle('hidden');
    }
  });

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

  console.log('[PRE-MCP] Player connected to host');
}

main().catch((err) => {
  console.error('[PRE-MCP] Initialization failed:', err);
  const el = document.getElementById('loading-indicator');
  if (el) el.textContent = `Error: ${err.message}`;
});
