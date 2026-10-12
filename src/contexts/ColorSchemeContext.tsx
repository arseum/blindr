import React, { useEffect, useState } from 'react';
import { COLOR_SCHEMES, ColorSchemeContext, type ColorScheme } from './colorScheme';

const STORAGE_KEY = 'blindr-scheme';

function readScheme(value: string | null): ColorScheme {
  return (COLOR_SCHEMES as readonly string[]).includes(value ?? '') ? (value as ColorScheme) : 'system';
}

function readStoredScheme(): ColorScheme {
  try { return readScheme(localStorage.getItem(STORAGE_KEY)); } catch { return 'system'; }
}

/** Applique data-scheme sur <html> ; « system » laisse prefers-color-scheme décider (voir tokens.css). */
export function ColorSchemeProvider({ children }: { children: React.ReactNode }) {
  const [scheme, setSchemeState] = useState<ColorScheme>(readStoredScheme);

  const setScheme = (s: ColorScheme) => {
    setSchemeState(s);
    try { localStorage.setItem(STORAGE_KEY, s); } catch { /* stockage indisponible */ }
  };

  useEffect(() => {
    const root = document.documentElement;
    if (scheme === 'system') root.removeAttribute('data-scheme');
    else root.setAttribute('data-scheme', scheme);
  }, [scheme]);

  // Synchronise l'écran TV (autre fenêtre) quand le réglage change
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setSchemeState(readScheme(e.newValue));
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <ColorSchemeContext.Provider value={{ scheme, setScheme }}>
      {children}
    </ColorSchemeContext.Provider>
  );
}
