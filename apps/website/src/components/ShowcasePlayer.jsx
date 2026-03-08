/**
 * ShowcasePlayer — Reusable auto-playing player embed for use-case showcases.
 *
 * Accepts a VisualScript, label, and description. Renders a smaller
 * live player that auto-advances and loops. Used below the hero.
 */
import { useRef, useEffect, useCallback } from 'react';
import { SceneController } from '@preplai/player';

const CW = 1920;
const CH = 1080;
const FRAME_INTERVAL_MS = 5000; // 5s per frame → ~15s for 3 frames

export default function ShowcasePlayer({ script, label, description }) {
  const entityLayerRef = useRef(null);
  const connectionLayerRef = useRef(null);
  const narratorRef = useRef(null);
  const controllerRef = useRef(null);
  const frameRef = useRef(0);
  const timerRef = useRef(null);

  const advanceFrame = useCallback(() => {
    const ctrl = controllerRef.current;
    if (!ctrl) return;
    const total = script.frames.length;
    frameRef.current = (frameRef.current + 1) % total;
    ctrl.seekToFrame(frameRef.current);
  }, [script]);

  useEffect(() => {
    const entityLayer = entityLayerRef.current;
    const connectionLayer = connectionLayerRef.current;
    if (!entityLayer || !connectionLayer) return;

    const ctrl = new SceneController({
      entityLayer,
      connectionLayer,
      onNarratorUpdate: (text) => {
        if (narratorRef.current) narratorRef.current.textContent = text;
      },
      onFrameChange: () => {},
    });

    controllerRef.current = ctrl;
    ctrl.loadScript(script);

    timerRef.current = setInterval(advanceFrame, FRAME_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      controllerRef.current = null;
    };
  }, [advanceFrame, script]);

  return (
    <div className="showcase-player">
      <div className="showcase-player-canvas">
        <svg
          viewBox={`0 0 ${CW} ${CH}`}
          xmlns="http://www.w3.org/2000/svg"
          className="showcase-player-svg"
        >
          <defs>
            <radialGradient id={`sc-bg-${label?.replace(/\s/g, '')}`} cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#14151f" />
              <stop offset="100%" stopColor="#08090e" />
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

          {/* Background */}
          <rect width={CW} height={CH} fill={`url(#sc-bg-${label?.replace(/\s/g, '')})`} />

          {/* Subtle dot grid */}
          <g opacity="0.4">
            {Array.from({ length: Math.floor(CW / 100) }, (_, x) =>
              Array.from({ length: Math.floor(CH / 100) }, (_, y) => (
                <circle
                  key={`d${x}-${y}`}
                  cx={x * 100 + 50}
                  cy={y * 100 + 50}
                  r="1"
                  fill="rgba(255,255,255,0.03)"
                />
              ))
            )}
          </g>

          {/* Connection layer */}
          <g ref={connectionLayerRef} />

          {/* Entity layer */}
          <g ref={entityLayerRef} />

          {/* Narrator bar */}
          <g transform={`translate(${CW / 2}, ${CH - 70})`}>
            <rect x="-380" y="-22" width="760" height="44" rx="8" fill="rgba(12,13,18,0.8)" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <rect x="-380" y="-22" width="3" height="44" rx="1.5" fill="#C9A84C" />
            <text
              ref={narratorRef}
              x="0"
              y="5"
              textAnchor="middle"
              fill="#9090a8"
              fontSize="16"
              fontFamily="Inter, sans-serif"
            />
          </g>
        </svg>
      </div>
      <div className="showcase-player-info">
        <h3 className="showcase-player-label">{label}</h3>
        <p className="showcase-player-desc">{description}</p>
      </div>
    </div>
  );
}
