import { describe, it, expect } from 'vitest';
import { levelChip } from '../chips';

const lvl = (bigBlind: number, isBreak = false) => ({ level: 1, smallBlind: bigBlind / 2, bigBlind, ante: 0, duration: 20, isBreak });

describe('levelChip', () => {
  it.each([
    [2, '1'], [10, '10'], [50, '25'], [100, '100'], [400, '100'],
    [1150, '1000'], [6000, '5000'], [250000, '5000'],
  ])('BB %i → jeton %s', (bb, chip) => {
    expect(levelChip(lvl(bb))).toBe(chip);
  });
  it('renvoie break pour une pause', () => {
    expect(levelChip(lvl(0, true))).toBe('break');
  });
});
