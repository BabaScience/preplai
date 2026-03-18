import { useEffect, useRef } from 'react';
import { registry, renderEntity, setActivePalette } from '@preplai/illustrations';
import { applyDefaults } from '@preplai/player';
import { isConnectionType } from '@preplai/shared';

const CW = 1920;
const CH = 1080;

// Set sunset palette globally for all illustration renders
setActivePalette('sunset');

// Sunset particle colors (from shared/palettes.ts sunset.particles)
const SUNSET_PARTICLES = ['#F39C12', '#E74C3C', '#F1C40F', '#ff6b6b', '#9B59B6'];

/** Create placeholder entities for connection types (Arrow, DataFlow, etc.) */
function createPlaceholders(connectionEntity) {
  const srcId = connectionEntity.sourceEntityId ?? 'debug-src';
  const tgtId = connectionEntity.targetEntityId ?? 'debug-tgt';
  return [
    { id: srcId, type: 'Concept', position: { x: 20, y: 50 }, label: 'A' },
    { id: tgtId, type: 'Concept', position: { x: 80, y: 50 }, label: 'B' },
  ];
}

/** Generate dot grid circles — light theme uses dark dots */
function buildDotGrid() {
  const dots = [];
  const spacing = 80;
  for (let x = spacing; x < CW; x += spacing) {
    for (let y = spacing; y < CH; y += spacing) {
      dots.push(<circle key={`${x}-${y}`} cx={x} cy={y} r="1.2" fill="rgba(0,0,0,0.5)" />);
    }
  }
  return dots;
}

/** Generate ambient particles — sunset palette colors */
function buildAmbientParticles() {
  const particles = [];
  for (let i = 0; i < 12; i++) {
    const cx = 100 + Math.random() * (CW - 200);
    const cy = 100 + Math.random() * (CH - 200);
    const r = 2 + Math.random() * 4;
    const opacity = 0.04 + Math.random() * 0.04;
    const delay = Math.random() * 6;
    particles.push(
      <circle
        key={i}
        cx={cx}
        cy={cy}
        r={r}
        fill={SUNSET_PARTICLES[i % SUNSET_PARTICLES.length]}
        opacity={opacity}
        className="ambient-particle"
        style={{ animationDelay: `${delay}s` }}
      />,
    );
  }
  return particles;
}

const DOT_GRID = buildDotGrid();
const AMBIENT_PARTICLES = buildAmbientParticles();

export default function IllustrationPreview({ entity, renderError }) {
  const svgRef = useRef(null);
  const entityLayerRef = useRef(null);
  const connectionLayerRef = useRef(null);

  useEffect(() => {
    if (!entity || !entityLayerRef.current || !connectionLayerRef.current) return;

    const entityLayer = entityLayerRef.current;
    const connectionLayer = connectionLayerRef.current;

    // Clear layers
    entityLayer.innerHTML = '';
    connectionLayer.innerHTML = '';

    const needsConnection = isConnectionType(entity.type);
    const connectionEntity = needsConnection
      ? { ...entity, sourceEntityId: entity.sourceEntityId ?? 'debug-src', targetEntityId: entity.targetEntityId ?? 'debug-tgt' }
      : entity;

    const [placeholderSrc, placeholderTgt] = needsConnection ? createPlaceholders(connectionEntity) : [null, null];

    const entities = needsConnection
      ? [
          applyDefaults(placeholderSrc),
          applyDefaults(placeholderTgt),
          applyDefaults(connectionEntity),
        ]
      : [entity];

    try {
      const connections = entities.filter((e) => isConnectionType(e.type));
      const nonConnections = entities.filter((e) => !isConnectionType(e.type));

      // Render non-connection entities first
      for (const e of nonConnections) {
        const defaulted = applyDefaults(e);
        const el = renderEntity(defaulted, entityLayer);
        if (el) entityLayer.appendChild(el);
      }

      // Render connection entities (need allEntities for position resolution)
      for (const conn of connections) {
        const defaulted = applyDefaults(conn);
        const el = renderEntity(defaulted, connectionLayer, entities);
        if (el) connectionLayer.appendChild(el);
      }

      renderError?.(null);
    } catch (err) {
      renderError?.(err.message);
    }
  }, [entity, renderError]);

  if (!entity) {
    return (
      <div
        className="dev-preview"
        style={{
          background: 'radial-gradient(ellipse at center, #faf7f2 0%, #f3ede4 70%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(0,0,0,0.3)',
          fontSize: 14,
        }}
      >
        Select an entity type to preview
      </div>
    );
  }

  return (
    <div
      className="dev-preview"
      style={{ background: 'radial-gradient(ellipse at center, #faf7f2 0%, #f3ede4 70%)' }}
    >
      <style>{`
        @keyframes ambient-float {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.04; }
          50% { transform: translateY(-20px) scale(1.3); opacity: 0.07; }
        }
        .ambient-particle {
          animation: ambient-float 8s ease-in-out infinite;
        }
      `}</style>
      <svg
        ref={svgRef}
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          {/* Light vignette — warm beige center, slightly darker edges */}
          <radialGradient id="dbg-vignette" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#faf7f2" />
            <stop offset="50%" stopColor="#f5f0e8" />
            <stop offset="100%" stopColor="#ebe4d8" />
          </radialGradient>
          {/* Subtle paper texture noise */}
          <filter id="dbg-noise" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise" />
            <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
            <feComponentTransfer in="grayNoise" result="alphaedNoise">
              <feFuncA type="linear" slope="0.03" />
            </feComponentTransfer>
            <feBlend in="SourceGraphic" in2="alphaedNoise" mode="multiply" />
          </filter>
          {/* Warm soft shadow for depth */}
          <filter id="dbg-soft-shadow" x="-10%" y="-10%" width="130%" height="130%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="#8b7355" floodOpacity="0.15" />
          </filter>
        </defs>

        {/* Layer 1: Background vignette — warm beige */}
        <rect width={CW} height={CH} fill="url(#dbg-vignette)" />

        {/* Layer 2: Dot grid — dark dots on light bg */}
        <g opacity="0.06">{DOT_GRID}</g>

        {/* Layer 3: Noise overlay — subtler on light */}
        <rect width={CW} height={CH} fill="transparent" filter="url(#dbg-noise)" opacity="0.2" />

        {/* Layer 4: Ambient particles — sunset colors */}
        <g>{AMBIENT_PARTICLES}</g>

        {/* Layer 5: Entities */}
        <g id="entity-layer" ref={entityLayerRef} />

        {/* Layer 6: Connections */}
        <g id="connection-layer" ref={connectionLayerRef} />
      </svg>
    </div>
  );
}
