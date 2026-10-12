import { useState } from 'react';
import { ArrowLeftRight, Plus, X, AlertTriangle, MoveRight } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PageHeader } from '../components/PageHeader';
import { EmptyTournament } from '../components/EmptyTournament';
import { useTournamentStore } from '../store/tournamentStore';
import type { Page, Player } from '../types';

interface TablesPageProps {
  onNavigate: (page: Page) => void;
}

/**
 * Tables : déplacer un joueur au toucher (le sélectionner, puis toucher « Déplacer ici »)
 * ou à la souris par glisser-déposer.
 */
export function TablesPage({ onNavigate }: TablesPageProps) {
  const { tournament, redistributeTables, movePlayerToTable, addTable, removeTable } = useTournamentStore();
  const [dragOverTableId, setDragOverTableId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!tournament) return <EmptyTournament title="Tables" onNavigate={onNavigate} />;

  const { players, tables, config } = tournament;
  const activePlayers = players.filter(p => !p.isEliminated);
  const maxPerTable = config.maxPlayersPerTable;
  const selected = players.find(p => p.id === selectedId) ?? null;

  const moveTo = (playerId: string, tableId: string) => {
    movePlayerToTable(playerId, tableId);
    setSelectedId(null);
    setDragOverTableId(null);
  };

  return (
    <div className="px-4 lg:px-8 max-w-6xl mx-auto pb-6">
      <PageHeader title="Tables" subtitle={`${activePlayers.length} joueurs · ${tables.length} tables`} />

      <div className="flex flex-wrap gap-2 mb-5">
        <Button variant="ghost" size="sm" onClick={redistributeTables}>
          <ArrowLeftRight size={16} /> Rééquilibrer
        </Button>
        <Button variant="ghost" size="sm" onClick={addTable}>
          <Plus size={16} /> Ajouter une table
        </Button>
      </div>

      {selected && (
        <div className="sticky top-[env(safe-area-inset-top)] z-10 mb-4 flex items-center justify-between gap-3 px-4 py-3 rounded-card bg-ink text-canvas shadow-raised">
          <span className="text-sm">Choisis la table de <b>{selected.name}</b></span>
          <button onClick={() => setSelectedId(null)} className="min-h-11 px-3 text-sm font-semibold rounded-control hover:bg-canvas/10">
            Annuler
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map(table => {
          const tablePlayers = table.playerIds
            .map(pid => players.find(p => p.id === pid))
            .filter((p): p is Player => !!p && !p.isEliminated);
          const isFull = tablePlayers.length >= maxPerTable;
          const isShort = tablePlayers.length > 0 && tablePlayers.length <= 3;
          const isDragOver = dragOverTableId === table.id;
          const canReceive = selected && selected.tableId !== table.id;

          return (
            <section
              key={table.id}
              aria-label={table.name}
              onDragOver={e => { e.preventDefault(); setDragOverTableId(table.id); }}
              onDragLeave={() => setDragOverTableId(null)}
              onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData('playerId'); if (id) moveTo(id, table.id); }}
              className={`flex flex-col gap-3 p-4 rounded-card bg-surface border shadow-raised transition-[border-color,box-shadow] ${isDragOver ? 'border-accent ring-2 ring-accent/30' : 'border-line'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-xl font-extrabold">{table.name}</h2>
                <div className="flex items-center gap-1">
                  <Badge variant={isFull ? 'danger' : 'neutral'} className="num">{tablePlayers.length} / {maxPerTable}</Badge>
                  {tablePlayers.length === 0 && (
                    <button
                      onClick={() => removeTable(table.id)}
                      aria-label={`Supprimer ${table.name}`}
                      className="grid place-items-center w-11 h-11 -mr-2 rounded-full text-ink-faint hover:text-danger hover:bg-danger/10"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>

              {tablePlayers.length > 0 ? (
                <ul className="grid grid-cols-2 gap-2">
                  {tablePlayers.map(player => {
                    const isSelected = player.id === selectedId;
                    return (
                      <li key={player.id}>
                        <button
                          draggable
                          onDragStart={e => { e.dataTransfer.setData('playerId', player.id); e.dataTransfer.effectAllowed = 'move'; }}
                          onClick={() => setSelectedId(isSelected ? null : player.id)}
                          aria-pressed={isSelected}
                          className={`w-full min-h-11 px-3 rounded-control text-sm font-medium text-left truncate transition-colors select-none ${isSelected ? 'bg-accent text-on-accent' : 'bg-sunken text-ink hover:bg-line'}`}
                        >
                          {player.name}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-ink-muted py-3 text-center">Table vide</p>
              )}

              {isShort && (
                <p className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <AlertTriangle size={13} /> Table courte : pense à rééquilibrer
                </p>
              )}

              {canReceive && (
                <Button size="sm" onClick={() => moveTo(selected.id, table.id)} className="w-full" disabled={isFull}>
                  <MoveRight size={16} /> {isFull ? 'Table complète' : 'Déplacer ici'}
                </Button>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
