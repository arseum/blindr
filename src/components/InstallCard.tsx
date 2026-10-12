import { Download, Share, SquarePlus } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { Button } from './ui/Button';

/** Inviter à installer Blindr : bouton natif sur Android/Chrome, mode d'emploi sur iPhone. */
export function InstallCard({ onDismiss }: { onDismiss?: () => void }) {
  const { isInstalled, canPrompt, needsIOSInstructions, promptInstall } = useInstallPrompt();
  if (isInstalled || (!canPrompt && !needsIOSInstructions)) return null;

  return (
    <div className="flex flex-col gap-3 p-4 rounded-card bg-surface border border-line">
      <div className="flex items-start gap-3">
        <img src="/favicon.svg" alt="" className="w-11 h-11 flex-none" />
        <div className="min-w-0">
          <p className="font-semibold">Installer Blindr</p>
          <p className="text-sm text-ink-muted">
            Une icône sur l'écran d'accueil, plein écran, et ça marche sans réseau.
          </p>
        </div>
      </div>

      {canPrompt && (
        <div className="flex gap-2">
          <Button size="sm" onClick={promptInstall}><Download size={16} /> Installer</Button>
          {onDismiss && <Button size="sm" variant="ghost" onClick={onDismiss}>Plus tard</Button>}
        </div>
      )}

      {needsIOSInstructions && (
        <>
          <ol className="flex flex-col gap-2 text-sm">
            <li className="flex items-center gap-2">
              <span className="grid place-items-center w-6 h-6 rounded-full bg-sunken text-xs font-bold num">1</span>
              Touche <Share size={16} aria-label="Partager" className="text-chip-10" /> en bas de Safari
            </li>
            <li className="flex items-center gap-2">
              <span className="grid place-items-center w-6 h-6 rounded-full bg-sunken text-xs font-bold num">2</span>
              Choisis <SquarePlus size={16} aria-hidden="true" /> « Sur l'écran d'accueil »
            </li>
          </ol>
          {onDismiss && <Button size="sm" variant="ghost" onClick={onDismiss} className="self-start">J'ai compris</Button>}
        </>
      )}
    </div>
  );
}
