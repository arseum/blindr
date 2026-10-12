import { createContext, useContext } from 'react';

export const COLOR_SCHEMES = ['system', 'light', 'dark'] as const;
export type ColorScheme = typeof COLOR_SCHEMES[number];

export const COLOR_SCHEME_LABELS: Record<ColorScheme, string> = {
  system: 'Automatique',
  light: 'Clair',
  dark: 'Sombre',
};

interface ColorSchemeContextValue {
  scheme: ColorScheme;
  setScheme: (s: ColorScheme) => void;
}

export const ColorSchemeContext = createContext<ColorSchemeContextValue>({
  scheme: 'system',
  setScheme: () => {},
});

export function useColorScheme() {
  return useContext(ColorSchemeContext);
}
