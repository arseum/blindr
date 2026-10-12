import { describe, it, expect } from 'vitest';
import { calculatePrizes, getPaidPlaces, defaultPaliers, defaultManualShares } from '../prizePool';
import type { PrizePoolConfig } from '../../types';

const baseConfig: PrizePoolConfig = {
  prizePoolPct: 100,
  killPct: 0,
  rakePct: 0,
  itmPct: 20,
  distributionMode: 'auto',
  paliers: [],
  manualShares: [],
  killSystem: { type: 'fixed', amountPerKill: 0 },
};

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0);

describe('getPaidPlaces', () => {
  it('paie au moins une place', () => {
    expect(getPaidPlaces(3, 10)).toBe(1);
  });
  it('arrondit le pourcentage ITM', () => {
    expect(getPaidPlaces(50, 15)).toBe(8);
  });
  it('ne paie personne sans joueur', () => {
    expect(getPaidPlaces(0, 20)).toBe(0);
  });
});

describe('calculatePrizes — auto', () => {
  it.each([2, 9, 20, 50, 150, 300])('distribue tout le pot et décroît (%i joueurs)', (players) => {
    const prizes = calculatePrizes(10000, players, { ...baseConfig, itmPct: 30 });
    expect(Math.abs(sum(prizes.map(p => p.amount)) - 10000)).toBeLessThanOrEqual(prizes.length);
    for (let i = 1; i < prizes.length; i++) {
      expect(prizes[i].amount).toBeLessThanOrEqual(prizes[i - 1].amount);
      expect(prizes[i].amount).toBeGreaterThan(0);
    }
  });
  it('donne tout au vainqueur si une seule place payée', () => {
    expect(calculatePrizes(500, 4, baseConfig)).toEqual([{ position: 1, percentage: 100, amount: 500 }]);
  });
});

describe('calculatePrizes — paliers et manuel', () => {
  it('répartit un palier également entre ses positions', () => {
    const prizes = calculatePrizes(1000, 10, {
      ...baseConfig,
      itmPct: 30,
      distributionMode: 'paliers',
      paliers: [
        { fromPosition: 1, toPosition: 1, totalPct: 50 },
        { fromPosition: 2, toPosition: 3, totalPct: 50 },
      ],
    });
    expect(prizes.map(p => p.amount)).toEqual([500, 250, 250]);
  });
  it('applique les parts manuelles', () => {
    const prizes = calculatePrizes(1000, 10, {
      ...baseConfig,
      distributionMode: 'manual',
      manualShares: [70, 30],
    });
    expect(prizes.map(p => p.amount)).toEqual([700, 300]);
  });
});

describe('valeurs par défaut', () => {
  it.each([1, 3, 7])('somment à 100%% (%i places)', (J) => {
    expect(sum(defaultManualShares(J))).toBeCloseTo(100, 5);
    expect(sum(defaultPaliers(J).map(p => p.totalPct))).toBeCloseTo(100, 5);
  });
});
