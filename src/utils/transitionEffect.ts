export type TransitionEffect = 'radial' | 'curtain' | 'ascend';

const EFFECTS: TransitionEffect[] = ['radial', 'curtain', 'ascend'];

export function pickRandomEffect(): TransitionEffect {
  return EFFECTS[Math.floor(Math.random() * EFFECTS.length)];
}
