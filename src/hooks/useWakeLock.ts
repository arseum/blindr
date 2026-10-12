import { useEffect } from 'react';

/**
 * Empêche l'écran de se mettre en veille tant que `active` est vrai.
 * Le navigateur relâche le verrou quand l'app passe en arrière-plan : on le redemande au retour.
 */
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock: WakeLockSentinel | null = null;
    let cancelled = false;

    const request = async () => {
      try {
        const next = await navigator.wakeLock.request('screen');
        if (cancelled) void next.release();
        else lock = next;
      } catch { /* refusé (batterie faible, onglet masqué…) : sans conséquence */ }
    };
    const onVisible = () => { if (document.visibilityState === 'visible') void request(); };

    void request();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void lock?.release();
    };
  }, [active]);
}
