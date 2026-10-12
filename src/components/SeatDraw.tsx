import { useEffect, useRef, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';
import { feedback } from '../utils/feedback';
import type { TournamentState } from '../types';

const REVEAL_ALL_INTERVAL_MS = 90;

/**
 * Tirage des places au lancement : une carte face cachée par joueur, rangée par table.
 * Chacun retourne sa carte et découvre sa place ; « Tout retourner » les révèle d'affilée.
 */
export function SeatDraw({ tournament, onDone }: { tournament: TournamentState; onDone: () => void }) {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const allIds = tournament.tables.flatMap(t => t.playerIds);
  const total = allIds.length;

  const [revealed, setRevealed] = useState<Set<string>>(() => new Set(reduce ? allIds : []));
  const [last, setLast] = useState<string | null>(null);
  const [revealingAll, setRevealingAll] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const done = revealed.size >= total;

  const reveal = (id: string) => {
    setRevealed(prev => (prev.has(id) ? prev : new Set(prev).add(id)));
    setLast(id);
    feedback('tick');
  };

  // « Tout retourner » : les cartes restantes, une à une
  const revealAll = () => {
    setRevealingAll(true);
    allIds.filter(id => !revealed.has(id)).forEach((id, k) => {
      timers.current.push(setTimeout(() => reveal(id), k * REVEAL_ALL_INTERVAL_MS));
    });
  };
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => { if (done && !reduce) feedback('celebrate'); }, [done, reduce]);

  const nameOf = (id: string) => tournament.players.find(p => p.id === id)?.name ?? '';
  const seatOf = (id: string) => {
    for (const table of tournament.tables) {
      const seat = table.playerIds.indexOf(id);
      if (seat >= 0) return { table: table.name, seat: seat + 1 };
    }
    return null;
  };
  const lastSeat = last ? seatOf(last) : null;

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="draw-title" className="fixed inset-0 z-50 bg-canvas overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 lg:px-8 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h1 id="draw-title" className="font-display text-4xl sm:text-5xl font-extrabold">Tirage des places</h1>
            <p className="text-ink-muted mt-1">{done ? 'Tout le monde est placé.' : 'Chacun retourne sa carte.'}</p>
          </div>
          <p className="num-display text-3xl text-accent" aria-live="polite">
            {revealed.size}<span className="text-lg text-ink-faint"> / {total}</span>
          </p>
        </div>

        {tournament.tables.map(table => (
          <section key={table.id} aria-label={table.name} className="mt-6">
            <h2 className="font-display text-xl font-extrabold mb-3">{table.name}</h2>
            <ol className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-9 gap-2.5">
              {table.playerIds.map((id, seat) => {
                const up = revealed.has(id);
                const isLast = id === last;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => { if (!up) reveal(id); }}
                      disabled={up}
                      data-up={up || undefined}
                      aria-label={up ? `Place ${seat + 1} : ${nameOf(id)}` : `Carte ${seat + 1} de ${table.name}, face cachée`}
                      className={`deal-card block w-full h-26 transition-transform duration-300 ${isLast ? '-translate-y-1.5' : ''}`}
                      style={{ rotate: `${((seat * 7) % 5) - 2}deg` }}
                    >
                      <span className="deal-card-inner block">
                        <span className="deal-card-back" />
                        <span className={`deal-card-face flex flex-col justify-between p-2 text-left ${isLast ? 'outline-3 outline-accent' : ''}`}>
                          <span className="num-display text-2xl leading-none text-accent">{seat + 1}</span>
                          <span className="text-[13px] font-bold leading-tight break-words line-clamp-2">{nameOf(id)}</span>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}

        {lastSeat && last && (
          <div className="mt-6 flex items-center gap-3 px-4 py-3 rounded-card bg-ink text-canvas" aria-live="polite">
            <span className="grid place-items-center w-9 h-12 flex-none rounded-[5px] bg-surface text-accent num-display text-xl">{lastSeat.seat}</span>
            <span><b>{nameOf(last)}</b> s'assoit à la {lastSeat.table.toLowerCase()}, place {lastSeat.seat}</span>
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 bg-gradient-to-t from-canvas via-canvas to-transparent">
        <div className="max-w-md mx-auto grid grid-cols-2 gap-2.5">
          <Button variant="secondary" size="lg" onClick={revealAll} disabled={done || revealingAll}>
            Tout retourner
          </Button>
          <Button size="lg" onClick={onDone} disabled={!done} className="shadow-sheet">
            C'est parti <ChevronRight size={22} />
          </Button>
        </div>
      </div>
    </div>
  );
}
