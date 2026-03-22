import { useEffect, useRef, useMemo, useImperativeHandle, forwardRef, useCallback } from 'react';
import { renderEntity, setActivePalette, setActiveTheme, getParticleColors } from '@preplai/illustrations';
import { SceneController, applyDefaults } from '@preplai/player';
import { isConnectionType, ENTITY_DEFAULTS } from '@preplai/shared';

/** Default entity color from ENTITY_DEFAULTS — strip it so palette controls color */
const DEFAULT_COLOR = ENTITY_DEFAULTS.color;

const CW = 1920;
const CH = 1080;

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
    emptyText: 'rgba(0,0,0,0.2)',
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
    emptyText: 'rgba(255,255,255,0.2)',
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

/**
 * ScenePreview — renders multiple entities on a single 1920×1080 canvas.
 * Supports theme (cinema/light) and palette switching.
 *
 * Two modes:
 *   - Direct mode (default): clears + rebuilds all entities each render
 *   - Controller mode (useController=true): uses SceneController for cinematic
 *     frame transitions with morphing, exit/entrance animations, camera zoom
 */
const ScenePreview = forwardRef(function ScenePreview(
  { entities, selectedId, onSelectEntity, theme = 'light', palette = 'sunset', useController = false, frames = null, currentFrameIdx = 0 },
  ref,
) {
  const entityLayerRef = useRef(null);
  const connectionLayerRef = useRef(null);
  const controllerRef = useRef(null);

  const themeConfig = THEME_BG[theme] ?? THEME_BG.light;

  const dotGrid = useMemo(() => buildDotGrid(theme), [theme]);
  const particleColors = useMemo(() => {
    try { return getParticleColors(); } catch { return ['#F39C12', '#E74C3C', '#F1C40F', '#ff6b6b', '#9B59B6']; }
  }, [palette]);
  const ambientParticles = useMemo(() => buildAmbientParticles(particleColors), [particleColors]);

  useEffect(() => {
    setActivePalette(palette);
    setActiveTheme(theme);
  }, [palette, theme]);

  // ── Load GSAP + MorphSVG dynamically for controller mode ─────────
  const gsapLoadedRef = useRef(false);
  useEffect(() => {
    if (!useController || gsapLoadedRef.current) return;
    // Load GSAP and MorphSVG from CDN so SceneController can use them
    const loadScript = (src) => new Promise((resolve) => {
      if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = resolve; // non-critical
      document.head.appendChild(s);
    });
    (async () => {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js');
      await loadScript('https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/MorphSVGPlugin.min.js');
      if (window.gsap && window.MorphSVGPlugin) {
        window.gsap.registerPlugin(window.MorphSVGPlugin);
      }
      gsapLoadedRef.current = true;
    })();
  }, [useController]);

  // ── Controller mode: instantiate SceneController once ───────────
  useEffect(() => {
    if (!useController) return;
    const entityLayer = entityLayerRef.current;
    const connectionLayer = connectionLayerRef.current;
    if (!entityLayer || !connectionLayer) return;
    if (!controllerRef.current) {
      controllerRef.current = new SceneController({
        entityLayer,
        connectionLayer,
      });
    }
  }, [useController]);

  // Track loaded frames hash to know when to re-load vs just seek
  const loadedFramesHashRef = useRef(null);
  const lastSeekedFrameRef = useRef(-1);

  const buildVisualScript = useCallback((framesData) => ({
    sceneId: 'composer-preview',
    totalDuration: framesData.length * 5000,
    frames: framesData.map((f, i) => ({
      id: `frame-${i}`,
      startTime: i * 5000,
      endTime: (i + 1) * 5000,
      entities: (f.entities || []).map((e) => {
        const d = applyDefaults(e);
        if (!e.color || e.color === DEFAULT_COLOR) delete d.color;
        return d;
      }),
      narrationSegment: f.narration || '',
      description: '',
    })),
  }), []);

  // ── Controller mode: load script once, then seek on frame changes ──
  useEffect(() => {
    if (!useController || !frames || !frames.length || !controllerRef.current) return;

    setActivePalette(palette);
    setActiveTheme(theme);

    const framesHash = JSON.stringify(frames);
    const script = buildVisualScript(frames);

    if (loadedFramesHashRef.current !== framesHash) {
      // Frames changed — full reload (clears canvas, seeks to frame 0)
      loadedFramesHashRef.current = framesHash;
      lastSeekedFrameRef.current = 0;
      controllerRef.current.loadScript(script);
      // If we need a different frame than 0, seek to it
      if (currentFrameIdx > 0) {
        // Must seek sequentially so SceneController builds diff state for each frame
        for (let i = 1; i <= currentFrameIdx; i++) {
          controllerRef.current.seekToFrame(i);
        }
        lastSeekedFrameRef.current = currentFrameIdx;
      }
    } else if (lastSeekedFrameRef.current !== currentFrameIdx) {
      // Same frames, different frame index — just seek (this triggers morphing!)
      lastSeekedFrameRef.current = currentFrameIdx;
      controllerRef.current.seekToFrame(currentFrameIdx);
    }
  }, [useController, frames, currentFrameIdx, palette, theme, buildVisualScript]);

  // ── Direct mode: clear + rebuild (existing behavior) ────────────
  useEffect(() => {
    if (useController) return; // skip in controller mode
    const entityLayer = entityLayerRef.current;
    const connectionLayer = connectionLayerRef.current;
    if (!entityLayer || !connectionLayer) return;

    entityLayer.innerHTML = '';
    connectionLayer.innerHTML = '';

    if (!entities || entities.length === 0) return;

    setActivePalette(palette);
    setActiveTheme(theme);

    const allDefaulted = entities.map((e) => {
      const d = applyDefaults(e);
      if (!e.color || e.color === DEFAULT_COLOR) delete d.color;
      return d;
    });
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
  }, [entities, onSelectEntity, palette, theme, useController]);

  // Selection ring
  const selectedEntity = entities?.find((e) => e.id === selectedId);
  const ringColor = theme === 'cinema' ? '#F39C12' : '#F39C12';
  const selRing = selectedEntity && !isConnectionType(selectedEntity.type) ? (
    <circle
      cx={(selectedEntity.position?.x ?? 50) * CW / 100}
      cy={(selectedEntity.position?.y ?? 50) * CH / 100}
      r={40}
      fill="none"
      stroke={ringColor}
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

  const vignetteId = `scene-vignette-${theme}`;
  const noiseId = `scene-noise-${theme}`;

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

        <g id="scene-entity-layer" ref={entityLayerRef} />
        <g id="scene-connection-layer" ref={connectionLayerRef} />

        {selRing}

        {(!entities || entities.length === 0) && (
          <text
            x={CW / 2}
            y={CH / 2}
            textAnchor="middle"
            fill={themeConfig.emptyText}
            fontSize="24"
            fontFamily="Inter, sans-serif"
          >
            Add entities to build your scene
          </text>
        )}
      </svg>
    </div>
  );
});

export default ScenePreview;
