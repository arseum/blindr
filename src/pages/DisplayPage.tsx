import { useEffect, useRef, useState } from 'react';
import { TV_SYNC_KEY } from '../timer';
import { formatTime, formatChips, TV_EFFECT_KEY } from '../constants';
import { calculatePrizes, getPaidPlaces, positionLabel } from '../utils/prizePool';
import { levelChip } from '../utils/chips';
import { LevelTransitionOverlay } from '../components/LevelTransitionOverlay';
import type { TransitionEffect } from '../components/LevelTransitionOverlay';
import type { TournamentState, Player } from '../types';

function readInitialState(): TournamentState | null {
  const syncRaw = localStorage.getItem(TV_SYNC_KEY);
  if (syncRaw) { try { return JSON.parse(syncRaw) as TournamentState; } catch { /* ignore */ } }
  const storeRaw = localStorage.getItem('poker-tournament-state');
  if (storeRaw) { try { return JSON.parse(storeRaw).state?.tournament ?? null; } catch { /* ignore */ } }
  return null;
}

export function DisplayPage() {
  const [tournament, setTournament] = useState<TournamentState | null>(readInitialState);
  const [transition, setTransition] = useState<{ effect: TransitionEffect; label: string } | null>(null);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === TV_SYNC_KEY && e.newValue) {
        try { setTournament(JSON.parse(e.newValue)); } catch { /* ignore */ }
      }
      if (e.key === TV_EFFECT_KEY && e.newValue) {
        try {
          const { effect, label } = JSON.parse(e.newValue);
          setTransition({ effect, label });
        } catch { /* ignore */ }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  if (!tournament) return <DisplayIdle />;
  if (tournament.isEnded) return <EndScreenTV tournament={tournament} />;

  const { config, players, currentLevelIndex, secondsRemaining } = tournament;
  const currentLevel  = config.blindStructure[currentLevelIndex];
  const nextLevel     = config.blindStructure[currentLevelIndex + 1];
  const activePlayers = players.filter(p => !p.isEliminated);
  const totalChips    = (players.length + tournament.rebuyCount) * config.startingStack;
  const avgStack      = activePlayers.length > 0 ? Math.floor(totalChips / activePlayers.length) : 0;
  const totalPot      = (players.length + tournament.rebuyCount) * config.buyIn;
  const prizePoolAmount = Math.round(totalPot * config.prizePool.prizePoolPct / 100);
  const prizes        = calculatePrizes(prizePoolAmount, players.length, config.prizePool);
  const paidPlaces    = getPaidPlaces(players.length, config.prizePool.itmPct);
  const levelProgress = 1 - secondsRemaining / (currentLevel.duration * 60);
  const isWarning     = secondsRemaining <= 60 && !currentLevel.isBreak;

  // Niveau de tremblement 0-6 progressif (monte toutes les ~10s sous la minute)
  const shakeLevel = isWarning ? Math.min(6, Math.floor((60 - secondsRemaining) / 10) + 1) : 0;
  const shakeDuration = [0, 500, 420, 330, 260, 200, 140][shakeLevel];
  const shakeStyle: React.CSSProperties = shakeLevel > 0 ? {
    animation: `tv-shake-${shakeLevel} ${shakeDuration}ms ease-in-out infinite`,
  } : {};

  return (
    <div data-chip={levelChip(currentLevel)} className="min-h-dvh flex flex-col relative overflow-hidden bg-canvas text-ink">
      {transition && (
        <LevelTransitionOverlay
          effect={transition.effect}
          levelLabel={transition.label}
          onDone={() => setTransition(null)}
        />
      )}

      <div
        className={`relative z-10 flex flex-col min-h-dvh${transition?.effect === 'radial' ? ' wave-active' : ''}`}
        style={shakeStyle}
      >
        {/* Top bar */}
        <div data-wave="1" className="flex items-center justify-between px-4 sm:px-10 pt-4 sm:pt-7 pb-2 sm:pb-3 gap-2">
          <div className="text-sm sm:text-xl lg:text-2xl font-semibold text-ink-muted truncate">
            {config.name}
          </div>
          <div className="font-display text-sm sm:text-xl lg:text-3xl font-extrabold uppercase text-accent flex-shrink-0">
            {currentLevel.isBreak ? 'Pause' : `Niveau ${currentLevel.level}`}
          </div>
        </div>

        {/* Center — Timer + Blinds */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-12 gap-3 sm:gap-6">
          <div
            data-wave="0"
            className={`num-display select-none transition-colors ${isWarning ? 'text-danger motion-safe:animate-pulse' : 'text-ink'}`}
            style={{ fontSize: 'clamp(6rem, 28vw, 24rem)' }}
          >
            {formatTime(secondsRemaining)}
          </div>

          {!currentLevel.isBreak && (
            <div data-wave="2" className="flex flex-wrap items-center justify-center gap-3 sm:gap-8 lg:gap-12">
              <BlindBlock label="Petite blinde" value={formatChips(currentLevel.smallBlind)} />
              <div className="text-4xl sm:text-7xl font-thin text-ink-faint">/</div>
              <BlindBlock label="Grosse blinde" value={formatChips(currentLevel.bigBlind)} />
              {currentLevel.ante > 0 && (
                <>
                  <div className="text-4xl sm:text-7xl font-thin text-ink-faint">+</div>
                  <BlindBlock label="Ante" value={formatChips(currentLevel.ante)} accent />
                </>
              )}
            </div>
          )}

          {nextLevel && (
            <div data-wave="3" className="text-ink-muted text-xs sm:text-lg lg:text-xl text-center px-2 num">
              Prochain niveau :{' '}
              {nextLevel.isBreak
                ? 'pause'
                : `${formatChips(nextLevel.smallBlind)} / ${formatChips(nextLevel.bigBlind)}${nextLevel.ante ? ` + ${formatChips(nextLevel.ante)}` : ''}`
              }
              {' '}({nextLevel.duration} min)
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div data-wave="4" className="w-full timer-bar-track">
          <div
            className={`timer-bar-fill${isWarning ? ' timer-bar-warning' : ''}`}
            style={{ width: `${levelProgress * 100}%` }}
          />
        </div>

        {/* Bottom stats */}
        <div data-wave="5" className="grid grid-cols-2 sm:grid-cols-4 border-t border-line bg-surface">
          <StatBlock label="Joueurs" value={String(activePlayers.length)} sub={`/ ${players.length}`} />
          <StatBlock label="Tapis moyen" value={formatChips(avgStack)} />
          <StatBlock label="Pot total" value={`${totalPot} €`} />

          <div className="col-span-2 sm:col-span-1 flex flex-col py-3 sm:py-5 px-3 sm:px-5 border-t border-line sm:border-t-0 min-h-0">
            <div className="text-ink-muted text-xs sm:text-base mb-2 text-center">
              Prize pool <span className="text-ink-faint text-xs num">· {paidPlaces} payés sur {players.length}</span>
            </div>
            <div className="overflow-hidden" style={{ height: '6.5rem' }}>
              <div
                className="flex flex-col gap-1"
                style={prizes.length > 3 ? {
                  animation: `prizeScroll ${prizes.length * 2.5}s ease-in-out infinite alternate`,
                  '--prize-scroll-dist': `-${(prizes.length - 3) * 30}px`,
                } as React.CSSProperties : undefined}
              >
                {prizes.map(({ position, percentage, amount }) => (
                  <div key={position} className="flex items-center gap-2 rounded px-2 py-0.5 text-xs sm:text-sm flex-shrink-0 num">
                    <span className={`font-bold w-6 text-xs ${position <= 3 ? 'text-ink' : 'text-ink-faint'}`}>
                      {positionLabel(position)}
                    </span>
                    <div className="flex-1">
                      <div className="h-1 bg-sunken rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                    <span className="text-ink-faint text-xs w-8 text-right">{percentage}%</span>
                    <span className="font-bold text-xs w-12 text-right text-ink">{amount} €</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ── */

function DisplayIdle() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-6 bg-canvas text-ink px-4 text-center">
      <img src="/favicon.svg" alt="" className="w-20 h-20 sm:w-28 sm:h-28" />
      <div className="font-display font-extrabold" style={{ fontSize: 'clamp(3rem, 9vw, 7rem)', lineHeight: 1 }}>
        blindr
      </div>
      <div className="text-base sm:text-2xl text-ink-muted">
        En attente du tournoi…
      </div>
    </div>
  );
}

function BlindBlock({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="text-center">
      <div className="text-ink-muted text-xs sm:text-lg lg:text-xl mb-1 sm:mb-2">{label}</div>
      <div className={`num-display ${accent ? 'text-accent' : 'text-ink'}`} style={{ fontSize: 'clamp(2.5rem, 8vw, 7rem)' }}>
        {value}
      </div>
    </div>
  );
}

function StatBlock({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center py-4 sm:py-7 border-r border-line last:border-r-0">
      <div className="text-ink-muted text-xs sm:text-base lg:text-lg mb-1 sm:mb-2 text-center px-2">{label}</div>
      <div className="num-display text-ink" style={{ fontSize: 'clamp(2rem, 5vw, 5rem)' }}>
        {value}
      </div>
      {sub && <div className="text-ink-faint text-xs sm:text-base mt-1 num">{sub}</div>}
    </div>
  );
}

/* ── EndScreenTV ── */

const TV_COLORS = ['text-chip-1000', 'text-chip-1', 'text-chip-5000'];
const TV_BORDER = ['border-chip-1000', 'border-chip-1', 'border-chip-5000'];
const TV_BLOCK  = ['bg-chip-1000/15', 'bg-chip-1/12', 'bg-chip-5000/12'];
const TV_ORDER  = [1, 0, 2];

function buildPodiumTV(tournament: TournamentState): Player[] {
  const { players } = tournament;
  const winner = players.find(p => !p.isEliminated) ??
    players.reduce((best, p) => (p.position ?? 99) < (best.position ?? 99) ? p : best);
  const eliminated = players
    .filter(p => p.isEliminated)
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
  return [winner, eliminated[0], eliminated[1]].filter(Boolean) as Player[];
}

function EndScreenTV({ tournament }: { tournament: TournamentState }) {
  const [revealed, setRevealed] = useState<number[]>([]);

  const podium      = buildPodiumTV(tournament);
  const totalPot    = (tournament.players.length + tournament.rebuyCount) * tournament.config.buyIn;
  const prizeAmount = Math.round(totalPot * tournament.config.prizePool.prizePoolPct / 100);
  const prizes      = calculatePrizes(prizeAmount, tournament.players.length, tournament.config.prizePool);
  const getPrize    = (position: number) => prizes.find(p => p.position === position)?.amount ?? 0;
  const nowRef = useRef(Date.now());
  const durationMin = tournament.startedAt
    ? Math.round((nowRef.current - tournament.startedAt) / 60000)
    : 0;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setRevealed([2]),        800));
    timers.push(setTimeout(() => setRevealed([2, 1]),    1600));
    timers.push(setTimeout(() => setRevealed([2, 1, 0]), 2600));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center relative overflow-hidden bg-canvas text-ink">
      <div className="relative z-10 flex flex-col items-center w-full px-4 sm:px-12 gap-2 sm:gap-4">
        <div className="font-display font-extrabold text-center" style={{ fontSize: 'clamp(2rem, 6vw, 5rem)' }}>
          Tournoi terminé
        </div>
        <div className="text-ink-muted text-center num" style={{ fontSize: 'clamp(0.85rem, 2vw, 1.4rem)' }}>
          {tournament.config.name} · {durationMin} min · {totalPot} €
        </div>

        <div className="flex items-end justify-center gap-3 sm:gap-8 xl:gap-14 mt-2 sm:mt-6 w-full">
          {TV_ORDER.map(rankIdx => {
            const player     = podium[rankIdx];
            const prize      = getPrize(rankIdx + 1);
            const isRevealed = revealed.includes(rankIdx);

            if (!player) return <div key={rankIdx} style={{ width: 'clamp(100px, 12vw, 200px)' }} />;

            return (
              <div key={rankIdx} className="flex flex-col items-center"
                style={{
                  opacity:   isRevealed ? 1 : 0,
                  transform: isRevealed ? 'translateY(0)' : 'translateY(60px)',
                  transition: 'opacity 0.8s ease-out, transform 0.8s ease-out',
                }}>
                <div className={`border-2 rounded-card bg-surface shadow-raised text-center ${TV_BORDER[rankIdx]}`}
                  style={{
                    padding: 'clamp(8px, 1.5vw, 24px) clamp(12px, 2.5vw, 40px)',
                    minWidth: rankIdx === 0 ? 'clamp(110px, 14vw, 240px)' : 'clamp(90px, 11vw, 190px)',
                  }}>
                  <div className={`num-display mb-1 ${TV_COLORS[rankIdx]}`} style={{
                    fontSize: rankIdx === 0 ? 'clamp(2.5rem, 8vw, 7rem)'
                            : rankIdx === 1 ? 'clamp(2rem, 6vw, 5.5rem)'
                            : 'clamp(1.7rem, 5vw, 4.5rem)',
                  }}>
                    #{rankIdx + 1}
                  </div>
                  <div className="font-bold truncate" style={{
                    fontSize: 'clamp(0.85rem, 2.2vw, 1.8rem)',
                    maxWidth: 'clamp(90px, 10vw, 180px)',
                  }}>
                    {player.name}
                  </div>
                  {prize > 0 && (
                    <div className="font-bold mt-1 text-success num" style={{ fontSize: 'clamp(0.85rem, 1.8vw, 1.5rem)' }}>
                      {prize} €
                    </div>
                  )}
                </div>
                <div className={`w-full border-2 border-t-0 rounded-b-card ${TV_BORDER[rankIdx]} ${TV_BLOCK[rankIdx]}`} style={{
                  height: rankIdx === 0 ? 'clamp(30px, 4vw, 70px)'
                        : rankIdx === 1 ? 'clamp(20px, 3vw, 48px)'
                        : 'clamp(12px, 2vw, 28px)',
                }} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
