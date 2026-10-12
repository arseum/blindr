import { useEffect, useMemo } from 'react';
import { chipColorVar } from '../utils/chips';

const CHIP_VALUES = [5, 25, 100, 500, 1000, 5000];

/** La bulle vient d'éclater : pluie de jetons et annonce, quelques secondes. Un toucher ferme. */
export function BubbleBurst({ paidCount, onDone }: { paidCount: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4200);
    return () => clearTimeout(t);
  }, [onDone]);

  // Positions figées au montage : la pluie ne change pas à chaque rendu
  const rain = useMemo(() => Array.from({ length: 26 }, (_, i) => ({
    left: (i * 37) % 100,
    delay: (i % 9) * 0.12,
    duration: 1.6 + ((i * 7) % 10) / 10,
    size: 28 + ((i * 13) % 24),
    value: CHIP_VALUES[i % CHIP_VALUES.length],
  })), []);

  return (
    <div role="alert" onClick={onDone} className="fixed inset-0 z-[60] overflow-hidden bg-canvas/80 backdrop-blur-[2px] grid place-items-center cursor-pointer">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none motion-reduce:hidden">
        {rain.map((c, i) => (
          <span
            key={i}
            className="chip-coin chip-rain absolute -top-16"
            style={{
              left: `${c.left}%`, width: c.size, '--c': chipColorVar(c.value),
              animationDelay: `${c.delay}s`, animationDuration: `${c.duration}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>
      <div className="relative text-center px-6 burst-in">
        <p className="font-display text-6xl sm:text-8xl font-extrabold text-success">Bulle éclatée !</p>
        <p className="mt-3 text-lg text-ink">
          Les <b className="num">{paidCount}</b> joueurs restants sont payés.
        </p>
      </div>
    </div>
  );
}
