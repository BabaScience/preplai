/**
 * ShowcaseCarousel — Full-width carousel for use-case showcases.
 *
 * Shows one use case at a time with dot indicators, arrow navigation,
 * and auto-advance. Pauses on hover.
 */
import { useRef, useEffect, useCallback, useState } from 'react';
import { SceneController } from '@preplai/player';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const CW = 1920;
const CH = 1080;
const FRAME_INTERVAL_MS = 5000; // 5s per frame
const FRAMES_PER_SCRIPT = 5;
const AUTO_ADVANCE_MS = FRAME_INTERVAL_MS * FRAMES_PER_SCRIPT; // 25s per use case

const SC_THEME = {
  dark: { bgGrad: ['#14151f', '#08090e'], dotFill: 'rgba(255,255,255,0.03)' },
  light: { bgGrad: ['#f5f0e8', '#ebe5d8'], dotFill: 'rgba(0,0,0,0.03)' },
};

export default function ShowcaseCarousel({ items }) {
  const { currentTheme } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const entityLayerRef = useRef(null);
  const connectionLayerRef = useRef(null);
  const narratorRef = useRef(null);
  const controllerRef = useRef(null);
  const frameRef = useRef(0);
  const frameTimerRef = useRef(null);
  const slideTimerRef = useRef(null);
  const activeIndexRef = useRef(0);

  // Keep ref in sync with state for timers
  activeIndexRef.current = activeIndex;

  const currentItem = items[activeIndex];

  // Initialize or update SceneController when active script changes
  useEffect(() => {
    const entityLayer = entityLayerRef.current;
    const connectionLayer = connectionLayerRef.current;
    if (!entityLayer || !connectionLayer) return;

    // Clear previous controller
    if (controllerRef.current) {
      controllerRef.current = null;
    }

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

    // Frame auto-advance within the current script
    if (frameTimerRef.current) clearInterval(frameTimerRef.current);
    frameTimerRef.current = setInterval(() => {
      const c = controllerRef.current;
      if (!c) return;
      const total = currentItem.script.frames.length;
      frameRef.current = (frameRef.current + 1) % total;
      c.seekToFrame(frameRef.current);
    }, FRAME_INTERVAL_MS);

    return () => {
      if (frameTimerRef.current) clearInterval(frameTimerRef.current);
      controllerRef.current = null;
    };
  }, [activeIndex, currentItem.script]);

  // Auto-advance slides (pauses on hover)
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
    // Reset slide timer on manual nav
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
      {/* Player canvas */}
      <div className="showcase-carousel-player">
        <svg
          viewBox={`0 0 ${CW} ${CH}`}
          xmlns="http://www.w3.org/2000/svg"
          className="showcase-carousel-svg"
        >
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

          {/* Background */}
          <rect width={CW} height={CH} fill="url(#sc-carousel-bg)" />

          {/* Subtle dot grid */}
          <g opacity="0.4">
            {Array.from({ length: Math.floor(CW / 100) }, (_, x) =>
              Array.from({ length: Math.floor(CH / 100) }, (_, y) => (
                <circle
                  key={`d${x}-${y}`}
                  cx={x * 100 + 50}
                  cy={y * 100 + 50}
                  r="1"
                  fill={(SC_THEME[currentTheme] || SC_THEME.dark).dotFill}
                />
              ))
            )}
          </g>

          {/* Connection layer */}
          <g ref={connectionLayerRef} />

          {/* Entity layer */}
          <g ref={entityLayerRef} />

        </svg>

        {/* Narrator bar — HTML overlay for proper text wrapping */}
        <div className="showcase-carousel-narrator" ref={narratorRef} />

        {/* Arrow buttons */}
        <button className="showcase-carousel-arrow showcase-carousel-arrow-left" onClick={goPrev} aria-label="Previous use case">
          <ChevronLeft size={20} />
        </button>
        <button className="showcase-carousel-arrow showcase-carousel-arrow-right" onClick={goNext} aria-label="Next use case">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Info + navigation */}
      <div className="showcase-carousel-footer">
        <div className="showcase-carousel-info">
          <h3 className="showcase-carousel-label">{currentItem.label}</h3>
          <p className="showcase-carousel-desc">{currentItem.description}</p>
        </div>

        {/* Dot indicators */}
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
