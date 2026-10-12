import type { BlindLevel, ReEntryConfig } from '../types';
import { nearestValue } from './presets';
import { estimateTournament } from './tournamentEstimator';

/**
 * Calcul des blindes « de vrai poker ».
 *
 * - Les grosses blindes suivent l'échelle usuelle (1, 1,2, 1,5, 2, 2,5, 3, 4, 5, 6, 8 × 10ⁿ).
 * - Les petits jetons quittent la table au fil du tournoi (« chip race ») : un jeton part
 *   dès qu'il vaut 1/20 de la petite blinde ou moins, soit une grosse blinde ≥ 40 × le jeton.
 * - Petite blinde = moitié de la grosse. Si les jetons encore en jeu ne le permettent pas,
 *   elle vaut les 2/3 (1 000-1 500 et non 750-1 500). Sinon, la valeur est écartée.
 * - La vitesse de montée est calée pour que la fin estimée tombe sur la durée visée,
 *   puis des niveaux de réserve suivent.
 */

const NICE = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8];

/** Échelle des grosses blindes possibles (2 à 8 000 000). */
const BLIND_LADDER = Array.from({ length: 7 }, (_, k) => NICE.map(m => Math.round(m * 10 ** k)))
  .flat()
  .filter(v => v >= 2);

/** Dénominations courantes des mallettes. */
const STANDARD_CHIPS = [1, 5, 25, 100, 500, 1000, 5000, 25000, 100000];

/** Jetons en jeu en début de tournoi : le plus petit, puis les dénominations courantes qui en sont multiples. */
export function chipSet(smallestChip: number): number[] {
  const chip = Math.max(1, smallestChip);
  return [chip, ...STANDARD_CHIPS.filter(d => d > chip && d % chip === 0)];
}

/** Plus petit jeton encore sur la table quand la grosse blinde vaut `bigBlind`. */
export function activeChip(bigBlind: number, chips: number[]): number {
  let i = 0;
  while (i < chips.length - 1 && chips[i] * 40 <= bigBlind) i++;
  return chips[i];
}

/** Petite blinde jouable avec le jeton `chip`, ou null si la grosse blinde ne s'y prête pas. */
export function smallBlindFor(bigBlind: number, chip: number): number | null {
  if (bigBlind % (2 * chip) === 0) return bigBlind / 2;
  if (bigBlind % (3 * chip) === 0) return (bigBlind / 3) * 2;
  return null;
}

/** Ante classique ≈ 10 % de la grosse blinde, en jetons entiers. */
export function anteFor(bigBlind: number, chip: number): number {
  return Math.max(chip, Math.round(bigBlind / 10 / chip) * chip);
}

/** Tapis proposés : multiples du plus petit jeton, et au moins 40 de ces jetons. */
export function stackOptions(values: number[], smallestChip: number): number[] {
  const ok = values.filter(s => s % smallestChip === 0 && s >= smallestChip * 40);
  return ok.length ? ok : [values[values.length - 1]];
}

/** Grosses blindes de départ proposées : petite blinde = 1 jeton entier ou plus, tapis de 10 à 400 BB. */
export function bigBlindOptions(smallestChip: number, stack: number): number[] {
  const ok = BLIND_LADDER.filter(bb => bb % (2 * smallestChip) === 0 && stack / bb >= 10 && stack / bb <= 400);
  return ok.length ? ok : [2 * smallestChip];
}

export interface StructureOptions {
  startingStack: number;
  smallestChip: number;
  /** Grosse blinde du niveau 1 (défaut : 1 % du tapis). */
  startBigBlind?: number;
  /** Durée visée : le tournoi doit se terminer vers ce moment. */
  targetMinutes?: number;
  levelMinutes?: number;
  /** Joueurs attendus (défaut 9 tant que la liste est vide). */
  playerCount?: number;
  maxPlayersPerTable?: number;
  reEntry?: ReEntryConfig | null;
}

/** Nombre de joueurs pris par défaut tant que la liste n'est pas remplie. */
export const DEFAULT_FIELD = 9;
/** Niveaux de réserve : on continue jusqu'à ce que les jetons en jeu ne valent plus que ce nombre de grosses blindes. */
const RESERVE_DEPTH_TOTAL = 8;
const MAX_GAME_LEVELS = 40;
/** Écart (en log) toléré pour préférer une petite blinde à la moitié de la grosse. */
const TWO_THIRDS_PENALTY = 0.1;

/** Blindes et ante d'un niveau dont la grosse blinde vaut `bigBlind`. */
export function levelBlinds(bigBlind: number, chips: number[], withAnte: boolean) {
  const chip = activeChip(bigBlind, chips);
  return {
    smallBlind: smallBlindFor(bigBlind, chip) ?? smallBlindFor(bigBlind, chips[0]) ?? bigBlind / 2,
    bigBlind,
    ante: withAnte ? anteFor(bigBlind, chip) : 0,
  };
}

/**
 * Structure calée sur la durée visée : on essaie plusieurs vitesses de montée et on garde celle dont
 * la fin estimée (`estimateTournament`, re-entry compris) tombe au plus près de `targetMinutes`.
 * Des niveaux de réserve suivent, pour que le chrono ne s'arrête pas si la partie traîne.
 */
export function generateBlindStructure({
  startingStack,
  smallestChip,
  startBigBlind,
  targetMinutes = 180,
  levelMinutes = 20,
  playerCount,
  maxPlayersPerTable = 9,
  reEntry = null,
}: StructureOptions): BlindLevel[] {
  const chips = chipSet(smallestChip);
  const lvDur = Math.max(5, Math.round(levelMinutes));
  // Pauses proportionnées aux niveaux (5 à 15 min), une après chaque tranche de 4 niveaux de jeu
  const breakDur = Math.min(15, Math.max(5, lvDur));

  // Niveau 1 : la grosse blinde demandée, calée sur une valeur jouable
  const options = bigBlindOptions(chips[0], startingStack);
  const startBB = (startBigBlind && options.includes(startBigBlind))
    ? startBigBlind
    : nearestValue(options, startBigBlind ?? startingStack / 100);

  const field = playerCount && playerCount >= 2 ? playerCount : DEFAULT_FIELD;
  const totalChips = field * startingStack;

  // Montée complète, jusqu'à ce que tous les jetons ne valent plus qu'une grosse blinde
  const build = (ratio: number): BlindLevel[] => {
    const result: BlindLevel[] = [];
    let bb = startBB;
    let elapsed = 0;
    for (let i = 0; i < MAX_GAME_LEVELS; i++) {
      if (i > 0) {
        const next = bb < totalChips ? nextBigBlind(bb, startBB * Math.pow(ratio, i), chips) : null;
        if (!next) break;
        bb = next;
      }
      // Antes à partir de la deuxième moitié de la durée visée
      const withAnte = elapsed >= targetMinutes / 2;
      const blinds = i === 0
        ? { smallBlind: bb / 2, bigBlind: bb, ante: withAnte ? anteFor(bb, chips[0]) : 0 }
        : levelBlinds(bb, chips, withAnte);
      result.push({ level: result.length + 1, ...blinds, duration: lvDur });
      elapsed += lvDur;
      if ((i + 1) % 4 === 0) {
        result.push({ level: result.length + 1, smallBlind: 0, bigBlind: 0, ante: 0, duration: breakDur, isBreak: true });
        elapsed += breakDur;
      }
    }
    if (result.at(-1)?.isBreak) result.pop();
    return result;
  };

  let best = { structure: [] as BlindLevel[], endLevel: 0, gap: Infinity };
  for (let ratio = 1.15; ratio <= 2.001; ratio += 0.025) {
    const structure = build(ratio);
    const estimate = estimateTournament(structure, field, startingStack, maxPlayersPerTable, reEntry);
    const gap = Math.abs(estimate.estimatedDurationMinutes - targetMinutes);
    if (gap < best.gap) best = { structure, endLevel: estimate.estimatedEndLevel, gap };
  }

  // Réserve : au moins 2 niveaux de jeu après la fin estimée, et jusqu'à ce que les jetons en jeu
  // ne valent plus que RESERVE_DEPTH_TOTAL grosses blindes
  const { structure, endLevel } = best;
  let cut = endLevel;
  let extra = 0;
  while (cut < structure.length - 1 && (extra < 2 || structure[cut].isBreak || structure[cut].bigBlind * RESERVE_DEPTH_TOTAL < totalChips)) {
    cut++;
    if (!structure[cut].isBreak) extra++;
  }
  return structure.slice(0, cut + 1);
}

/**
 * Grosse blinde jouable suivante (`direction` = 1) ou précédente (-1) dans l'échelle.
 * Sert à l'éditeur : on ne peut saisir que des valeurs jouables.
 */
export function stepBigBlind(bigBlind: number, direction: 1 | -1, chips: number[]): number | null {
  const playable = BLIND_LADDER.filter(c => c >= 2 * chips[0] && smallBlindFor(c, activeChip(c, chips)) !== null);
  return direction === 1
    ? playable.find(c => c > bigBlind) ?? null
    : playable.filter(c => c < bigBlind).at(-1) ?? null;
}

/** Grosse blinde d'un niveau ajouté à la main après `prev` (montée ×1,5). */
export function followingBigBlind(prev: number, chips: number[]): number {
  return nextBigBlind(prev, prev * 1.5, chips) ?? prev * 2;
}

/**
 * Valeur jouable de l'échelle la plus proche de `target`, strictement au-dessus de `prev` et au plus ×2.
 * Une petite blinde aux 2/3 n'est retenue que si elle colle nettement mieux à la progression.
 */
function nextBigBlind(prev: number, target: number, chips: number[]): number | null {
  const sb = (c: number) => smallBlindFor(c, activeChip(c, chips));
  // La petite blinde monte aussi : pas de 1000/1500 suivi de 1000/2000
  const prevSB = sb(prev) ?? prev / 2;
  const playable = BLIND_LADDER.filter(c => c > prev && (sb(c) ?? 0) > prevSB);
  const inRange = playable.filter(c => c <= prev * 2);
  const pool = inRange.length ? inRange : playable.slice(0, 1);
  if (!pool.length) return null;
  const score = (c: number) => Math.abs(Math.log(c / target)) + (sb(c) === c / 2 ? 0 : TWO_THIRDS_PENALTY);
  return pool.reduce((best, c) => (score(c) < score(best) ? c : best));
}
