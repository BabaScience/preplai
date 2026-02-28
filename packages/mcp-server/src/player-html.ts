/**
 * @pre/mcp-server — Player HTML Template
 *
 * Inline HTML template for the player page.
 * {{SESSION_ID}} is replaced at serve time.
 */

export const PLAYER_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PRE Player</title>
  <link rel="stylesheet" href="/player.css">
</head>
<body data-session-id="{{SESSION_ID}}">

  <!-- Narrator text overlay (HTML, not SVG — better font rendering) -->
  <div id="narrator-overlay">
    <p id="narrator-text"></p>
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
        <!-- Arrow marker -->
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="rgba(255,255,255,0.8)" />
        </marker>

        <!-- Highlight glow filter -->
        <filter id="entity-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <!-- Background: near-black cinematic fill -->
      <rect id="bg" width="1920" height="1080" fill="#0f0f1a" />

      <!-- Entity layer — all non-arrow entities rendered here -->
      <g id="entity-layer"></g>

      <!-- Connection layer — arrows rendered AFTER entities -->
      <g id="connection-layer"></g>

      <!-- Overlay layer — floating labels, tooltips -->
      <g id="overlay-layer"></g>
    </svg>
  </div>

  <!-- GSAP 3.13 — all plugins free, no license key needed -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/DrawSVGPlugin.min.js"></script>

  <!-- Player bootstrap -->
  <script src="/player.js"></script>
</body>
</html>`;
