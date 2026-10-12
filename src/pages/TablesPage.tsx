import { useState } from 'react';
import { ArrowLeftRight, Users, AlertTriangle, Plus, X } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useTournamentStore } from '../store/tournamentStore';
import type { Page } from '../types';

interface TablesPageProps {
  onNavigate: (page: Page) => void;
}

export function TablesPage({ onNavigate }: TablesPageProps) {
  const { tournament, redistributeTables, movePlayerToTable, addTable, removeTable } = useTournamentStore();
  const [dragOverTableId, setDragOverTableId] = useState<string | null>(null);

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

  const { players, tables, config } = tournament;
  const activePlayers = players.filter(p => !p.isEliminated);
  const idealPerTable = config.maxPlayersPerTable;

  function handleDragStart(e: React.DragEvent, playerId: string) {
    e.dataTransfer.setData('playerId', playerId);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDrop(e: React.DragEvent, targetTableId: string) {
    e.preventDefault();
    const playerId = e.dataTransfer.getData('playerId');
    if (playerId) movePlayerToTable(playerId, targetTableId);
    setDragOverTableId(null);
  }

  return (
    <div className="min-h-dvh p-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-accent">Tables</h1>
            <p className="text-ink-muted text-sm mt-1">
              {activePlayers.length} joueurs — {tables.length} tables · glisser-déposer pour déplacer
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="success"
              onClick={addTable}
              className="flex items-center gap-2"
            >
              <Plus size={18} /> Ajouter table
            </Button>
            <Button
              variant="secondary"
              onClick={redistributeTables}
              className="flex items-center gap-2"
            >
              <ArrowLeftRight size={18} /> Redistribuer
            </Button>
            <Button variant="ghost" onClick={() => onNavigate('tournament')}>
              ← Tournoi
            </Button>
          </div>
        </div>

        {/* Tables grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map(table => {
            const tablePlayers = table.playerIds
              .map(pid => players.find(p => p.id === pid))
              .filter(Boolean)
              .filter(p => !p!.isEliminated);

            const isFull = tablePlayers.length >= idealPerTable;
            const isEmpty = tablePlayers.length === 0;
            const isDragOver = dragOverTableId === table.id;

            return (
              <div
                key={table.id}
                onDragOver={e => { e.preventDefault(); setDragOverTableId(table.id); }}
                onDragLeave={() => setDragOverTableId(null)}
                onDrop={e => handleDrop(e, table.id)}
              >
                {isEmpty ? (
                  <div className={`rounded-xl border-2 border-dashed transition-all duration-150 flex flex-col items-center justify-center min-h-32 gap-2 ${isDragOver ? 'border-accent/70 bg-accent/5 scale-[1.02]' : 'border-line/40'}`}>
                    <h3 className="font-display font-bold text-ink-faint text-base">{table.name}</h3>
                    <p className="text-xs text-ink-faint">Glisser un joueur ici</p>
                    <button
                      onClick={() => removeTable(table.id)}
                      className="mt-1 text-ink-faint hover:text-danger transition-colors p-1 rounded"
                      title="Supprimer la table"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <Card
                    highlight={tablePlayers.length <= 3}
                    className={`transition-all duration-150 ${isDragOver ? 'ring-2 ring-accent/70 scale-[1.02]' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-display font-bold text-accent text-lg">{table.name}</h3>
                      <Badge variant={isFull ? 'danger' : tablePlayers.length <= 4 ? 'accent' : 'success'}>
                        <Users size={12} className="mr-1" />
                        {tablePlayers.length}/{idealPerTable}
                      </Badge>
                    </div>

                    {/* Poker table visual */}
                    <div className={`bg-sunken rounded-xl p-3 mb-3 transition-colors duration-150 ${isDragOver ? 'bg-sunken' : ''}`}>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {tablePlayers.map(player => (
                          <div
                            key={player!.id}
                            draggable
                            onDragStart={e => handleDragStart(e, player!.id)}
                            className="bg-chip-10/30 border border-chip-10/50 rounded-lg px-2 py-1.5 text-center cursor-grab active:cursor-grabbing active:opacity-50 hover:border-accent/50 hover:bg-chip-10/50 transition-colors select-none"
                          >
                            <span className="text-xs text-ink font-medium truncate block">
                              {player!.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {tablePlayers.length <= 3 && (
                      <div className="flex items-center justify-center gap-1.5 text-xs text-accent/70 font-display tracking-wide">
                        <AlertTriangle size={11} /> Table courte — redistribution conseillée
                      </div>
                    )}
                  </Card>
                )}
              </div>
            );
          })}
        </div>

        {/* Eliminated players section */}
        {players.filter(p => p.isEliminated).length > 0 && (
          <div className="mt-6">
            <h2 className="font-display text-lg font-bold text-ink-faint mb-3">Joueurs éliminés</h2>
            <div className="flex flex-wrap gap-2">
              {players
                .filter(p => p.isEliminated)
                .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
                .map(player => (
                  <div key={player.id} className="bg-sunken/50 border border-ink-faint/30 rounded-lg px-3 py-1.5 flex items-center gap-2">
                    <span className="text-sm text-ink-faint line-through">{player.name}</span>
                    {player.position && <Badge variant="danger">{player.position}e</Badge>}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
