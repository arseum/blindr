import type { BlindLevel } from '../types';

/**
 * Montée des blindes en barres : on voit d'un coup d'œil si la soirée sera calme ou nerveuse.
 * Les niveaux après `reserveFrom` (réserve, au-delà de la fin estimée) sont estompés.
 */
export function BlindCurve({ structure, reserveFrom = Infinity, className = '' }: { structure: BlindLevel[]; reserveFrom?: number; className?: string }) {
  const max = Math.max(1, ...structure.map(l => l.bigBlind));
  return (
    <div className={`flex items-end gap-[3px] h-16 ${className}`} aria-hidden="true">
      {structure.map((l, i) => (
        <span
          key={i}
          className={`flex-1 rounded-t-[3px] transition-[height] duration-500 ease-out ${l.isBreak ? 'bg-line' : i >= reserveFrom ? 'bg-accent/25' : 'bg-accent/85'}`}
          style={{ height: l.isBreak ? '6%' : `${Math.max(6, Math.sqrt(l.bigBlind / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}
