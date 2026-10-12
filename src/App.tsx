import { useState } from 'react';
import type { Page } from './types';
import { Navigation } from './components/Navigation';
import { SetupPage } from './pages/SetupPage';
import { TournamentPage } from './pages/TournamentPage';
import { TablesPage } from './pages/TablesPage';
import { HistoryPage } from './pages/HistoryPage';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('setup');

  const renderPage = () => {
    switch (currentPage) {
      case 'setup':      return <SetupPage onNavigate={setCurrentPage} />;
      case 'tournament': return <TournamentPage onNavigate={setCurrentPage} />;
      case 'tables':     return <TablesPage onNavigate={setCurrentPage} />;
      case 'history':    return <HistoryPage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="relative min-h-dvh">
      <div className="pb-16 md:pb-0 md:pt-12">
        <Navigation currentPage={currentPage} onNavigate={setCurrentPage} />
        {renderPage()}
      </div>
    </div>
  );
}

export default App;
