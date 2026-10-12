import { useEffect, useState } from 'react';

import { useRef } from 'react';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, UserMinus, Trophy, Undo2, Tv } from 'lucide-react';
import { LevelTransitionOverlay, pickRandomEffect } from '../components/LevelTransitionOverlay';
import type { TransitionEffect } from '../components/LevelTransitionOverlay';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { EndTournamentOverlay } from '../components/EndTournamentOverlay';
import { useTournamentStore } from '../store/tournamentStore';
import { useHistoryStore } from '../store/historyStore';
import { formatTime, formatChips, TV_EFFECT_KEY } from '../constants';
import { calculatePrizes, getPaidPlaces, positionLabel } from '../utils/prizePool';
import { levelChip } from '../utils/chips';
import type { Page } from '../types';

interface TournamentPageProps {
  onNavigate: (page: Page) => void;
}

export function TournamentPage({ onNavigate }: TournamentPageProps) {
  const {
    tournament,
    startTimer,
    pauseTimer,
    nextLevel,
    prevLevel,
    resetTimer,
    eliminatePlayer,
    undoElimination,
    clearTournament,
    endTournament,
  } = useTournamentStore();
  const { addEntry } = useHistoryStore();

  const [showEnd, setShowEnd] = useState(false);
  const [playerSearch, setPlayerSearch] = useState('');
  const [transition, setTransition] = useState<{ effect: TransitionEffect; label: string } | null>(null);
  const prevLevelRef = useRef(tournament?.currentLevelIndex ?? 0);

  // Détection du changement de niveau → animation aléatoire, syncée vers la TV
  useEffect(() => {
    if (!tournament) return;
    const newIdx = tournament.currentLevelIndex;
    if (newIdx !== prevLevelRef.current) {
      prevLevelRef.current = newIdx;
      const level = tournament.config.blindStructure[newIdx];
      const label = level.isBreak ? 'PAUSE' : `NIVEAU ${level.level}`;
      const effect = pickRandomEffect();
      localStorage.setItem(TV_EFFECT_KEY, JSON.stringify({ effect, label, ts: Date.now() }));
      setTransition({ effect, label });
    }
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const activePlayers = tournament?.players.filter(p => !p.isEliminated) ?? [];
  const totalPlayers = tournament?.players.length ?? 0;
  useEffect(() => {
    if (!showEnd && tournament && activePlayers.length === 1 && totalPlayers > 1) {
      endTournament();
      setShowEnd(true);
    }
  }, [activePlayers.length, totalPlayers, showEnd]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCloseEnd = () => {
    if (!tournament) return;
    const pot = (tournament.players.length + tournament.rebuyCount) * tournament.config.buyIn;
    const finalPrizes = calculatePrizes(
      Math.round(pot * tournament.config.prizePool.prizePoolPct / 100),
      tournament.players.length,
      tournament.config.prizePool,
    );
    const prizeFor = (position: number) => finalPrizes.find(p => p.position === position)?.amount ?? 0;
    const winner = activePlayers[0] ?? tournament.players.reduce((b, p) =>
      (p.position ?? 99) < (b.position ?? 99) ? p : b
    );
    addEntry({
      id: tournament.id,
      name: tournament.config.name,
      date: Date.now(),
      buyIn: tournament.config.buyIn,
      playerCount: tournament.players.length,
      rebuyCount: tournament.rebuyCount,
      totalPot: pot,
      duration: tournament.startedAt ? Math.round((Date.now() - tournament.startedAt) / 60000) : 0,
      placements: [
        { playerName: winner.name, position: 1, prize: prizeFor(1) },
        ...tournament.players
          .filter(p => p.isEliminated && p.position !== undefined)
          .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
          .map(p => ({ playerName: p.name, position: p.position!, prize: prizeFor(p.position!) })),
      ],
    });
    clearTournament();
    setShowEnd(false);
    onNavigate('history');
  };

  if (!tournament) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Card>
          <p className="text-ink-muted mb-4">Aucun tournoi en cours</p>
          <Button onClick={() => onNavigate('setup')}>Créer un tournoi</Button>
        </Card>
      </div>
    );
  }

  const { config, players, currentLevelIndex, secondsRemaining, isRunning } = tournament;
  const currentLevel = config.blindStructure[currentLevelIndex];
  const nextLevelData = config.blindStructure[currentLevelIndex + 1];
  const totalChips = (players.length + tournament.rebuyCount) * config.startingStack;
  const avgStack = activePlayers.length > 0 ? Math.floor(totalChips / activePlayers.length) : 0;
  const totalPot        = (players.length + tournament.rebuyCount) * config.buyIn;
  const prizePoolAmount = Math.round(totalPot * config.prizePool.prizePoolPct / 100);
  const prizes          = calculatePrizes(prizePoolAmount, players.length, config.prizePool);
  const paidPlaces      = getPaidPlaces(players.length, config.prizePool.itmPct);
  const levelProgress = 1 - secondsRemaining / (currentLevel.duration * 60);
  const isWarning = secondsRemaining <= 60 && !currentLevel.isBreak;

  return (
    <div data-chip={levelChip(currentLevel)} className="min-h-dvh p-4 relative">
      {showEnd && (
        <EndTournamentOverlay tournament={tournament} onClose={handleCloseEnd} />
      )}
      {transition && (
        <LevelTransitionOverlay
          effect={transition.effect}
          levelLabel={transition.label}
          onDone={() => setTransition(null)}
        />
      )}

      {/* Title bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h1 className="font-display text-base sm:text-xl font-bold text-accent truncate min-w-0">{config.name}</h1>
        <div className="flex gap-2 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={() => onNavigate('tables')}>Tables</Button>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('history')} className="hidden sm:flex">Historique</Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.open('/?display', 'poker-tv', 'popup=true,width=1920,height=1080')}
            className="flex items-center gap-1.5"
          >
            <Tv size={15} /> TV
          </Button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Timer + Controls + Stats — colonne principale */}
        <div className="lg:col-span-2 flex flex-col gap-4">

          {/* Timer (avec controls intégrés) */}
          <Card highlight className="text-center relative overflow-hidden">
            {/* Barre de progression */}
            <div className="absolute bottom-0 left-0 w-full timer-bar-track">
              <div
                className={`timer-bar-fill${isWarning ? ' timer-bar-warning' : ''}`}
                style={{ width: `${levelProgress * 100}%` }}
              />
            </div>

            {currentLevel.isBreak ? (
              <>
                <div className="font-display text-xl sm:text-2xl font-bold text-chip-500 mb-2">— PAUSE —</div>
                <div className={`font-display font-black text-6xl sm:text-8xl md:text-9xl leading-none tracking-tight ${isWarning ? 'text-danger animate-pulse' : 'text-ink'}`}>
                  {formatTime(secondsRemaining)}
                </div>
              </>
            ) : (
              <>
                <div className="font-display text-lg sm:text-2xl font-bold text-ink-muted mb-1">
                  <span>NIVEAU {currentLevel.level}</span>
                </div>
                <div className={`font-display font-black text-6xl sm:text-8xl md:text-9xl leading-none tracking-tight mb-3 sm:mb-4 ${isWarning ? 'text-danger animate-pulse' : 'text-accent'}`}>
                  {formatTime(secondsRemaining)}
                </div>
                <div className="flex justify-center gap-3 sm:gap-6 text-center flex-wrap">
                  <div>
                    <div className="text-ink-muted text-xs uppercase tracking-widest mb-1">Petite</div>
                    <div className="font-display text-xl sm:text-3xl font-bold text-ink">{formatChips(currentLevel.smallBlind)}</div>
                  </div>
                  <div className="text-ink-muted text-2xl sm:text-4xl font-thin self-center">/</div>
                  <div>
                    <div className="text-ink-muted text-xs uppercase tracking-widest mb-1">Grande</div>
                    <div className="font-display text-xl sm:text-3xl font-bold text-ink">{formatChips(currentLevel.bigBlind)}</div>
                  </div>
                  {currentLevel.ante > 0 && (
                    <>
                      <div className="text-ink-muted text-2xl sm:text-4xl font-thin self-center">+</div>
                      <div>
                        <div className="text-ink-muted text-xs uppercase tracking-widest mb-1">Ante</div>
                        <div className="font-display text-xl sm:text-3xl font-bold text-accent">{formatChips(currentLevel.ante)}</div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {/* Controls — fusionnés dans le timer */}
            <div className="border-t border-line/40 mt-5 pt-4 flex flex-wrap justify-center gap-3">
              <Button variant="ghost" size="sm" onClick={prevLevel}>
                <SkipBack size={18} />
              </Button>
              <Button variant="ghost" size="sm" onClick={resetTimer}>
                <RotateCcw size={18} />
              </Button>
              <Button
                variant={isRunning ? 'secondary' : 'primary'}
                size="lg"
                onClick={isRunning ? pauseTimer : startTimer}
                className="px-12 flex items-center gap-2"
              >
                {isRunning ? <><Pause size={20} /> Pause</> : <><Play size={20} /> Jouer</>}
              </Button>
              <Button variant="ghost" size="sm" onClick={nextLevel}>
                <SkipForward size={18} />
              </Button>
            </div>
            {nextLevelData && (
              <div className="mt-3 text-center text-sm text-ink-faint pb-1">
                Prochain : {nextLevelData.isBreak ? 'PAUSE' : `${formatChips(nextLevelData.smallBlind)}/${formatChips(nextLevelData.bigBlind)}${nextLevelData.ante ? ` + ${formatChips(nextLevelData.ante)}` : ''}`} — {nextLevelData.duration}min
              </div>
            )}
          </Card>

          {/* Stats — ligne plate sans cards individuelles */}
          <div className="grid grid-cols-3 border border-line rounded-xl overflow-hidden bg-surface/90">
            <div className="text-center px-4 py-4 border-r border-line">
              <div className="text-ink-muted text-xs uppercase tracking-widest mb-1">Joueurs</div>
              <div className="font-display text-2xl sm:text-3xl font-bold text-accent">{activePlayers.length}</div>
              <div className="text-ink-faint text-xs">/ {players.length}</div>
            </div>
            <div className="text-center px-4 py-4 border-r border-line">
              <div className="text-ink-muted text-xs uppercase tracking-widest mb-1">Moy.</div>
              <div className="font-display text-2xl sm:text-3xl font-bold text-ink-muted">{formatChips(avgStack)}</div>
            </div>
            <div className="text-center px-4 py-4">
              <div className="text-ink-muted text-xs uppercase tracking-widest mb-1">Pot</div>
              <div className="font-display text-2xl sm:text-3xl font-bold text-success">{totalPot}€</div>
              {tournament.rebuyCount > 0 && (
                <div className="text-ink-muted text-xs">+{tournament.rebuyCount} rebuy</div>
              )}
            </div>
          </div>

          {/* Prize pool */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-base font-bold text-success flex items-center gap-2">
                <Trophy size={16} className="text-accent" /> Prize Pool — {prizePoolAmount}€
              </h2>
              <span className="text-ink-faint text-xs">ITM : {paidPlaces}/{players.length} joueurs</span>
            </div>
            <div className="flex flex-col max-h-44 overflow-y-auto">
              {prizes.map(({ position, percentage, amount }) => (
                <div
                  key={position}
                  className="flex items-center justify-between py-2 border-b border-line/40 last:border-0 text-sm"
                >
                  <span className={`font-display font-bold w-8 flex-shrink-0 ${position <= 3 ? 'text-accent' : 'text-ink-faint'}`}>
                    {positionLabel(position)}
                  </span>
                  <div className="flex-1 mx-3">
                    <div className="h-1 bg-sunken rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-success"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-ink-muted text-xs w-10 text-right">{percentage}%</span>
                  <span className="font-display font-bold text-success w-14 text-right">{amount}€</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Players sidebar */}
        <Card className="max-h-72 lg:max-h-dvh overflow-y-auto">
          <h2 className="font-display text-base font-bold text-accent mb-3 flex items-center gap-2">
            <Trophy size={18} />
            Joueurs actifs ({activePlayers.length})
          </h2>
          <input
            type="text"
            placeholder="Rechercher..."
            value={playerSearch}
            onChange={e => setPlayerSearch(e.target.value)}
            className="w-full mb-3 px-3 py-1.5 text-sm rounded-lg bg-sunken border border-line text-ink placeholder-ink-faint focus:outline-none focus:border-accent/50"
          />
          <div className="flex flex-col">
            {activePlayers.filter(p => p.name.toLowerCase().includes(playerSearch.toLowerCase())).map(player => (
              <div
                key={player.id}
                className="flex items-center justify-between py-2.5 border-b border-line/30 last:border-0"
              >
                <span className="text-ink text-sm">{player.name}</span>
                <button
                  onClick={() => eliminatePlayer(player.id)}
                  className="text-ink-faint hover:text-on-accent hover:bg-danger transition-colors flex-shrink-0 ml-2 p-1.5 rounded-lg"
                  title="Éliminer"
                >
                  <UserMinus size={15} />
                </button>
              </div>
            ))}
          </div>

          {players.filter(p => p.isEliminated).length > 0 && (
            <>
              <h3 className="font-display text-xs font-bold text-ink-faint uppercase tracking-widest mt-5 mb-3">Éliminés</h3>
              <div className="flex flex-col">
                {players.filter(p => p.isEliminated)
                  .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
                  .map(player => (
                    <div key={player.id} className="flex items-center justify-between py-2 border-b border-line/20 last:border-0 group">
                      <div className="flex items-center gap-2 min-w-0">
                        {player.position && <Badge variant="danger">{player.position}e</Badge>}
                        <span className="text-sm text-ink-faint line-through truncate">{player.name}</span>
                      </div>
                      <button
                        onClick={() => undoElimination(player.id)}
                        className="text-ink-faint hover:text-accent transition-colors opacity-0 group-hover:opacity-100 ml-2 flex-shrink-0 p-1"
                        title="Annuler l'élimination"
                      >
                        <Undo2 size={14} />
                      </button>
                    </div>
                  ))}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
