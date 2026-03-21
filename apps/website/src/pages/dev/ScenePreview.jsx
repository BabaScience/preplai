import { useEffect, useRef } from 'react';
import { renderEntity, setActivePalette } from '@preplai/illustrations';
import { applyDefaults } from '@preplai/player';
import { isConnectionType } from '@preplai/shared';

const CW = 1920;
const CH = 1080;

setActivePalette('sunset');

const SUNSET_PARTICLES = ['#F39C12', '#E74C3C', '#F1C40F', '#ff6b6b', '#9B59B6'];

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

/**
 * ScenePreview — renders multiple entities on a single 1920×1080 canvas.
 * Highlights the selected entity with a selection ring.
 */
export default function ScenePreview({ entities, selectedId, onSelectEntity }) {
  const entityLayerRef = useRef(null);
  const connectionLayerRef = useRef(null);

  useEffect(() => {
    const entityLayer = entityLayerRef.current;
    const connectionLayer = connectionLayerRef.current;
    if (!entityLayer || !connectionLayer) return;

    entityLayer.innerHTML = '';
    connectionLayer.innerHTML = '';

    if (!entities || entities.length === 0) return;

    const allDefaulted = entities.map((e) => applyDefaults(e));
    const connections = allDefaulted.filter((e) => isConnectionType(e.type));
    const nonConnections = allDefaulted.filter((e) => !isConnectionType(e.type));

    try {
      for (const e of nonConnections) {
        const el = renderEntity(e, entityLayer, allDefaulted);
        if (el) {
          el.style.cursor = 'pointer';
          el.addEventListener('click', () => onSelectEntity?.(e.id));
          entityLayer.appendChild(el);
        }
      }
      for (const conn of connections) {
        const el = renderEntity(conn, connectionLayer, allDefaulted);
        if (el) {
          el.style.cursor = 'pointer';
          el.addEventListener('click', () => onSelectEntity?.(conn.id));
          connectionLayer.appendChild(el);
        }
      }
    } catch (err) {
      console.error('[ScenePreview]', err);
    }
  }, [entities, onSelectEntity]);

  // Selection ring overlay
  const selectedEntity = entities?.find((e) => e.id === selectedId);
  const selRing = selectedEntity && !isConnectionType(selectedEntity.type) ? (
    <circle
      cx={(selectedEntity.position?.x ?? 50) * CW / 100}
      cy={(selectedEntity.position?.y ?? 50) * CH / 100}
      r={40}
      fill="none"
      stroke="#F39C12"
      strokeWidth="2"
      strokeDasharray="6 4"
      opacity="0.7"
    >
      <animateTransform
        attributeName="transform"
        type="rotate"
        from={`0 ${(selectedEntity.position?.x ?? 50) * CW / 100} ${(selectedEntity.position?.y ?? 50) * CH / 100}`}
        to={`360 ${(selectedEntity.position?.x ?? 50) * CW / 100} ${(selectedEntity.position?.y ?? 50) * CH / 100}`}
        dur="8s"
        repeatCount="indefinite"
      />
    </circle>
  ) : null;

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
        viewBox="0 0 1920 1080"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <defs>
          <radialGradient id="scene-vignette" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#faf7f2" />
            <stop offset="50%" stopColor="#f5f0e8" />
            <stop offset="100%" stopColor="#ebe4d8" />
          </radialGradient>
          <filter id="scene-noise" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise" />
            <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
            <feComponentTransfer in="grayNoise" result="alphaedNoise">
              <feFuncA type="linear" slope="0.03" />
            </feComponentTransfer>
            <feBlend in="SourceGraphic" in2="alphaedNoise" mode="multiply" />
          </filter>
        </defs>

        <rect width={CW} height={CH} fill="url(#scene-vignette)" />
        <g opacity="0.06">{DOT_GRID}</g>
        <rect width={CW} height={CH} fill="transparent" filter="url(#scene-noise)" opacity="0.2" />
        <g>{AMBIENT_PARTICLES}</g>

        <g id="scene-entity-layer" ref={entityLayerRef} />
        <g id="scene-connection-layer" ref={connectionLayerRef} />

        {/* Selection indicator */}
        {selRing}

        {/* Empty state */}
        {(!entities || entities.length === 0) && (
          <text
            x={CW / 2}
            y={CH / 2}
            textAnchor="middle"
            fill="rgba(0,0,0,0.2)"
            fontSize="24"
            fontFamily="Inter, sans-serif"
          >
            Add entities to build your scene
          </text>
        )}
      </svg>
    </div>
  );
}
