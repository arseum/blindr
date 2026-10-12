import React, { useState } from 'react';
import { Settings, Clock, Grid, History, SunMoon, X, Monitor, Sun, Moon } from 'lucide-react';
import type { Page } from '../types';
import { useTournamentStore } from '../store/tournamentStore';
import { useColorScheme, COLOR_SCHEMES, COLOR_SCHEME_LABELS } from '../contexts/ColorSchemeContext';

interface NavigationProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: Array<{ page: Page; label: string; icon: React.ReactNode }> = [
  { page: 'setup',      label: 'Setup',      icon: <Settings size={20} /> },
  { page: 'tournament', label: 'Tournoi',    icon: <Clock size={20} /> },
  { page: 'tables',     label: 'Tables',     icon: <Grid size={20} /> },
  { page: 'history',    label: 'Historique', icon: <History size={20} /> },
];

const SCHEME_ICONS: Record<string, React.ReactNode> = {
  system: <Monitor size={18} />,
  light:  <Sun size={18} />,
  dark:   <Moon size={18} />,
};

export function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const { tournament } = useTournamentStore();
  const { scheme, setScheme } = useColorScheme();
  const [showThemePicker, setShowThemePicker] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-canvas/70 backdrop-blur-md border-t border-line/60 z-50 md:top-0 md:bottom-auto md:border-t-0 md:border-b">
        <div className="flex justify-around md:justify-center md:gap-8 max-w-5xl mx-auto">
          {navItems.map(({ page, label, icon }) => {
            const isActive = currentPage === page;
            const hasContent = page === 'tournament' && tournament?.isRunning;

            return (
              <button
                key={page}
                onClick={() => onNavigate(page)}
                className={`
                  flex flex-col md:flex-row items-center gap-1 md:gap-2
                  px-4 py-3 text-xs md:text-sm font-medium transition-colors relative
                  ${isActive ? 'text-accent' : 'text-ink-faint hover:text-ink-muted'}
                `}
              >
                {icon}
                <span className="font-display tracking-wide">{label}</span>
                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent md:top-0 md:bottom-auto" />
                )}
                {hasContent && !isActive && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-success rounded-full animate-pulse" />
                )}
              </button>
            );
          })}

          {/* Theme button */}
          <button
            onClick={() => setShowThemePicker(v => !v)}
            className={`
              flex flex-col md:flex-row items-center gap-1 md:gap-2
              px-4 py-3 text-xs md:text-sm font-medium transition-colors relative
              ${showThemePicker ? 'text-accent' : 'text-ink-faint hover:text-ink-muted'}
            `}
            title="Apparence"
          >
            <SunMoon size={20} />
            <span className="font-display tracking-wide">Apparence</span>
          </button>
        </div>
      </nav>

      {/* Theme picker panel */}
      {showThemePicker && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-start justify-center pb-20 md:pt-16 px-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowThemePicker(false)}
          />

          <div className="relative bg-canvas border border-line rounded-2xl p-5 w-full max-w-sm shadow-2xl z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display text-accent text-lg font-bold tracking-wide">
                Apparence
              </h3>
              <button
                onClick={() => setShowThemePicker(false)}
                className="text-ink-faint hover:text-ink-muted transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {COLOR_SCHEMES.map(t => (
                <button
                  key={t}
                  onClick={() => { setScheme(t); setShowThemePicker(false); }}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left
                    ${scheme === t
                      ? 'border-accent bg-accent/10 text-accent'
                      : 'border-line bg-surface/50 text-ink-muted hover:border-ink-muted hover:text-ink'
                    }
                  `}
                >
                  <span className="text-ink-muted">{SCHEME_ICONS[t]}</span>
                  <div>
                    <div className="font-semibold text-sm">{COLOR_SCHEME_LABELS[t]}</div>
                    {t === 'system' && <div className="text-xs opacity-70 mt-0.5">Suit le réglage de l'appareil</div>}
                  </div>
                  {scheme === t && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-accent" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
