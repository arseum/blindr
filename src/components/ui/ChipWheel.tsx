import { useEffect, useRef } from 'react';
import { feedback } from '../../utils/feedback';
import { chipColorVar } from '../../utils/chips';

interface ChipWheelProps {
  values: number[];
  value: number;
  onChange: (value: number) => void;
  label: string;
  /** Texte affiché sur le jeton (par défaut « 10k » pour 10 000). */
  format?: (v: number) => string;
}

const shortValue = (v: number) => (v >= 1000 ? `${v / 1000}k` : String(v));

/**
 * Roulette de jetons : on fait défiler du doigt, la valeur se cale au centre avec un « clic ».
 * Les transformations sont appliquées directement au DOM pendant le défilement (60 i/s sans re-rendu React).
 */
export function ChipWheel({ values, value, onChange, label, format = shortValue }: ChipWheelProps) {
  const ref = useRef<HTMLDivElement>(null);
  const current = useRef(-1);
  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

  const indexOf = (v: number) => {
    let best = 0;
    values.forEach((x, i) => { if (Math.abs(x - v) < Math.abs(values[best] - v)) best = i; });
    return best;
  };

  const center = (i: number, smooth: boolean) => {
    const el = ref.current;
    const chip = el?.children[i] as HTMLElement | undefined;
    if (!el || !chip) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ left: chip.offsetLeft - el.clientWidth / 2 + chip.offsetWidth / 2, behavior: smooth && !reduce ? 'smooth' : 'auto' });
  };

  // Mise en place : marges pour que le premier et le dernier jeton puissent se centrer
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      const mid = el.scrollLeft + el.clientWidth / 2;
      let best = 0, bestD = Infinity;
      Array.from(el.children as HTMLCollectionOf<HTMLElement>).forEach((c, i) => {
        const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid);
        c.style.transform = `scale(${Math.max(0.55, 1 - d / 260).toFixed(3)})`;
        c.style.opacity = Math.max(0.25, 1 - d / 220).toFixed(3);
        if (d < bestD) { bestD = d; best = i; }
      });
      if (best !== current.current) {
        const first = current.current === -1;
        current.current = best;
        if (!first) { feedback('tick'); onChangeRef.current(values[best]); }
      }
    };
    const pad = () => {
      const first = el.children[0] as HTMLElement | undefined;
      if (first) el.style.paddingInline = `${el.clientWidth / 2 - first.offsetWidth / 2}px`;
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };

    // Souris : glisser pour faire tourner, et molette (verticale ou horizontale)
    let drag: { x: number; left: number } | null = null;
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      drag = { x: e.clientX, left: el.scrollLeft };
      el.style.scrollSnapType = 'none';
      el.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => { if (drag) el.scrollLeft = drag.left - (e.clientX - drag.x); };
    const onPointerUp = () => {
      if (!drag) return;
      drag = null;
      el.style.scrollSnapType = '';
      center(current.current, true);
    };
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return; // le trackpad horizontal défile déjà
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    el.addEventListener('wheel', onWheel, { passive: false });
    const onResize = () => { pad(); center(current.current < 0 ? indexOf(value) : current.current, false); };

    pad();
    center(indexOf(value), false);
    current.current = -1; // nouvelle liste : se recaler sans annoncer de changement
    update();
    el.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
      el.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [values]); // eslint-disable-line react-hooks/exhaustive-deps

  // Valeur changée de l'extérieur (formule choisie…) : la roulette suit
  useEffect(() => {
    const i = indexOf(value);
    if (i !== current.current) { current.current = i; center(i, true); }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = current.current;
    if (e.key === 'ArrowRight' && i < values.length - 1) { e.preventDefault(); center(i + 1, true); }
    if (e.key === 'ArrowLeft' && i > 0) { e.preventDefault(); center(i - 1, true); }
  };

  return (
    <div className="relative">
      <div
        ref={ref}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={values[0]}
        aria-valuemax={values[values.length - 1]}
        aria-valuenow={value}
        onKeyDown={onKeyDown}
        className="chip-wheel"
      >
        {values.map((v, i) => (
          <button
            key={v}
            type="button"
            tabIndex={-1}
            onClick={() => center(i, true)}
            className="chip-coin w-[4.25rem] text-[15px]"
            style={{ '--c': chipColorVar(v) } as React.CSSProperties}
          >
            {format(v)}
          </button>
        ))}
      </div>
      <div className="mx-auto -mt-1 w-0 h-0 border-[7px] border-transparent border-b-ink" aria-hidden="true" />
    </div>
  );
}
