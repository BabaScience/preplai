/**
 * HeroPlayer — Live auto-playing player embed for the landing hero.
 *
 * Renders a real Preplai presentation using SceneController + illustrations.
 * Auto-advances frames, loops seamlessly. Optional ElevenLabs audio narration.
 *
 * When audio is enabled, frame advancement is driven by audio completion
 * (onAudioEnd) so narration never gets cut off. When disabled, uses fixed timer.
 */
import { useRef, useEffect, useCallback } from 'react';
import { SceneController } from '@preplai/player';
import { setActivePalette, setActiveTheme } from '@preplai/illustrations';
import { Volume2, VolumeX } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import useShowcaseAudio from '../hooks/useShowcaseAudio';

const CW = 1920;
const CH = 1080;
const FRAME_INTERVAL_MS = 5500;
const AUDIO_GAP_MS = 800; // Breathing room between audio-driven frames

// ── Demo VisualScript ───────────────────────────────────────────────

const DEMO_SCRIPT = {
  frames: [
    {
      // Frame 1: Center cluster — camera zooms into center
      narrationSegment: 'Every great outcome starts with an idea. You ask your AI to turn it into something people can see.',
      entities: [
        { id: 'user1', type: 'User', position: { x: 30, y: 42 }, label: 'You', size: 2.5 },
        { id: 'idea', type: 'Concept', position: { x: 50, y: 42 }, label: 'The Idea', size: 3, highlight: true },
        { id: 'nn1', type: 'NeuralNetwork', position: { x: 70, y: 42 }, label: 'Your AI', size: 2.5 },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'user1', targetEntityId: 'idea', label: 'imagine' },
        { id: 'a2', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'idea', targetEntityId: 'nn1', label: 'explain' },
      ],
    },
    {
      // Frame 2: Right cluster — camera pans right
      narrationSegment: 'Your AI researches, analyzes, and structures the information — building a clear narrative from complex data.',
      entities: [
        { id: 'nn1', type: 'NeuralNetwork', position: { x: 35, y: 42 }, label: 'Your AI', size: 2 },
        { id: 'pipe1', type: 'Pipeline', position: { x: 55, y: 35 }, label: 'Build the Story', size: 3, highlight: true, metadata: { stages: ['Research', 'Analyze', 'Structure', 'Narrate'] } },
        { id: 'db1', type: 'Database', position: { x: 72, y: 28 }, label: 'Your Data', size: 2 },
        { id: 'db2', type: 'Database', position: { x: 72, y: 55 }, label: 'Context', size: 2 },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'nn1', targetEntityId: 'pipe1', label: 'execute' },
        { id: 'a2', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'pipe1', targetEntityId: 'db1', label: 'gather' },
        { id: 'a3', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'pipe1', targetEntityId: 'db2', label: 'enrich' },
      ],
    },
    {
      // Frame 3: Bottom-center cluster — camera pans down
      narrationSegment: 'Preplai transforms AI output into animated visuals — charts, diagrams, flows, and metrics — narrated frame by frame.',
      entities: [
        { id: 'pipe1', type: 'Pipeline', position: { x: 45, y: 22 }, label: 'Preplai Engine', size: 2.5, highlight: true, metadata: { stages: ['Parse', 'Illustrate', 'Animate', 'Narrate'] } },
        { id: 'pie1', type: 'PieChart', position: { x: 30, y: 50 }, label: 'Market Share', size: 2, metadata: { slices: [{ label: 'A', value: 40 }, { label: 'B', value: 35 }, { label: 'C', value: 25 }] } },
        { id: 'bar1', type: 'BarChart', position: { x: 52, y: 50 }, label: 'Performance', size: 2.2, metadata: { bars: [{ label: 'Q1', value: 60 }, { label: 'Q2', value: 85 }, { label: 'Q3', value: 110 }, { label: 'Q4', value: 140 }] } },
        { id: 'metric1', type: 'Metric', position: { x: 70, y: 40 }, label: 'Impact', size: 2, metadata: { value: '+47%', trend: 'up' } },
        { id: 'timeline1', type: 'Timeline', position: { x: 70, y: 60 }, label: 'Milestones', size: 1.8, metadata: { events: ['Phase 1', 'Phase 2', 'Launch'] } },
      ],
    },
    {
      // Frame 4: Left-center cluster — camera pans left
      narrationSegment: 'The result: a cinematic walkthrough anyone can watch — your team, your client, your board. No slides, no jargon.',
      entities: [
        { id: 'user1', type: 'User', position: { x: 28, y: 30 }, label: 'Your Team', size: 2 },
        { id: 'user2', type: 'User', position: { x: 28, y: 48 }, label: 'Your Client', size: 2 },
        { id: 'user3', type: 'User', position: { x: 28, y: 66 }, label: 'Your Board', size: 2 },
        { id: 'monitor1', type: 'Monitor', position: { x: 52, y: 45 }, label: 'Preplai Player', size: 3.5, highlight: true },
        { id: 'metric1', type: 'Metric', position: { x: 70, y: 35 }, label: 'Retention', size: 2, metadata: { value: '95%', trend: 'up' } },
        { id: 'metric2', type: 'Metric', position: { x: 70, y: 58 }, label: 'Time Saved', size: 2, metadata: { value: '10x', trend: 'up' } },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'user1', targetEntityId: 'monitor1', label: 'watch' },
        { id: 'a2', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'user2', targetEntityId: 'monitor1', label: 'watch' },
        { id: 'a3', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'user3', targetEntityId: 'monitor1', label: 'watch' },
      ],
    },
    {
      // Frame 5: Center horizontal — camera centers for finale
      narrationSegment: 'From idea to impact — in 2 minutes. Don\'t read it. Just watch it.',
      entities: [
        { id: 'idea', type: 'Concept', position: { x: 28, y: 40 }, label: 'Idea', size: 2 },
        { id: 'pipe1', type: 'Pipeline', position: { x: 50, y: 32 }, label: 'From Idea to Impact', size: 3, highlight: true, metadata: { stages: ['Idea', 'AI Research', 'Visual Story', 'Share'] } },
        { id: 'monitor1', type: 'Monitor', position: { x: 72, y: 40 }, label: 'Watch It', size: 2.5 },
        { id: 'a1', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'idea', targetEntityId: 'pipe1' },
        { id: 'a2', type: 'Arrow', position: { x: 0, y: 0 }, sourceEntityId: 'pipe1', targetEntityId: 'monitor1' },
        { id: 'callout1', type: 'Callout', position: { x: 50, y: 62 }, label: 'Works with Claude, ChatGPT, Cursor, and any MCP-compatible AI', size: 1.5 },
      ],
    },
  ],
};

// ── Theme palettes ──────────────────────────────────────────────────
const THEME = {
  dark: {
    bgGrad: ['#14151f', '#08090e'],
    dotFill: 'rgba(255,255,255,0.04)',
    dotActive: '#C9A84C',
    dotInactive: 'rgba(255,255,255,0.2)',
  },
  light: {
    bgGrad: ['#f5f0e8', '#ebe5d8'],
    dotFill: 'rgba(0,0,0,0.04)',
    dotActive: '#B8943D',
    dotInactive: 'rgba(0,0,0,0.15)',
  },
};

export default function HeroPlayer() {
  const { currentTheme, palette } = useTheme();
  const controllerRef = useRef(null);
  const frameRef = useRef(0);
  const timerRef = useRef(null);
  const focusTimerRef = useRef(null);
  const audioGapTimerRef = useRef(null);

  const svgRef = useRef(null);
  const entityLayerRef = useRef(null);
  const connectionLayerRef = useRef(null);
  const narratorRef = useRef(null);
  const dotsRef = useRef(null);

  // ── Frame advancement (shared between timer and audio modes) ──────

  const goToFrame = useCallback((idx) => {
    const ctrl = controllerRef.current;
    if (!ctrl) return;
    frameRef.current = idx;
    ctrl.seekToFrame(idx);
  }, []);

  const advanceFrame = useCallback(() => {
    const total = DEMO_SCRIPT.frames.length;
    const next = (frameRef.current + 1) % total;
    goToFrame(next);
    return next;
  }, [goToFrame]);

  // Apply fallback focus for when audio is off
  const applyFallbackFocus = useCallback(() => {
    const ctrl = controllerRef.current;
    if (!ctrl || !ctrl.shiftFocus) return;
    const frame = DEMO_SCRIPT.frames[frameRef.current];
    if (!frame) return;
    const ids = frame.entities.filter((e) => e.highlight).map((e) => e.id);
    if (ids.length > 0) ctrl.shiftFocus(ids, ids.map(() => 1));
  }, []);

  // ── Fixed-interval timer management ───────────────────────────────

  const startFixedTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      advanceFrame();
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
      focusTimerRef.current = setTimeout(applyFallbackFocus, 800);
    }, FRAME_INTERVAL_MS);
  }, [advanceFrame, applyFallbackFocus]);

  const stopFixedTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ── Audio hook with onAudioEnd driving frame advancement ──────────

  const playFrameRef = useRef(null);
  const audio = useShowcaseAudio({
    onFocusCue: (cue) => {
      const ctrl = controllerRef.current;
      if (!ctrl || !ctrl.shiftFocus) return;
      const ids = cue.entityIds?.length ? cue.entityIds : cue.entityId ? [cue.entityId] : null;
      ctrl.shiftFocus(ids, cue.confidences);
    },
    onAudioEnd: () => {
      // Wait a beat, then advance to next frame and play its audio
      if (audioGapTimerRef.current) clearTimeout(audioGapTimerRef.current);
      audioGapTimerRef.current = setTimeout(() => {
        const next = advanceFrame();
        playFrameRef.current?.('hero', next);
      }, AUDIO_GAP_MS);
    },
    onAudioError: () => {
      // Browser blocked autoplay — fall back to timer-driven frames
      startFixedTimer();
    },
  });
  playFrameRef.current = audio.playFrame;

  // When audio is toggled, switch between timer and audio-driven modes
  const handleToggle = useCallback(() => {
    if (audio.enabledRef.current) {
      // Switching OFF: disable audio, clear gap timer, restart fixed timer
      audio.disable();
      if (audioGapTimerRef.current) {
        clearTimeout(audioGapTimerRef.current);
        audioGapTimerRef.current = null;
      }
      startFixedTimer();
    } else {
      // Switching ON: enable audio, stop fixed timer, play current frame
      audio.enable();
      stopFixedTimer();
      // audio.enable() is synchronous, so playFrame will work immediately
      audio.playFrame('hero', frameRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startFixedTimer, stopFixedTimer]);

  // ── SceneController setup ─────────────────────────────────────────

  useEffect(() => {
    const entityLayer = entityLayerRef.current;
    const connectionLayer = connectionLayerRef.current;
    if (!entityLayer || !connectionLayer) return;

    // Apply palette and theme for illustrations
    if (palette) setActivePalette(palette);
    setActiveTheme(currentTheme === 'light' ? 'light' : 'cinema');

    const ctrl = new SceneController({
      entityLayer,
      connectionLayer,
      onNarratorUpdate: (text) => {
        if (narratorRef.current) narratorRef.current.textContent = text;
      },
      onFrameChange: () => {
        if (dotsRef.current) {
          const total = DEMO_SCRIPT.frames.length;
          const current = frameRef.current;
          const dots = dotsRef.current.children;
          const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
          const t = isDark ? THEME.dark : THEME.light;
          for (let i = 0; i < dots.length; i++) {
            dots[i].setAttribute('fill', i === current ? t.dotActive : t.dotInactive);
            dots[i].setAttribute('r', i === current ? '4' : '3');
          }
        }
      },
    });

    controllerRef.current = ctrl;
    ctrl.loadScript(DEMO_SCRIPT);

    // Apply focus on first frame
    focusTimerRef.current = setTimeout(applyFallbackFocus, 800);

    // Start with fixed timer (audio is off by default)
    startFixedTimer();

    return () => {
      stopFixedTimer();
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
      if (audioGapTimerRef.current) clearTimeout(audioGapTimerRef.current);
      controllerRef.current = null;
    };
  }, [applyFallbackFocus, startFixedTimer, stopFixedTimer]);

  // Re-render current frame when palette or theme changes
  useEffect(() => {
    const ctrl = controllerRef.current;
    if (!ctrl) return;
    if (palette) setActivePalette(palette);
    setActiveTheme(currentTheme === 'light' ? 'light' : 'cinema');
    ctrl.seekToFrame(frameRef.current);
  }, [palette, currentTheme]);

  const totalFrames = DEMO_SCRIPT.frames.length;
  const t = THEME[currentTheme] || THEME.dark;

  return (
    <div className="hero-player-live">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CW} ${CH}`}
        xmlns="http://www.w3.org/2000/svg"
        className="hero-player-svg"
      >
        <defs>
          <radialGradient id="hero-bg-grad" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor={t.bgGrad[0]} />
            <stop offset="100%" stopColor={t.bgGrad[1]} />
          </radialGradient>
          <filter id="glass-inner-light" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
            <feOffset in="blur" dx="0" dy="2" result="offsetBlur" />
            <feComposite in="offsetBlur" in2="SourceAlpha" operator="in" result="clipped" />
            <feFlood floodColor="white" floodOpacity="0.08" result="whiteFlood" />
            <feComposite in="whiteFlood" in2="clipped" operator="in" result="innerGlow" />
            <feOffset in="SourceAlpha" dx="0" dy="-1" result="topOffset" />
            <feGaussianBlur in="topOffset" stdDeviation="1" result="topBlur" />
            <feFlood floodColor="white" floodOpacity="0.12" result="topFlood" />
            <feComposite in="topFlood" in2="topBlur" operator="in" result="topHighlight" />
            <feMerge>
              <feMergeNode in="SourceGraphic" />
              <feMergeNode in="innerGlow" />
              <feMergeNode in="topHighlight" />
            </feMerge>
          </filter>
        </defs>

        <rect width={CW} height={CH} fill="url(#hero-bg-grad)" />

        <g opacity="0.5">
          {Array.from({ length: Math.floor(CW / 80) }, (_, x) =>
            Array.from({ length: Math.floor(CH / 80) }, (_, y) => (
              <circle key={`d${x}-${y}`} cx={x * 80 + 40} cy={y * 80 + 40} r="1.2" fill={t.dotFill} />
            ))
          )}
        </g>

        <g ref={connectionLayerRef} id="hero-connection-layer" />
        <g ref={entityLayerRef} id="hero-entity-layer" />

        <g ref={dotsRef} transform={`translate(${CW / 2 - (totalFrames - 1) * 10}, ${CH - 28})`}>
          {Array.from({ length: totalFrames }, (_, i) => (
            <circle key={i} cx={i * 20} cy="0" r={i === 0 ? 4 : 3} fill={i === 0 ? t.dotActive : t.dotInactive} />
          ))}
        </g>
      </svg>

      <div className="hero-player-narrator" ref={narratorRef} />

      <button
        className={`player-audio-toggle ${audio.enabled ? 'audio-on' : ''}`}
        onClick={handleToggle}
        aria-label={audio.enabled ? 'Mute narration' : 'Enable audio narration'}
      >
        {audio.enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
      </button>
    </div>
  );
}
