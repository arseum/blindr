import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

/**
 * Service worker : signale quand l'app est prête hors ligne, et quand une nouvelle version attend.
 * Pas de mise à jour automatique : recharger en plein tournoi interromprait l'animation et le son.
 */
export function UpdateToast() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!offlineReady && !needRefresh) return null;
  const close = () => { setOfflineReady(false); setNeedRefresh(false); };

  return (
    <div
      role="status"
      className="fixed z-50 left-4 right-4 sm:left-auto sm:w-96 bottom-[calc(5rem+env(safe-area-inset-bottom))] lg:bottom-6 short:bottom-4
                 flex items-center gap-3 pl-4 pr-2 py-2 rounded-card bg-ink text-canvas shadow-sheet"
    >
      <p className="flex-1 text-sm">
        {needRefresh ? 'Une nouvelle version de Blindr est disponible.' : 'Blindr est prêt à fonctionner hors ligne.'}
      </p>
      {needRefresh && (
        <button
          onClick={() => updateServiceWorker(true)}
          className="inline-flex items-center gap-1.5 min-h-11 px-3 rounded-control font-semibold text-sm bg-canvas text-ink"
        >
          <RefreshCw size={15} /> Mettre à jour
        </button>
      )}
      <button onClick={close} aria-label="Fermer" className="grid place-items-center w-11 h-11 rounded-full hover:bg-canvas/10">
        <X size={18} />
      </button>
    </div>
  );
}
