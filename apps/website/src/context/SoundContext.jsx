import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const SoundContext = createContext(null);
const SOUND_STORAGE_KEY = 'preplai-sound-effects';

function getStoredSoundEnabled() {
  try {
    const stored = localStorage.getItem(SOUND_STORAGE_KEY);
    if (stored === 'true') return true;
    if (stored === 'false') return false;
  } catch (_) {}
  return false;
}

function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function createTone(audioContext, type) {
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  const gain = 0.1;
  const fadeIn = 0.02;
  const fadeOut = 0.03;

  switch (type) {
    case 'modal-open': {
      const duration = 0.15;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(400, now);
      oscillator.frequency.exponentialRampToValueAtTime(600, now + duration);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(gain, now + fadeIn);
      gainNode.gain.setValueAtTime(gain, now + duration - fadeOut);
      gainNode.gain.linearRampToValueAtTime(0, now + duration);
      oscillator.start(now);
      oscillator.stop(now + duration);
      break;
    }
    case 'modal-close': {
      const duration = 0.12;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(500, now);
      oscillator.frequency.exponentialRampToValueAtTime(350, now + duration);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(gain, now + fadeIn);
      gainNode.gain.setValueAtTime(gain, now + duration - fadeOut);
      gainNode.gain.linearRampToValueAtTime(0, now + duration);
      oscillator.start(now);
      oscillator.stop(now + duration);
      break;
    }
    case 'toggle': {
      const duration = 0.08;
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(600, now);
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(gain, now + fadeIn);
      gainNode.gain.setValueAtTime(gain, now + duration - fadeOut);
      gainNode.gain.linearRampToValueAtTime(0, now + duration);
      oscillator.start(now);
      oscillator.stop(now + duration);
      break;
    }
  }
}

export function SoundProvider({ children }) {
  const [soundEnabled, setSoundEnabled] = useState(getStoredSoundEnabled);
  const audioContextRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(SOUND_STORAGE_KEY, String(soundEnabled));
    } catch (_) {}
  }, [soundEnabled]);

  const playSound = useCallback(async (type) => {
    if (!soundEnabled || prefersReducedMotion()) return;
    if (typeof window === 'undefined' || !window.AudioContext) return;

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }
      createTone(ctx, type);
    } catch (_) {}
  }, [soundEnabled]);

  const toggleSoundEnabled = useCallback(() => {
    setSoundEnabled(prev => !prev);
  }, []);

  return (
    <SoundContext.Provider value={{ soundEnabled, setSoundEnabled, toggleSoundEnabled, playSound }}>
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  const ctx = useContext(SoundContext);
  if (!ctx) throw new Error('useSound must be used within SoundProvider');
  return ctx;
}
