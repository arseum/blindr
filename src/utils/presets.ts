/**
 * Formules de tournoi : un toucher remplit la structure des blindes.
 * La profondeur (tapis / grosse blinde de départ) et la durée des niveaux font le rythme de la soirée.
 */
export interface TournamentPreset {
  id: 'turbo' | 'apero' | 'soiree' | 'deep';
  name: string;
  description: string;
  targetMinutes: number;
  levelMinutes: number;
  /** Tapis de départ exprimé en grosses blindes. */
  depthBB: number;
}

export const PRESETS: TournamentPreset[] = [
  { id: 'turbo',  name: 'Turbo',     description: '1 h · ça part vite',          targetMinutes: 60,  levelMinutes: 8,  depthBB: 50 },
  { id: 'apero',  name: 'Apéro',     description: '1 h 30 · sans prise de tête', targetMinutes: 90,  levelMinutes: 12, depthBB: 75 },
  { id: 'soiree', name: 'Soirée',    description: '3 h · le classique',          targetMinutes: 180, levelMinutes: 20, depthBB: 100 },
  { id: 'deep',   name: 'Deepstack', description: '5 h · pour les joueurs',      targetMinutes: 300, levelMinutes: 25, depthBB: 200 },
];

/** Valeurs proposées par les roulettes : uniquement des montants « de vrai poker ». Grosses blindes : voir `blinds.ts`. */
export const STACK_VALUES = [1000, 1500, 2000, 2500, 3000, 5000, 7500, 10000, 15000, 20000, 25000, 30000, 50000, 100000];
export const BUY_IN_VALUES = [0, 2, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 500];
export const SMALLEST_CHIP_VALUES = [1, 5, 10, 25, 50, 100];

/** Valeur de la liste la plus proche de `target`. */
export function nearestValue(values: number[], target: number): number {
  return values.reduce((best, v) => (Math.abs(v - target) < Math.abs(best - target) ? v : best), values[0]);
}

/** Ce que la profondeur (en grosses blindes) promet comme partie. */
export function depthLabel(depthBB: number): string {
  if (depthBB < 40) return 'Turbo : ça va partir à tapis très vite.';
  if (depthBB < 80) return 'Rapide : les blindes pèsent tôt.';
  if (depthBB <= 150) return 'Confortable : de la place pour jouer.';
  return 'Deepstack : prévoyez la soirée.';
}
