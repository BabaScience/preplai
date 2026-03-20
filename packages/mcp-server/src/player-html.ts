/**
 * @preplai/mcp-server — Player HTML Template v4
 *
 * Inline HTML template for the player page.
 * {{SESSION_ID}} is replaced at serve time.
 * {{STYLE}} is replaced with 'light' or 'cinema' from URL ?style= param.
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
  <title>Preplai Player</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' rx='20' fill='%23C9A84C'/%3E%3Cdefs%3E%3Cfilter id='f' x='-18%25' y='-18%25' width='136%25' height='136%25' color-interpolation-filters='sRGB'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.018 0.022' numOctaves='4' seed='7' result='n'/%3E%3CfeDisplacementMap in='SourceGraphic' in2='n' scale='1.8' xChannelSelector='R' yChannelSelector='G'/%3E%3C/filter%3E%3C/defs%3E%3Cpath d='M 137.79,38.71 A 72,72 0 1,0 169.97,118.50 L 30.03,115.80' fill='none' stroke='%230b0c10' stroke-width='22' stroke-linecap='round' stroke-linejoin='round' filter='url(%23f)'/%3E%3C/svg%3E">

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

  <!-- Feedback trigger — fixed bottom-right, subtle circle with question mark -->
  <button id="feedback-btn" title="Send feedback" aria-label="Send feedback">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  </button>

  <!-- Tooltip for entity hover -->
  <div id="entity-tooltip" class="entity-tooltip"></div>

  <!-- Rotate hint (mobile portrait only, hidden via CSS) -->
  <div id="rotate-hint">
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M15 17l2-2-2-2"/><path d="M17 15H9"/></svg>
    <p>Rotate your phone for the best experience</p>
    <button id="rotate-fullscreen-btn" type="button">Go Fullscreen</button>
  </div>

  <div id="loading-state">
    <div class="loading-logo">
      <svg width="48" height="48" viewBox="0 0 32 32">
        <rect width="32" height="32" rx="6" fill="rgba(201,168,76,0.15)" stroke="rgba(201,168,76,0.3)" stroke-width="1"/>
        <path d="M8 8h6a6 6 0 0 1 0 12H8z" fill="none" stroke="#C9A84C" stroke-width="2.5"/>
        <circle cx="22" cy="22" r="3" fill="#C9A84C"/>
      </svg>
    </div>
    <p class="loading-text">Preparing your presentation\u2026</p>
    <div class="loading-dots"><span></span><span></span><span></span></div>
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

  <div id="end-screen" class="end-screen">
    <div class="end-content">
      <div class="end-logo">
        <svg width="40" height="40" viewBox="0 0 32 32">
          <rect width="32" height="32" rx="6" fill="rgba(201,168,76,0.15)" stroke="rgba(201,168,76,0.3)" stroke-width="1"/>
          <path d="M8 8h6a6 6 0 0 1 0 12H8z" fill="none" stroke="#C9A84C" stroke-width="2.5"/>
          <circle cx="22" cy="22" r="3" fill="#C9A84C"/>
        </svg>
      </div>
      <p class="end-title">Presentation complete</p>
      <div class="end-actions">
        <button id="end-replay" type="button" aria-label="Replay presentation">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
          Replay
        </button>
        <button id="end-share" type="button" aria-label="Copy share link">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          Share
        </button>
      </div>
      <p class="end-stats" id="end-stats"></p>
    </div>
  </div>

  <!-- Feedback overlay -->
  <div id="feedback-overlay" class="hidden">
    <div id="feedback-panel">
      <div id="feedback-header">
        <span>Send Feedback</span>
        <button id="feedback-close" aria-label="Close feedback">&times;</button>
      </div>
      <form id="feedback-form">
        <div id="feedback-types">
          <button type="button" class="fb-type-btn fb-type-active" data-type="bug">Bug</button>
          <button type="button" class="fb-type-btn" data-type="suggestion">Suggestion</button>
          <button type="button" class="fb-type-btn" data-type="other">Other</button>
        </div>
        <input id="feedback-email" type="email" placeholder="Your email" required />
        <textarea id="feedback-desc" placeholder="Describe the issue or suggestion..." rows="3" required></textarea>
        <div id="feedback-image-area">
          <label id="feedback-image-label" for="feedback-image-input">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <span>Attach screenshot</span>
          </label>
          <input id="feedback-image-input" type="file" accept="image/*" style="display:none" />
          <div id="feedback-image-preview" class="hidden">
            <img id="feedback-image-thumb" alt="Preview" />
            <button type="button" id="feedback-image-remove">&times;</button>
          </div>
        </div>
        <button type="submit" id="feedback-submit">Send Feedback</button>
      </form>
      <div id="feedback-success" class="hidden">
        <div id="feedback-success-icon">&#10003;</div>
        <p>Thank you for your feedback!</p>
      </div>
    </div>
  </div>

  <!-- GSAP 3.13 — animation engine -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js"></script>

  <!-- Player bootstrap -->
  <script src="/player.js"></script>

  <div id="keyboard-hint" class="keyboard-hint">← → navigate · Space play/pause · N narrator</div>
</body>
</html>`;


/**
 * Polished 404 page for when a session is not found or has expired.
 * Self-contained — no external CSS/JS dependencies (except Google Fonts).
 * {{SESSION_ID}} is replaced with the requested session ID.
 * {{GA_SCRIPT}} is replaced with GA4 script if configured.
 */
export const PLAYER_NOT_FOUND_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Presentation Not Found — Preplai</title>
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' rx='20' fill='%23C9A84C'/%3E%3Cdefs%3E%3Cfilter id='f' x='-18%25' y='-18%25' width='136%25' height='136%25' color-interpolation-filters='sRGB'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.018 0.022' numOctaves='4' seed='7' result='n'/%3E%3CfeDisplacementMap in='SourceGraphic' in2='n' scale='1.8' xChannelSelector='R' yChannelSelector='G'/%3E%3C/filter%3E%3C/defs%3E%3Cpath d='M 137.79,38.71 A 72,72 0 1,0 169.97,118.50 L 30.03,115.80' fill='none' stroke='%230b0c10' stroke-width='22' stroke-linecap='round' stroke-linejoin='round' filter='url(%23f)'/%3E%3C/svg%3E">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
{{GA_SCRIPT}}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #faf7f2;
      color: #1a1a2e;
      overflow: hidden;
    }

    .container {
      text-align: center;
      max-width: 520px;
      padding: 2rem;
      animation: fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* Animated film reel icon */
    .icon-wrap {
      width: 88px;
      height: 88px;
      margin: 0 auto 2rem;
      position: relative;
    }

    .icon-ring {
      width: 88px;
      height: 88px;
      border-radius: 50%;
      border: 2.5px solid #e8e0d4;
      position: absolute;
      top: 0; left: 0;
    }

    .icon-ring::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: #e8e0d4;
      transform: translate(-50%, -50%);
    }

    .icon-reel {
      position: absolute;
      top: 0; left: 0;
      width: 88px;
      height: 88px;
      animation: spin 12s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .icon-reel .hole {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #faf7f2;
      position: absolute;
      border: 2px solid #d4ccc0;
    }

    .icon-reel .hole:nth-child(1) { top: 8px; left: 50%; transform: translateX(-50%); }
    .icon-reel .hole:nth-child(2) { top: 22px; right: 12px; }
    .icon-reel .hole:nth-child(3) { bottom: 22px; right: 12px; }
    .icon-reel .hole:nth-child(4) { bottom: 8px; left: 50%; transform: translateX(-50%); }
    .icon-reel .hole:nth-child(5) { bottom: 22px; left: 12px; }
    .icon-reel .hole:nth-child(6) { top: 22px; left: 12px; }

    h1 {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1a1a2e;
      margin-bottom: 0.75rem;
      letter-spacing: -0.02em;
    }

    .subtitle {
      font-size: 1.05rem;
      color: #5a5a6e;
      line-height: 1.6;
      margin-bottom: 0.5rem;
    }

    .session-id {
      display: inline-block;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.8rem;
      color: #8a8a9e;
      background: rgba(0, 0, 0, 0.04);
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-radius: 6px;
      padding: 0.25rem 0.6rem;
      margin-top: 0.5rem;
      letter-spacing: 0.02em;
      word-break: break-all;
    }

    .hints {
      margin-top: 2rem;
      padding: 1.25rem 1.5rem;
      background: rgba(255, 255, 255, 0.7);
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-radius: 12px;
      text-align: left;
    }

    .hints-title {
      font-size: 0.8rem;
      font-weight: 600;
      color: #8a8a9e;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 0.75rem;
    }

    .hints ul {
      list-style: none;
      padding: 0;
    }

    .hints li {
      font-size: 0.9rem;
      color: #5a5a6e;
      line-height: 1.6;
      padding-left: 1.25rem;
      position: relative;
    }

    .hints li + li {
      margin-top: 0.4rem;
    }

    .hints li::before {
      content: '→';
      position: absolute;
      left: 0;
      color: #B8943D;
      font-weight: 600;
    }

    .home-link {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      margin-top: 2rem;
      font-size: 0.9rem;
      font-weight: 500;
      color: #B8943D;
      text-decoration: none;
      transition: opacity 0.2s;
    }

    .home-link:hover {
      opacity: 0.75;
    }

    /* Ambient floating dots */
    .dot {
      position: fixed;
      border-radius: 50%;
      background: #B8943D;
      opacity: 0;
      animation: float 8s ease-in-out infinite;
    }

    .dot:nth-child(1) { width: 4px; height: 4px; top: 15%; left: 10%; animation-delay: 0s; }
    .dot:nth-child(2) { width: 3px; height: 3px; top: 70%; left: 85%; animation-delay: 2s; }
    .dot:nth-child(3) { width: 5px; height: 5px; top: 30%; right: 15%; animation-delay: 4s; }
    .dot:nth-child(4) { width: 3px; height: 3px; bottom: 20%; left: 25%; animation-delay: 6s; }

    @keyframes float {
      0%, 100% { opacity: 0; transform: translateY(0); }
      50% { opacity: 0.15; transform: translateY(-20px); }
    }
  </style>
</head>
<body>
  <div class="dot"></div>
  <div class="dot"></div>
  <div class="dot"></div>
  <div class="dot"></div>

  <div class="container">
    <div class="icon-wrap">
      <div class="icon-ring"></div>
      <div class="icon-reel">
        <div class="hole"></div>
        <div class="hole"></div>
        <div class="hole"></div>
        <div class="hole"></div>
        <div class="hole"></div>
        <div class="hole"></div>
      </div>
    </div>

    <h1>Presentation not found</h1>
    <p class="subtitle">
      This presentation doesn't exist or may have expired.
      Presentations are automatically removed after a period of inactivity.
    </p>
    <code class="session-id">{{SESSION_ID}}</code>

    <div class="hints">
      <div class="hints-title">What you can do</div>
      <ul>
        <li>Check that the URL was copied correctly</li>
        <li>Ask the person who shared it to generate a new link</li>
        <li>Create a new presentation from your AI assistant</li>
      </ul>
    </div>

    <a class="home-link" href="https://preplai.com">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      Back to Preplai
    </a>
  </div>
</body>
</html>`;
