import { useCallback, useState } from 'react';
import { Search, UserMinus, Undo2, RefreshCw } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { EmptyTournament } from '../components/EmptyTournament';
import { SwipeRow } from '../components/ui/SwipeRow';
import { UndoToast } from '../components/ui/UndoToast';
import { Odometer } from '../components/ui/Odometer';
import { PlayerCoin } from '../components/ui/PlayerCoin';
import { feedback } from '../utils/feedback';
import { useTournamentStore } from '../store/tournamentStore';
import type { Page, Player, TournamentState } from '../types';

interface PlayersPageProps {
  onNavigate: (page: Page) => void;
}

/** Un joueur éliminé peut-il reprendre un tapis ? (niveau limite et nombre max par joueur) */
function canReEnter(tournament: TournamentState, player: Player): boolean {
  const rule = tournament.config.reEntry;
  if (!rule) return false;
  if (tournament.currentLevelIndex + 1 > rule.maxLevel) return false;
  return rule.maxPerPlayer === 0 || (player.reEntries ?? 0) < rule.maxPerPlayer;
}

export function PlayersPage({ onNavigate }: PlayersPageProps) {
  const { tournament, eliminatePlayer, undoElimination, rebuyPlayer } = useTournamentStore();
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ playerId: string; message: string } | null>(null);
  const closeToast = useCallback(() => setToast(null), []);

  if (!tournament) return <EmptyTournament title="Joueurs" onNavigate={onNavigate} />;

  const { players, tables } = tournament;
  const query = search.trim().toLowerCase();
  const matches = (p: Player) => !query || p.name.toLowerCase().includes(query);
  const active = players.filter(p => !p.isEliminated);
  const eliminated = players
    .filter(p => p.isEliminated)
    .sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
  const tableName = (id: string) => tables.find(t => t.id === id)?.name;

  const eliminate = (player: Player) => {
    const place = active.length; // la place = nombre de joueurs encore en jeu
    eliminatePlayer(player.id);
    feedback('eliminate');
    setToast({ playerId: player.id, message: `${player.name} éliminé·e · ${place}e place` });
  };

  return (
    <div className="px-4 lg:px-8 max-w-3xl mx-auto pb-6">
      <PageHeader title="Joueurs" subtitle={<><Odometer value={String(active.length)} /> en jeu · {eliminated.length} éliminés</>} />

      <label className="relative block mb-5">
        <span className="sr-only">Rechercher un joueur</span>
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint pointer-events-none" />
        <input
          id="player-search"
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un joueur"
          className="w-full min-h-12 pl-10 pr-3 rounded-control bg-surface border border-line text-ink placeholder-ink-faint focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
        />
      </label>

      <section aria-labelledby="active-h" className="mb-8">
        <h2 id="active-h" className="flex justify-between text-sm font-semibold text-ink-muted mb-2">En jeu <span className="font-normal text-ink-faint">Glisse vers la gauche pour éliminer</span></h2>
        <ul className="rounded-card bg-surface border border-line divide-y divide-line overflow-hidden">
          {active.filter(matches).map(player => (
            <SwipeRow key={player.id} actionLabel={<><UserMinus size={18} /> Éliminer</>} onSwipe={() => eliminate(player)}>
              <div className="flex items-center gap-3 pl-3 pr-2 min-h-16">
                <PlayerCoin name={player.name} />
                <span className="flex-1 min-w-0 font-semibold truncate">{player.name}</span>
                {tableName(player.tableId) && (
                  <span className="flex-none rounded-full bg-sunken px-2 py-0.5 text-xs font-semibold text-ink-muted num">{tableName(player.tableId)}</span>
                )}
                <button
                  onClick={() => eliminate(player)}
                  aria-label={`Éliminer ${player.name}`}
                  className="grid place-items-center w-11 h-11 rounded-full text-ink-faint hover:text-danger hover:bg-danger/10 focus-visible:outline-2 focus-visible:outline-danger"
                >
                  <UserMinus size={18} />
                </button>
              </div>
            </SwipeRow>
          ))}
          {active.filter(matches).length === 0 && (
            <li className="px-4 py-6 text-center text-ink-muted text-sm">Aucun joueur en jeu ne correspond.</li>
          )}
        </ul>
      </section>

      {eliminated.length > 0 && (
        <section aria-labelledby="out-h">
          <h2 id="out-h" className="text-sm font-semibold text-ink-muted mb-2">Éliminés</h2>
          <ul className="rounded-card bg-surface border border-line divide-y divide-line overflow-hidden">
            {eliminated.filter(matches).map(player => (
              <li key={player.id} className="flex items-center gap-3 pl-3 pr-2 min-h-16">
                <PlayerCoin name={player.name} eliminated />
                <span className="flex-1 min-w-0">
                  <span className="block truncate text-ink-muted">{player.name}</span>
                  <span className="block text-xs font-bold text-ink-faint num">{player.position}e place</span>
                </span>
                {canReEnter(tournament, player) && (
                  <button
                    onClick={() => rebuyPlayer(player.id)}
                    className="inline-flex items-center gap-1.5 min-h-11 px-3 rounded-control text-sm font-semibold text-accent hover:bg-accent/10"
                  >
                    <RefreshCw size={16} /> Re-entry
                  </button>
                )}
                <button
                  onClick={() => undoElimination(player.id)}
                  aria-label={`Annuler l'élimination de ${player.name}`}
                  className="inline-flex items-center gap-1.5 min-h-11 px-3 rounded-control text-sm font-semibold text-ink-muted hover:bg-sunken hover:text-ink"
                >
                  <Undo2 size={16} /> Annuler
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {toast && (
        <UndoToast
          key={toast.playerId}
          message={toast.message}
          onUndo={() => { undoElimination(toast.playerId); setToast(null); feedback('select'); }}
          onClose={closeToast}
        />
      )}
    </div>
  );
}
