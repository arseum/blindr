import type { BlindLevel, ReEntryConfig } from '../types';

/**
 * Génère une structure de blindes automatique.
 * - BB de départ ≈ 1% du stack, arrondi au plus petit jeton
 * - Progression x1.5 par niveau, arrondie au plus petit jeton
 * - Pauses (5 à 15 min selon la durée des niveaux) après chaque tranche de 4 niveaux de jeu
 * - Antes à partir du niveau 7 (≈ 10% de la BB)
 *
 * @param levelDurationMinutes  Durée souhaitée par niveau (défaut 20 min)
 * @param startBigBlind         Grosse blinde du niveau 1 (défaut : 1 % du tapis, soit 100 BB)
 */
export function generateBlindStructure(
  startingStack: number,
  smallestChip: number,
  targetDurationMinutes = 180,
  levelDurationMinutes = 20,
  startBigBlind?: number
): BlindLevel[] {
  const chip = Math.max(1, smallestChip);
  const roundTo = (n: number) => Math.max(chip, Math.round(n / chip) * chip);
  const lvDur = Math.max(5, Math.round(levelDurationMinutes));

  // Pauses proportionnées aux niveaux (5 à 15 min), une après chaque tranche de 4 niveaux de jeu
  const breakDur = Math.min(15, Math.max(5, lvDur));
  const totalFor = (levels: number) => levels * lvDur + Math.floor((levels - 1) / 4) * breakDur;
  // Plus grand nombre de niveaux qui tient dans la durée visée (à un demi-niveau près)
  let GAME_LEVELS = Math.max(4, Math.round(targetDurationMinutes / lvDur));
  while (GAME_LEVELS > 4 && totalFor(GAME_LEVELS) > targetDurationMinutes + lvDur / 2) GAME_LEVELS--;
  GAME_LEVELS = Math.min(24, GAME_LEVELS);

  const startBB = roundTo(startBigBlind ?? startingStack * 0.01);
  const result: BlindLevel[] = [];
  let gameLevel = 0;

  for (let i = 0; i < GAME_LEVELS; i++) {
    const bb = roundTo(startBB * Math.pow(1.5, i));
    const sb = roundTo(bb / 2);
    const ante = i >= 6 ? roundTo(bb * 0.1) : 0;

    result.push({
      level: result.length + 1,
      smallBlind: sb,
      bigBlind: bb,
      ante,
      duration: lvDur,
    });
    gameLevel++;

    if (gameLevel % 4 === 0 && gameLevel < GAME_LEVELS) {
      result.push({
        level: result.length + 1,
        smallBlind: 0,
        bigBlind: 0,
        ante: 0,
        duration: breakDur,
        isBreak: true,
      });
    }
  }

  return result;
}

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

/**
 * Estime la durée et le nombre de joueurs restants par niveau.
 * Modèle basé sur le M-ratio (Paul Magriel) avec décroissance exponentielle.
 *
 * survivalRate(L) = e^(-mains_niveau / (avgM × joueurs_à_table))
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

  // Suivi re-entry par "slot joueur" (approximation : on alloue les re-entries aux premiers slots)
  const reEntriesUsed = new Array(playerCount).fill(0);

  let totalChips = playerCount * startingStack;
  let playersRemaining = playerCount;
  const levels: LevelEstimate[] = [];

  let estimatedEndLevel = structure.length - 1;
  let estimatedDurationMinutes = totalDurationMinutes;
  let cumulativeDuration = 0;
  let endFound = false;

  for (let i = 0; i < structure.length; i++) {
    const level = structure[i];
    cumulativeDuration += level.duration;

    if (level.isBreak) {
      levels.push({ levelIndex: i, isBreak: true, playersRemaining, avgM: 0 });
      continue;
    }

    const roundCost = level.smallBlind + level.bigBlind + level.ante;
    if (roundCost === 0) {
      levels.push({ levelIndex: i, isBreak: false, playersRemaining, avgM: 999 });
      continue;
    }

    const avgStack = totalChips / playersRemaining;
    const avgM = avgStack / roundCost;
    const playersAtTable = Math.min(maxPlayersPerTable, playersRemaining);
    const handsInLevel = (level.duration * handsPerHour) / 60;

    // Survie : e^(-mains / (M * joueurs_à_table))
    const survivalRate = Math.exp(-handsInLevel / (avgM * playersAtTable));
    const newPlayers = Math.max(1, Math.round(playersRemaining * survivalRate));
    const eliminated = playersRemaining - newPlayers;

    // Re-entry : ajouter des chips pour les éliminés qui peuvent revenir
    // Niveau 1-indexed pour comparaison avec maxLevel
    if (reEntry && (i + 1) <= reEntry.maxLevel && eliminated > 0) {
      let reEnterers = 0;
      for (let p = 0; p < eliminated && p < playerCount; p++) {
        const maxRe = reEntry.maxPerPlayer === 0 ? Infinity : reEntry.maxPerPlayer;
        if (reEntriesUsed[p] < maxRe) {
          reEntriesUsed[p]++;
          reEnterers++;
        }
      }
      totalChips += reEnterers * startingStack;
    }

    levels.push({ levelIndex: i, isBreak: false, playersRemaining: newPlayers, avgM });

    if (!endFound && playersRemaining > 1 && newPlayers <= 1) {
      estimatedEndLevel = i;
      estimatedDurationMinutes = cumulativeDuration;
      endFound = true;
    }

    playersRemaining = newPlayers;
  }

  return {
    totalDurationMinutes,
    estimatedEndLevel,
    estimatedDurationMinutes,
    levels,
  };
}
