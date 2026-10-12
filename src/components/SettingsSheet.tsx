import { useEffect } from 'react';
import { X, Monitor, Sun, Moon, Tv } from 'lucide-react';
import { useColorScheme, COLOR_SCHEMES, COLOR_SCHEME_LABELS } from '../contexts/colorScheme';
import { useSettingsStore } from '../store/settingsStore';
import { playLevelChange, unlockAudio, vibrate } from '../utils/sound';
import { Switch } from './ui/Switch';
import { InstallCard } from './InstallCard';

const SCHEME_ICONS = { system: Monitor, light: Sun, dark: Moon };

/** Réglages : panneau en bas sur téléphone, fenêtre centrée sur grand écran. */
export function SettingsSheet({ onClose }: { onClose: () => void }) {
  const { scheme, setScheme } = useColorScheme();
  const { sound, vibration, setSound, setVibration } = useSettingsStore();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="settings-title">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative w-full sm:max-w-md max-h-[92dvh] overflow-y-auto bg-surface rounded-t-sheet sm:rounded-sheet shadow-sheet px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pt-5 flex flex-col gap-6">
        <div className="mx-auto w-10 h-1 rounded-full bg-line sm:hidden" />
        <div className="flex items-center justify-between">
          <h2 id="settings-title" className="font-display text-2xl font-extrabold">Réglages</h2>
          <button onClick={onClose} aria-label="Fermer" className="grid place-items-center w-11 h-11 -mr-2 rounded-full text-ink-muted hover:bg-sunken">
            <X size={22} />
          </button>
        </div>

        <InstallCard />

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-ink-muted">Apparence</h3>
          <div className="grid grid-cols-3 gap-1 p-1 rounded-control bg-sunken">
            {COLOR_SCHEMES.map(s => {
              const Icon = SCHEME_ICONS[s];
              return (
                <button
                  key={s}
                  onClick={() => setScheme(s)}
                  aria-pressed={scheme === s}
                  className={`min-h-11 flex items-center justify-center gap-2 rounded-[6px] text-sm font-semibold transition-colors ${scheme === s ? 'bg-surface text-ink shadow-raised' : 'text-ink-muted hover:text-ink'}`}
                >
                  <Icon size={16} /> {COLOR_SCHEME_LABELS[s]}
                </button>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold text-ink-muted mb-1">Changement de niveau</h3>
          <Switch
            label="Son"
            description="Trois notes au nouveau niveau, deux bips à une minute"
            checked={sound}
            onChange={on => { setSound(on); if (on) { unlockAudio(); playLevelChange(); } }}
          />
          <Switch
            label="Vibration"
            description="Sur les téléphones qui le permettent"
            checked={vibration}
            onChange={on => { setVibration(on); if (on) vibrate(150); }}
          />
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-ink-muted">Écran TV</h3>
          <button
            onClick={() => window.open('/?display', 'blindr-tv', 'popup=true,width=1920,height=1080')}
            className="min-h-12 flex items-center gap-3 px-4 rounded-control border border-line text-left hover:bg-sunken"
          >
            <Tv size={20} className="text-ink-muted flex-none" />
            <span className="flex flex-col">
              <span className="font-semibold">Ouvrir l'affichage grand écran</span>
              <span className="text-sm text-ink-muted">Dans une nouvelle fenêtre, à placer sur la TV</span>
            </span>
          </button>
        </section>
      </div>
    </div>
  );
}
