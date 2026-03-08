/**
 * HeroPlayer — Live auto-playing player embed for the landing hero.
 *
 * Renders a real Preplai presentation using SceneController + illustrations.
 * Auto-advances frames, loops seamlessly. No user controls.
 */
import { useRef, useEffect, useCallback } from 'react';
import { SceneController } from '@preplai/player';

const CW = 1920;
const CH = 1080;
const FRAME_INTERVAL_MS = 5500;

// ── Demo VisualScript ───────────────────────────────────────────────

const DEMO_SCRIPT = {
  frames: [
    {
      narrationSegment: 'A user asks an AI agent: "Explain how microservices communicate."',
      entities: [
        { id: 'user1', type: 'User', position: { x: 50, y: 55 }, label: 'User', size: 2.5, highlight: true, color: '#C9A84C' },
      ],
    },
    {
      narrationSegment: 'The agent creates a visual scene with a server and database.',
      entities: [
        { id: 'user1', type: 'User', position: { x: 15, y: 75 }, label: 'User', size: 2, color: '#C9A84C' },
        { id: 'srv1', type: 'Server', position: { x: 40, y: 40 }, label: 'API Server', size: 2.5, highlight: true },
        { id: 'db1', type: 'Database', position: { x: 75, y: 40 }, label: 'Database', size: 2.5 },
        { id: 'arrow1', type: 'Arrow', position: { x: 0, y: 0 }, fromEntity: 'srv1', toEntity: 'db1', label: 'query' },
        { id: 'arrow2', type: 'Arrow', position: { x: 0, y: 0 }, fromEntity: 'user1', toEntity: 'srv1', label: 'request', style: 'dashed' },
      ],
    },
    {
      narrationSegment: 'A cache layer is added for faster reads. The architecture evolves live.',
      entities: [
        { id: 'user1', type: 'User', position: { x: 15, y: 75 }, label: 'User', size: 2, color: '#C9A84C' },
        { id: 'srv1', type: 'Server', position: { x: 40, y: 40 }, label: 'API Server', size: 2.5 },
        { id: 'db1', type: 'Database', position: { x: 75, y: 65 }, label: 'Database', size: 2.5 },
        { id: 'cache1', type: 'Cache', position: { x: 75, y: 25 }, label: 'Redis Cache', size: 2, highlight: true },
        { id: 'arrow1', type: 'Arrow', position: { x: 0, y: 0 }, fromEntity: 'srv1', toEntity: 'db1', label: 'query' },
        { id: 'arrow3', type: 'Arrow', position: { x: 0, y: 0 }, fromEntity: 'srv1', toEntity: 'cache1', label: 'cache hit?' },
        { id: 'arrow2', type: 'Arrow', position: { x: 0, y: 0 }, fromEntity: 'user1', toEntity: 'srv1', label: 'request', style: 'dashed' },
      ],
    },
    {
      narrationSegment: 'A load balancer distributes traffic across multiple services.',
      entities: [
        { id: 'user1', type: 'User', position: { x: 10, y: 50 }, label: 'User', size: 2, color: '#C9A84C' },
        { id: 'lb1', type: 'LoadBalancer', position: { x: 30, y: 50 }, label: 'Load Balancer', size: 2, highlight: true },
        { id: 'srv1', type: 'Server', position: { x: 55, y: 30 }, label: 'Service A', size: 2 },
        { id: 'srv2', type: 'Server', position: { x: 55, y: 70 }, label: 'Service B', size: 2 },
        { id: 'db1', type: 'Database', position: { x: 80, y: 50 }, label: 'Database', size: 2.5 },
        { id: 'cache1', type: 'Cache', position: { x: 80, y: 20 }, label: 'Redis', size: 1.8 },
        { id: 'a_user_lb', type: 'Arrow', position: { x: 0, y: 0 }, fromEntity: 'user1', toEntity: 'lb1' },
        { id: 'a_lb_s1', type: 'Arrow', position: { x: 0, y: 0 }, fromEntity: 'lb1', toEntity: 'srv1' },
        { id: 'a_lb_s2', type: 'Arrow', position: { x: 0, y: 0 }, fromEntity: 'lb1', toEntity: 'srv2' },
        { id: 'a_s1_db', type: 'Arrow', position: { x: 0, y: 0 }, fromEntity: 'srv1', toEntity: 'db1', label: 'read' },
        { id: 'a_s2_db', type: 'Arrow', position: { x: 0, y: 0 }, fromEntity: 'srv2', toEntity: 'db1', label: 'write' },
        { id: 'a_s1_c', type: 'Arrow', position: { x: 0, y: 0 }, fromEntity: 'srv1', toEntity: 'cache1' },
      ],
    },
    {
      narrationSegment: 'Every step explained visually. Not slides — cinema.',
      entities: [
        { id: 'user1', type: 'User', position: { x: 10, y: 50 }, label: 'User', size: 2, color: '#C9A84C' },
        { id: 'lb1', type: 'LoadBalancer', position: { x: 30, y: 50 }, label: 'Load Balancer', size: 2 },
        { id: 'srv1', type: 'Server', position: { x: 55, y: 30 }, label: 'Service A', size: 2 },
        { id: 'srv2', type: 'Server', position: { x: 55, y: 70 }, label: 'Service B', size: 2 },
        { id: 'db1', type: 'Database', position: { x: 80, y: 50 }, label: 'Database', size: 2.5, highlight: true },
        { id: 'cache1', type: 'Cache', position: { x: 80, y: 20 }, label: 'Redis', size: 1.8 },
        { id: 'a_user_lb', type: 'Arrow', position: { x: 0, y: 0 }, fromEntity: 'user1', toEntity: 'lb1' },
        { id: 'a_lb_s1', type: 'Arrow', position: { x: 0, y: 0 }, fromEntity: 'lb1', toEntity: 'srv1' },
        { id: 'a_lb_s2', type: 'Arrow', position: { x: 0, y: 0 }, fromEntity: 'lb1', toEntity: 'srv2' },
        { id: 'a_s1_db', type: 'Arrow', position: { x: 0, y: 0 }, fromEntity: 'srv1', toEntity: 'db1', label: 'read' },
        { id: 'a_s2_db', type: 'Arrow', position: { x: 0, y: 0 }, fromEntity: 'srv2', toEntity: 'db1', label: 'write' },
        { id: 'a_s1_c', type: 'Arrow', position: { x: 0, y: 0 }, fromEntity: 'srv1', toEntity: 'cache1' },
      ],
    },
  ],
};

// ── Component ────────────────────────────────────────────────────────

export default function HeroPlayer() {
  const svgRef = useRef(null);
  const entityLayerRef = useRef(null);
  const connectionLayerRef = useRef(null);
  const narratorRef = useRef(null);
  const dotsRef = useRef(null);
  const controllerRef = useRef(null);
  const frameRef = useRef(0);
  const timerRef = useRef(null);

  const advanceFrame = useCallback(() => {
    const ctrl = controllerRef.current;
    if (!ctrl) return;
    const total = DEMO_SCRIPT.frames.length;
    frameRef.current = (frameRef.current + 1) % total;
    ctrl.seekToFrame(frameRef.current);
  }, []);

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
      onFrameChange: () => {
        // Update dots
        if (dotsRef.current) {
          const total = DEMO_SCRIPT.frames.length;
          const current = frameRef.current;
          const dots = dotsRef.current.children;
          for (let i = 0; i < dots.length; i++) {
            dots[i].setAttribute('fill', i === current ? '#C9A84C' : 'rgba(255,255,255,0.2)');
            dots[i].setAttribute('r', i === current ? '4' : '3');
          }
        }
      },
    });

    controllerRef.current = ctrl;
    ctrl.loadScript(DEMO_SCRIPT);

    // Start auto-play
    timerRef.current = setInterval(advanceFrame, FRAME_INTERVAL_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      controllerRef.current = null;
    };
  }, [advanceFrame]);

  const totalFrames = DEMO_SCRIPT.frames.length;

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
            <stop offset="0%" stopColor="#14151f" />
            <stop offset="100%" stopColor="#08090e" />
          </radialGradient>
          {/* Glass filter for entities (mirrored from player) */}
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
        <rect width={CW} height={CH} fill="url(#hero-bg-grad)" />

        {/* Dot grid */}
        <g opacity="0.5">
          {Array.from({ length: Math.floor(CW / 80) }, (_, x) =>
            Array.from({ length: Math.floor(CH / 80) }, (_, y) => (
              <circle
                key={`d${x}-${y}`}
                cx={x * 80 + 40}
                cy={y * 80 + 40}
                r="1.2"
                fill="rgba(255,255,255,0.04)"
              />
            ))
          )}
        </g>

        {/* Connection layer (behind entities) */}
        <g ref={connectionLayerRef} id="hero-connection-layer" />

        {/* Entity layer */}
        <g ref={entityLayerRef} id="hero-entity-layer" />

        {/* Narrator bar */}
        <g transform={`translate(${CW / 2}, ${CH - 80})`}>
          <rect x="-340" y="-24" width="680" height="48" rx="10" fill="rgba(12,13,18,0.75)" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <rect x="-340" y="-24" width="3" height="48" rx="1.5" fill="#C9A84C" />
          <text
            ref={narratorRef}
            x="0"
            y="5"
            textAnchor="middle"
            fill="#b0b0c8"
            fontSize="17"
            fontFamily="Inter, sans-serif"
          />
        </g>

        {/* Frame dots */}
        <g ref={dotsRef} transform={`translate(${CW / 2 - (totalFrames - 1) * 10}, ${CH - 28})`}>
          {Array.from({ length: totalFrames }, (_, i) => (
            <circle
              key={i}
              cx={i * 20}
              cy="0"
              r={i === 0 ? 4 : 3}
              fill={i === 0 ? '#C9A84C' : 'rgba(255,255,255,0.2)'}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
