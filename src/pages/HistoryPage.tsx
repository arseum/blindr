import { Trash2, Trophy } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useHistoryStore } from '../store/historyStore';
import { PageHeader } from '../components/PageHeader';
import { HoldButton } from '../components/ui/HoldButton';
import type { Page } from '../types';

interface HistoryPageProps {
  onNavigate: (page: Page) => void;
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
            <div className="mx-auto mb-4 flex justify-center">
              <Trophy size={48} className="text-ink-faint" />
            </div>
            <p className="text-ink-faint font-display text-xl">Aucun tournoi terminé</p>
            <p className="text-ink-faint text-sm mt-2">Les résultats apparaîtront ici à la fin de chaque tournoi</p>
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
                    className="text-ink-faint hover:text-danger transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-4 divide-x divide-line/40 mt-4 border-t border-line/40 pt-4">
                  <div className="text-center px-2">
                    <div className="font-display font-bold text-lg text-ink">{entry.playerCount}</div>
                    <div className="text-ink-faint text-xs">joueurs</div>
                  </div>
                  <div className="text-center px-2">
                    <div className="font-display font-bold text-lg text-ink">{entry.duration}min</div>
                    <div className="text-ink-faint text-xs">durée</div>
                  </div>
                  <div className="text-center px-2">
                    <div className="font-display font-bold text-lg text-accent">{entry.totalPot}€</div>
                    <div className="text-ink-faint text-xs">pot</div>
                  </div>
                  <div className="text-center px-2">
                    <div className="font-display font-bold text-lg text-success">{entry.buyIn}€</div>
                    <div className="text-ink-faint text-xs">buy-in</div>
                  </div>
                </div>

                {entry.placements.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-display text-sm text-ink-muted mb-2 uppercase tracking-wide">Classement</h4>
                    <div className="flex flex-wrap gap-2">
                      {entry.placements.slice(0, 5).map((p, idx) => (
                        <div key={idx} className="flex items-center gap-1.5 bg-sunken rounded-lg px-2.5 py-1.5">
                          <span className={`font-display font-bold text-sm ${idx === 0 ? 'text-accent' : idx === 1 ? 'text-ink-muted' : idx === 2 ? 'text-chip-5000' : 'text-ink-faint'}`}>
                            #{p.position}
                          </span>
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

