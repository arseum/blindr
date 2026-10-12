const CHIP_COUNT = 10;

interface ChipTimerProps {
  /** Durée du niveau, en secondes. */
  totalSeconds: number;
  secondsRemaining: number;
  /** Taille max d'un jeton (CSS). Les 10 jetons occupent toujours la largeur disponible sans déborder. */
  size?: string;
  className?: string;
}

/**
 * Progression du niveau en jetons : 10 jetons couleur du niveau, chacun vaut 1/10 de la durée.
 * Les jetons écoulés s'effacent, celui en cours se vide comme une aiguille.
 */
export function ChipTimer({ totalSeconds, secondsRemaining, size, className = '' }: ChipTimerProps) {
  const elapsed = totalSeconds > 0 ? Math.min(1, Math.max(0, 1 - secondsRemaining / totalSeconds)) : 0;
  const spentChips = elapsed * CHIP_COUNT;
  const minutesPerChip = totalSeconds / 60 / CHIP_COUNT;
  const isWarning = secondsRemaining <= 60 && secondsRemaining > 0;

  return (
    <div className={`chip-timer flex flex-col gap-2 @container ${className}`} data-warning={isWarning || undefined}>
      <div
        role="progressbar"
        aria-label="Temps écoulé dans le niveau"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(elapsed * 100)}
        className="flex items-center gap-[2cqi]"
        style={{ '--chip-size': `min(${size ?? '3.25rem'}, 8cqi)` } as React.CSSProperties}
      >
        {Array.from({ length: CHIP_COUNT }, (_, i) => {
          const state = i < Math.floor(spentChips) ? 'spent' : i === Math.floor(spentChips) ? 'current' : 'full';
          const spentPct = state === 'current' ? `${Math.round((spentChips % 1) * 100)}%` : undefined;
          return (
            <span
              key={i}
              className="chip-token"
              data-state={state}
              style={spentPct ? ({ '--spent': spentPct } as React.CSSProperties) : undefined}
            />
          );
        })}
      </div>
      <div className="text-xs text-ink-muted num short:hidden">
        1 jeton = {formatMinutes(minutesPerChip)}
      </div>
    </div>
  );
}

function formatMinutes(min: number): string {
  if (min >= 1) return `${Number.isInteger(min) ? min : min.toFixed(1).replace('.', ',')} min`;
  return `${Math.round(min * 60)} s`;
}
