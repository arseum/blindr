import { describe, it, expect } from 'vitest';
import { bubbleState, bubbleBurst } from '../bubble';
import { PRESETS, nearestValue, depthLabel } from '../presets';
import { bigBlindOptions, generateBlindStructure } from '../blinds';
import { estimateTournament } from '../tournamentEstimator';

describe('bulle', () => {
  it('détecte avant, pendant et après la bulle', () => {
    expect(bubbleState(8, 4)).toBe('before');
    expect(bubbleState(5, 4)).toBe('bubble');
    expect(bubbleState(4, 4)).toBe('itm');
  });
  it('éclate seulement au passage bulle → payés', () => {
    expect(bubbleBurst('bubble', 'itm')).toBe(true);
    expect(bubbleBurst('before', 'itm')).toBe(false);
    expect(bubbleBurst('bubble', 'bubble')).toBe(false);
  });
  it('ignore un tournoi sans place payée ou avec une seule (finale)', () => {
    expect(bubbleState(3, 0)).toBe('before');
    expect(bubbleState(2, 1)).toBe('before');
  });
});

describe('formules', () => {
  it.each(PRESETS)('$name : structure cohérente avec la grosse blinde choisie', p => {
    const bb = nearestValue(bigBlindOptions(25, 10000), 10000 / p.depthBB);
    const structure = generateBlindStructure({ startingStack: 10000, smallestChip: 25, startBigBlind: bb, targetMinutes: p.targetMinutes, levelMinutes: p.levelMinutes });
    const first = structure[0];
    expect(first.bigBlind).toBe(bb);
    expect(structure.filter(l => !l.isBreak).every(l => l.duration === Math.max(5, p.levelMinutes))).toBe(true);
  });
  it.each(PRESETS)('$name : fin estimée proche de la cible, avec des niveaux de réserve', p => {
    const bb = nearestValue(bigBlindOptions(25, 10000), 10000 / p.depthBB);
    const structure = generateBlindStructure({ startingStack: 10000, smallestChip: 25, startBigBlind: bb, targetMinutes: p.targetMinutes, levelMinutes: p.levelMinutes });
    const estimate = estimateTournament(structure, 9, 10000, 9, null);
    expect(Math.abs(estimate.estimatedDurationMinutes - p.targetMinutes)).toBeLessThanOrEqual(p.targetMinutes * 0.15);
    expect(structure.length - 1 - estimate.estimatedEndLevel).toBeGreaterThanOrEqual(2);
  });
  it('choisit la valeur la plus proche', () => {
    expect(nearestValue([100, 150, 200], 133)).toBe(150);
  });
  it('décrit la profondeur', () => {
    expect(depthLabel(100)).toMatch(/Confortable/);
    expect(depthLabel(30)).toMatch(/Turbo/);
  });
});
