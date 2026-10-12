import { Play, Pause, SkipForward, SkipBack, RotateCcw, Users } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ChipTimer } from '../components/ChipTimer';
import { PageHeader } from '../components/PageHeader';
import { EmptyTournament } from '../components/EmptyTournament';
import { useTournamentStore } from '../store/tournamentStore';
import { formatTime, formatChips } from '../constants';
import { calculatePrizes, getPaidPlaces, positionLabel } from '../utils/prizePool';
import type { BlindLevel, Page } from '../types';

interface TournamentPageProps {
  onNavigate: (page: Page) => void;
}

/** Secondes avant la prochaine pause, ou null s'il n'y en a plus. */
function secondsUntilBreak(structure: BlindLevel[], currentIndex: number, secondsRemaining: number): number | null {
  if (structure[currentIndex]?.isBreak) return null;
  let total = secondsRemaining;
  for (let i = currentIndex + 1; i < structure.length; i++) {
    if (structure[i].isBreak) return total;
    total += structure[i].duration * 60;
  }
  return null;
}

function blindsLabel(level: BlindLevel) {
  return `${formatChips(level.smallBlind)} / ${formatChips(level.bigBlind)}${level.ante ? ` · ante ${formatChips(level.ante)}` : ''}`;
}

export function TournamentPage({ onNavigate }: TournamentPageProps) {
  const { tournament, startTimer, pauseTimer, nextLevel, prevLevel, resetTimer } = useTournamentStore();

  if (!tournament) return <EmptyTournament title="Timer" onNavigate={onNavigate} />;

  const { config, players, currentLevelIndex, secondsRemaining, isRunning } = tournament;
  const structure       = config.blindStructure;
  const currentLevel    = structure[currentLevelIndex];
  const nextLevelData   = structure[currentLevelIndex + 1];
  const activeCount     = players.filter(p => !p.isEliminated).length;
  const totalChips      = (players.length + tournament.rebuyCount) * config.startingStack;
  const avgStack        = activeCount > 0 ? Math.floor(totalChips / activeCount) : 0;
  const totalPot        = (players.length + tournament.rebuyCount) * config.buyIn;
  const prizePoolAmount = Math.round(totalPot * config.prizePool.prizePoolPct / 100);
  const prizes          = calculatePrizes(prizePoolAmount, players.length, config.prizePool);
  const paidPlaces      = getPaidPlaces(players.length, config.prizePool.itmPct);
  const isWarning       = secondsRemaining <= 60 && !currentLevel.isBreak;
  const breakIn         = secondsUntilBreak(structure, currentLevelIndex, secondsRemaining);
  const isLastLevel     = currentLevelIndex >= structure.length - 1;

  return (
    <div className="px-4 lg:px-8 max-w-6xl mx-auto">
      <PageHeader
        title={config.name}
        subtitle={<>{isRunning ? 'En cours' : 'En pause'} · {activeCount} / {players.length} joueurs</>}
      />

      <div className="grid gap-4 md:gap-6 md:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] short:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] short:gap-4 pb-6">

        {/* ── Timer ── */}
        <section aria-label="Niveau en cours" className="flex flex-col gap-4 short:gap-2 md:bg-surface md:rounded-card md:border md:border-line md:shadow-raised md:p-6 short:md:p-0 short:md:bg-transparent short:md:border-0 short:md:shadow-none">
          <div className="font-display text-2xl short:text-lg font-extrabold uppercase text-accent">
            {currentLevel.isBreak ? 'Pause' : `Niveau ${currentLevel.level}`}
          </div>

          <div
            className={`num-display text-[clamp(5.5rem,30vw,9rem)] md:text-[clamp(6rem,13vw,11rem)] short:text-[22vh] ${isWarning ? 'text-danger' : 'text-ink'}`}
          >
            {formatTime(secondsRemaining)}
          </div>

          <ChipTimer totalSeconds={currentLevel.duration * 60} secondsRemaining={secondsRemaining} />

          {currentLevel.isBreak ? (
            <p className="text-ink-muted num">
              Reprise {nextLevelData ? <>en <b className="text-ink">{blindsLabel(nextLevelData)}</b></> : 'au dernier niveau'}
            </p>
          ) : (
            <div className="flex items-end gap-x-6 gap-y-2 flex-wrap">
              <Blind label="Petite blinde" value={formatChips(currentLevel.smallBlind)} />
              <Blind label="Grosse blinde" value={formatChips(currentLevel.bigBlind)} />
              {currentLevel.ante > 0 && <Blind label="Ante" value={formatChips(currentLevel.ante)} accent />}
            </div>
          )}

          <div className="flex items-center justify-center gap-5 pt-2 short:pt-0 short:justify-start">
            <RoundButton label="Niveau précédent" onClick={prevLevel} disabled={currentLevelIndex === 0}>
              <SkipBack size={22} />
            </RoundButton>
            <button
              onClick={isRunning ? pauseTimer : startTimer}
              aria-label={isRunning ? 'Mettre en pause' : 'Lancer le timer'}
              className={`grid place-items-center w-20 h-20 short:w-16 short:h-16 rounded-[22px] short:rounded-[18px] transition-[filter,transform] active:scale-95 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${isRunning ? 'bg-ink text-canvas' : 'bg-accent text-on-accent'}`}
            >
              {isRunning ? <Pause size={32} fill="currentColor" /> : <Play size={32} fill="currentColor" className="ml-1" />}
            </button>
            <RoundButton label="Niveau suivant" onClick={nextLevel} disabled={isLastLevel}>
              <SkipForward size={22} />
            </RoundButton>
          </div>
          <button
            onClick={resetTimer}
            className="self-center short:self-start inline-flex items-center gap-1.5 min-h-11 px-3 text-sm text-ink-muted hover:text-ink rounded-control"
          >
            <RotateCcw size={15} /> Recommencer le niveau
          </button>
        </section>

        {/* ── Infos ── */}
        <aside className="flex flex-col gap-3">
          {nextLevelData && (
            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-card bg-surface border border-line">
              <span className="text-ink-muted text-sm">
                {nextLevelData.isBreak ? 'Ensuite' : `Niveau ${nextLevelData.level}`}
              </span>
              <span className="font-semibold num text-right">
                {nextLevelData.isBreak ? `Pause ${nextLevelData.duration} min` : blindsLabel(nextLevelData)}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Stat label="Joueurs" value={`${activeCount} / ${players.length}`} />
            <Stat label="Tapis moyen" value={formatChips(avgStack)} />
            <Stat label="Prize pool" value={`${prizePoolAmount} €`} sub={tournament.rebuyCount > 0 ? `dont ${tournament.rebuyCount} re-entry` : undefined} />
            <Stat label="Pause dans" value={breakIn !== null ? formatDuration(breakIn) : '—'} />
          </div>

          <Card className="!p-4">
            <h2 className="flex items-baseline justify-between gap-2 mb-2">
              <span className="font-semibold">Places payées</span>
              <span className="text-sm text-ink-muted num">{paidPlaces} sur {players.length}</span>
            </h2>
            <ol className="flex flex-col max-h-60 overflow-y-auto">
              {prizes.map(({ position, percentage, amount }) => (
                <li key={position} className="flex items-center gap-3 py-2 border-b border-line last:border-0 num">
                  <span className="w-8 flex-none text-ink-muted">{positionLabel(position)}</span>
                  <span className="flex-1 h-1.5 bg-sunken rounded-full overflow-hidden">
                    <span className="block h-full rounded-full bg-accent" style={{ width: `${percentage}%` }} />
                  </span>
                  <span className="w-12 text-right text-sm text-ink-muted">{percentage}%</span>
                  <span className="w-16 text-right font-bold">{amount} €</span>
                </li>
              ))}
            </ol>
          </Card>

          <Button variant="ghost" onClick={() => onNavigate('players')} className="w-full">
            <Users size={18} /> Gérer les joueurs
          </Button>
        </aside>
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const min = Math.ceil(seconds / 60);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, '0')}`;
}

function Blind({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className={`num-display text-[clamp(2.5rem,12vw,4rem)] short:text-[9vh] ${accent ? 'text-accent' : 'text-ink'}`}>{value}</span>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3 rounded-card bg-surface border border-line">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="num-display text-3xl">{value}</span>
      {sub && <span className="text-xs text-ink-faint">{sub}</span>}
    </div>
  );
}

function RoundButton({ label, onClick, disabled, children }: {
  label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid place-items-center w-14 h-14 short:w-12 short:h-12 rounded-full bg-surface border border-line text-ink hover:bg-sunken active:scale-95 transition-transform disabled:opacity-35 disabled:active:scale-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {children}
    </button>
  );
}
