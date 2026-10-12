import { useSyncExternalStore } from 'react';

/** Événement non standard de Chrome/Android, absent des types DOM. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// L'événement peut arriver avant le montage de React : on l'écoute dès le chargement du module.
let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach(l => l());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault(); // on affiche notre propre bouton
    deferred = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installed = true;
    notify();
  });
}

function isStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches
    || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function isIOS(): boolean {
  const ua = navigator.userAgent;
  // iPadOS se présente comme un Mac : on le reconnaît à l'écran tactile
  return /iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1);
}

const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const getVersion = () => `${!!deferred}-${installed}`;

export interface InstallState {
  /** L'app tourne déjà installée (écran d'accueil). */
  isInstalled: boolean;
  /** Le navigateur propose l'installation en un clic (Chrome, Edge, Android). */
  canPrompt: boolean;
  /** iPhone/iPad : installation manuelle via Partager → Sur l'écran d'accueil. */
  needsIOSInstructions: boolean;
  promptInstall: () => Promise<void>;
}

export function useInstallPrompt(): InstallState {
  useSyncExternalStore(subscribe, getVersion, getVersion);
  const isInstalled = installed || isStandalone();
  return {
    isInstalled,
    canPrompt: !isInstalled && !!deferred,
    needsIOSInstructions: !isInstalled && !deferred && isIOS(),
    promptInstall: async () => {
      if (!deferred) return;
      await deferred.prompt();
      await deferred.userChoice;
      deferred = null;
      notify();
    },
  };
}
