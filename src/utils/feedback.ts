import { useSettingsStore } from '../store/settingsStore';
import { playClack, playBubble, playCelebration, vibrate } from './sound';

/**
 * Retour tactile et sonore des gestes, selon les réglages Son / Vibration.
 * Un seul endroit pour régler la « sensation » de l'app.
 */
export type FeedbackKind =
  | 'tick'      // roulette qui passe une valeur
  | 'select'    // choix d'une option
  | 'arm'       // geste armé (glissement assez long, bouton presque rempli)
  | 'eliminate' // joueur éliminé
  | 'confirm'   // action maintenue validée
  | 'pause'     // timer en pause
  | 'resume'    // timer relancé
  | 'bump'      // limite atteinte (pas de niveau avant le premier)
  | 'bubble'
  | 'celebrate';

const PATTERNS: Record<FeedbackKind, { vibrate?: number | number[]; sound?: () => void }> = {
  tick:      { vibrate: 4,             sound: () => playClack(2200, 0.06) },
  select:    { vibrate: 8,             sound: () => playClack(1600, 0.1) },
  arm:       { vibrate: 12,            sound: () => playClack(900, 0.1) },
  eliminate: { vibrate: [20, 40, 20],  sound: () => playClack(600, 0.14) },
  confirm:   { vibrate: [30, 50, 30],  sound: () => playClack(700, 0.15) },
  pause:     { vibrate: 25,            sound: () => playClack(700, 0.12) },
  resume:    { vibrate: 10,            sound: () => playClack(1300, 0.12) },
  bump:      { vibrate: 30 },
  bubble:    { vibrate: [60, 80, 60],  sound: playBubble },
  celebrate: { vibrate: [40, 60, 40, 60, 120], sound: playCelebration },
};

export function feedback(kind: FeedbackKind) {
  const { sound, vibration } = useSettingsStore.getState();
  const p = PATTERNS[kind];
  if (vibration && p.vibrate !== undefined) vibrate(p.vibrate);
  if (sound) p.sound?.();
}
