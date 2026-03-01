/**
 * @pre/mcp-server — Player CSS
 *
 * Cinematic dark theme with refined typography, animations, and layout.
 * Served as a string at GET /player.css.
 *
 * Design system:
 * - Font: Inter for all UI, JetBrains Mono for code/technical content
 * - Background: #16162a → #08080f radial vignette
 * - Accent palette: Cyan #00e5ff, Violet #b388ff, Warm #FFD54F
 * - Narrator: frosted glass panel with typewriter entrance
 */

export const PLAYER_CSS = `/* ── PRE Player — Cinematic Dark Theme v2 ─────────────────────────── */

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
  background: #0a0a14;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #e8e8f0;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
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

/* ── SVG text defaults ───────────────────────────────────────────── */

svg text {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;
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
  padding: 32px 64px;
}

#narrator-text {
  max-width: 880px;
  padding: 20px 36px;
  background: rgba(12, 12, 24, 0.82);
  backdrop-filter: blur(20px) saturate(1.2);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
  color: #c8c8e0;
  font-family: 'Inter', sans-serif;
  font-size: 17px;
  font-weight: 400;
  line-height: 1.7;
  letter-spacing: 0.01em;
  text-align: center;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1),
              transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

#narrator-text.visible {
  opacity: 1;
  transform: translateY(0);
}

#narrator-text:empty {
  display: none;
}

/* ── Frame navigation ────────────────────────────────────────────── */

#frame-nav {
  position: fixed;
  bottom: 12px;
  right: 16px;
  z-index: 150;
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

#frame-nav.visible {
  opacity: 1;
}

#frame-nav:hover {
  opacity: 1 !important;
}

#frame-counter {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
  min-width: 48px;
  text-align: center;
  user-select: none;
}

#frame-nav button {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
  width: 32px;
  height: 32px;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
}

#frame-nav button:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
}

/* ── Animate element base class ──────────────────────────────────── */

.animate-element {
  transform-box: fill-box;
  transform-origin: center center;
  will-change: transform, opacity;
}

/* ── Entrance @keyframes ─────────────────────────────────────────── */

@keyframes fadeInUp {
  0%   { opacity: 0; transform: translateY(24px) scale(0.96); }
  100% { opacity: 1; transform: translateY(0px) scale(1.00); }
}

@keyframes fadeIn {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes drawIn {
  0%   { opacity: 0; transform: scale(0.7); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes slideInLeft {
  0%   { opacity: 0; transform: translateX(-32px); }
  100% { opacity: 1; transform: translateX(0); }
}

@keyframes slideInRight {
  0%   { opacity: 0; transform: translateX(32px); }
  100% { opacity: 1; transform: translateX(0); }
}

@keyframes scaleIn {
  0%   { opacity: 0; transform: scale(0.4); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes floatIn {
  0%   { opacity: 0; transform: translateY(16px) scale(0.92); }
  60%  { opacity: 1; transform: translateY(-4px) scale(1.01); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes pulseGlow {
  0%, 100% { filter: drop-shadow(0 0 4px currentColor); }
  50%      { filter: drop-shadow(0 0 12px currentColor); }
}

/* ── Entrance animation classes ──────────────────────────────────── */

.entrance-fadeInUp {
  animation: fadeInUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.entrance-fadeIn {
  animation: fadeIn 0.35s ease both;
}

.entrance-drawIn {
  animation: drawIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.entrance-slideInLeft {
  animation: slideInLeft 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.entrance-slideInRight {
  animation: slideInRight 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.entrance-scaleIn {
  animation: scaleIn 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.entrance-floatIn {
  animation: floatIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* ── Connection status indicator ─────────────────────────────────── */

#connection-status {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 200;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  opacity: 0;
  transition: opacity 0.3s ease;
  backdrop-filter: blur(8px);
}

#connection-status.disconnected {
  opacity: 1;
  background: rgba(239, 68, 68, 0.7);
  color: white;
}

#connection-status.reconnecting {
  opacity: 1;
  background: rgba(245, 200, 66, 0.7);
  color: #0f0f1a;
}

/* ── Highlight pulsing ───────────────────────────────────────────── */

.entity-highlighted {
  animation: pulseGlow 2s ease-in-out infinite;
}
`;
