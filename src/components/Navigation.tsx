import React from 'react';
import { SlidersHorizontal, Timer, Users, LayoutGrid, History } from 'lucide-react';
import type { Page } from '../types';
import { useTournamentStore } from '../store/tournamentStore';

interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: Array<{ page: Page; label: string; icon: React.ReactNode }> = [
  { page: 'setup',      label: 'Config',     icon: <SlidersHorizontal size={22} /> },
  { page: 'tournament', label: 'Timer',      icon: <Timer size={22} /> },
  { page: 'players',    label: 'Joueurs',    icon: <Users size={22} /> },
  { page: 'tables',     label: 'Tables',     icon: <LayoutGrid size={22} /> },
  { page: 'history',    label: 'Historique', icon: <History size={22} /> },
];

/** Barre d'onglets en bas (téléphone, tablette portrait) ; rail à gauche à partir de lg. */
export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const isRunning = useTournamentStore(s => !!s.tournament?.isRunning);

  return (
    <nav
      aria-label="Navigation principale"
      className="
        fixed z-40 bg-surface/92 backdrop-blur-md border-line
        inset-x-0 bottom-0 border-t pb-[env(safe-area-inset-bottom)]
        lg:inset-x-auto lg:left-0 lg:top-0 lg:w-24 lg:border-t-0 lg:border-r lg:pb-0 lg:pt-[max(1.25rem,env(safe-area-inset-top))]
        short:inset-x-auto short:left-0 short:top-0 short:w-[calc(5rem+env(safe-area-inset-left))] short:pl-[env(safe-area-inset-left)] short:border-t-0 short:border-r short:pb-0 short:pt-2 short:overflow-y-auto
      "
    >
      <img src="/favicon.svg" alt="Blindr" className="hidden lg:block w-11 h-11 mx-auto mb-6" />
      <ul className="flex lg:flex-col lg:gap-1 short:flex-col short:gap-0">
        {navItems.map(({ page, label, icon }) => {
          const isActive = currentPage === page;
          return (
            <li key={page} className="flex-1 lg:flex-none short:flex-none">
              <button
                onClick={() => onNavigate(page)}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  relative w-full min-h-14 flex flex-col items-center justify-center gap-1 lg:py-3 short:min-h-0 short:py-1.5
                  text-[11px] font-semibold transition-colors
                  focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent
                  ${isActive ? 'text-accent' : 'text-ink-faint hover:text-ink-muted'}
                `}
              >
                <span className={`relative grid place-items-center w-12 h-8 rounded-full transition-colors ${isActive ? 'bg-accent/12' : ''}`}>
                  {icon}
                  {page === 'tournament' && isRunning && !isActive && (
                    <span className="absolute top-0.5 right-2.5 w-2 h-2 rounded-full bg-success motion-safe:animate-pulse" />
                  )}
                </span>
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
