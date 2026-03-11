/**
 * @preplai/mcp-server — Player HTML Template v4
 *
 * Inline HTML template for the player page.
 * {{SESSION_ID}} is replaced at serve time.
 * {{STYLE}} is replaced with 'cinema' or 'minimal' from URL ?style= param.
 * {{EVENTS_BASE}} is the base URL for SSE (e.g. https://player.preplai.com) — used when player is in iframe.
 * {{GA_SCRIPT}} is replaced with GA4 inline script if GA_MEASUREMENT_ID env var is set, else empty string.
 *
 * Design philosophy:
 * - Cinema-quality dark canvas with radial vignette
 * - Rich SVG <defs> for gradients, glows, noise texture
 * - Layered rendering: bg → grid → ambient → entities → connections → overlay
 * - Google Fonts loaded for Inter (UI) + JetBrains Mono (code)
 *
 * v4 changes:
 * - Updated bg-vignette gradient colors (deeper cinematic palette)
 * - Added accent-glow filter def
 * - Added ambient-layer group between dot-grid and entity-layer
 * - Restructured frame-nav: SVG arrow buttons + dot indicators + counter
 * - Added keyboard-hint element
 */

export const PLAYER_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PRE Player</title>

  <!-- Fonts: Inter for UI, JetBrains Mono for code/technical -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/player.css">
{{GA_SCRIPT}}
</head>
<body data-session-id="{{SESSION_ID}}" data-theme="{{STYLE}}" data-palette="{{PALETTE}}" data-events-base="{{EVENTS_BASE}}">

  <!-- Connection status indicator -->
  <div id="connection-status"></div>

  <!-- Narrator text overlay (HTML, not SVG — better font rendering) -->
  <div id="narrator-overlay">
    <p id="narrator-text" aria-live="polite"></p>
  </div>

  <!-- Progress bar (algorithm-viz style) -->
  <div id="progress-bar" class="progress-bar">
    <div id="progress-fill" class="progress-fill"></div>
  </div>

  <!-- Frame navigation (keyboard + click) -->
  <div id="frame-nav">
    <button id="prev-frame" aria-label="Previous frame" title="Previous frame (←)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
    </button>
    <div id="frame-dots" role="tablist" aria-label="Scene navigation"></div>
    <button id="next-frame" aria-label="Next frame" title="Next frame (→)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
    </button>
    <button id="play-pause-toggle" type="button" aria-label="Play/Pause" title="Play/Pause (Space)" class="play-state">
      <svg class="play-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
      <svg class="pause-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
    </button>
    <button id="tts-toggle" type="button" role="switch" aria-label="Toggle voice narration" aria-pressed="true" title="Voice narration on (click to mute)" class="tts-on">
      <svg class="tts-icon-on" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
      <svg class="tts-icon-off" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
    </button>
    <span id="frame-counter">1 / 1</span>
    <button id="narrator-overlay-toggle" type="button" aria-label="Toggle narrator overlay" title="Toggle narrator text (N)">
      <svg class="narrator-toggle-on" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <svg class="narrator-toggle-off" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
    </button>
    <button id="fullscreen-toggle" type="button" aria-label="Toggle fullscreen" title="Fullscreen (F)">
      <svg class="fs-enter-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
      <svg class="fs-exit-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
    </button>
  </div>

  <!-- Tooltip for entity hover -->
  <div id="entity-tooltip" class="entity-tooltip"></div>

  <!-- Rotate hint (mobile portrait only, hidden via CSS) -->
  <div id="rotate-hint">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M15 17l2-2-2-2"/><path d="M17 15H9"/></svg>
    <p>Rotate your phone for the best experience</p>
    <button id="rotate-fullscreen-btn" type="button">Go Fullscreen</button>
  </div>

  <div id="canvas-wrapper">
    <!--
      viewBox="0 0 1920 1080"  — 16:9, 1920×1080 coordinate space
      preserveAspectRatio="xMidYMid meet"  — scales to fit, centered, no crop
    -->
    <svg
      id="canvas"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <!-- ── Radial vignette background gradient ──────────────── -->
        <radialGradient id="bg-vignette" cx="50%" cy="50%" r="70%">
          <stop offset="0%"   stop-color="#12131c" />
          <stop offset="60%"  stop-color="#0c0d14" />
          <stop offset="100%" stop-color="#060610" />
        </radialGradient>

        <!-- ── Subtle noise texture via SVG filter ──────────────── -->
        <filter id="noise" x="0%" y="0%" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise" />
          <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
          <feComponentTransfer in="grayNoise" result="alphaedNoise">
            <feFuncA type="linear" slope="0.03" />
          </feComponentTransfer>
          <feBlend in="SourceGraphic" in2="alphaedNoise" mode="overlay" />
        </filter>

        <!-- ── Entity highlight glow (warm bloom) ───────────────── -->
        <filter id="entity-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" />
          <feColorMatrix in="blur" type="matrix" result="coloredBlur"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 0.6 0" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <!-- ── Soft shadow for cards/entities ────────────────────── -->
        <filter id="soft-shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#000000" flood-opacity="0.35" />
        </filter>

        <!-- ── Arrow markers (multiple colors via CSS) ──────────── -->
        <marker id="arrowhead-default" markerWidth="14" markerHeight="10" refX="12" refY="5" orient="auto">
          <path d="M 0 0 L 14 5 L 0 10 L 3 5 Z" fill="rgba(255,255,255,0.8)" />
        </marker>

        <!-- ── Ambient glow for accent elements ─────────────────── -->
        <filter id="accent-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="blur" />
          <feColorMatrix in="blur" type="matrix" result="coloredBlur"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 0.4 0" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <!-- ── Linear gradient for entity fills ─────────────────── -->
        <!-- Dynamic gradients are created per-entity in JS -->

      </defs>

      <!-- Background: cinematic vignette -->
      <rect id="bg" width="1920" height="1080" fill="url(#bg-vignette)" />

      <!-- Subtle dot grid for spatial reference -->
      <g id="dot-grid" opacity="0.04">
        <!-- Generated by player.js at init -->
      </g>

      <!-- Ambient layer — floating particles, atmosphere effects -->
      <g id="ambient-layer"></g>

      <!-- Entity layer — all non-arrow entities rendered here -->
      <g id="entity-layer"></g>

      <!-- Connection layer — arrows rendered AFTER entities -->
      <g id="connection-layer"></g>

      <!-- Overlay layer — floating labels, tooltips -->
      <g id="overlay-layer"></g>
    </svg>
  </div>

  <!-- GSAP 3.13 — animation engine -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js"></script>

  <!-- Player bootstrap -->
  <script src="/player.js"></script>

  <div id="keyboard-hint" class="keyboard-hint">← → navigate · Space play/pause · N narrator</div>
</body>
</html>`;
