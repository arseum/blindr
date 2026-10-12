import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { SettingsSheet } from './SettingsSheet';

interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

/** En-tête commun : titre, sous-titre, actions de la page et accès aux réglages. */
export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <header className="flex items-start justify-between gap-3 pt-[max(1rem,env(safe-area-inset-top))] pb-4 short:pt-2 short:pb-2">
      <div className="min-w-0">
        <h1 className="font-display text-3xl sm:text-4xl short:text-2xl font-extrabold text-ink truncate">{title}</h1>
        {subtitle && <p className="text-sm text-ink-muted mt-0.5 num">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 flex-none">
        {actions}
        <button
          onClick={() => setShowSettings(true)}
          aria-label="Réglages"
          className="grid place-items-center w-11 h-11 rounded-full text-ink-muted hover:bg-surface hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Settings size={22} />
        </button>
      </div>
      {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} />}
    </header>
  );
}
