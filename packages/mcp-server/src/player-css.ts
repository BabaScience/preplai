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

html {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: transparent;
}

body {
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

/* ── Cinematic Loading State ──────────────────────────────────── */

#loading-state {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  background: radial-gradient(ellipse at center, #12131c 0%, #060610 70%);
  transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

#loading-state.hidden {
  opacity: 0;
  pointer-events: none;
  visibility: hidden;
  transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1),
              visibility 0s linear 0.6s;
}

.loading-logo svg {
  animation: logoPulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes logoPulse {
  0%, 100% { opacity: 0.7; transform: scale(1); filter: drop-shadow(0 0 8px rgba(201,168,76,0.2)); }
  50% { opacity: 1; transform: scale(1.08); filter: drop-shadow(0 0 20px rgba(201,168,76,0.4)); }
}

.loading-text {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  color: rgba(255,255,255,0.4);
  letter-spacing: 0.03em;
}

.loading-dots {
  display: flex;
  gap: 6px;
}

.loading-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(201,168,76,0.5);
  animation: dotBounce 1.4s ease-in-out infinite;
}

.loading-dots span:nth-child(2) { animation-delay: 0.16s; }
.loading-dots span:nth-child(3) { animation-delay: 0.32s; }

@keyframes dotBounce {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
  40% { transform: scale(1); opacity: 1; }
}

/* ── Cinematic End Screen ─────────────────────────────────────── */

.end-screen {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 180;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(6, 6, 16, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.end-screen.visible {
  opacity: 1;
  pointer-events: auto;
}

.end-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
}

.end-logo svg { opacity: 0.8; }

.end-title {
  font-family: 'Inter', sans-serif;
  font-size: 20px;
  font-weight: 500;
  color: rgba(255,255,255,0.7);
  letter-spacing: 0.02em;
}

.end-actions {
  display: flex;
  gap: 12px;
  margin-top: 8px;
}

.end-actions button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 10px;
  border: 1px solid rgba(255,255,255,0.1);
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.7);
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.end-actions button:hover {
  background: rgba(201,168,76,0.15);
  border-color: rgba(201,168,76,0.3);
  color: #C9A84C;
}

.end-stats {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  color: rgba(255,255,255,0.3);
  margin-top: 4px;
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
  background: rgba(18, 20, 28, 0.45);
  backdrop-filter: blur(24px) saturate(1.2);
  -webkit-backdrop-filter: blur(24px) saturate(1.2);
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
  transform: translateX(-50%) translateY(0);
  z-index: 150;
  display: flex;
  align-items: center;
  gap: 12px;
  opacity: 1;
  transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  background: rgba(12, 13, 20, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 20px;
  padding: 8px 16px;
  overflow: visible;
}

/* Auto-hide: slide down + fade out when idle */
#frame-nav.auto-hidden {
  opacity: 0;
  transform: translateX(-50%) translateY(20px);
  pointer-events: none;
}

/* Keep visible when hovering the nav bar itself */
#frame-nav:hover {
  opacity: 1 !important;
  transform: translateX(-50%) translateY(0) !important;
  pointer-events: auto !important;
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

/* ── Play/Pause toggle ───────────────────────────────────────────── */

#play-pause-toggle {
  margin-left: 4px;
}

#play-pause-toggle .play-icon,
#play-pause-toggle .pause-icon {
  display: none;
}

#play-pause-toggle.play-state .play-icon {
  display: block;
}

#play-pause-toggle.play-state .pause-icon {
  display: none;
}

#play-pause-toggle.pause-state .play-icon {
  display: none;
}

#play-pause-toggle.pause-state .pause-icon {
  display: block;
}

/* ── Audio loading spinner (pulsing ring on play button) ──────── */

#play-pause-toggle.audio-loading {
  position: relative;
  pointer-events: none;
}

#play-pause-toggle.audio-loading::after {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: #C9A84C;
  animation: audioLoadingSpin 0.8s linear infinite;
}

@keyframes audioLoadingSpin {
  to { transform: rotate(360deg); }
}

#play-pause-toggle.audio-loading .play-icon,
#play-pause-toggle.audio-loading .pause-icon {
  opacity: 0.4;
}

/* ── Speed control (hover-pill with slider popup) ────────────────── */

#speed-control { min-width: 36px; }
#speed-control .hover-pill-trigger { width: auto; min-width: 36px; padding: 0 8px; border-radius: 12px; }

#speed-toggle .speed-label {
  font-family: 'JetBrains Mono', monospace;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}

.speed-popup { width: 200px !important; flex-direction: column !important; gap: 8px !important; padding: 10px 12px !important; }
.speed-presets { display: flex; gap: 4px; justify-content: center; width: 100%; }
.speed-preset { width: auto !important; min-width: 32px; height: 26px !important; padding: 0 6px !important; border-radius: 6px !important; font-family: 'JetBrains Mono', monospace; font-size: 10px !important; font-weight: 500; font-variant-numeric: tabular-nums; }

.speed-slider-wrap { display: flex; align-items: center; gap: 8px; width: 100%; padding: 2px 0; }
.speed-slider-value { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.5); min-width: 28px; text-align: right; font-variant-numeric: tabular-nums; }

#speed-slider {
  -webkit-appearance: none;
  appearance: none;
  flex: 1;
  height: 4px;
  background: rgba(255,255,255,0.12);
  border-radius: 2px;
  outline: none;
  cursor: pointer;
}

#speed-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #C9A84C;
  border: 2px solid rgba(0,0,0,0.2);
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  cursor: grab;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
}

#speed-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  box-shadow: 0 2px 8px rgba(201,168,76,0.4);
}

#speed-slider::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.1); }

#speed-slider::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #C9A84C;
  border: 2px solid rgba(0,0,0,0.2);
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  cursor: grab;
}

#speed-slider::-moz-range-track {
  height: 4px;
  background: rgba(255,255,255,0.12);
  border-radius: 2px;
  border: none;
}

/* Light theme overrides */
[data-theme="light"] #speed-slider { background: rgba(0,0,0,0.08); }
[data-theme="light"] #speed-slider::-webkit-slider-thumb { background: #B8943D; border-color: rgba(255,255,255,0.6); box-shadow: 0 1px 4px rgba(0,0,0,0.15); }
[data-theme="light"] #speed-slider::-moz-range-thumb { background: #B8943D; border-color: rgba(255,255,255,0.6); }
[data-theme="light"] #speed-slider::-moz-range-track { background: rgba(0,0,0,0.08); }
[data-theme="light"] .speed-slider-value { color: rgba(40,40,60,0.5); }

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

/* ── Timeline Bar (replaces dot indicators) ──────────────────── */

#frame-dots {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 28px;
  padding: 0 4px;
}

.frame-segment {
  height: 4px;
  min-width: 16px;
  flex: 1;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.12);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  position: relative;
}

.frame-segment:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scaleY(1.3);
}

.frame-segment.visited {
  background: rgba(201, 168, 76, 0.35);
}

.frame-segment.current {
  background: rgba(201, 168, 76, 0.3);
  box-shadow: 0 0 8px rgba(201, 168, 76, 0.4);
  transform: scaleY(1.5);
  overflow: hidden;
  position: relative;
}

.frame-segment.current:hover {
  transform: scaleY(1.5);
}

.segment-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: #C9A84C;
  border-radius: 2px;
  animation: segmentFill linear forwards;
  animation-duration: 5000ms;
  width: 100%;
  transform-origin: left;
  animation-name: segmentFill;
}

@keyframes segmentFill {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.frame-segment .segment-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%) translateY(-8px);
  padding: 4px 10px;
  background: rgba(12, 13, 20, 0.9);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  font-family: 'Inter', sans-serif;
  font-size: 11px;
  color: rgba(255,255,255,0.7);
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.frame-segment:hover .segment-tooltip {
  opacity: 1;
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
  transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
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

/* ── Motivated entrance @keyframes (P2.4) ───────────────────────── */

@keyframes flyInFromLeft {
  0%   { opacity: 0; transform: translateX(-120px) scale(0.92); }
  100% { opacity: 1; transform: translateX(0) scale(1); }
}

@keyframes flyInFromRight {
  0%   { opacity: 0; transform: translateX(120px) scale(0.92); }
  100% { opacity: 1; transform: translateX(0) scale(1); }
}

@keyframes flyInFromTop {
  0%   { opacity: 0; transform: translateY(-80px) scale(0.92); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes flyInFromBottom {
  0%   { opacity: 0; transform: translateY(80px) scale(0.92); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}

@keyframes growFromPoint {
  0%   { opacity: 0; transform: scale(0.15); }
  60%  { opacity: 1; transform: scale(1.06); }
  100% { opacity: 1; transform: scale(1); }
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

/* ── Motivated entrance classes (P2.4) ────────────────────────── */

.entrance-flyInFromLeft {
  animation: flyInFromLeft 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.entrance-flyInFromRight {
  animation: flyInFromRight 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.entrance-flyInFromTop {
  animation: flyInFromTop 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.entrance-flyInFromBottom {
  animation: flyInFromBottom 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
}

.entrance-growFromPoint {
  animation: growFromPoint 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
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

/* ── Depth of field (P2.2) ───────────────────────────────────────── */

#entity-layer > g {
  transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1),
              filter 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.dof-focus {
  opacity: 1 !important;
  filter: none !important;
}

.dof-focus > .animate-element {
  transform: scale(1.15) !important;
}

.dof-bg {
  opacity: 0.35 !important;
  filter: blur(1.5px) saturate(0.5) !important;
}

.dof-bg > .animate-element {
  transform: scale(0.88) !important;
}

/* Secondary focus: confidence 0.4–0.79 — partially elevated */
.dof-focus-secondary {
  opacity: 0.85 !important;
  filter: blur(0.5px) saturate(0.8) !important;
}

.dof-focus-secondary > .animate-element {
  transform: scale(1.05) !important;
}

/* ── Spatial narrator (P2.3) ─────────────────────────────────────── */

#narrator-overlay {
  transition: opacity 0.3s ease, visibility 0.3s ease,
              top 0.5s cubic-bezier(0.16, 1, 0.3, 1),
              left 0.5s cubic-bezier(0.16, 1, 0.3, 1),
              bottom 0.5s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

#narrator-overlay.narrator-spatial {
  bottom: auto;
  top: var(--spatial-top, 50%);
  left: var(--spatial-left, 50%);
  right: auto;
  transform: translate(-50%, -100%);
  padding: 0;
  justify-content: center;
}

#narrator-overlay.narrator-spatial #narrator-text {
  max-width: 480px;
  font-size: 16px;
  padding: 14px 24px;
  text-align: left;
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
  transition: opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

#progress-fill {
  height: 100%;
  background: #C9A84C;
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
  outline: 2px solid #94a3b8;
}

[data-theme="minimal"] .frame-dot.current {
  background: #94a3b8;
  box-shadow: 0 0 8px rgba(148, 163, 184, 0.4);
}

[data-theme="minimal"] #progress-bar {
  background: #1e293b;
  border: 1px solid #334155;
}

[data-theme="minimal"] #progress-fill {
  background: #94a3b8;
}

[data-theme="minimal"] #dot-grid,
[data-theme="minimal"] #ambient-layer {
  opacity: 0;
  pointer-events: none;
}

[data-theme="minimal"] #bg {
  fill: #0f172a;
}

/* ── Light theme overrides ──────────────────────────────────────── */

body[data-theme="light"] {
  background: radial-gradient(ellipse at center, #faf7f2 0%, #f3ede4 70%);
  color: #1a1a2e;
}

[data-theme="light"] #bg {
  fill: #f5f0e8;
}

/* Dot grid: dark dots on light bg */
[data-theme="light"] #dot-grid {
  opacity: 0.06;
}
[data-theme="light"] #dot-grid circle {
  fill: rgba(0, 0, 0, 0.5);
}

/* Ambient particles: tinted with low opacity */
[data-theme="light"] .ambient-particle {
  opacity: 0.04 !important;
}

/* ── Light narrator ──────────────────────────────────────────── */

/* Light theme: loading state */
[data-theme="light"] #loading-state {
  background: radial-gradient(ellipse at center, #faf7f2 0%, #f0ece4 70%);
}
[data-theme="light"] .loading-text { color: rgba(0,0,0,0.35); }
[data-theme="light"] .loading-dots span { background: rgba(184,148,61,0.5); }

/* Light theme: end screen */
[data-theme="light"] .end-screen { background: rgba(250, 247, 242, 0.9); }
[data-theme="light"] .end-title { color: rgba(0,0,0,0.6); }
[data-theme="light"] .end-actions button {
  background: rgba(0,0,0,0.04);
  border-color: rgba(0,0,0,0.1);
  color: rgba(0,0,0,0.6);
}
[data-theme="light"] .end-actions button:hover {
  background: rgba(184,148,61,0.1);
  border-color: rgba(184,148,61,0.3);
  color: #B8943D;
}
[data-theme="light"] .end-stats { color: rgba(0,0,0,0.3); }

[data-theme="light"] #narrator-text {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(24px) saturate(1.1);
  -webkit-backdrop-filter: blur(24px) saturate(1.1);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-left: 3px solid #B8943D;
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.06),
    0 0 0 1px rgba(0, 0, 0, 0.02) inset,
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
  color: #3a3a4e;
}

[data-theme="light"] #narrator-text::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.12);
}

[data-theme="light"] #narrator-text {
  scrollbar-color: rgba(0, 0, 0, 0.12) transparent;
}

/* ── Light frame nav ─────────────────────────────────────────── */

[data-theme="light"] #frame-nav {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(16px) saturate(1.2);
  -webkit-backdrop-filter: blur(16px) saturate(1.2);
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

[data-theme="light"] #frame-nav button {
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.08);
  color: #5a5a6e;
}

[data-theme="light"] #frame-nav button:hover {
  background: rgba(0, 0, 0, 0.08);
  color: #1a1a2e;
}

[data-theme="light"] #frame-nav button:active {
  background: rgba(0, 0, 0, 0.06);
}

[data-theme="light"] #frame-nav button:focus-visible {
  outline: 2px solid #B8943D;
}

[data-theme="light"] #frame-counter {
  color: #8a8a9e;
}

/* ── Light timeline segments ────────────────────────────────── */

[data-theme="light"] .frame-segment {
  background: rgba(0, 0, 0, 0.08);
}

[data-theme="light"] .frame-segment:hover {
  background: rgba(0, 0, 0, 0.15);
}

[data-theme="light"] .frame-segment.visited {
  background: rgba(184, 148, 61, 0.3);
}

[data-theme="light"] .frame-segment.current {
  background: #B8943D;
  box-shadow: 0 0 8px rgba(184, 148, 61, 0.3);
}

[data-theme="light"] .frame-segment .segment-tooltip {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(0,0,0,0.1);
  color: rgba(0,0,0,0.7);
}

/* ── Light progress bar ──────────────────────────────────────── */

[data-theme="light"] #progress-bar {
  background: rgba(0, 0, 0, 0.06);
}

[data-theme="light"] #progress-fill {
  background: #B8943D;
}

/* ── Light play button gold accent ───────────────────────────── */

[data-theme="light"] #play-pause-toggle.play-state:hover {
  background: rgba(184, 148, 61, 0.12);
  color: #B8943D;
  border-color: rgba(184, 148, 61, 0.25);
}

[data-theme="light"] #play-pause-toggle.audio-loading::after {
  border-top-color: #B8943D;
}

/* ── Light tooltips ──────────────────────────────────────────── */

[data-theme="light"] .entity-tooltip {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  color: #1a1a2e;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

/* ── Light connection status ─────────────────────────────────── */

[data-theme="light"] #connection-status.reconnecting {
  color: #1a1a2e;
}

/* ── Light keyboard hint ─────────────────────────────────────── */

[data-theme="light"] .keyboard-hint {
  color: rgba(0, 0, 0, 0.2);
}

/* ── Light rotate hint ───────────────────────────────────────── */

[data-theme="light"] #rotate-hint {
  background: rgba(250, 247, 242, 0.95);
  color: #3a3a4e;
}

[data-theme="light"] #rotate-hint svg {
  stroke: #5a5a6e;
}

[data-theme="light"] #rotate-fullscreen-btn {
  background: #B8943D;
  color: #ffffff;
}

[data-theme="light"] #rotate-fullscreen-btn:active {
  background: #a68535;
}

/* ── Light entity hover ──────────────────────────────────────── */

[data-theme="light"] .entity-interactive:hover {
  filter: brightness(0.92) drop-shadow(0 0 12px rgba(0, 0, 0, 0.08));
}

/* ── Light SVG text — make all text dark for readability ─────── */

[data-theme="light"] #entity-layer text,
[data-theme="light"] #connection-layer text,
[data-theme="light"] #overlay-layer text {
  fill: #2d2d3a;
}

/* ── Light connections — dark strokes + arrow markers ─────────── */

[data-theme="light"] #connection-layer line,
[data-theme="light"] #connection-layer path,
[data-theme="light"] #connection-layer polyline {
  stroke: rgba(0, 0, 0, 0.4) !important;
}

[data-theme="light"] marker path {
  fill: rgba(0, 0, 0, 0.45) !important;
}

/* ── Light soft shadow filter — lighter for light bg ─────────── */

[data-theme="light"] #entity-layer > g {
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.06));
}

/* ── Entity idle micro-animations ────────────────────────────────── */
/* GPU-only: opacity + transform. Activates after entrance completes. */
/* Each entity type gets a unique ambient rhythm so the scene feels alive. */

@keyframes idle-breathe {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.012); }
}

@keyframes idle-shimmer {
  0%, 100% { opacity: 0.6; }
  50%      { opacity: 0.85; }
}

@keyframes idle-pulse-led {
  0%, 100% { opacity: 0.9; }
  40%      { opacity: 0.5; }
  60%      { opacity: 1; }
}

@keyframes idle-float {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-2px); }
}

@keyframes idle-bob {
  0%, 100% { transform: translateY(0); }
  33%      { transform: translateY(-1.5px); }
  66%      { transform: translateY(1px); }
}

@keyframes idle-rotate-slow {
  0%   { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes idle-data-flow {
  0%   { opacity: 0.3; transform: translateX(-3px); }
  50%  { opacity: 0.7; transform: translateX(3px); }
  100% { opacity: 0.3; transform: translateX(-3px); }
}

@keyframes idle-flicker {
  0%, 90%, 100% { opacity: 0.7; }
  92%           { opacity: 0.4; }
  95%           { opacity: 0.8; }
  97%           { opacity: 0.3; }
}

/* ── Idle animation classes (applied via JS after entrance completes) ── */
/* These override the entrance animation AFTER it finishes, so both play. */

.idle-breathe {
  animation: idle-breathe 4s ease-in-out infinite !important;
}
.idle-breathe-fast {
  animation: idle-breathe 3s ease-in-out infinite !important;
}
.idle-breathe-slow {
  animation: idle-breathe 5s ease-in-out infinite !important;
}
.idle-float {
  animation: idle-float 5s ease-in-out infinite !important;
}
.idle-float-slow {
  animation: idle-float 6s ease-in-out infinite !important;
}
.idle-bob {
  animation: idle-bob 4s ease-in-out infinite !important;
}

/* ── Child-element idle rules (don't conflict with entrance on parent) ── */

/* Server: rack lines shimmer, LEDs pulse */
[data-type="Server"] .animate-element line {
  animation: idle-shimmer 3s ease-in-out 0.8s infinite;
}
[data-type="Server"] .animate-element circle {
  animation: idle-pulse-led 2.5s ease-in-out 1s infinite;
}

/* Database: stripe lines shimmer */
[data-type="Database"] .animate-element line {
  animation: idle-shimmer 3.5s ease-in-out 1.2s infinite;
}

/* CPU: register text shimmers */
[data-type="CPU"] .animate-element text {
  animation: idle-shimmer 2s ease-in-out 1s infinite;
}

/* Network: data flow on lines */
[data-type="Network"] .animate-element line {
  animation: idle-data-flow 3s ease-in-out infinite;
}

/* NeuralNetwork: activations shimmer on nodes and links */
[data-type="NeuralNetwork"] .animate-element circle {
  animation: idle-shimmer 2s ease-in-out infinite;
}
[data-type="NeuralNetwork"] .animate-element line {
  animation: idle-data-flow 2.5s ease-in-out infinite;
}

/* Monitor: LED pulse on circles */
[data-type="Monitor"] .animate-element circle {
  animation: idle-pulse-led 3s ease-in-out infinite;
}

/* FSM: transition lines shimmer */
[data-type="FSM"] .animate-element line,
[data-type="FSM"] .animate-element path {
  animation: idle-shimmer 3s ease-in-out infinite;
}

/* TuringMachine: tape cells shimmer */
[data-type="TuringMachine"] .animate-element rect {
  animation: idle-shimmer 4s ease-in-out infinite;
}

/* LogicGate: input/output lines shimmer */
[data-type="LogicGate"] .animate-element line {
  animation: idle-data-flow 2.5s ease-in-out infinite;
}

/* Disable ALL idle animations in minimal theme */
[data-theme="minimal"] .idle-breathe,
[data-theme="minimal"] .idle-breathe-fast,
[data-theme="minimal"] .idle-breathe-slow,
[data-theme="minimal"] .idle-float,
[data-theme="minimal"] .idle-float-slow,
[data-theme="minimal"] .idle-bob {
  animation: none !important;
}
[data-theme="minimal"] [data-type] .animate-element line,
[data-theme="minimal"] [data-type] .animate-element circle,
[data-theme="minimal"] [data-type] .animate-element rect,
[data-theme="minimal"] [data-type] .animate-element path,
[data-theme="minimal"] [data-type] .animate-element text {
  animation: none !important;
}

/* ── Fullscreen toggle icon states ─────────────────────────────── */

#fullscreen-toggle .fs-exit-icon { display: none; }
#fullscreen-toggle .fs-enter-icon { display: block; }
#fullscreen-toggle.is-fullscreen .fs-enter-icon { display: none; }
#fullscreen-toggle.is-fullscreen .fs-exit-icon { display: block; }

/* ── Hover-pill: compact floating popup (icons/dots only) ─────── */
.hover-pill { position:relative; display:flex; align-items:center; height:32px; border-radius:16px; overflow:visible; background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.10); transition:background 0.2s ease, border-color 0.2s ease; z-index:1; }
.hover-pill:hover, .hover-pill:focus-within { z-index:210; background:rgba(255,255,255,0.14); border-color:rgba(255,255,255,0.18); }
.hover-pill-trigger { display:flex; align-items:center; justify-content:center; width:32px; height:32px; border:none; background:transparent; color:rgba(255,255,255,0.55); cursor:pointer; padding:0; flex-shrink:0; border-radius:50%; transition:color 0.15s ease; }
.hover-pill-trigger:hover { color:rgba(255,255,255,0.9); }
.hover-pill-popup { position:absolute; left:50%; bottom:calc(100% + 10px); transform:translateX(-50%) translateY(6px) scale(0.92); transform-origin:bottom center; display:flex; flex-direction:row; align-items:center; gap:6px; padding:6px 8px; background:linear-gradient(170deg, rgba(255,255,255,0.13) 0%, rgba(24,26,40,0.58) 100%); backdrop-filter:blur(28px) saturate(1.25); -webkit-backdrop-filter:blur(28px) saturate(1.25); border:1px solid rgba(255,255,255,0.16); border-radius:20px; box-shadow:0 8px 28px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.10); opacity:0; visibility:hidden; pointer-events:none; transition:opacity 0.16s ease, transform 0.2s cubic-bezier(0.16,1,0.3,1), visibility 0.2s; z-index:200; }
.hover-pill-popup::before { content:''; position:absolute; bottom:-14px; left:0; right:0; height:16px; background:transparent; }
.hover-pill-popup::after { content:''; position:absolute; bottom:-5px; left:50%; transform:translateX(-50%) rotate(45deg); width:9px; height:9px; background:rgba(24,26,40,0.58); border-right:1px solid rgba(255,255,255,0.16); border-bottom:1px solid rgba(255,255,255,0.16); }
.hover-pill:hover .hover-pill-popup, .hover-pill:focus-within .hover-pill-popup { opacity:1; visibility:visible; pointer-events:auto; transform:translateX(-50%) translateY(0) scale(1); }
.hover-pill-popup button { display:flex; align-items:center; justify-content:center; width:30px; height:30px; margin:0; padding:0; border:1.5px solid transparent; background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.6); border-radius:50%; cursor:pointer; flex-shrink:0; transition:all 0.14s ease; }
.hover-pill-popup button:hover { background:rgba(255,255,255,0.16); color:#fff; }
.hover-pill-popup button:focus { outline:none; }
.hover-pill-popup button:focus-visible { border-color:rgba(201,168,76,0.6); }
.hover-pill-popup button.active { background:rgba(201,168,76,0.22); border-color:rgba(201,168,76,0.55); color:#fff; }
.hover-pill-popup button>svg { width:14px; height:14px; display:block; }
[data-theme="cinema"] .theme-icon-light { display:none; }
[data-theme="cinema"] .theme-icon-cinema { display:block; }
[data-theme="light"] .theme-icon-cinema { display:none; }
[data-theme="light"] .theme-icon-light { display:block; }
.palette-dot-indicator { display:block; width:13px; height:13px; border-radius:50%; background:#C9A84C; transition:background 0.25s ease; box-shadow:0 0 0 1.5px rgba(255,255,255,0.12); }
.pdot { width:22px !important; height:22px !important; border:1.5px solid transparent !important; transition:all 0.14s ease, transform 0.14s ease !important; box-shadow:inset 0 1px 2px rgba(255,255,255,0.2); }
.pdot[data-palette-value="default"] { background:#c9a84c !important; }
.pdot[data-palette-value="ocean"] { background:#4ecdc4 !important; }
.pdot[data-palette-value="sunset"] { background:#e67e22 !important; }
.pdot[data-palette-value="forest"] { background:#27ae60 !important; }
.pdot[data-palette-value="mono"] { background:#90a4ae !important; }
.pdot.active { transform:scale(1.15); border-color:rgba(255,255,255,0.5) !important; box-shadow:inset 0 1px 2px rgba(255,255,255,0.3), 0 0 0 2px rgba(255,255,255,0.2) !important; }
.pdot:hover:not(.active) { transform:scale(1.08); border-color:rgba(255,255,255,0.3) !important; }
[data-theme="light"] .hover-pill { background:rgba(0,0,0,0.05); border-color:rgba(0,0,0,0.09); }
[data-theme="light"] .hover-pill:hover, [data-theme="light"] .hover-pill:focus-within { background:rgba(0,0,0,0.08); border-color:rgba(0,0,0,0.12); }
[data-theme="light"] .hover-pill-trigger { color:rgba(60,60,80,0.6); }
[data-theme="light"] .hover-pill-trigger:hover { color:rgba(20,20,40,0.9); }
[data-theme="light"] .hover-pill-popup { background:linear-gradient(165deg, rgba(255,255,255,0.82) 0%, rgba(248,246,240,0.7) 100%); backdrop-filter:blur(28px) saturate(1.1); -webkit-backdrop-filter:blur(28px) saturate(1.1); border-color:rgba(255,255,255,0.8); box-shadow:0 8px 28px rgba(20,24,40,0.09), inset 0 1px 0 rgba(255,255,255,0.9); }
[data-theme="light"] .hover-pill-popup::after { background:rgba(248,246,240,0.7); border-right-color:rgba(255,255,255,0.8); border-bottom-color:rgba(255,255,255,0.8); }
[data-theme="light"] .hover-pill-popup button { background:rgba(0,0,0,0.04); color:rgba(40,40,60,0.65); border-color:transparent; }
[data-theme="light"] .hover-pill-popup button:hover { background:rgba(0,0,0,0.08); color:#1a1a2e; }
[data-theme="light"] .hover-pill-popup button.active { background:rgba(201,168,76,0.18); border-color:rgba(184,148,61,0.45); color:#1a1a2e; }
[data-theme="light"] .palette-dot-indicator { box-shadow:0 0 0 1.5px rgba(0,0,0,0.1); }
[data-theme="light"] .pdot.active { border-color:rgba(0,0,0,0.25) !important; box-shadow:inset 0 1px 2px rgba(255,255,255,0.4), 0 0 0 2px rgba(0,0,0,0.1) !important; }
[data-theme="light"] .pdot:hover:not(.active) { border-color:rgba(0,0,0,0.18) !important; }

/* ── Rotate hint overlay (mobile portrait only) ────────────────── */

#rotate-hint {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 500;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: rgba(6, 6, 16, 0.92);
  color: rgba(255, 255, 255, 0.7);
  font-family: 'Inter', sans-serif;
  font-size: 16px;
  text-align: center;
  padding: 24px;
}

#rotate-hint svg {
  opacity: 0.5;
  animation: idle-bob 3s ease-in-out infinite;
}

#rotate-hint p {
  max-width: 260px;
  line-height: 1.5;
}

#rotate-fullscreen-btn {
  margin-top: 8px;
  padding: 12px 28px;
  background: #C9A84C;
  color: #0c0d14;
  border: none;
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, transform 0.15s ease;
}

#rotate-fullscreen-btn:active {
  transform: scale(0.96);
  background: #b8963f;
}

/* Show rotate hint on mobile portrait */
@media (max-width: 768px) and (orientation: portrait) {
  #rotate-hint { display: flex; }
}

/* Hide rotate hint in landscape or fullscreen */
@media (orientation: landscape) {
  #rotate-hint { display: none !important; }
}
:fullscreen #rotate-hint,
:-webkit-full-screen #rotate-hint {
  display: none !important;
}

/* ── Mobile adjustments ────────────────────────────────────────── */

@media (max-width: 768px) {
  #frame-nav {
    gap: 8px;
    padding: 6px 12px;
  }
  #frame-nav button {
    width: 36px;
    height: 36px;
    -webkit-tap-highlight-color: transparent;
  }
  .frame-dot {
    width: 10px;
    height: 10px;
  }
  #narrator-overlay {
    bottom: 76px;
    padding: 0 16px;
  }
  #narrator-text {
    font-size: 15px;
    padding: 14px 20px;
    max-width: 100%;
  }
  .keyboard-hint { display: none; }
  #progress-bar {
    bottom: 64px;
    width: 280px;
  }
}

/* ── Fullscreen state ──────────────────────────────────────────── */

:fullscreen .keyboard-hint,
:-webkit-full-screen .keyboard-hint {
  display: none;
}

/* ── Feedback overlay ─────────────────────────────────────────── */

#feedback-overlay {
  position: fixed;
  inset: 0;
  z-index: 400;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  animation: feedbackFadeIn 0.2s ease;
}

#feedback-overlay.hidden {
  display: none;
}

@keyframes feedbackFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes feedbackSlideUp {
  from { opacity: 0; transform: translateY(20px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

#feedback-panel {
  width: 360px;
  max-width: calc(100vw - 32px);
  max-height: calc(100vh - 64px);
  overflow-y: auto;
  background: rgba(18, 20, 28, 0.85);
  backdrop-filter: blur(24px) saturate(1.2);
  -webkit-backdrop-filter: blur(24px) saturate(1.2);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-top: 3px solid #C9A84C;
  border-radius: 16px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.5);
  animation: feedbackSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

#feedback-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px 12px;
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
}

#feedback-close {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.4);
  font-size: 22px;
  cursor: pointer;
  width: auto;
  height: auto;
  border-radius: 6px;
  padding: 0 4px;
  line-height: 1;
  transition: color 0.15s ease;
}

#feedback-close:hover {
  color: rgba(255, 255, 255, 0.8);
  background: rgba(255, 255, 255, 0.06);
}

#feedback-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 20px 20px;
}

/* Type selector pills */
#feedback-types {
  display: flex;
  gap: 8px;
}

.fb-type-btn {
  flex: 1;
  padding: 7px 0;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.04);
  color: rgba(255, 255, 255, 0.5);
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  width: auto;
  height: auto;
}

.fb-type-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.7);
}

.fb-type-btn.fb-type-active {
  background: rgba(201, 168, 76, 0.15);
  border-color: rgba(201, 168, 76, 0.4);
  color: #C9A84C;
}

/* Inputs */
#feedback-email,
#feedback-desc {
  width: 100%;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.06);
  color: #e8e8f0;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

#feedback-email::placeholder,
#feedback-desc::placeholder {
  color: rgba(255, 255, 255, 0.25);
}

#feedback-email:focus,
#feedback-desc:focus {
  border-color: rgba(201, 168, 76, 0.5);
  box-shadow: 0 0 0 2px rgba(201, 168, 76, 0.15);
}

#feedback-desc {
  resize: vertical;
  min-height: 72px;
}

/* Image upload area */
#feedback-image-area {
  position: relative;
}

#feedback-image-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  border: 1px dashed rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.4);
  font-family: 'Inter', sans-serif;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
}

#feedback-image-label:hover {
  border-color: rgba(255, 255, 255, 0.25);
  color: rgba(255, 255, 255, 0.6);
  background: rgba(255, 255, 255, 0.03);
}

#feedback-image-label.hidden {
  display: none;
}

#feedback-image-preview {
  position: relative;
  display: inline-block;
}

#feedback-image-preview.hidden {
  display: none;
}

#feedback-image-thumb {
  max-width: 100%;
  max-height: 120px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

#feedback-image-remove {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 22px !important;
  height: 22px !important;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.9);
  border: none;
  color: white;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

#feedback-image-remove:hover {
  background: rgba(239, 68, 68, 1);
}

/* Submit button */
#feedback-submit {
  padding: 10px 0;
  border-radius: 10px;
  border: none;
  background: #C9A84C;
  color: #0c0d14;
  font-family: 'Inter', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
  width: 100%;
  height: auto;
}

#feedback-submit:hover {
  background: #dfc06a;
}

#feedback-submit:active {
  transform: scale(0.98);
}

#feedback-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Success state */
#feedback-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 32px 20px;
  text-align: center;
}

#feedback-success.hidden {
  display: none;
}

#feedback-success-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(201, 168, 76, 0.15);
  color: #C9A84C;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

#feedback-success p {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  color: rgba(255, 255, 255, 0.6);
}

/* Feedback button — fixed bottom-right, subtle and unobtrusive */
#feedback-btn {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.25);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 90;
  transition: opacity 0.3s ease, background 0.2s ease, color 0.2s ease, transform 0.2s ease;
  opacity: 0.5;
  padding: 0;
}
#feedback-btn:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.7);
  transform: scale(1.08);
}
[data-theme="light"] #feedback-btn {
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.06);
  color: rgba(0, 0, 0, 0.2);
}
[data-theme="light"] #feedback-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  color: rgba(0, 0, 0, 0.5);
}

/* ── Feedback — Light theme ──────────────────────────────────── */

[data-theme="light"] #feedback-panel {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(24px) saturate(1.1);
  -webkit-backdrop-filter: blur(24px) saturate(1.1);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-top: 3px solid #B8943D;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.12);
}

[data-theme="light"] #feedback-header {
  color: #1a1a2e;
}

[data-theme="light"] #feedback-close {
  color: rgba(0, 0, 0, 0.3);
}

[data-theme="light"] #feedback-close:hover {
  color: rgba(0, 0, 0, 0.6);
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .fb-type-btn {
  border-color: rgba(0, 0, 0, 0.1);
  background: rgba(0, 0, 0, 0.03);
  color: rgba(0, 0, 0, 0.5);
}

[data-theme="light"] .fb-type-btn:hover {
  background: rgba(0, 0, 0, 0.06);
  color: rgba(0, 0, 0, 0.7);
}

[data-theme="light"] .fb-type-btn.fb-type-active {
  background: rgba(184, 148, 61, 0.12);
  border-color: rgba(184, 148, 61, 0.35);
  color: #8a7530;
}

[data-theme="light"] #feedback-email,
[data-theme="light"] #feedback-desc {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.1);
  color: #1a1a2e;
}

[data-theme="light"] #feedback-email::placeholder,
[data-theme="light"] #feedback-desc::placeholder {
  color: rgba(0, 0, 0, 0.3);
}

[data-theme="light"] #feedback-email:focus,
[data-theme="light"] #feedback-desc:focus {
  border-color: rgba(184, 148, 61, 0.5);
  box-shadow: 0 0 0 2px rgba(184, 148, 61, 0.12);
}

[data-theme="light"] #feedback-image-label {
  border-color: rgba(0, 0, 0, 0.12);
  color: rgba(0, 0, 0, 0.4);
}

[data-theme="light"] #feedback-image-label:hover {
  border-color: rgba(0, 0, 0, 0.2);
  color: rgba(0, 0, 0, 0.6);
  background: rgba(0, 0, 0, 0.02);
}

[data-theme="light"] #feedback-image-thumb {
  border-color: rgba(0, 0, 0, 0.1);
}

[data-theme="light"] #feedback-submit {
  background: #B8943D;
  color: #ffffff;
}

[data-theme="light"] #feedback-submit:hover {
  background: #a68535;
}

[data-theme="light"] #feedback-success-icon {
  background: rgba(184, 148, 61, 0.12);
  color: #8a7530;
}

[data-theme="light"] #feedback-success p {
  color: rgba(0, 0, 0, 0.5);
}

/* ── Universal Entity Overlays (Move 2: Enhanced Metadata) ────────── */

/* Status: healthy — subtle green ring pulse */
@keyframes statusHealthyPulse {
  0%, 100% { opacity: 0.4; }
  50%      { opacity: 0.7; }
}
.status-healthy-ring {
  animation: statusHealthyPulse 3s ease-in-out infinite;
}

/* Status: warning — amber pulsing dot */
@keyframes statusWarningPulse {
  0%, 100% { r: 4; opacity: 0.8; }
  50%      { r: 6; opacity: 1; }
}
.status-warning-dot {
  animation: statusWarningPulse 1.5s ease-in-out infinite;
}

/* Status: error — red glow ring */
@keyframes statusErrorGlow {
  0%, 100% { opacity: 0.3; stroke-width: 2; }
  50%      { opacity: 0.6; stroke-width: 3; }
}
.status-error-ring {
  animation: statusErrorGlow 1.8s ease-in-out infinite;
}

/* Status: loading — rotating dashed ring */
@keyframes statusLoadingRotate {
  from { transform: rotate(0deg); }
  to   { transform: rotate(360deg); }
}
.status-loading-ring {
  transform-box: fill-box;
  transform-origin: center center;
  animation: statusLoadingRotate 2s linear infinite;
}

/* Progress ring — smooth entrance */
.progress-ring-arc {
  transition: stroke-dashoffset 0.8s cubic-bezier(0.22, 1, 0.36, 1);
}

/* Emphasis: low — reduced presence */
[data-emphasis="low"] > .animate-element {
  transform: scale(0.85);
}

/* Emphasis: high — elevated presence */
[data-emphasis="high"] > .animate-element {
  transform: scale(1.1);
}

/* Emphasis: critical — pulsing glow ring + elevated */
@keyframes emphasisCriticalPulse {
  0%, 100% { opacity: 0.25; }
  50%      { opacity: 0.55; }
}
.emphasis-critical-ring {
  animation: emphasisCriticalPulse 2s ease-in-out infinite;
}

[data-emphasis="critical"] > .animate-element {
  transform: scale(1.15);
}
`;
