import { describe, it, expect } from 'vitest';
import { activeChip, bigBlindOptions, chipSet, generateBlindStructure, levelBlinds, smallBlindFor, stackOptions, stepBigBlind } from '../blinds';
import { validateBlindStructure } from '../tournamentEstimator';
import { STACK_VALUES } from '../presets';

const game = (opts: Parameters<typeof generateBlindStructure>[0]) => generateBlindStructure(opts).filter(l => !l.isBreak);

describe('jetons en jeu', () => {
  it('part du plus petit jeton puis des dénominations courantes qui en sont multiples', () => {
    expect(chipSet(25)).toEqual([25, 100, 500, 1000, 5000, 25000, 100000]);
    expect(chipSet(10)).toEqual([10, 100, 500, 1000, 5000, 25000, 100000]);
  });
  it('retire un petit jeton quand la grosse blinde dépasse 40 fois sa valeur', () => {
    const chips = chipSet(25);
    expect(activeChip(800, chips)).toBe(25);
    expect(activeChip(1000, chips)).toBe(100);
    expect(activeChip(4000, chips)).toBe(500);
  });
});

describe('petite blinde', () => {
  it('vaut la moitié de la grosse quand les jetons le permettent', () => {
    expect(smallBlindFor(300, 25)).toBe(150);
  });
  it('passe aux 2/3 quand la moitié est injouable : 1 000-1 500, jamais 750-1 500', () => {
    expect(smallBlindFor(1500, 500)).toBe(1000);
    expect(smallBlindFor(1500, 100)).toBe(1000);
  });
  it('écarte une grosse blinde sans petite blinde jouable', () => {
    expect(smallBlindFor(2500, 1000)).toBeNull();
  });
});

describe('roulettes', () => {
  it('ne propose que des grosses blindes dont la moitié est un multiple du jeton', () => {
    for (const chip of [1, 5, 10, 25, 50, 100]) {
      const options = bigBlindOptions(chip, 10000);
      expect(options.length).toBeGreaterThan(0);
      options.forEach(bb => expect((bb / 2) % chip).toBe(0));
    }
  });
  it('ne propose que des tapis faisables avec le plus petit jeton', () => {
    stackOptions(STACK_VALUES, 100).forEach(s => {
      expect(s % 100).toBe(0);
      expect(s).toBeGreaterThanOrEqual(4000);
    });
  });
});

describe('generateBlindStructure', () => {
  const cases = [
    { startingStack: 10000, smallestChip: 25, startBigBlind: 100, playerCount: 10 },
    { startingStack: 10000, smallestChip: 25, startBigBlind: 100, playerCount: 40 },
    { startingStack: 100000, smallestChip: 100, startBigBlind: 1000, playerCount: 12 },
    { startingStack: 20000, smallestChip: 100, startBigBlind: 200, targetMinutes: 60, levelMinutes: 8 },
    { startingStack: 1500, smallestChip: 5, startBigBlind: 20, playerCount: 6 },
    { startingStack: 30000, smallestChip: 25, startBigBlind: 150, targetMinutes: 300, levelMinutes: 25 },
  ];

  it.each(cases)('blindes jouables avec les jetons encore en jeu (%o)', opts => {
    const chips = chipSet(opts.smallestChip);
    expect(validateBlindStructure(generateBlindStructure(opts), opts.smallestChip)).toEqual([]);
    for (const l of game(opts)) {
      const chip = activeChip(l.bigBlind, chips);
      expect(l.smallBlind % chip === 0 || l === game(opts)[0]).toBe(true);
      expect([l.bigBlind / 2, (l.bigBlind * 2) / 3]).toContain(l.smallBlind);
      if (l.ante) expect(l.ante % chip).toBe(0);
    }
  });

  it.each(cases)('montée strictement croissante, au plus ×2 par niveau (%o)', opts => {
    const levels = game(opts);
    expect(levels[0].bigBlind).toBe(opts.startBigBlind);
    for (let i = 1; i < levels.length; i++) {
      expect(levels[i].bigBlind).toBeGreaterThan(levels[i - 1].bigBlind);
      expect(levels[i].bigBlind).toBeLessThanOrEqual(levels[i - 1].bigBlind * 2);
      expect(levels[i].smallBlind).toBeGreaterThan(levels[i - 1].smallBlind);
    }
  });

  it('monte plus vite quand il y a plus de joueurs', () => {
    const last = (n: number) => game({ startingStack: 10000, smallestChip: 25, startBigBlind: 100, playerCount: n }).at(-1)!.bigBlind;
    expect(last(40)).toBeGreaterThan(last(10));
  });

  it('insère une pause tous les 4 niveaux de jeu et numérote en continu', () => {
    const structure = generateBlindStructure({ startingStack: 10000, smallestChip: 25 });
    expect(structure[4].isBreak).toBe(true);
    structure.forEach((l, i) => expect(l.level).toBe(i + 1));
  });

  it('cale une grosse blinde de départ injouable sur la valeur jouable la plus proche', () => {
    expect(game({ startingStack: 10000, smallestChip: 25, startBigBlind: 40 })[0].bigBlind).toBe(50);
  });
});

describe('éditeur', () => {
  const chips = chipSet(25);
  it('avance par grosses blindes jouables', () => {
    expect(stepBigBlind(800, 1, chips)).toBe(1000);
    expect(stepBigBlind(1000, 1, chips)).toBe(1200);
    expect(stepBigBlind(50, -1, chips)).toBeNull();
  });
  it('recalcule la petite blinde et l\'ante selon les jetons en jeu', () => {
    expect(levelBlinds(1500, chips, true)).toEqual({ smallBlind: 1000, bigBlind: 1500, ante: 200 });
    expect(levelBlinds(300, chips, false)).toEqual({ smallBlind: 150, bigBlind: 300, ante: 0 });
  });
});

describe('re-entry', () => {
  it('fait monter les blindes plus haut : plus de jetons en jeu', () => {
    const base = { startingStack: 10000, smallestChip: 25, startBigBlind: 100, playerCount: 10 };
    const top = (s: ReturnType<typeof generateBlindStructure>) => s.filter(l => !l.isBreak).at(-1)!.bigBlind;
    expect(top(generateBlindStructure({ ...base, reEntry: { maxLevel: 6, maxPerPlayer: 0 } })))
      .toBeGreaterThanOrEqual(top(generateBlindStructure(base)));
  });
});
