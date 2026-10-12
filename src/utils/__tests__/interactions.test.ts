import { describe, it, expect } from 'vitest';
import { bubbleState, bubbleBurst } from '../bubble';
import { PRESETS, nearestValue, depthLabel, BIG_BLIND_VALUES } from '../presets';
import { generateBlindStructure } from '../tournamentEstimator';

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
    const bb = nearestValue(BIG_BLIND_VALUES, 10000 / p.depthBB);
    const structure = generateBlindStructure(10000, 25, p.targetMinutes, p.levelMinutes, bb);
    const first = structure[0];
    expect(first.bigBlind).toBe(bb);
    expect(structure.filter(l => !l.isBreak).every(l => l.duration === Math.max(5, p.levelMinutes))).toBe(true);
  });
  it.each(PRESETS)('$name : durée totale proche de la cible', p => {
    const structure = generateBlindStructure(10000, 25, p.targetMinutes, p.levelMinutes, 100);
    const total = structure.reduce((s, l) => s + l.duration, 0);
    expect(Math.abs(total - p.targetMinutes)).toBeLessThanOrEqual(p.levelMinutes);
  });
  it('arrondit la grosse blinde au plus petit jeton', () => {
    expect(generateBlindStructure(10000, 25, 180, 20, 40)[0].bigBlind).toBe(50);
  });
  it('choisit la valeur la plus proche', () => {
    expect(nearestValue(BIG_BLIND_VALUES, 133)).toBe(150);
  });
  it('décrit la profondeur', () => {
    expect(depthLabel(100)).toMatch(/Confortable/);
    expect(depthLabel(30)).toMatch(/Turbo/);
  });
});
