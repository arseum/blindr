import { describe, it, expect, beforeEach } from 'vitest';
import { useTournamentStore } from '../tournamentStore';
import type { TournamentConfig } from '../../types';

const config = {
  name: 'Test',
  buyIn: 20,
  startingStack: 10000,
  maxPlayersPerTable: 9,
  smallestChip: 25,
  reEntry: null,
  blindStructure: [
    { level: 1, smallBlind: 25, bigBlind: 50, ante: 0, duration: 10 },
    { level: 2, smallBlind: 50, bigBlind: 100, ante: 0, duration: 10 },
    { level: 3, smallBlind: 100, bigBlind: 200, ante: 0, duration: 10 },
  ],
  prizePool: {} as TournamentConfig['prizePool'],
} satisfies TournamentConfig;

const store = () => useTournamentStore.getState();
const t = () => store().tournament!;

describe('tickTimer', () => {
  beforeEach(() => {
    store().initTournament(config, ['A', 'B', 'C']);
    store().startTimer();
  });

  it('décompte et mémorise l\'horodatage du tick', () => {
    store().tickTimer(5, 12345);
    expect(t().secondsRemaining).toBe(595);
    expect(t().lastTickAt).toBe(12345);
  });

  it('rattrape plusieurs niveaux d\'un coup (app fermée)', () => {
    store().tickTimer(600 + 600 + 30, 1);
    expect(t().currentLevelIndex).toBe(2);
    expect(t().secondsRemaining).toBe(570);
  });

  it('s\'arrête à la fin du dernier niveau', () => {
    store().tickTimer(10_000, 1);
    expect(t().isRunning).toBe(false);
    expect(t().secondsRemaining).toBe(0);
  });

  it('ignore les ticks en pause', () => {
    store().pauseTimer();
    store().tickTimer(5, 1);
    expect(t().secondsRemaining).toBe(600);
  });
});

describe('éliminations', () => {
  beforeEach(() => store().initTournament(config, ['A', 'B', 'C']));

  it('attribue la position et la recalcule à l\'annulation', () => {
    const [a, b] = t().players;
    store().eliminatePlayer(a.id); // 3e
    store().eliminatePlayer(b.id); // 2e
    store().undoElimination(a.id);
    const after = t().players;
    expect(after[0].isEliminated).toBe(false);
    expect(after[1].position).toBe(3);
  });
});
