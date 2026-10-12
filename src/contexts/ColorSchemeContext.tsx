import React, { createContext, useContext, useEffect, useState } from 'react';

export const COLOR_SCHEMES = ['system', 'light', 'dark'] as const;
export type ColorScheme = typeof COLOR_SCHEMES[number];

export const COLOR_SCHEME_LABELS: Record<ColorScheme, string> = {
  system: 'Automatique',
  light: 'Clair',
  dark: 'Sombre',
};

const STORAGE_KEY = 'blindr-scheme';

function readScheme(value: string | null): ColorScheme {
  return (COLOR_SCHEMES as readonly string[]).includes(value ?? '') ? (value as ColorScheme) : 'system';
}

function readStoredScheme(): ColorScheme {
  try { return readScheme(localStorage.getItem(STORAGE_KEY)); } catch { return 'system'; }
}

interface ColorSchemeContextValue {
  scheme: ColorScheme;
  setScheme: (s: ColorScheme) => void;
}

const ColorSchemeContext = createContext<ColorSchemeContextValue>({
  scheme: 'system',
  setScheme: () => {},
});

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

export function useColorScheme() {
  return useContext(ColorSchemeContext);
}
