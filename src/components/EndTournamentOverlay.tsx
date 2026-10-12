import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import { Button } from './ui/Button';
import { calculatePrizes } from '../utils/prizePool';
import type { Player, TournamentState } from '../types';

interface EndTournamentOverlayProps {
  tournament: TournamentState;
  onClose: () => void;
}

const MEDAL  = ['#1', '#2', '#3'];
const COLORS = ['text-chip-1000', 'text-chip-1', 'text-chip-5000'];
const BORDER = ['border-chip-1000', 'border-chip-1', 'border-chip-5000'];
const BLOCK  = ['h-16 bg-chip-1000/15', 'h-10 bg-chip-1/12', 'h-6 bg-chip-5000/12'];
const SIZES  = ['text-7xl md:text-8xl', 'text-5xl md:text-6xl', 'text-4xl md:text-5xl'];
const ORDER  = [1, 0, 2]; // 2nd / 1st / 3rd pour l'effet podium

function buildPodium(tournament: TournamentState): Player[] {
  const { players } = tournament;
  const winner = players.find(p => !p.isEliminated) ??
    players.reduce((best, p) => (p.position ?? 99) < (best.position ?? 99) ? p : best);
  const eliminated = players
    .filter(p => p.isEliminated)
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
  return [winner, eliminated[0], eliminated[1]].filter(Boolean) as Player[];
}

export function EndTournamentOverlay({ tournament, onClose }: EndTournamentOverlayProps) {
  const [visible,  setVisible]  = useState(false);
  const [revealed, setRevealed] = useState<number[]>([]);

  const podium       = buildPodium(tournament);
  const totalPot     = (tournament.players.length + tournament.rebuyCount) * tournament.config.buyIn;
  const prizeAmount  = Math.round(totalPot * tournament.config.prizePool.prizePoolPct / 100);
  const prizes       = calculatePrizes(prizeAmount, tournament.players.length, tournament.config.prizePool);
  const getPrize     = (position: number) => prizes.find(p => p.position === position)?.amount ?? 0;
  const [shownAt]    = useState(() => Date.now());
  const durationMin  = tournament.startedAt
    ? Math.round((shownAt - tournament.startedAt) / 60000)
    : 0;

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setVisible(true),          100));
    timers.push(setTimeout(() => setRevealed([2]),          600));
    timers.push(setTimeout(() => setRevealed([2, 1]),      1200));
    timers.push(setTimeout(() => setRevealed([2, 1, 0]),   2000));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-canvas/95 backdrop-blur-sm transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <Trophy size={48} className="mb-2 text-chip-1000 motion-safe:animate-bounce" />
      <h1 className="font-display text-4xl md:text-6xl font-extrabold mb-1 text-center text-ink">
        Tournoi terminé
      </h1>
      <p className="text-sm mb-10 text-ink-muted num">
        {tournament.config.name} · {durationMin} min · {totalPot} €
      </p>

      {/* Podium — ordre visuel : 2ème / 1er / 3ème */}
      <div className="flex items-end justify-center gap-4 md:gap-8 mb-10 px-4">
        {ORDER.map(rankIdx => {
          const player    = podium[rankIdx];
          const prize     = getPrize(rankIdx + 1);
          const isRevealed = revealed.includes(rankIdx);

          if (!player) return <div key={rankIdx} className="w-24 md:w-32" />;

          return (
            <div
              key={rankIdx}
              style={{
                animation: isRevealed ? `podiumRise 0.7s ease-out both` : undefined,
                opacity: isRevealed ? 1 : 0,
                transform: isRevealed ? 'translateY(0)' : 'translateY(40px)',
              }}
              className="flex flex-col items-center"
            >
              <div className={`font-display font-bold text-2xl mb-2 ${COLORS[rankIdx]}`}>{MEDAL[rankIdx]}</div>
              <div
                className={`border-2 rounded-card bg-surface shadow-raised px-4 py-4 md:px-6 text-center ${BORDER[rankIdx]}`}
                style={{ minWidth: rankIdx === 0 ? 140 : 110 }}
              >
                <div className={`font-display font-black ${SIZES[rankIdx]} ${COLORS[rankIdx]} leading-none mb-1`}>
                  #{rankIdx + 1}
                </div>
                <div className="text-ink font-bold text-sm md:text-base truncate max-w-[120px]">
                  {player.name}
                </div>
                {prize > 0 && (
                  <div className="text-sm font-bold mt-1 text-success num">
                    {prize} €
                  </div>
                )}
              </div>
              {/* Bloc podium */}
              <div className={`w-full rounded-b-card border-x-2 border-b-2 ${BORDER[rankIdx]} ${BLOCK[rankIdx]}`} />
            </div>
          );
        })}
      </div>

      <Button variant="primary" size="lg" onClick={onClose} className="text-lg px-12">
        Clôturer le tournoi
      </Button>
    </div>
  );
}
