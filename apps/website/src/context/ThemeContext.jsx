import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);
const THEME_STORAGE_KEY = 'preplai-theme';
const PALETTE_STORAGE_KEY = 'preplai-palette';

const VALID_PALETTES = ['default', 'ocean', 'sunset', 'forest', 'mono'];

function getStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch (_) {}
  return 'light';
}

function getStoredPalette() {
  try {
    const stored = localStorage.getItem(PALETTE_STORAGE_KEY);
    if (VALID_PALETTES.includes(stored)) return stored;
  } catch (_) {}
  return 'default';
}

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useState(getStoredTheme);
  const [palette, setPaletteState] = useState(getStoredPalette);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
    } catch (_) {}
  }, [currentTheme]);

  useEffect(() => {
    try {
      localStorage.setItem(PALETTE_STORAGE_KEY, palette);
    } catch (_) {}
  }, [palette]);

  const toggleTheme = useCallback(() => {
    setCurrentTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);

  const setPalette = useCallback((name) => {
    if (VALID_PALETTES.includes(name)) {
      setPaletteState(name);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ currentTheme, toggleTheme, palette, setPalette }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
