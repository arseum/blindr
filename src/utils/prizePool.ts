import type { PrizePoolConfig, PalierEntry } from '../types';

export interface PrizeEntry {
  position: number;
  percentage: number;
  amount: number;
}

// ─── ITM ─────────────────────────────────────────────────────────────────────
export function getPaidPlaces(playerCount: number, itmPct: number): number {
  if (playerCount <= 0) return 0;
  return Math.max(1, Math.round(playerCount * (itmPct / 100)));
}

// ─── Auto distribution: loi de puissance 1/k^α ───────────────────────────────
//
// weight(k) = 1 / k^α  où k=1 est le vainqueur
// α s'adapte à la taille du champ pour éviter les montants nuls :
//   petit champ (≤9)   → α élevé = pyramide marquée
//   grand champ (≥200) → α faible = distribution plus équitable
//
function autoAlpha(J: number): number {
  if (J <= 3)   return 2.0;
  if (J <= 9)   return 1.5;
  if (J <= 20)  return 1.2;
  if (J <= 50)  return 1.0;
  if (J <= 150) return 0.85;
  return 0.70;
}

function distributeAuto(totalPot: number, J: number): PrizeEntry[] {
  if (J <= 0) return [];
  if (J === 1) return [{ position: 1, percentage: 100, amount: totalPot }];
  const alpha   = autoAlpha(J);
  const weights = Array.from({ length: J }, (_, i) => 1 / Math.pow(i + 1, alpha));
  const totalW  = weights.reduce((s, w) => s + w, 0);
  return weights.map((w, i) => ({
    position:   i + 1,
    percentage: Math.round((w / totalW) * 1000) / 10,
    amount:     Math.round(totalPot * w / totalW),
  }));
}

// ─── Paliers distribution ─────────────────────────────────────────────────────
function distributePaliers(totalPot: number, paliers: PalierEntry[]): PrizeEntry[] {
  const entries: PrizeEntry[] = [];
  for (const palier of paliers) {
    const count     = palier.toPosition - palier.fromPosition + 1;
    const pctEach   = palier.totalPct / count;
    const amountEach = Math.round(totalPot * (pctEach / 100));
    for (let pos = palier.fromPosition; pos <= palier.toPosition; pos++) {
      entries.push({
        position:   pos,
        percentage: Math.round(pctEach * 10) / 10,
        amount:     amountEach,
      });
    }
  }
  return entries.sort((a, b) => a.position - b.position);
}

// ─── Manual distribution ──────────────────────────────────────────────────────
function distributeManual(totalPot: number, manualShares: number[], J: number): PrizeEntry[] {
  return Array.from({ length: J }, (_, i) => {
    const pct = manualShares[i] ?? 0;
    return {
      position:   i + 1,
      percentage: pct,
      amount:     Math.round(totalPot * pct / 100),
    };
  });
}

// ─── Main entry point ─────────────────────────────────────────────────────────
export function calculatePrizes(
  prizePoolAmount: number,
  playerCount: number,
  config: PrizePoolConfig,
): PrizeEntry[] {
  const J = getPaidPlaces(playerCount, config.itmPct);
  if (J <= 0) return [];

  switch (config.distributionMode) {
    case 'paliers': return distributePaliers(prizePoolAmount, config.paliers);
    case 'manual':  return distributeManual(prizePoolAmount, config.manualShares, J);
    case 'auto':
    default:        return distributeAuto(prizePoolAmount, J);
  }
}

// ─── Helpers pour initialiser les modes ───────────────────────────────────────
export function defaultPaliers(J: number): PalierEntry[] {
  if (J <= 0) return [];
  const pctEach = Math.round(1000 / J) / 10;
  return Array.from({ length: J }, (_, i) => ({
    fromPosition: i + 1,
    toPosition:   i + 1,
    totalPct: i < J - 1
      ? pctEach
      : Math.round((100 - pctEach * (J - 1)) * 10) / 10,
  }));
}

export function defaultManualShares(J: number): number[] {
  if (J <= 0) return [];
  const pctEach = Math.round(1000 / J) / 10;
  return Array.from({ length: J }, (_, i) =>
    i < J - 1 ? pctEach : Math.round((100 - pctEach * (J - 1)) * 10) / 10
  );
}

// ─── UI helpers ───────────────────────────────────────────────────────────────
/** « 1er », « 2e »… (visuel : composant PlaceCoin). */
export function positionLabel(pos: number): string {
  return pos === 1 ? '1er' : `${pos}e`;
}
