import { useEffect, useRef, useMemo } from 'react';
import { renderEntity, setActivePalette, getParticleColors } from '@preplai/illustrations';
import { applyDefaults } from '@preplai/player';
import { isConnectionType, ENTITY_DEFAULTS } from '@preplai/shared';

const DEFAULT_COLOR = ENTITY_DEFAULTS.color;

const CW = 1920;
const CH = 1080;

// Set initial palette
setActivePalette('sunset');

/* ── Theme backgrounds ─────────────────────────────────────────────── */
const THEME_BG = {
  light: {
    outer: 'radial-gradient(ellipse at center, #faf7f2 0%, #f3ede4 70%)',
    vignette: [
      { offset: '0%', color: '#faf7f2' },
      { offset: '50%', color: '#f5f0e8' },
      { offset: '100%', color: '#ebe4d8' },
    ],
    dotColor: 'rgba(0,0,0,0.5)',
    dotOpacity: 0.06,
    noiseOpacity: 0.2,
    emptyText: 'rgba(0,0,0,0.3)',
  },
  cinema: {
    outer: 'radial-gradient(ellipse at center, #12131c 0%, #0c0d14 50%, #050509 100%)',
    vignette: [
      { offset: '0%', color: '#12131c' },
      { offset: '50%', color: '#0c0d14' },
      { offset: '100%', color: '#050509' },
    ],
    dotColor: 'rgba(255,255,255,0.15)',
    dotOpacity: 0.04,
    noiseOpacity: 0.4,
    emptyText: 'rgba(255,255,255,0.3)',
  },
};

function buildDotGrid(theme) {
  const dots = [];
  const spacing = 80;
  const color = THEME_BG[theme]?.dotColor ?? THEME_BG.light.dotColor;
  for (let x = spacing; x < CW; x += spacing) {
    for (let y = spacing; y < CH; y += spacing) {
      dots.push(<circle key={`${x}-${y}`} cx={x} cy={y} r="1.2" fill={color} />);
    }
  }
  return dots;
}

function buildAmbientParticles(particleColors) {
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
        fill={particleColors[i % particleColors.length]}
        opacity={opacity}
        className="ambient-particle"
        style={{ animationDelay: `${delay}s` }}
      />,
    );
  }
  return particles;
}

/** Create placeholder entities for connection types (Arrow, DataFlow, etc.) */
function createPlaceholders(connectionEntity) {
  const srcId = connectionEntity.sourceEntityId ?? 'debug-src';
  const tgtId = connectionEntity.targetEntityId ?? 'debug-tgt';
  return [
    { id: srcId, type: 'Concept', position: { x: 20, y: 50 }, label: 'A' },
    { id: tgtId, type: 'Concept', position: { x: 80, y: 50 }, label: 'B' },
  ];
}

export default function IllustrationPreview({ entity, renderError, theme = 'light', palette = 'sunset' }) {
  const svgRef = useRef(null);
  const entityLayerRef = useRef(null);
  const connectionLayerRef = useRef(null);

  const themeConfig = THEME_BG[theme] ?? THEME_BG.light;

  const dotGrid = useMemo(() => buildDotGrid(theme), [theme]);
  const particleColors = useMemo(() => {
    try { return getParticleColors(); } catch { return ['#F39C12', '#E74C3C', '#F1C40F', '#ff6b6b', '#9B59B6']; }
  }, [palette]);
  const ambientParticles = useMemo(() => buildAmbientParticles(particleColors), [particleColors]);

  useEffect(() => {
    setActivePalette(palette);
  }, [palette]);

  useEffect(() => {
    if (!entity || !entityLayerRef.current || !connectionLayerRef.current) return;

    const entityLayer = entityLayerRef.current;
    const connectionLayer = connectionLayerRef.current;

    entityLayer.innerHTML = '';
    connectionLayer.innerHTML = '';

    // Set palette before render
    setActivePalette(palette);

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

      for (const e of nonConnections) {
        const defaulted = applyDefaults(e);
        // Strip default color so palette controls entity colors
        if (!e.color || e.color === DEFAULT_COLOR) delete defaulted.color;
        const el = renderEntity(defaulted, entityLayer);
        if (el) entityLayer.appendChild(el);
      }

      for (const conn of connections) {
        const defaulted = applyDefaults(conn);
        if (!conn.color || conn.color === DEFAULT_COLOR) delete defaulted.color;
        const el = renderEntity(defaulted, connectionLayer, entities);
        if (el) connectionLayer.appendChild(el);
      }

      renderError?.(null);
    } catch (err) {
      renderError?.(err.message);
    }
  }, [entity, renderError, palette]);

  if (!entity) {
    return (
      <div
        className="dev-preview"
        style={{
          background: themeConfig.outer,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: themeConfig.emptyText,
          fontSize: 14,
        }}
      >
        Select an entity type to preview
      </div>
    );
  }

  const vignetteId = `dbg-vignette-${theme}`;
  const noiseId = `dbg-noise-${theme}`;

  return (
    <div
      className="dev-preview"
      style={{ background: themeConfig.outer }}
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
          <radialGradient id={vignetteId} cx="50%" cy="50%" r="70%">
            {themeConfig.vignette.map((s, i) => (
              <stop key={i} offset={s.offset} stopColor={s.color} />
            ))}
          </radialGradient>
          <filter id={noiseId} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise" />
            <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
            <feComponentTransfer in="grayNoise" result="alphaedNoise">
              <feFuncA type="linear" slope="0.03" />
            </feComponentTransfer>
            <feBlend in="SourceGraphic" in2="alphaedNoise" mode="multiply" />
          </filter>
        </defs>

        <rect width={CW} height={CH} fill={`url(#${vignetteId})`} />
        <g opacity={themeConfig.dotOpacity}>{dotGrid}</g>
        <rect width={CW} height={CH} fill="transparent" filter={`url(#${noiseId})`} opacity={themeConfig.noiseOpacity} />
        <g>{ambientParticles}</g>

        <g id="entity-layer" ref={entityLayerRef} />
        <g id="connection-layer" ref={connectionLayerRef} />
      </svg>
    </div>
  );
}
