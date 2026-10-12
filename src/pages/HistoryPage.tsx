import { Trash2 } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { PlaceCoin } from '../components/ui/PlaceCoin';
import { useHistoryStore } from '../store/historyStore';
import { PageHeader } from '../components/PageHeader';
import { HoldButton } from '../components/ui/HoldButton';
import type { Page } from '../types';

interface HistoryPageProps {
  onNavigate: (page: Page) => void;
}

/** Pile de jetons décalés pour l'état vide. */
const STACK = [
  { chip: 5, x: -46, y: 12, r: -14 },
  { chip: 10, x: 44, y: 14, r: 10 },
  { chip: 500, x: -14, y: -2, r: -4 },
  { chip: 1000, x: 16, y: -14, r: 8 },
  { chip: 25, x: -4, y: -30, r: -6 },
];

function ChipStack() {
  return (
    <div aria-hidden="true" className="relative mx-auto mb-6 h-28 w-40">
      {STACK.map(c => (
        <span
          key={c.chip}
          className="chip-coin absolute left-1/2 top-1/2 w-14 cursor-[inherit]"
          style={{
            '--c': `var(--color-chip-${c.chip})`,
            transform: `translate(calc(-50% + ${c.x}px), calc(-50% + ${c.y}px)) rotate(${c.r}deg)`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

export function HistoryPage({ onNavigate }: HistoryPageProps) {
  const { entries, removeEntry, clearHistory } = useHistoryStore();

  const totalGames = entries.length;

  return (
    <div className="px-4 lg:px-8 pb-6">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="Historique"
          subtitle={`${totalGames} tournoi${totalGames > 1 ? 's' : ''} enregistré${totalGames > 1 ? 's' : ''}`}
          actions={entries.length > 0 && (
            <HoldButton onConfirm={clearHistory} doneLabel="Effacé" className="text-sm"><Trash2 size={16} /> Vider</HoldButton>
          )}
        />

        {entries.length === 0 ? (
          <Card className="text-center py-16">
            <ChipStack />
            <p className="text-ink font-display font-bold text-xl">Aucun tournoi terminé</p>
            <p className="text-ink-muted text-sm mt-2">Les résultats apparaîtront ici à la fin de chaque tournoi</p>
            <Button className="mt-6" onClick={() => onNavigate('setup')}>Configurer un tournoi</Button>
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {entries.map(entry => (
              <Card key={entry.id}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-display font-bold text-accent text-lg">{entry.name}</h3>
                    <p className="text-ink-muted text-sm">
                      {new Date(entry.date).toLocaleDateString('fr-FR', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => removeEntry(entry.id)}
                    aria-label={`Supprimer ${entry.name}`}
                    className="grid place-items-center w-11 h-11 -mt-2 -mr-2 rounded-full text-ink-faint hover:text-danger hover:bg-danger/10 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-4 divide-x divide-line/40 mt-4 border-t border-line/40 pt-4">
                  <div className="text-center px-2">
                    <div className="num-display text-3xl text-ink">{entry.playerCount}</div>
                    <div className="text-ink-faint text-xs">joueurs</div>
                  </div>
                  <div className="text-center px-2">
                    <div className="num-display text-3xl text-ink">{entry.duration}<span className="text-base text-ink-muted"> min</span></div>
                    <div className="text-ink-faint text-xs">durée</div>
                  </div>
                  <div className="text-center px-2">
                    <div className="num-display text-3xl text-accent">{entry.totalPot}<span className="text-base"> €</span></div>
                    <div className="text-ink-faint text-xs">pot</div>
                  </div>
                  <div className="text-center px-2">
                    <div className="num-display text-3xl text-success">{entry.buyIn}<span className="text-base"> €</span></div>
                    <div className="text-ink-faint text-xs">buy-in</div>
                  </div>
                </div>

                {entry.placements.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-semibold text-ink-muted mb-2">Classement</h4>
                    <div className="flex flex-wrap gap-2">
                      {entry.placements.slice(0, 5).map((p, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-sunken rounded-full pl-1.5 pr-3 py-1.5">
                          <PlaceCoin position={p.position} className="w-7 text-xs" />
                          <span className="text-ink text-sm">{p.playerName}</span>
                          {p.prize > 0 && (
                            <Badge variant="success">{p.prize}€</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

