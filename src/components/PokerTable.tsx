import { Plus } from 'lucide-react';
import { PlayerCoin } from './ui/PlayerCoin';
import { useMediaQuery } from '../hooks/useMediaQuery';
import type { Player } from '../types';

interface PokerTableProps {
  name: string;
  /** Joueurs en jeu, dans l'ordre des places. */
  players: Player[];
  /** Nombre de places autour de la table. */
  seats: number;
  selectedId: string | null;
  onSelectPlayer: (id: string) => void;
  /** Un joueur est sélectionné ailleurs : les places libres deviennent des cibles. */
  canReceive: boolean;
  onEmptySeat: () => void;
}

// Géométrie en % du cadre : feutre ovale au centre, places sur une ellipse à cheval sur le rail.
// Debout sur téléphone (cadre 358 × 470), couchée en paysage (470 × 300).
const PORTRAIT = { rx: 35.8, ry: 43, felt: { left: '19.3%', top: '8.9%', width: '61.5%', height: '80.9%' }, frame: { height: 'min(470px, 60dvh)', aspectRatio: '358 / 470' }, coin: 14 };
const LANDSCAPE = { rx: 41, ry: 36, felt: { left: '12%', top: '15%', width: '76%', height: '70%' }, frame: { height: 'min(300px, 52dvh)', aspectRatio: '470 / 300' }, coin: 9.5 };

/** Table ovale vue du dessus : feutre, rail, joueurs en jetons autour, places libres en pointillés. */
export function PokerTable({ name, players, seats, selectedId, onSelectPlayer, canReceive, onEmptySeat }: PokerTableProps) {
  const g = useMediaQuery('(orientation: landscape) and (max-height: 520px)') ? LANDSCAPE : PORTRAIT;
  const count = Math.max(seats, players.length);
  const places = Array.from({ length: count }, (_, i) => {
    const angle = ((-90 + 360 / count / 2 + (i * 360) / count) * Math.PI) / 180;
    return { x: 50 + g.rx * Math.cos(angle), y: 50 + g.ry * Math.sin(angle), below: Math.sin(angle) > 0.2, player: players[i] ?? null };
  });

  return (
    <div className="@container relative mx-auto max-w-full" style={{ ...g.frame, '--seat': `${g.coin}cqw` } as React.CSSProperties}>
      <div className="felt-table" style={g.felt}>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-on-felt/25 select-none pointer-events-none" aria-hidden="true">
          <span className="font-display font-extrabold text-[9cqw]">blindr</span>
          <span className="text-[3.4cqw] font-semibold">{name}</span>
        </div>
        <span className="chip-coin absolute left-1/2 top-[4%] -translate-x-1/2 w-[7cqw] text-[3cqw]" style={{ '--c': 'var(--color-ink)' } as React.CSSProperties} aria-label="Bouton du donneur">D</span>
      </div>

      {places.map(({ x, y, below, player }, i) => {
        const pos = { left: `${x}%`, top: `${y}%` };
        if (!player) {
          return (
            <button
              key={`empty-${i}`}
              type="button"
              disabled={!canReceive}
              onClick={onEmptySeat}
              aria-label={canReceive ? `Place ${i + 1} libre : déplacer ici` : `Place ${i + 1} libre`}
              className={`absolute -translate-x-1/2 -translate-y-1/2 grid place-items-center w-[var(--seat)] aspect-square rounded-full border-2 border-dashed font-bold transition-colors
                ${canReceive ? 'border-accent bg-accent/15 text-accent motion-safe:animate-pulse' : 'border-ink-faint bg-surface/70 text-ink-faint text-[3.6cqw]'}`}
              style={pos}
            >
              {canReceive ? <Plus size={20} /> : i + 1}
            </button>
          );
        }
        const selected = player.id === selectedId;
        return (
          <div key={player.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={pos}>
            <button
              type="button"
              draggable
              onDragStart={e => { e.dataTransfer.setData('playerId', player.id); e.dataTransfer.effectAllowed = 'move'; }}
              onClick={() => onSelectPlayer(player.id)}
              aria-pressed={selected}
              aria-label={`${player.name}, place ${i + 1}`}
              className={`block rounded-full transition-transform duration-200 ${selected ? '-translate-y-1.5 scale-110 outline-3 outline-offset-2 outline-accent' : ''}`}
            >
              <PlayerCoin name={player.name} className="w-[var(--seat)] text-[calc(var(--seat)*0.33)]" />
            </button>
            <span
              className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap max-w-[30cqw] truncate px-2 rounded-full text-[3.1cqw] font-semibold shadow-raised pointer-events-none
                ${below ? 'top-full mt-1' : 'bottom-full mb-1'} ${selected ? 'bg-accent text-on-accent' : 'bg-surface text-ink'}`}
            >
              {player.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
