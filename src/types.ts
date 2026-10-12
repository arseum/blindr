export type Page = 'setup' | 'tournament' | 'tables' | 'history';

export interface Player {
  id: string;
  name: string;
  tableId: string;
  isEliminated: boolean;
  eliminatedAt?: number; // level index
  position?: number; // finish position
}

export interface Table {
  id: string;
  name: string;
  playerIds: string[];
}

export interface BlindLevel {
  level: number;
  smallBlind: number;
  bigBlind: number;
  ante: number;
  duration: number; // minutes
  isBreak?: boolean;
}

// ─── Kill system ─────────────────────────────────────────────────────────────
// Type union is intentionally narrow; extend as new modes are added.
export type KillSystemType = 'fixed'; // future: 'progressive' | 'bounty' | 'last-longer'

export interface KillSystemConfig {
  type: KillSystemType;
  amountPerKill: number; // for 'fixed': flat amount paid per elimination
}

// ─── Prize pool ───────────────────────────────────────────────────────────────
export type DistributionMode = 'auto' | 'paliers' | 'manual';

export interface PalierEntry {
  fromPosition: number; // 1-indexed
  toPosition: number;   // 1-indexed, inclusive
  totalPct: number;     // % total for this range, split equally among positions
}

export interface PrizePoolConfig {
  // Buy-in split (must sum to 100)
  prizePoolPct: number; // % of buy-in → prize pool (mandatory)
  killPct: number;      // % of buy-in → kill pot (0 = disabled)
  rakePct: number;      // % of buy-in → rake / house (0 = disabled)

  // ITM
  itmPct: number; // % of players that get paid (e.g. 15 for 15%)

  // Distribution
  distributionMode: DistributionMode;
  paliers: PalierEntry[];
  manualShares: number[]; // index 0 = 1st place, values are %, should sum to 100

  // Kill system details (relevant when killPct > 0)
  killSystem: KillSystemConfig;
}

export interface ReEntryConfig {
  maxLevel: number;      // dernier niveau autorisé (1-indexed)
  maxPerPlayer: number;  // 0 = illimité
}

export interface TournamentConfig {
  name: string;
  buyIn: number;
  startingStack: number;
  maxPlayersPerTable: number;
  blindStructure: BlindLevel[];
  prizePool: PrizePoolConfig;
  smallestChip: number;
  reEntry: ReEntryConfig | null;
}

export interface TournamentState {
  id: string;
  config: TournamentConfig;
  players: Player[];
  tables: Table[];
  currentLevelIndex: number;
  secondsRemaining: number;
  isRunning: boolean;
  isPaused: boolean;
  isEnded: boolean;
  startedAt: number | null;
  lastTickAt: number | null; // horodatage du dernier tick appliqué, pour rattraper le temps écoulé app fermée
  rebuyCount: number;
}

export interface HistoryEntry {
  id: string;
  name: string;
  date: number;
  buyIn: number;
  playerCount: number;
  rebuyCount: number;
  totalPot: number;
  duration: number; // minutes
  placements: Array<{ playerName: string; position: number; prize: number }>;
}
