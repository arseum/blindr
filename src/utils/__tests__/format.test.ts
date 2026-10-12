import { describe, it, expect } from 'vitest';
import { formatChips, formatTime } from '../../constants';

// Intl fr-FR sépare les milliers par une espace fine insécable (U+202F)
const nb = (s: string) => s.replace(/ /g, ' ');

describe('formatChips', () => {
  it.each([
    [25, '25'], [1150, '1 150'], [1700, '1 700'], [99999, '99 999'],
    [125000, '125K'], [1250000, '1,25M'], [2000000, '2M'],
  ])('%i → %s', (amount, expected) => {
    expect(nb(formatChips(amount))).toBe(expected);
  });
});

describe('formatTime', () => {
  it('formate en mm:ss', () => {
    expect(formatTime(768)).toBe('12:48');
    expect(formatTime(5)).toBe('00:05');
  });
});
