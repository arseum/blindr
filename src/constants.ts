import type { PrizePoolConfig } from './types';

export const DEFAULT_PRIZE_POOL_CONFIG: PrizePoolConfig = {
  prizePoolPct: 100,
  killPct: 0,
  rakePct: 0,
  itmPct: 15,
  distributionMode: 'auto',
  paliers: [],
  manualShares: [],
  killSystem: { type: 'fixed', amountPerKill: 0 },
};

export const TV_EFFECT_KEY = 'poker-tv-effect';

/**
 * Montant de jetons lisible et exact : 1 150 → « 1 150 », 125 000 → « 125K », 1 250 000 → « 1,25M ».
 * Sous 100 000, on affiche la valeur exacte : une blinde arrondie serait fausse.
 */
const chipsFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });
export const formatChips = (amount: number): string => {
  if (amount >= 1_000_000) return `${chipsFormatter.format(amount / 1_000_000)}M`;
  if (amount >= 100_000) return `${chipsFormatter.format(amount / 1_000)}K`;
  return chipsFormatter.format(amount);
};

export const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};
