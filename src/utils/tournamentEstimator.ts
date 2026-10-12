import type { BlindLevel, ReEntryConfig } from '../types';

export interface BlindValidationError {
  levelIndex: number;
  field: 'smallBlind' | 'bigBlind' | 'ante';
  value: number;
}

export interface LevelEstimate {
  levelIndex: number;
  isBreak: boolean;
  playersRemaining: number;
  avgM: number;
}

export interface TournamentEstimate {
  totalDurationMinutes: number;
  estimatedEndLevel: number; // index 0-based
  estimatedDurationMinutes: number;
  levels: LevelEstimate[];
}

/**
 * Retourne les valeurs de blindes non-multiples du plus petit jeton.
 */
export function validateBlindStructure(
  structure: BlindLevel[],
  smallestChip: number
): BlindValidationError[] {
  if (smallestChip <= 0) return [];
  const errors: BlindValidationError[] = [];
  structure.forEach((level, idx) => {
    if (level.isBreak) return;
    if (level.smallBlind % smallestChip !== 0)
      errors.push({ levelIndex: idx, field: 'smallBlind', value: level.smallBlind });
    if (level.bigBlind % smallestChip !== 0)
      errors.push({ levelIndex: idx, field: 'bigBlind', value: level.bigBlind });
    if (level.ante > 0 && level.ante % smallestChip !== 0)
      errors.push({ levelIndex: idx, field: 'ante', value: level.ante });
  });
  return errors;
}

/** Part des joueurs éliminés qui rachètent quand le re-entry est encore ouvert. */
const REENTRY_RATE = 0.6;
/** Le tournoi est fini quand il reste moins de 1,5 joueur (compté en continu). */
const END_PLAYERS = 1.5;

/**
 * Estime la durée et le nombre de joueurs restants par niveau.
 * Modèle basé sur le M-ratio (Paul Magriel) avec décroissance exponentielle :
 *
 *   joueurs(t) = joueurs₀ × e^(-mains(t) / (avgM × joueurs_à_table))
 *
 * Le nombre de joueurs est suivi en continu (pas d'arrondi qui bloquerait la fin à 2 joueurs),
 * les mains vont plus vite quand la table est incomplète, et la fin est interpolée dans le niveau.
 */
export function estimateTournament(
  structure: BlindLevel[],
  playerCount: number,
  startingStack: number,
  maxPlayersPerTable: number,
  reEntry: ReEntryConfig | null,
  handsPerHour = 25
): TournamentEstimate {
  const totalDurationMinutes = structure.reduce((s, l) => s + l.duration, 0);

  if (playerCount < 2 || startingStack <= 0 || structure.length === 0) {
    return {
      totalDurationMinutes,
      estimatedEndLevel: structure.length - 1,
      estimatedDurationMinutes: totalDurationMinutes,
      levels: [],
    };
  }

  let reEntriesLeft = reEntry ? (reEntry.maxPerPlayer === 0 ? Infinity : playerCount * reEntry.maxPerPlayer) : 0;
  let totalChips = playerCount * startingStack;
  let players = playerCount;
  const levels: LevelEstimate[] = [];

  let estimatedEndLevel = structure.length - 1;
  let estimatedDurationMinutes = totalDurationMinutes;
  let elapsed = 0;
  let endFound = false;

  for (let i = 0; i < structure.length; i++) {
    const level = structure[i];
    const roundCost = level.smallBlind + level.bigBlind + level.ante;

    if (level.isBreak || roundCost === 0 || endFound) {
      levels.push({ levelIndex: i, isBreak: !!level.isBreak, playersRemaining: Math.round(players), avgM: level.isBreak ? 0 : 999 });
      elapsed += level.duration;
      continue;
    }

    const avgM = totalChips / players / roundCost;
    const atTable = Math.max(2, Math.min(maxPlayersPerTable, players));
    // Table incomplète : on distribue plus vite (jusqu'à ×2 en tête-à-tête)
    const handsPerMinute = (handsPerHour / 60) * Math.min(2, maxPlayersPerTable / atTable);
    // Taux d'élimination par minute
    const rate = handsPerMinute / (avgM * atTable);

    const after = players * Math.exp(-rate * level.duration);
    if (after < END_PLAYERS) {
      // Fin dans ce niveau : moment où l'on passe sous 1,5 joueur
      estimatedEndLevel = i;
      estimatedDurationMinutes = Math.round(elapsed + Math.log(players / END_PLAYERS) / rate);
      endFound = true;
      players = 1;
    } else {
      // Re-entry : une partie des éliminés rachète un tapis et revient en jeu
      if (reEntry && i + 1 <= reEntry.maxLevel) {
        const back = Math.min(reEntriesLeft, (players - after) * REENTRY_RATE);
        reEntriesLeft -= back;
        totalChips += back * startingStack;
        players = after + back;
      } else {
        players = after;
      }
    }

    levels.push({ levelIndex: i, isBreak: false, playersRemaining: Math.max(1, Math.round(players)), avgM });
    elapsed += level.duration;
  }

  return {
    totalDurationMinutes,
    estimatedEndLevel,
    estimatedDurationMinutes,
    levels,
  };
}
