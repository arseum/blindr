import { useCallback, useEffect, useState } from 'react';
import { useTournamentStore } from '../store/tournamentStore';
import { useHistoryStore } from '../store/historyStore';
import { useSettingsStore } from '../store/settingsStore';
import { useWakeLock } from '../hooks/useWakeLock';
import { playLevelChange, playOneMinuteWarning, vibrate } from '../utils/sound';
import { calculatePrizes, getPaidPlaces } from '../utils/prizePool';
import { bubbleState, bubbleBurst } from '../utils/bubble';
import { feedback } from '../utils/feedback';
import { BubbleBurst } from './BubbleBurst';
import { TV_EFFECT_KEY } from '../constants';
import { LevelTransitionOverlay, pickRandomEffect } from './LevelTransitionOverlay';
import type { TransitionEffect } from './LevelTransitionOverlay';
import { EndTournamentOverlay } from './EndTournamentOverlay';
import type { Page } from '../types';

/**
 * Événements du tournoi, montés une seule fois dans App pour fonctionner quel que soit l'onglet ouvert :
 * transition + son + vibration au changement de niveau, bip à une minute, écran allumé pendant le jeu,
 * fin de tournoi quand il ne reste qu'un joueur.
 */
export function TournamentEvents({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const tournament = useTournamentStore(s => s.tournament);
  const endTournament = useTournamentStore(s => s.endTournament);
  const clearTournament = useTournamentStore(s => s.clearTournament);
  const addEntry = useHistoryStore(s => s.addEntry);

  const [transition, setTransition] = useState<{ effect: TransitionEffect; label: string } | null>(null);
  const [burst, setBurst] = useState<number | null>(null);
  const closeBurst = useCallback(() => setBurst(null), []);

  useWakeLock(!!tournament?.isRunning);

  // Changement de niveau et dernière minute : abonnement direct au store (état précédent fourni)
  useEffect(() => useTournamentStore.subscribe((state, prevState) => {
    const now = state.tournament;
    const before = prevState.tournament;
    if (!now || !before || now.id !== before.id) return; // pas de tournoi ou nouveau tournoi : rien à annoncer

    // Bulle : annonce quand on y entre, célébration quand elle éclate
    const paid = getPaidPlaces(now.players.length, now.config.prizePool.itmPct);
    const bubbleBefore = bubbleState(before.players.filter(p => !p.isEliminated).length, paid);
    const bubbleNow = bubbleState(now.players.filter(p => !p.isEliminated).length, paid);
    if (bubbleBefore === 'before' && bubbleNow === 'bubble') feedback('bubble');
    if (bubbleBurst(bubbleBefore, bubbleNow) && !now.isEnded) { setBurst(paid); feedback('celebrate'); }

    const { sound, vibration } = useSettingsStore.getState();
    const level = now.config.blindStructure[now.currentLevelIndex];
    if (now.currentLevelIndex !== before.currentLevelIndex) {
      const label = level.isBreak ? 'Pause' : `Niveau ${level.level}`;
      const effect = pickRandomEffect();
      try { localStorage.setItem(TV_EFFECT_KEY, JSON.stringify({ effect, label, ts: Date.now() })); } catch { /* ignore */ }
      setTransition({ effect, label });
      if (sound) playLevelChange();
      if (vibration) vibrate([200, 100, 200]);
    } else if (now.isRunning && !level.isBreak && before.secondsRemaining > 60 && now.secondsRemaining <= 60) {
      if (sound) playOneMinuteWarning();
      if (vibration) vibrate(150);
    }
  }), []);

  // Fin de tournoi : un seul joueur restant
  const activeCount = tournament?.players.filter(p => !p.isEliminated).length ?? 0;
  const totalCount = tournament?.players.length ?? 0;
  useEffect(() => {
    if (tournament && !tournament.isEnded && activeCount === 1 && totalCount > 1) endTournament();
  }, [tournament, activeCount, totalCount, endTournament]);

  const handleCloseEnd = () => {
    if (!tournament) return;
    const pot = (tournament.players.length + tournament.rebuyCount) * tournament.config.buyIn;
    const prizes = calculatePrizes(
      Math.round(pot * tournament.config.prizePool.prizePoolPct / 100),
      tournament.players.length,
      tournament.config.prizePool,
    );
    const prizeFor = (position: number) => prizes.find(p => p.position === position)?.amount ?? 0;
    const winner = tournament.players.find(p => !p.isEliminated) ?? tournament.players.reduce((b, p) =>
      (p.position ?? 99) < (b.position ?? 99) ? p : b
    );
    addEntry({
      id: tournament.id,
      name: tournament.config.name,
      date: Date.now(),
      buyIn: tournament.config.buyIn,
      playerCount: tournament.players.length,
      rebuyCount: tournament.rebuyCount,
      totalPot: pot,
      duration: tournament.startedAt ? Math.round((Date.now() - tournament.startedAt) / 60000) : 0,
      placements: [
        { playerName: winner.name, position: 1, prize: prizeFor(1) },
        ...tournament.players
          .filter(p => p.isEliminated && p.position !== undefined)
          .sort((a, b) => (a.position ?? 99) - (b.position ?? 99))
          .map(p => ({ playerName: p.name, position: p.position!, prize: prizeFor(p.position!) })),
      ],
    });
    clearTournament();
    onNavigate('history');
  };

  if (!tournament) return null;

  return (
    <>
      {transition && (
        <LevelTransitionOverlay
          effect={transition.effect}
          levelLabel={transition.label}
          onDone={() => setTransition(null)}
        />
      )}
      {burst !== null && <BubbleBurst paidCount={burst} onDone={closeBurst} />}
      {tournament.isEnded && <EndTournamentOverlay tournament={tournament} onClose={handleCloseEnd} />}
    </>
  );
}
