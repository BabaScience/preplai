/**
 * @preplai/mcp-server — Player HTML Template v4
 *
 * Inline HTML template for the player page.
 * {{SESSION_ID}} is replaced at serve time.
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
</head>
<body data-session-id="{{SESSION_ID}}">

  <!-- Connection status indicator -->
  <div id="connection-status"></div>

  <!-- Narrator text overlay (HTML, not SVG — better font rendering) -->
  <div id="narrator-overlay">
    <p id="narrator-text" aria-live="polite"></p>
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
    <button id="tts-toggle" type="button" role="switch" aria-label="Toggle voice narration" aria-pressed="true" title="Voice narration on (click to mute)">
      <svg class="tts-icon-on" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
      <svg class="tts-icon-off" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
    </button>
    <span id="frame-counter">1 / 1</span>
    <button id="nav-toggle" type="button" aria-label="Hide navigation bar" title="Hide controls (H)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
    </button>
  </div>

  <!-- Show controls bar — visible when frame-nav is hidden -->
  <div id="show-controls-bar" aria-label="Show navigation bar" title="Show controls (H)">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    <span>Show controls</span>
  </div>

  <!-- Tooltip for entity hover -->
  <div id="entity-tooltip" class="entity-tooltip"></div>

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
        <marker id="arrowhead-default" markerWidth="12" markerHeight="8" refX="10" refY="4" orient="auto">
          <path d="M 0 0 L 12 4 L 0 8 L 3 4 Z" fill="rgba(255,255,255,0.7)" />
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

  <div id="keyboard-hint" class="keyboard-hint">← → navigate · H hide UI</div>
</body>
</html>`;
