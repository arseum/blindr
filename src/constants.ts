import type { BlindLevel, PrizePoolConfig } from './types';

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

export const DEFAULT_BLIND_STRUCTURE: BlindLevel[] = [
  { level: 1, smallBlind: 25, bigBlind: 50, ante: 0, duration: 20 },
  { level: 2, smallBlind: 50, bigBlind: 100, ante: 0, duration: 20 },
  { level: 3, smallBlind: 75, bigBlind: 150, ante: 0, duration: 20 },
  { level: 4, smallBlind: 100, bigBlind: 200, ante: 25, duration: 20 },
  { level: 5, smallBlind: 0, bigBlind: 0, ante: 0, duration: 15, isBreak: true },
  { level: 6, smallBlind: 150, bigBlind: 300, ante: 25, duration: 20 },
  { level: 7, smallBlind: 200, bigBlind: 400, ante: 50, duration: 20 },
  { level: 8, smallBlind: 300, bigBlind: 600, ante: 75, duration: 20 },
  { level: 9, smallBlind: 400, bigBlind: 800, ante: 100, duration: 20 },
  { level: 10, smallBlind: 0, bigBlind: 0, ante: 0, duration: 15, isBreak: true },
  { level: 11, smallBlind: 500, bigBlind: 1000, ante: 100, duration: 20 },
  { level: 12, smallBlind: 600, bigBlind: 1200, ante: 200, duration: 20 },
  { level: 13, smallBlind: 800, bigBlind: 1600, ante: 200, duration: 20 },
  { level: 14, smallBlind: 1000, bigBlind: 2000, ante: 300, duration: 20 },
  { level: 15, smallBlind: 1500, bigBlind: 3000, ante: 400, duration: 20 },
  { level: 16, smallBlind: 2000, bigBlind: 4000, ante: 500, duration: 20 },
  { level: 17, smallBlind: 3000, bigBlind: 6000, ante: 1000, duration: 20 },
  { level: 18, smallBlind: 4000, bigBlind: 8000, ante: 1000, duration: 20 },
  { level: 19, smallBlind: 5000, bigBlind: 10000, ante: 1000, duration: 20 },
  { level: 20, smallBlind: 8000, bigBlind: 16000, ante: 2000, duration: 20 },
];

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
