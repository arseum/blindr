import { useEffect, useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from './ui/Button';
import { feedback } from '../utils/feedback';
import type { TournamentState } from '../types';

const DEAL_INTERVAL_MS = 140;

/**
 * Tirage des places au lancement : les joueurs sont « distribués » sur les tables comme des cartes,
 * siège par siège et table par table, comme un croupier qui donne.
 */
export function SeatDraw({ tournament, onDone }: { tournament: TournamentState; onDone: () => void }) {
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Ordre de donne : siège 1 de chaque table, puis siège 2…
  const order = useMemo(() => {
    const deal: Record<string, number> = {};
    const maxSeats = Math.max(...tournament.tables.map(t => t.playerIds.length));
    let k = 0;
    for (let seat = 0; seat < maxSeats; seat++) {
      for (const table of tournament.tables) {
        const id = table.playerIds[seat];
        if (id) deal[id] = k++;
      }
    }
    return deal;
  }, [tournament.tables]);
  const total = Object.keys(order).length;
  const [dealt, setDealt] = useState(reduce ? total : 0);

  useEffect(() => {
    if (dealt >= total) { if (!reduce) feedback('celebrate'); return; }
    const t = setTimeout(() => { setDealt(d => d + 1); feedback('tick'); }, dealt === 0 ? 400 : DEAL_INTERVAL_MS);
    return () => clearTimeout(t);
  }, [dealt, total, reduce]);

  const done = dealt >= total;
  const nameOf = (id: string) => tournament.players.find(p => p.id === id)?.name ?? '';

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="draw-title" className="fixed inset-0 z-50 bg-canvas overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 lg:px-8 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <h1 id="draw-title" className="font-display text-4xl sm:text-5xl font-extrabold">Tirage des places</h1>
        <p className="text-ink-muted mt-1 num" aria-live="polite">
          {done ? `${total} joueurs placés sur ${tournament.tables.length} table${tournament.tables.length > 1 ? 's' : ''}.` : `Distribution… ${dealt} / ${total}`}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {tournament.tables.map(table => (
            <section key={table.id} aria-label={table.name} className="p-4 rounded-card bg-surface border border-line shadow-raised">
              <h2 className="font-display text-xl font-extrabold mb-3">{table.name}</h2>
              <ol className="grid grid-cols-2 gap-2">
                {table.playerIds.map((id, seat) => {
                  const visible = order[id] < dealt;
                  return (
                    <li
                      key={id}
                      className={`flex items-center gap-2 min-h-11 px-3 rounded-control bg-sunken ${visible ? 'deal-in' : 'opacity-0'}`}
                    >
                      <span className="text-xs text-ink-faint num w-4">{seat + 1}</span>
                      <span className="text-sm font-semibold truncate">{nameOf(id)}</span>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 bg-gradient-to-t from-canvas via-canvas to-transparent flex justify-center">
        {done ? (
          <Button size="lg" onClick={onDone} className="w-full sm:w-auto sm:px-12 shadow-sheet">
            C'est parti <ChevronRight size={22} />
          </Button>
        ) : (
          <Button variant="ghost" onClick={() => setDealt(total)} className="bg-surface">Passer</Button>
        )}
      </div>
    </div>
  );
}
