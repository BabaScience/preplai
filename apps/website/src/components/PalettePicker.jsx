/**
 * PalettePicker — Presentation style controls for the landing page.
 *
 * Lets visitors toggle between Cinema (dark) / Light themes and
 * switch color palettes to preview how their presentations would look.
 * Changes apply instantly to both HeroPlayer and ShowcaseCarousel.
 */
import { PALETTES } from '@preplai/shared';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const PALETTE_NAMES = ['default', 'ocean', 'sunset', 'forest', 'mono'];
const PALETTE_LABELS = {
  default: 'Default',
  ocean: 'Ocean',
  sunset: 'Sunset',
  forest: 'Forest',
  mono: 'Mono',
};

export default function PalettePicker() {
  const { currentTheme, toggleTheme, palette, setPalette } = useTheme();
  const isDark = currentTheme === 'dark';

  return (
    <div className="style-bar">
      {/* Theme toggle */}
      <div className="style-bar-group">
        <span className="style-bar-label">Theme</span>
        <div className="theme-toggle-pills">
          <button
            className={`theme-pill ${!isDark ? 'active' : ''}`}
            onClick={() => isDark && toggleTheme()}
            aria-label="Light theme"
          >
            <Sun size={13} />
            <span>Light</span>
          </button>
          <button
            className={`theme-pill ${isDark ? 'active' : ''}`}
            onClick={() => !isDark && toggleTheme()}
            aria-label="Cinema theme"
          >
            <Moon size={13} />
            <span>Cinema</span>
          </button>
        </div>
      </div>

      <div className="style-bar-divider" />

      {/* Palette selector */}
      <div className="style-bar-group">
        <span className="style-bar-label">Palette</span>
        <div className="palette-picker-dots">
          {PALETTE_NAMES.map((name) => {
            const p = PALETTES[name];
            const isActive = palette === name;
            return (
              <button
                key={name}
                className={`palette-dot ${isActive ? 'active' : ''}`}
                onClick={() => setPalette(name)}
                aria-label={`${PALETTE_LABELS[name]} palette`}
                title={PALETTE_LABELS[name]}
              >
                <span
                  className="palette-dot-inner"
                  style={{ background: `linear-gradient(135deg, ${p.accent}, ${p.compute})` }}
                />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
