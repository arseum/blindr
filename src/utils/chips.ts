import type { BlindLevel } from '../types';

/** Dénominations de jetons, du plus petit au plus grand — chacune a son token `--color-chip-<valeur>`. */
export const CHIP_DENOMINATIONS = [1, 5, 10, 25, 100, 500, 1000, 5000] as const;

export type ChipKey = `${(typeof CHIP_DENOMINATIONS)[number]}` | 'break';

/**
 * Jeton qui « porte » le niveau : la plus grosse dénomination qui tient dans la grosse blinde.
 * S'utilise comme `data-chip={levelChip(level)}` pour recolorer l'accent de l'écran.
 */
export function levelChip(level: BlindLevel): ChipKey {
  if (level.isBreak || level.bigBlind <= 0) return 'break';
  let chip: number = CHIP_DENOMINATIONS[0];
  for (const d of CHIP_DENOMINATIONS) {
    if (d <= level.bigBlind) chip = d;
  }
  return `${chip}` as ChipKey;
}

/** Couleur CSS du jeton qui correspond à un montant (sert aussi aux montants en euros des roulettes). */
export function chipColorVar(amount: number): string {
  let chip: number = CHIP_DENOMINATIONS[0];
  for (const d of CHIP_DENOMINATIONS) {
    if (d <= amount) chip = d;
  }
  return `var(--color-chip-${chip})`;
}
