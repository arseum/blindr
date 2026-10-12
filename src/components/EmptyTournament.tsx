import { PageHeader } from './PageHeader';
import { Button } from './ui/Button';
import type { Page } from '../types';

/** État vide commun aux pages qui ont besoin d'un tournoi en cours. */
export function EmptyTournament({ title, onNavigate }: { title: string; onNavigate: (page: Page) => void }) {
  return (
    <div className="px-4 lg:px-8 max-w-6xl mx-auto">
      <PageHeader title={title} />
      <div className="flex flex-col items-center text-center gap-4 py-16">
        <img src="/favicon.svg" alt="" className="w-16 h-16 opacity-80" />
        <div>
          <p className="font-display text-2xl font-extrabold">Aucun tournoi en cours</p>
          <p className="text-ink-muted mt-1 max-w-xs">Choisis les joueurs, le buy-in et la structure des blindes pour lancer le timer.</p>
        </div>
        <Button size="lg" onClick={() => onNavigate('setup')}>Configurer un tournoi</Button>
      </div>
    </div>
  );
}
