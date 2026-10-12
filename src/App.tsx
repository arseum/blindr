import { useState } from 'react';
import type { Page } from './types';
import { Navigation } from './components/Navigation';
import { TournamentEvents } from './components/TournamentEvents';
import { UpdateToast } from './components/UpdateToast';
import { SetupPage } from './pages/SetupPage';
import { TournamentPage } from './pages/TournamentPage';
import { PlayersPage } from './pages/PlayersPage';
import { TablesPage } from './pages/TablesPage';
import { HistoryPage } from './pages/HistoryPage';
import { useTournamentStore } from './store/tournamentStore';
import { levelChip } from './utils/chips';

function App() {
  // Un tournoi en cours ? On rouvre directement le timer.
  const [currentPage, setCurrentPage] = useState<Page>(() =>
    useTournamentStore.getState().tournament ? 'tournament' : 'setup'
  );

  // L'accent de toute l'app (navigation comprise) suit le jeton du niveau en cours
  const chip = useTournamentStore(s => {
    const t = s.tournament;
    return t ? levelChip(t.config.blindStructure[t.currentLevelIndex]) : undefined;
  });

  const navigate = (page: Page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0 });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'setup':      return <SetupPage onNavigate={navigate} />;
      case 'tournament': return <TournamentPage onNavigate={navigate} />;
      case 'players':    return <PlayersPage onNavigate={navigate} />;
      case 'tables':     return <TablesPage onNavigate={navigate} />;
      case 'history':    return <HistoryPage onNavigate={navigate} />;
    }
  };

  return (
    <div data-chip={chip} className="min-h-dvh pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0 lg:pl-24 short:pb-0 short:pl-[calc(5rem+env(safe-area-inset-left))]">
      <Navigation currentPage={currentPage} onNavigate={navigate} />
      <main>{renderPage()}</main>
      <TournamentEvents onNavigate={navigate} />
      <UpdateToast />
    </div>
  );
}

export default App;
