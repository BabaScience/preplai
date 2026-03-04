import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useSound } from '../context/SoundContext';

export default function ThemeToggle() {
  const { currentTheme, toggleTheme } = useTheme();
  const { playSound } = useSound();
  return (
    <button
      className="theme-toggle"
      onClick={() => {
        playSound('toggle');
        toggleTheme();
      }}
      aria-label={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${currentTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {currentTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
