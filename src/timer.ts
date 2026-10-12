/**
 * Singleton timer — tourne hors de React, indépendant du cycle de vie des composants.
 * Lancé une seule fois dans main.tsx (fenêtre principale uniquement).
 * Utilise un Web Worker pour ne jamais être throttlé quand l'onglet est masqué.
 * Broadcasts toutes les mutations du store vers la fenêtre TV.
 */
import { useTournamentStore } from './store/tournamentStore';

export const TV_SYNC_KEY = 'poker-tv-sync';

let worker: Worker | null = null;
let lastTick = Date.now();

function syncToLocalStorage() {
  const tournament = useTournamentStore.getState().tournament;
  try {
    localStorage.setItem(TV_SYNC_KEY, JSON.stringify(tournament));
  } catch { /* stockage plein ou indisponible : l'écran TV ne sera pas synchronisé */ }
}

function tick() {
  const { tournament, tickTimer } = useTournamentStore.getState();

  if (tournament?.isRunning) {
    const now = Date.now();
    const elapsed = Math.floor((now - lastTick) / 1000);
    if (elapsed >= 1) {
      lastTick += elapsed * 1000;
      tickTimer(elapsed, lastTick);
      syncToLocalStorage();
    }
  } else {
    lastTick = Date.now();
  }
}

export function initTimerLoop() {
  if (worker) return;

  // Broadcast TOUTES les mutations du store (éliminations, pause, etc.)
  useTournamentStore.subscribe(() => syncToLocalStorage());

  // Reprend depuis le dernier tick persisté : le temps écoulé app fermée est rattrapé
  const tournament = useTournamentStore.getState().tournament;
  lastTick = tournament?.isRunning && tournament.lastTickAt ? tournament.lastTickAt : Date.now();

  // Web Worker : tourne sur un thread séparé, jamais mis en pause par le navigateur
  worker = new Worker(new URL('./timerWorker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = tick;
  worker.postMessage('start');
}
