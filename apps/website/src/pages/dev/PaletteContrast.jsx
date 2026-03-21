import { useState, useMemo } from 'react';
import { PALETTES, PALETTES_LIGHT, PALETTES_CINEMA } from '@preplai/illustrations';

/* ── Theme background colors (exact player values) ──────────────────── */
const THEMES = {
  cinema: {
    label: '🌙 Cinema',
    bg: '#0c0d14',          // mid-vignette (most common area)
    bgLight: '#12131c',     // center
    bgDark: '#050509',      // edges
    vignette: [
      { offset: '0%', color: '#12131c' },
      { offset: '50%', color: '#0c0d14' },
      { offset: '100%', color: '#050509' },
    ],
    dotColor: 'rgba(255,255,255,0.15)',
    dotOpacity: 0.04,
  },
  light: {
    label: '☀️ Light',
    bg: '#f3ede4',          // mid-vignette
    bgLight: '#faf7f2',     // center
    bgDark: '#ebe4d8',      // edges
    vignette: [
      { offset: '0%', color: '#faf7f2' },
      { offset: '50%', color: '#f5f0e8' },
      { offset: '100%', color: '#ebe4d8' },
    ],
    dotColor: 'rgba(0,0,0,0.5)',
    dotOpacity: 0.06,
  },
};

const CATEGORIES = ['compute', 'data', 'environment', 'human', 'structure', 'state', 'annotation', 'generic', 'accent'];
const PALETTE_NAMES = ['default', 'ocean', 'sunset', 'forest', 'mono'];

/* ── Illustration opacity tokens (match design-tokens.ts OPACITY) ──── */
const OPACITY = {
  fillHeavy: '66',   // 40%
  fillMedium: '40',  // 25%
  strokeFull: 'ff',  // 100%
};

/* ── WCAG contrast ratio helpers ─────────────────────────────────────── */
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const num = parseInt(h.length === 3 ? h.split('').map(c => c + c).join('') : h, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function sRGBtoLinear(c) {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance([r, g, b]) {
  return 0.2126 * sRGBtoLinear(r) + 0.7152 * sRGBtoLinear(g) + 0.0722 * sRGBtoLinear(b);
}

function contrastRatio(hex1, hex2) {
  const l1 = relativeLuminance(hexToRgb(hex1));
  const l2 = relativeLuminance(hexToRgb(hex2));
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function contrastLabel(ratio) {
  if (ratio >= 7) return 'AAA';
  if (ratio >= 4.5) return 'AA';
  if (ratio >= 3) return 'AA-lg';
  return 'Fail';
}

function contrastBadgeColor(ratio) {
  if (ratio >= 4.5) return '#22c55e';
  if (ratio >= 3) return '#f59e0b';
  return '#ef4444';
}

/** Normalize hex to 6-char uppercase for gradient IDs */
function colorId(hex) {
  return hex.replace(/[^a-fA-F0-9]/g, '').toUpperCase();
}

/* ── Liquid Glass Swatch ─────────────────────────────────────────────── */
function GlassSwatch({ color, baseColor, wasFixed, themeKey, size = 56 }) {
  const r = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;
  const gradId = `swatch-grad-${colorId(color)}-${themeKey}`;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        {/* Radial gradient matching illustration rendering: center lighter → edge darker */}
        <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={`${color}${OPACITY.fillHeavy}`} />
          <stop offset="100%" stopColor={`${color}${OPACITY.fillMedium}`} />
        </radialGradient>
      </defs>

      {/* Original color ring (dashed) when theme-adjusted */}
      {wasFixed && (
        <circle
          cx={cx} cy={cy} r={r + 3}
          fill="none"
          stroke={baseColor}
          strokeWidth="1"
          opacity="0.3"
          strokeDasharray="3 2"
        />
      )}

      {/* Main glass circle — radial gradient fill + full-color stroke */}
      <circle
        cx={cx} cy={cy} r={r}
        fill={`url(#${gradId})`}
        stroke={color}
        strokeWidth="1.5"
      />

      {/* Inner highlight — subtle lighter center glow */}
      <circle
        cx={cx} cy={cy - r * 0.15}
        r={r * 0.45}
        fill={`${color}${OPACITY.fillMedium}`}
        stroke="none"
      />
    </svg>
  );
}

/* ── Main component ──────────────────────────────────────────────────── */
export default function PaletteContrast() {
  const [selectedTheme, setSelectedTheme] = useState('both');

  const data = useMemo(() => {
    const results = [];
    for (const palName of PALETTE_NAMES) {
      const palette = PALETTES[palName];
      const lightOverrides = PALETTES_LIGHT[palName] ?? {};
      const cinemaOverrides = PALETTES_CINEMA[palName] ?? {};
      const rows = [];
      for (const cat of CATEGORIES) {
        const baseColor = palette[cat];
        if (!baseColor || typeof baseColor !== 'string') continue;
        // Theme-adjusted colors
        const lightColor = lightOverrides[cat] ?? baseColor;
        const cinemaColor = cinemaOverrides[cat] ?? baseColor;
        const cinemaBaseRatio = contrastRatio(baseColor, THEMES.cinema.bg);
        const lightBaseRatio = contrastRatio(baseColor, THEMES.light.bg);
        const cinemaAdjRatio = contrastRatio(cinemaColor, THEMES.cinema.bg);
        const lightAdjRatio = contrastRatio(lightColor, THEMES.light.bg);
        rows.push({
          category: cat,
          baseColor,
          cinema: {
            color: cinemaColor,
            baseRatio: cinemaBaseRatio,
            ratio: cinemaAdjRatio,
            label: contrastLabel(cinemaAdjRatio),
            wasFixed: cinemaColor !== baseColor,
          },
          light: {
            color: lightColor,
            baseRatio: lightBaseRatio,
            ratio: lightAdjRatio,
            label: contrastLabel(lightAdjRatio),
            wasFixed: lightColor !== baseColor,
          },
        });
      }
      results.push({ name: palName, rows });
    }
    return results;
  }, []);

  const themesToShow = selectedTheme === 'both'
    ? ['cinema', 'light']
    : [selectedTheme];

  // Generate a unique vignette ID per theme per palette card
  let vignetteCounter = 0;

  return (
    <div className="palette-contrast-root">
      <div className="palette-contrast-header">
        <h2 className="dev-heading">Palette Contrast Audit</h2>
        <p className="dev-hint" style={{ marginBottom: 'var(--space-3)' }}>
          Every palette color rendered with the same liquid glass effect as actual illustrations.
          WCAG AA requires ≥4.5:1 for text, ≥3:1 for large text/graphics.
        </p>
        <div className="scene-toggle-row" style={{ marginBottom: 'var(--space-4)' }}>
          {['both', 'cinema', 'light'].map((t) => (
            <button
              key={t}
              type="button"
              className="scene-toggle-btn"
              data-active={selectedTheme === t}
              onClick={() => setSelectedTheme(t)}
            >
              {t === 'both' ? '⬛⬜ Both' : t === 'cinema' ? '🌙 Cinema' : '☀️ Light'}
            </button>
          ))}
        </div>
      </div>

      <div className="palette-contrast-grid">
        {data.map(({ name, rows }) => (
          <div key={name} className="palette-contrast-card">
            <h3 className="palette-contrast-title">{name}</h3>

            {themesToShow.map((themeKey) => {
              const theme = THEMES[themeKey];
              const vigId = `pc-vig-${name}-${themeKey}-${vignetteCounter++}`;
              const noiseId = `pc-noise-${name}-${themeKey}`;
              const dotSpacing = 40;
              const svgW = rows.length * 82;
              const svgH = 120;

              return (
                <div key={themeKey} className="palette-contrast-theme-section">
                  <div className="palette-contrast-theme-label">{theme.label}</div>
                  {/* Full SVG canvas with player-accurate background */}
                  <svg
                    className="palette-contrast-canvas"
                    viewBox={`0 0 ${svgW} ${svgH}`}
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <defs>
                      {/* Vignette gradient matching actual player */}
                      <radialGradient id={vigId} cx="50%" cy="50%" r="70%">
                        {theme.vignette.map((s, i) => (
                          <stop key={i} offset={s.offset} stopColor={s.color} />
                        ))}
                      </radialGradient>
                      {/* Noise filter */}
                      <filter id={noiseId} x="0%" y="0%" width="100%" height="100%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise" />
                        <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
                        <feComponentTransfer in="grayNoise" result="alphaedNoise">
                          <feFuncA type="linear" slope="0.03" />
                        </feComponentTransfer>
                        <feBlend in="SourceGraphic" in2="alphaedNoise" mode="multiply" />
                      </filter>
                    </defs>

                    {/* Background vignette */}
                    <rect width={svgW} height={svgH} fill={`url(#${vigId})`} />

                    {/* Dot grid */}
                    <g opacity={theme.dotOpacity}>
                      {(() => {
                        const dots = [];
                        for (let x = dotSpacing / 2; x < svgW; x += dotSpacing) {
                          for (let y = dotSpacing / 2; y < svgH; y += dotSpacing) {
                            dots.push(<circle key={`${x}-${y}`} cx={x} cy={y} r="0.6" fill={theme.dotColor} />);
                          }
                        }
                        return dots;
                      })()}
                    </g>

                    {/* Noise overlay */}
                    <rect width={svgW} height={svgH} fill="transparent" filter={`url(#${noiseId})`} opacity={themeKey === 'cinema' ? 0.4 : 0.2} />

                    {/* Glass entity swatches */}
                    {rows.map(({ category, baseColor, [themeKey]: result }, idx) => {
                      const { color: adjustedColor, ratio, label: badge, wasFixed } = result;
                      const badgeClr = contrastBadgeColor(ratio);
                      const cx = idx * 82 + 41;
                      const cy = 42;
                      const r = 24;
                      const gradSwatchId = `pc-sgrad-${name}-${themeKey}-${category}`;
                      const textColor = themeKey === 'cinema' ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)';
                      const hexTextColor = themeKey === 'cinema' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)';

                      return (
                        <g key={category}>
                          <defs>
                            <radialGradient id={gradSwatchId} cx="50%" cy="40%" r="55%">
                              <stop offset="0%" stopColor={`${adjustedColor}${OPACITY.fillHeavy}`} />
                              <stop offset="100%" stopColor={`${adjustedColor}${OPACITY.fillMedium}`} />
                            </radialGradient>
                          </defs>

                          {/* Original color dashed ring (when theme-adjusted) */}
                          {wasFixed && (
                            <circle
                              cx={cx} cy={cy} r={r + 4}
                              fill="none"
                              stroke={baseColor}
                              strokeWidth="1"
                              opacity="0.25"
                              strokeDasharray="3 2"
                            />
                          )}

                          {/* Main liquid glass circle */}
                          <circle
                            cx={cx} cy={cy} r={r}
                            fill={`url(#${gradSwatchId})`}
                            stroke={adjustedColor}
                            strokeWidth="1.5"
                          />

                          {/* Inner highlight glow (top-center) */}
                          <ellipse
                            cx={cx} cy={cy - r * 0.2}
                            rx={r * 0.5} ry={r * 0.35}
                            fill={`${adjustedColor}15`}
                            stroke="none"
                          />

                          {/* Category name */}
                          <text
                            x={cx} y={cy + r + 14}
                            textAnchor="middle"
                            fill={textColor}
                            fontSize="7"
                            fontFamily="Inter, sans-serif"
                            fontWeight="500"
                          >
                            {category}
                          </text>

                          {/* Hex value */}
                          <text
                            x={cx} y={cy + r + 23}
                            textAnchor="middle"
                            fill={hexTextColor}
                            fontSize="5.5"
                            fontFamily="'JetBrains Mono', monospace"
                          >
                            {adjustedColor}
                          </text>

                          {/* Contrast badge */}
                          <rect
                            x={cx - 16} y={cy + r + 26}
                            width="32" height="11"
                            rx="2"
                            fill={badgeClr}
                            opacity="0.9"
                          />
                          <text
                            x={cx} y={cy + r + 34}
                            textAnchor="middle"
                            fill={ratio >= 3 ? '#000' : '#fff'}
                            fontSize="6"
                            fontWeight="700"
                            fontFamily="Inter, sans-serif"
                          >
                            {ratio.toFixed(1)} {badge}
                          </text>

                          {/* Strikethrough old color if was fixed */}
                          {wasFixed && (
                            <text
                              x={cx} y={cy + r + 44}
                              textAnchor="middle"
                              fill={hexTextColor}
                              fontSize="5"
                              fontFamily="'JetBrains Mono', monospace"
                              textDecoration="line-through"
                            >
                              {baseColor}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Summary: remaining issues */}
      <div className="palette-contrast-summary">
        <h3 className="palette-contrast-title">Remaining Issues (below 3:1 after theme adjustment)</h3>
        <div className="palette-contrast-issues">
          {data.flatMap(({ name, rows }) =>
            rows.flatMap(({ category, cinema, light }) => {
              const issues = [];
              if (cinema.ratio < 3) issues.push({ palette: name, category, color: cinema.color, theme: 'cinema', ratio: cinema.ratio });
              if (light.ratio < 3) issues.push({ palette: name, category, color: light.color, theme: 'light', ratio: light.ratio });
              return issues;
            }),
          ).map((issue, i) => (
            <div key={i} className="palette-contrast-issue-row">
              <span className="palette-contrast-issue-dot" style={{ background: issue.color }} />
              <span><strong>{issue.palette}</strong> → {issue.category}</span>
              <span className="palette-contrast-issue-hex">{issue.color}</span>
              <span>on <em>{issue.theme}</em></span>
              <span className="palette-contrast-badge" style={{ background: '#ef4444', color: '#fff' }}>
                {issue.ratio.toFixed(2)}:1
              </span>
            </div>
          ))}
          {data.flatMap(({ rows }) =>
            rows.flatMap(({ cinema, light }) => [cinema.ratio < 3, light.ratio < 3]),
          ).every((v) => !v) && (
            <p className="dev-hint" style={{ padding: 'var(--space-3)' }}>
              ✅ All palette colors pass minimum contrast (3:1) on both themes after adjustment.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
