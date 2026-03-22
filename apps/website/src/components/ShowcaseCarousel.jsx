/**
 * ShowcaseCarousel — Full-width carousel for use-case showcases.
 *
 * Shows one use case at a time with dot indicators, arrow navigation,
 * and auto-advance. Pauses on hover. Optional ElevenLabs audio narration.
 *
 * When audio is enabled, frame advancement is driven by audio completion
 * (onAudioEnd) so narration never gets cut off. When disabled, uses fixed timer.
 */
import { useRef, useEffect, useCallback, useState } from 'react';
import { SceneController } from '@preplai/player';
import { setActivePalette, setActiveTheme } from '@preplai/illustrations';
import { ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import useShowcaseAudio from '../hooks/useShowcaseAudio';

const CW = 1920;
const CH = 1080;
const FRAME_INTERVAL_MS = 5000;
const FRAMES_PER_SCRIPT = 5;
const AUTO_ADVANCE_MS = FRAME_INTERVAL_MS * FRAMES_PER_SCRIPT;
const AUDIO_GAP_MS = 800;

const SCRIPT_AUDIO_KEYS = ['engineer', 'pm', 'consultant', 'finance'];

const SC_THEME = {
  dark: { bgGrad: ['#14151f', '#08090e'], dotFill: 'rgba(255,255,255,0.03)' },
  light: { bgGrad: ['#f5f0e8', '#ebe5d8'], dotFill: 'rgba(0,0,0,0.03)' },
};

export default function ShowcaseCarousel({ items }) {
  const { currentTheme, palette } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const controllerRef = useRef(null);
  const frameRef = useRef(0);
  const frameTimerRef = useRef(null);
  const slideTimerRef = useRef(null);
  const focusTimerRef = useRef(null);
  const audioGapTimerRef = useRef(null);
  const activeIndexRef = useRef(0);
  activeIndexRef.current = activeIndex;

  const entityLayerRef = useRef(null);
  const connectionLayerRef = useRef(null);
  const narratorRef = useRef(null);

  const currentItem = items[activeIndex];
  const audioKey = SCRIPT_AUDIO_KEYS[activeIndex] || SCRIPT_AUDIO_KEYS[0];
  const audioKeyRef = useRef(audioKey);
  audioKeyRef.current = audioKey;

  // ── Shared helpers ────────────────────────────────────────────────

  const applyFallbackFocus = useCallback(() => {
    const c = controllerRef.current;
    if (!c || !c.shiftFocus) return;
    const item = items[activeIndexRef.current];
    if (!item) return;
    const frame = item.script.frames[frameRef.current];
    if (!frame) return;
    const ids = frame.entities.filter((e) => e.highlight).map((e) => e.id);
    if (ids.length > 0) c.shiftFocus(ids, ids.map(() => 1));
  }, [items]);

  const advanceFrame = useCallback(() => {
    const c = controllerRef.current;
    if (!c) return;
    const item = items[activeIndexRef.current];
    if (!item) return;
    const total = item.script.frames.length;
    frameRef.current = (frameRef.current + 1) % total;
    c.seekToFrame(frameRef.current);
    return frameRef.current;
  }, [items]);

  // ── Audio hook ────────────────────────────────────────────────────

  const playFrameRef = useRef(null);
  const audioStopRef = useRef(null);
  const audio = useShowcaseAudio({
    onFocusCue: (cue) => {
      const ctrl = controllerRef.current;
      if (!ctrl || !ctrl.shiftFocus) return;
      const ids = cue.entityIds?.length ? cue.entityIds : cue.entityId ? [cue.entityId] : null;
      ctrl.shiftFocus(ids, cue.confidences);
    },
    onAudioEnd: () => {
      if (audioGapTimerRef.current) clearTimeout(audioGapTimerRef.current);
      audioGapTimerRef.current = setTimeout(() => {
        const next = advanceFrame();
        playFrameRef.current?.(audioKeyRef.current, next);
      }, AUDIO_GAP_MS);
    },
  });
  playFrameRef.current = audio.playFrame;
  audioStopRef.current = audio.stop;

  // ── Fixed timer management ────────────────────────────────────────

  const startFrameTimer = useCallback(() => {
    if (frameTimerRef.current) clearInterval(frameTimerRef.current);
    frameTimerRef.current = setInterval(() => {
      advanceFrame();
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
      focusTimerRef.current = setTimeout(applyFallbackFocus, 800);
    }, FRAME_INTERVAL_MS);
  }, [advanceFrame, applyFallbackFocus]);

  const stopFrameTimer = useCallback(() => {
    if (frameTimerRef.current) {
      clearInterval(frameTimerRef.current);
      frameTimerRef.current = null;
    }
  }, []);

  // ── Toggle handler ────────────────────────────────────────────────

  const handleToggle = useCallback(() => {
    if (audio.enabledRef.current) {
      // Switching OFF: disable audio, clear gap timer, restart fixed timer
      audio.disable();
      if (audioGapTimerRef.current) {
        clearTimeout(audioGapTimerRef.current);
        audioGapTimerRef.current = null;
      }
      startFrameTimer();
    } else {
      // Switching ON: enable audio, stop fixed timer, play current frame
      audio.enable();
      stopFrameTimer();
      audio.playFrame(audioKeyRef.current, frameRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startFrameTimer, stopFrameTimer]);

  // ── SceneController init per active script ────────────────────────

  useEffect(() => {
    const entityLayer = entityLayerRef.current;
    const connectionLayer = connectionLayerRef.current;
    if (!entityLayer || !connectionLayer) return;

    // Apply palette and theme
    if (palette) setActivePalette(palette);
    setActiveTheme(currentTheme === 'light' ? 'light' : 'cinema');

    // Stop audio and clear timers
    audioStopRef.current?.();
    if (audioGapTimerRef.current) clearTimeout(audioGapTimerRef.current);

    if (controllerRef.current) controllerRef.current = null;

    const ctrl = new SceneController({
      entityLayer,
      connectionLayer,
      onNarratorUpdate: (text) => {
        if (narratorRef.current) narratorRef.current.textContent = text;
      },
      onFrameChange: () => {},
    });

    controllerRef.current = ctrl;
    frameRef.current = 0;
    ctrl.loadScript(currentItem.script);

    if (audio.enabledRef.current) {
      // Audio mode: play first frame, let onAudioEnd drive advancement
      playFrameRef.current?.(audioKey, 0);
    } else {
      // Timer mode
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
      focusTimerRef.current = setTimeout(applyFallbackFocus, 800);
      startFrameTimer();
    }

    return () => {
      stopFrameTimer();
      if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
      if (audioGapTimerRef.current) clearTimeout(audioGapTimerRef.current);
      controllerRef.current = null;
    };
    // audio.enabledRef is a stable ref — safe to read inside effect without listing as dep
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, currentItem.script, audioKey, applyFallbackFocus, startFrameTimer, stopFrameTimer]);

  // Re-render current frame when palette or theme changes
  useEffect(() => {
    const ctrl = controllerRef.current;
    if (!ctrl) return;
    if (palette) setActivePalette(palette);
    setActiveTheme(currentTheme === 'light' ? 'light' : 'cinema');
    ctrl.seekToFrame(frameRef.current);
  }, [palette, currentTheme]);

  // ── Auto-advance slides (pauses on hover) ─────────────────────────

  useEffect(() => {
    if (isHovered) {
      if (slideTimerRef.current) clearInterval(slideTimerRef.current);
      return;
    }

    slideTimerRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, AUTO_ADVANCE_MS);

    return () => {
      if (slideTimerRef.current) clearInterval(slideTimerRef.current);
    };
  }, [isHovered, items.length]);

  const goTo = useCallback((index) => {
    setActiveIndex(index);
    if (slideTimerRef.current) clearInterval(slideTimerRef.current);
    if (!isHovered) {
      slideTimerRef.current = setInterval(() => {
        setActiveIndex((prev) => (prev + 1) % items.length);
      }, AUTO_ADVANCE_MS);
    }
  }, [isHovered, items.length]);

  const goPrev = useCallback(() => {
    goTo((activeIndex - 1 + items.length) % items.length);
  }, [activeIndex, items.length, goTo]);

  const goNext = useCallback(() => {
    goTo((activeIndex + 1) % items.length);
  }, [activeIndex, items.length, goTo]);

  return (
    <div
      className="showcase-carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="showcase-carousel-player">
        <svg viewBox={`0 0 ${CW} ${CH}`} xmlns="http://www.w3.org/2000/svg" className="showcase-carousel-svg">
          <defs>
            <radialGradient id="sc-carousel-bg" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor={(SC_THEME[currentTheme] || SC_THEME.dark).bgGrad[0]} />
              <stop offset="100%" stopColor={(SC_THEME[currentTheme] || SC_THEME.dark).bgGrad[1]} />
            </radialGradient>
            <filter id="glass-inner-light-carousel" x="-10%" y="-10%" width="120%" height="120%">
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

          <rect width={CW} height={CH} fill="url(#sc-carousel-bg)" />
          <g opacity="0.4">
            {Array.from({ length: Math.floor(CW / 100) }, (_, x) =>
              Array.from({ length: Math.floor(CH / 100) }, (_, y) => (
                <circle key={`d${x}-${y}`} cx={x * 100 + 50} cy={y * 100 + 50} r="1" fill={(SC_THEME[currentTheme] || SC_THEME.dark).dotFill} />
              ))
            )}
          </g>

          <g ref={connectionLayerRef} />
          <g ref={entityLayerRef} />
        </svg>

        <div className="showcase-carousel-narrator" ref={narratorRef} />

        <button
          className={`player-audio-toggle ${audio.enabled ? 'audio-on' : ''}`}
          onClick={handleToggle}
          aria-label={audio.enabled ? 'Mute narration' : 'Enable audio narration'}
        >
          {audio.enabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>

        <button className="showcase-carousel-arrow showcase-carousel-arrow-left" onClick={goPrev} aria-label="Previous use case">
          <ChevronLeft size={20} />
        </button>
        <button className="showcase-carousel-arrow showcase-carousel-arrow-right" onClick={goNext} aria-label="Next use case">
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="showcase-carousel-footer">
        <div className="showcase-carousel-info">
          <h3 className="showcase-carousel-label">{currentItem.label}</h3>
          <p className="showcase-carousel-desc">{currentItem.description}</p>
        </div>

        <div className="showcase-carousel-dots">
          {items.map((item, i) => (
            <button
              key={i}
              className={`showcase-carousel-dot ${i === activeIndex ? 'active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Show ${item.label}`}
            >
              <span className="showcase-carousel-dot-label">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
