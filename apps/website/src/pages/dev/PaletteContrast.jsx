import { useState, useMemo } from 'react';
import { PALETTES, PALETTES_LIGHT, PALETTES_CINEMA } from '@preplai/illustrations';

/* ── Theme background colors (exact player values) ──────────────────── */
const THEMES = {
  cinema: {
    label: '🌙 Cinema',
    bg: '#0c0d14',          // mid-vignette (most common area)
    bgLight: '#12131c',     // center
    bgDark: '#050509',      // edges
  },
  light: {
    label: '☀️ Light',
    bg: '#f3ede4',          // mid-vignette
    bgLight: '#faf7f2',     // center
    bgDark: '#ebe4d8',      // edges
  },
};

const CATEGORIES = ['compute', 'data', 'environment', 'human', 'structure', 'state', 'annotation', 'generic', 'accent'];
const PALETTE_NAMES = ['default', 'ocean', 'sunset', 'forest', 'mono'];

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

  return (
    <div className="palette-contrast-root">
      <div className="palette-contrast-header">
        <h2 className="dev-heading">Palette Contrast Audit</h2>
        <p className="dev-hint" style={{ marginBottom: 'var(--space-3)' }}>
          Every palette color tested against both theme backgrounds. WCAG AA requires ≥4.5:1 for text, ≥3:1 for large text/graphics.
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
              return (
                <div key={themeKey} className="palette-contrast-theme-section">
                  <div className="palette-contrast-theme-label">{theme.label}</div>
                  <div
                    className="palette-contrast-swatches"
                    style={{ background: theme.bg }}
                  >
                    {rows.map(({ category, baseColor, [themeKey]: result }) => {
                      const { color: adjustedColor, ratio, label: badge, wasFixed, baseRatio } = result;
                      const badgeColor = contrastBadgeColor(ratio);
                      return (
                        <div
                          key={category}
                          className="palette-contrast-swatch"
                          title={`${category}: ${adjustedColor} — ${ratio.toFixed(2)}:1 (${badge})${wasFixed ? ` (was ${baseColor} ${baseRatio.toFixed(2)}:1)` : ''}`}
                        >
                          {/* Swatch: show base (outer ring) and adjusted (inner fill) */}
                          <svg width="48" height="48" viewBox="0 0 48 48">
                            {wasFixed && (
                              <circle cx="24" cy="24" r="22" fill="none" stroke={baseColor} strokeWidth="2" opacity="0.35" strokeDasharray="3 2" />
                            )}
                            <circle cx="24" cy="24" r="18" fill={adjustedColor} stroke={adjustedColor} strokeWidth="1.5" opacity="0.95" />
                            <circle cx="24" cy="24" r="12" fill="none" stroke={adjustedColor} strokeWidth="1" opacity="0.6" />
                          </svg>
                          {/* Category label */}
                          <span
                            className="palette-contrast-cat"
                            style={{ color: themeKey === 'cinema' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }}
                          >
                            {category}
                          </span>
                          {/* Color hex */}
                          <span
                            className="palette-contrast-hex"
                            style={{ color: themeKey === 'cinema' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)' }}
                          >
                            {wasFixed ? `${adjustedColor}` : adjustedColor}
                          </span>
                          {/* Contrast badge */}
                          <span
                            className="palette-contrast-badge"
                            style={{
                              background: badgeColor,
                              color: ratio >= 3 ? '#000' : '#fff',
                            }}
                          >
                            {ratio.toFixed(1)} {badge}
                          </span>
                          {wasFixed && (
                            <span
                              className="palette-contrast-hex"
                              style={{ color: themeKey === 'cinema' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)', textDecoration: 'line-through' }}
                            >
                              {baseColor}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Summary: failing combos */}
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
