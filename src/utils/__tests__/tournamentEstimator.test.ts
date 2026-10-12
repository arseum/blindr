import { describe, it, expect } from 'vitest';
import { generateBlindStructure, validateBlindStructure, estimateTournament } from '../tournamentEstimator';

describe('generateBlindStructure', () => {
  const structure = generateBlindStructure(10000, 25, 180, 20);
  const game = structure.filter(l => !l.isBreak);

  it('produit des blindes multiples du plus petit jeton', () => {
    expect(validateBlindStructure(structure, 25)).toEqual([]);
  });
  it('fait croître la big blind', () => {
    for (let i = 1; i < game.length; i++) {
      expect(game[i].bigBlind).toBeGreaterThanOrEqual(game[i - 1].bigBlind);
    }
  });
  it('insère une pause tous les 4 niveaux de jeu', () => {
    expect(structure[4].isBreak).toBe(true);
  });
  it('numérote les niveaux de façon continue', () => {
    structure.forEach((l, i) => expect(l.level).toBe(i + 1));
  });
});

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
  const structure = generateBlindStructure(10000, 25, 240, 20);

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
