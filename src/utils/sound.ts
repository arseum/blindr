/**
 * Sons générés avec la Web Audio API : aucun fichier à charger, fonctionne hors ligne.
 * Les navigateurs mobiles exigent un geste de l'utilisateur avant de jouer un son :
 * `unlockAudio()` est appelé au premier toucher (voir main.tsx).
 */
let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null;
  ctx ??= new AudioContext();
  return ctx;
}

export function unlockAudio() {
  const c = getContext();
  if (c && c.state === 'suspended') void c.resume();
}

function tone(c: AudioContext, freq: number, start: number, duration: number, volume = 0.25, type: OscillatorType = 'sine') {
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

/** Nouveau niveau : trois notes montantes. */
export function playLevelChange() {
  const c = getContext();
  if (!c || c.state !== 'running') return;
  const t = c.currentTime;
  tone(c, 660, t, 0.35);
  tone(c, 880, t + 0.18, 0.35);
  tone(c, 1320, t + 0.36, 0.6);
}

/** Dernière minute du niveau : deux bips courts. */
export function playOneMinuteWarning() {
  const c = getContext();
  if (!c || c.state !== 'running') return;
  const t = c.currentTime;
  tone(c, 990, t, 0.15, 0.2);
  tone(c, 990, t + 0.25, 0.15, 0.2);
}

/** « Clac » de jeton : bref, sec, la hauteur varie avec le geste. */
export function playClack(pitch = 1800, volume = 0.1) {
  const c = getContext();
  if (!c || c.state !== 'running') return;
  const t = c.currentTime;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(pitch, t);
  osc.frequency.exponentialRampToValueAtTime(pitch / 2, t + 0.04);
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + 0.07);
}

/** Bulle : deux notes graves, tendues. */
export function playBubble() {
  const c = getContext();
  if (!c || c.state !== 'running') return;
  const t = c.currentTime;
  tone(c, 220, t, 0.5, 0.22, 'triangle');
  tone(c, 233, t + 0.45, 0.7, 0.22, 'triangle');
}

/** Bulle éclatée / victoire : arpège majeur. */
export function playCelebration() {
  const c = getContext();
  if (!c || c.state !== 'running') return;
  const t = c.currentTime;
  [523, 659, 784, 1047].forEach((f, i) => tone(c, f, t + i * 0.11, 0.5, 0.2));
}

export function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(pattern);
}
