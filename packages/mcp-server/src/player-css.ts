/**
 * @pre/mcp-server — Player CSS
 *
 * Cinematic dark theme, @keyframes entrance animations, layout.
 * Served as a string at GET /player.css.
 */

export const PLAYER_CSS = `/* ── PRE Player — Cinematic Dark Theme ────────────────────────────── */

/* Reset */
*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #0f0f1a;
  font-family: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
  color: #f0f0ff;
}

/* ── Canvas wrapper ──────────────────────────────────────────────── */

#canvas-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

#canvas {
  width: 100%;
  height: 100%;
  display: block;
}

/* ── Narrator overlay ────────────────────────────────────────────── */

#narrator-overlay {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  pointer-events: none;
  display: flex;
  justify-content: center;
  padding: 24px 48px;
}

#narrator-text {
  max-width: 960px;
  padding: 16px 32px;
  background: rgba(15, 15, 26, 0.85);
  backdrop-filter: blur(12px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #c8c8e8;
  font-size: 18px;
  line-height: 1.6;
  letter-spacing: 0.02em;
  text-align: center;
  opacity: 0;
  transform: translateY(8px);
  transition: opacity 0.35s ease, transform 0.35s ease;
}

#narrator-text.visible {
  opacity: 1;
  transform: translateY(0);
}

/* ── Animate element base class ──────────────────────────────────── */

.animate-element {
  transform-box: fill-box;
  transform-origin: center center;
  will-change: transform, opacity;
}

/* ── Entrance @keyframes (compositor thread — zero JS overhead) ─── */

@keyframes fadeInUp {
  0%   { opacity: 0; transform: translateY(24px) scale(0.96); }
  100% { opacity: 1; transform: translateY(0px)  scale(1.00); }
}

@keyframes fadeIn {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes drawIn {
  0%   { opacity: 0; transform: scale(0.8); }
  100% { opacity: 1; transform: scale(1);   }
}

@keyframes slideInLeft {
  0%   { opacity: 0; transform: translateX(-32px); }
  100% { opacity: 1; transform: translateX(0);     }
}

@keyframes slideInRight {
  0%   { opacity: 0; transform: translateX(32px); }
  100% { opacity: 1; transform: translateX(0);    }
}

@keyframes scaleIn {
  0%   { opacity: 0; transform: scale(0.5); }
  100% { opacity: 1; transform: scale(1);   }
}

/* ── Entrance animation classes ──────────────────────────────────── */

.entrance-fadeInUp {
  animation: fadeInUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.entrance-fadeIn {
  animation: fadeIn 0.3s ease both;
}

.entrance-drawIn {
  animation: drawIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.entrance-slideInLeft {
  animation: slideInLeft 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.entrance-slideInRight {
  animation: slideInRight 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.entrance-scaleIn {
  animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

/* ── Connection status indicator ─────────────────────────────────── */

#connection-status {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 200;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

#connection-status.disconnected {
  opacity: 1;
  background: rgba(239, 68, 68, 0.8);
  color: white;
}

#connection-status.reconnecting {
  opacity: 1;
  background: rgba(245, 200, 66, 0.8);
  color: #0f0f1a;
}
`;
