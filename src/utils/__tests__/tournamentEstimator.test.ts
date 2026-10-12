import { describe, it, expect } from 'vitest';
import { validateBlindStructure, estimateTournament } from '../tournamentEstimator';
import { generateBlindStructure } from '../blinds';

describe('validateBlindStructure', () => {
  it('signale les valeurs non multiples', () => {
    const errors = validateBlindStructure(
      [{ level: 1, smallBlind: 30, bigBlind: 50, ante: 0, duration: 20 }],
      25,
    );
    expect(errors).toEqual([{ levelIndex: 0, field: 'smallBlind', value: 30 }]);
  });
});

describe('estimateTournament', () => {
  const structure = generateBlindStructure({ startingStack: 10000, smallestChip: 25, targetMinutes: 240, levelMinutes: 20 });

  it('fait décroître le nombre de joueurs', () => {
    const { levels } = estimateTournament(structure, 30, 10000, 9, null);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i].playersRemaining).toBeLessThanOrEqual(levels[i - 1].playersRemaining);
    }
  });
  it('allonge le tournoi avec le re-entry', () => {
    const without = estimateTournament(structure, 30, 10000, 9, null);
    const withRe = estimateTournament(structure, 30, 10000, 9, { maxLevel: 6, maxPerPlayer: 0 });
    expect(withRe.estimatedDurationMinutes).toBeGreaterThanOrEqual(without.estimatedDurationMinutes);
  });
  it('gère un champ trop petit', () => {
    expect(estimateTournament(structure, 1, 10000, 9, null).levels).toEqual([]);
  });
});
