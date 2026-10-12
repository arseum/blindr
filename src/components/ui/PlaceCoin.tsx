import { positionLabel } from '../../utils/prizePool';

/** Podium en jetons : or (ocre), argent (ardoise), bronze (orange). */
const PODIUM: Record<number, string> = {
  1: 'var(--color-chip-1000)',
  2: 'var(--color-chip-1)',
  3: 'var(--color-chip-5000)',
};

/** Jeton numéroté d'une place payée — remplace les médailles emoji. */
export function PlaceCoin({ position, className = 'w-8 text-xs' }: { position: number; className?: string }) {
  const color = PODIUM[position];
  if (!color) {
    return (
      <span className={`grid place-items-center flex-none aspect-square rounded-full bg-sunken text-ink-muted font-bold num ${className}`} aria-label={positionLabel(position)}>
        {position}
      </span>
    );
  }
  return (
    <span
      className={`chip-coin cursor-[inherit] ${className}`}
      style={{ '--c': color } as React.CSSProperties}
      aria-label={positionLabel(position)}
    >
      {position}
    </span>
  );
}
