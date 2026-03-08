/**
 * @preplai/mcp-server — Player CSS v4
 *
 * Cinematic dark theme with refined typography, animations, and layout.
 * Served as a string at GET /player.css.
 *
 * Design system:
 * - Font: Inter for all UI, JetBrains Mono for code/technical content
 * - Background: #0c0d14 center → #060610 edges (radial gradient)
 * - Accent palette: Cyan #4ECDC4, Violet #9B59B6, Gold #C9A84C
 * - Narrator: liquid glass panel (blur 40px, raised 88px), 800px max, custom scrollbar
 * - Frame nav: bottom-center pill, dot indicators, always-visible at 0.7
 */

export const PLAYER_CSS = `/* ── PRE Player — Cinematic Dark Theme v4 ─────────────────────────── */

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
  background: radial-gradient(ellipse at center, #0c0d14 0%, #060610 70%);
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

/* ── Empty state ─────────────────────────────────────────────────── */

#empty-state text {
  font-family: 'Inter', sans-serif;
}

/* ── SVG entity shape subtle transitions ─────────────────────────── */

svg rect, svg circle, svg ellipse, svg polygon, svg path {
  transition: filter 0.2s ease;
}

/* ── Narrator overlay (liquid glass, raised for visibility) ───────── */

#narrator-overlay {
  position: fixed;
  bottom: 88px;
  left: 0;
  right: 0;
  z-index: 100;
  pointer-events: none;
  display: flex;
  justify-content: center;
  padding: 0 64px;
  transition: opacity 0.3s ease, visibility 0.3s ease;
}

#narrator-overlay.hidden {
  opacity: 0 !important;
  pointer-events: none;
  visibility: hidden;
}

#narrator-text {
  max-width: 800px;
  max-height: calc(5.5em + 48px);
  overflow-y: auto;
  scrollbar-gutter: stable;
  padding: 20px 36px;
  background: rgba(18, 20, 28, 0.65);
  backdrop-filter: blur(40px) saturate(1.4);
  -webkit-backdrop-filter: blur(40px) saturate(1.4);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-left: 3px solid #C9A84C;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03) inset,
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  color: #b8b8d0;
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 400;
  line-height: 1.7;
  letter-spacing: 0.01em;
  text-align: center;
  -webkit-font-smoothing: antialiased;
  opacity: 0;
  transform: translateY(12px);
  transition: opacity 0.4s cubic-bezier(0.22, 1, 0.36, 1),
              transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

#narrator-text.visible,
#narrator-text.narrator-visible {
  opacity: 1;
  transform: translateY(0);
}

#narrator-text:empty {
  display: none;
}

/* ── Narrator custom scrollbar ───────────────────────────────────── */

#narrator-text::-webkit-scrollbar {
  width: 4px;
}

#narrator-text::-webkit-scrollbar-track {
  background: transparent;
}

#narrator-text::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 4px;
}

#narrator-text {
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.12) transparent;
}

/* ── Frame navigation ────────────────────────────────────────────── */

#frame-nav {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 150;
  display: flex;
  align-items: center;
  gap: 12px;
  opacity: 0.85;
  transition: opacity 0.3s ease;
  background: rgba(12, 13, 20, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 20px;
  padding: 8px 16px;
}

#frame-nav.visible {
  opacity: 0.9;
}

#frame-nav:hover {
  opacity: 1 !important;
}

#frame-counter {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: #6b6b80;
  min-width: 48px;
  text-align: center;
  user-select: none;
}

#frame-nav button {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.5);
  border-radius: 50%;
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

#frame-nav button:active {
  transform: scale(0.95);
  background: rgba(255, 255, 255, 0.08);
}

#frame-nav button:focus-visible {
  outline: 2px solid #C9A84C;
  outline-offset: 2px;
}

#frame-nav button[aria-disabled="true"] {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

/* ── TTS toggle ──────────────────────────────────────────────────── */

#tts-toggle,
#narrator-overlay-toggle {
  margin-left: 4px;
}

/* Vocal button: show only one icon at a time */
#tts-toggle .tts-icon-on,
#tts-toggle .tts-icon-off {
  display: none;
}

#tts-toggle.tts-on .tts-icon-on {
  display: block;
}

#tts-toggle.tts-on .tts-icon-off {
  display: none;
}

#tts-toggle.tts-off .tts-icon-on {
  display: none;
}

#tts-toggle.tts-off .tts-icon-off {
  display: block;
  opacity: 0.5;
}

/* Narrator overlay toggle: show only one icon at a time */
#narrator-overlay-toggle .narrator-toggle-on,
#narrator-overlay-toggle .narrator-toggle-off {
  display: none;
}

#narrator-overlay-toggle.narrator-hidden .narrator-toggle-on {
  display: none;
}

#narrator-overlay-toggle.narrator-hidden .narrator-toggle-off {
  display: block;
}

#narrator-overlay-toggle:not(.narrator-hidden) .narrator-toggle-on {
  display: block;
}

#narrator-overlay-toggle:not(.narrator-hidden) .narrator-toggle-off {
  display: none;
}

/* ── Frame dot indicators ────────────────────────────────────────── */

#frame-dots {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}

@keyframes dotPulse {
  0%, 100% { box-shadow: 0 0 8px rgba(201, 168, 76, 0.4); }
  50%      { box-shadow: 0 0 12px rgba(201, 168, 76, 0.6); }
}

.frame-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  cursor: pointer;
  transition: all 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.frame-dot:hover {
  background: rgba(255, 255, 255, 0.5);
  transform: scale(1.15);
}

.frame-dot.visited {
  background: rgba(255, 255, 255, 0.4);
}

.frame-dot.visited:hover {
  background: rgba(255, 255, 255, 0.6);
}

.frame-dot.current {
  background: #C9A84C;
  box-shadow: 0 0 8px rgba(201, 168, 76, 0.4);
  transform: scale(1.2);
  animation: dotPulse 2s ease-in-out infinite;
}

.frame-dot.current:hover {
  background: #C9A84C;
  transform: scale(1.25);
}

/* ── Frame crossfade transition ──────────────────────────────────── */

.frame-fade-out {
  opacity: 0;
  transition: opacity 0.2s ease-out;
}

.frame-fade-in {
  opacity: 1;
  transition: opacity 0.3s ease-in;
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

@keyframes dropIn {
  0%   { opacity: 0; transform: translateY(-20px) scale(0.95); }
  60%  { opacity: 1; transform: translateY(4px) scale(1.01); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes pathDraw {
  from { stroke-dashoffset: 1; }
  to   { stroke-dashoffset: 0; }
}

@keyframes gentlePulse {
  0%, 100% { opacity: 0.05; }
  50%      { opacity: 0.1; }
}

@keyframes subtleFloat {
  0%, 100% { transform: translateY(0px); }
  50%      { transform: translateY(-4px); }
}

/* ── Entrance animation classes ──────────────────────────────────── */

.entrance-fadeInUp {
  animation: fadeInUp 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.entrance-fadeIn {
  animation: fadeIn 0.35s ease both;
}

.entrance-drawIn {
  animation: drawIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.entrance-slideInLeft {
  animation: slideInLeft 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.entrance-slideInRight {
  animation: slideInRight 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.entrance-scaleIn {
  animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.entrance-floatIn {
  animation: floatIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.entrance-dropIn {
  animation: dropIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.entrance-pathDraw {
  stroke-dashoffset: 1;
  animation: pathDraw 0.6s cubic-bezier(0.16, 1, 0.3, 1) both;
}

/* ── Utility classes ─────────────────────────────────────────────── */

.ambient-particle {
  animation: gentlePulse 6s ease-in-out infinite, subtleFloat 8s ease-in-out infinite;
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
  -webkit-backdrop-filter: blur(8px);
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

/* ── Interactive entity hover/focus states ───────────────────────── */

.entity-interactive {
  cursor: pointer;
  transition: filter 180ms cubic-bezier(0.16, 1, 0.3, 1);
}

.entity-interactive:hover {
  filter: brightness(1.15) drop-shadow(0 0 12px rgba(255, 255, 255, 0.12));
}

/* ── Entity tooltip ──────────────────────────────────────────────── */

.entity-tooltip {
  position: fixed;
  z-index: 300;
  padding: 8px 14px;
  background: rgba(12, 13, 20, 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: #e8e8f0;
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  pointer-events: none;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.15s ease, transform 0.15s ease;
  white-space: nowrap;
  max-width: 300px;
}

.entity-tooltip.visible {
  opacity: 1;
  transform: translateY(0);
}

/* ── Keyboard hint ───────────────────────────────────────────────── */

.keyboard-hint {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.25);
  opacity: 1;
  transition: opacity 0.5s ease;
  pointer-events: none;
}

.keyboard-hint.hidden {
  opacity: 0;
}

/* ── Progress bar (algorithm-viz style) ───────────────────────────── */

#progress-bar {
  position: fixed;
  bottom: 72px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 120;
  width: 400px;
  max-width: 90vw;
  height: 6px;
  background: rgba(30, 41, 59, 0.6);
  border-radius: 4px;
  overflow: hidden;
}

#progress-fill {
  height: 100%;
  background: #6366f1;
  border-radius: 4px;
  width: 0%;
  transition: width 0.2s ease;
}

/* ── Minimal theme overrides ─────────────────────────────────────── */

[data-theme="minimal"] html,
[data-theme="minimal"] body {
  background: #0f172a;
}

[data-theme="minimal"] #narrator-overlay {
  bottom: 72px;
}

[data-theme="minimal"] #narrator-text {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  border-left: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  box-shadow: none;
}

[data-theme="minimal"] #frame-nav {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
}

[data-theme="minimal"] #frame-nav button {
  background: #1e293b;
  border: 1px solid #334155;
  color: #94a3b8;
}

[data-theme="minimal"] #frame-nav button:hover {
  background: #334155;
  color: #e2e8f0;
}

[data-theme="minimal"] #frame-nav button:focus-visible {
  outline: 2px solid #6366f1;
}

[data-theme="minimal"] .frame-dot.current {
  background: #6366f1;
  box-shadow: 0 0 8px rgba(99, 102, 241, 0.4);
}

[data-theme="minimal"] #progress-bar {
  background: #1e293b;
  border: 1px solid #334155;
}

[data-theme="minimal"] #progress-fill {
  background: #6366f1;
}

[data-theme="minimal"] #dot-grid,
[data-theme="minimal"] #ambient-layer {
  opacity: 0;
  pointer-events: none;
}

[data-theme="minimal"] #bg {
  fill: #0f172a;
}
`;
