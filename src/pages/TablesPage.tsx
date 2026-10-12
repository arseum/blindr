import { useEffect, useRef, useState } from 'react';
import { ArrowLeftRight, Plus, X, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/PageHeader';
import { EmptyTournament } from '../components/EmptyTournament';
import { PokerTable } from '../components/PokerTable';
import { PlayerCoin } from '../components/ui/PlayerCoin';
import { useTournamentStore } from '../store/tournamentStore';
import { feedback } from '../utils/feedback';
import type { Page, Player } from '../types';

interface TablesPageProps {
  onNavigate: (page: Page) => void;
}

/**
 * Tables : une table ovale par écran, on glisse horizontalement de table en table.
 * Déplacer un joueur : le toucher, puis toucher une place libre (sur n'importe quelle table),
 * ou le glisser-déposer à la souris.
 */
export function TablesPage({ onNavigate }: TablesPageProps) {
  const { tournament, redistributeTables, movePlayerToTable, addTable, removeTable } = useTournamentStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const tableCount = tournament?.tables.length ?? 0;
  const prevCount = useRef(tableCount);

  const goTo = (index: number, smooth = true) => {
    const slide = sliderRef.current?.children[index] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', inline: 'start', block: 'nearest' });
  };

  // Table ajoutée : on glisse jusqu'à elle
  useEffect(() => {
    if (tableCount > prevCount.current) goTo(tableCount - 1);
    prevCount.current = tableCount;
  }, [tableCount]);

  if (!tournament) return <EmptyTournament title="Tables" onNavigate={onNavigate} />;

  const { players, tables, config } = tournament;
  const activePlayers = players.filter(p => !p.isEliminated);
  const maxPerTable = config.maxPlayersPerTable;
  const selected = players.find(p => p.id === selectedId) ?? null;
  const playersOf = (playerIds: string[]) =>
    playerIds.map(pid => players.find(p => p.id === pid)).filter((p): p is Player => !!p && !p.isEliminated);

  const moveTo = (playerId: string, tableId: string) => {
    movePlayerToTable(playerId, tableId);
    setSelectedId(null);
    feedback('select');
  };

  const onScroll = () => {
    const el = sliderRef.current;
    const first = el?.children[0] as HTMLElement | undefined;
    if (!el || !first) return;
    setActive(Math.round(el.scrollLeft / first.offsetWidth));
  };

  return (
    <div className="px-4 lg:px-8 max-w-6xl mx-auto pb-6">
      <PageHeader title="Tables" subtitle={`${activePlayers.length} joueurs · ${tables.length} table${tables.length > 1 ? 's' : ''}`} />

      <div className="flex flex-wrap gap-2 mb-4 short:mb-2">
        <Button variant="ghost" size="sm" onClick={redistributeTables}>
          <ArrowLeftRight size={16} /> Rééquilibrer
        </Button>
        <Button variant="ghost" size="sm" onClick={addTable}>
          <Plus size={16} /> Table
        </Button>
      </div>

      {/* Onglets des tables : où l'on est, et accès direct */}
      {tables.length > 1 && (
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 mb-2" style={{ scrollbarWidth: 'none' }} role="tablist" aria-label="Tables">
          {tables.map((table, i) => (
            <button
              key={table.id}
              type="button"
              role="tab"
              aria-selected={i === active}
              onClick={() => goTo(i)}
              className={`flex-none min-h-9 px-3 rounded-full text-sm font-semibold num transition-colors
                ${i === active ? 'bg-accent text-on-accent' : 'bg-sunken text-ink-muted hover:text-ink'}`}
            >
              {table.name} · {playersOf(table.playerIds).length}/{maxPerTable}
            </button>
          ))}
        </div>
      )}

      {selected && (
        <div className="sticky top-[env(safe-area-inset-top)] z-10 mb-2 flex items-center gap-3 pl-2 pr-2 py-2 rounded-card bg-accent text-on-accent shadow-raised">
          <PlayerCoin name={selected.name} className="w-9 text-xs" />
          <span className="flex-1 text-sm"><b>{selected.name}</b> → touche une place libre</span>
          <button onClick={() => setSelectedId(null)} className="min-h-11 px-3 text-sm font-semibold rounded-control hover:bg-on-accent/15">
            Annuler
          </button>
        </div>
      )}

      <div
        ref={sliderRef}
        onScroll={onScroll}
        className="flex overflow-x-auto snap-x snap-mandatory -mx-4 lg:-mx-8"
        style={{ scrollbarWidth: 'none' }}
      >
        {tables.map(table => {
          const tablePlayers = playersOf(table.playerIds);
          const isFull = tablePlayers.length >= maxPerTable;
          const isShort = tablePlayers.length > 0 && tablePlayers.length <= 3;
          const canReceive = !!selected && selected.tableId !== table.id && !isFull;

          return (
            <section
              key={table.id}
              aria-label={table.name}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData('playerId'); if (id && !isFull) moveTo(id, table.id); }}
              className="flex-none w-full md:w-1/2 xl:w-1/3 snap-start px-4 lg:px-8 pt-2 pb-8 short:pt-4 short:pb-6 flex flex-col gap-2"
            >
              <div className={`flex items-center justify-between gap-2 min-h-11 ${tables.length > 1 ? 'short:hidden' : ''}`}>
                <h2 className="font-display text-2xl font-extrabold">{table.name}</h2>
                <div className="flex items-center gap-1">
                  <span className={`text-sm font-bold num ${isFull ? 'text-danger' : 'text-ink-muted'}`}>{tablePlayers.length} / {maxPerTable}</span>
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

              <PokerTable
                name={table.name}
                players={tablePlayers}
                seats={maxPerTable}
                selectedId={selectedId}
                onSelectPlayer={id => { setSelectedId(cur => (cur === id ? null : id)); feedback('tick'); }}
                canReceive={canReceive}
                onEmptySeat={() => selected && moveTo(selected.id, table.id)}
              />

              {isShort && (
                <p className="flex items-center justify-center gap-1.5 text-xs text-ink-muted">
                  <AlertTriangle size={13} /> Table courte : pense à rééquilibrer
                </p>
              )}
            </section>
          );
        })}
      </div>

      {!selected && (
        <p className="mt-3 text-xs text-ink-faint text-center">
          Touche un joueur, puis une place libre.{tables.length > 1 ? ' Glisse pour changer de table.' : ''}
        </p>
      )}
    </div>
  );
}
