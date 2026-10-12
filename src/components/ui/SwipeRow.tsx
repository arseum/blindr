import { useRef, useState } from 'react';
import { feedback } from '../../utils/feedback';

interface SwipeRowProps {
  children: React.ReactNode;
  /** Libellé révélé sous la ligne pendant le glissement. */
  actionLabel: React.ReactNode;
  /** Appelé une fois la ligne sortie de l'écran. */
  onSwipe: () => void;
}

const THRESHOLD = 0.4; // part de la largeur à dépasser pour valider

/**
 * Ligne qu'on tire vers la gauche pour déclencher une action (comme supprimer un mail).
 * Le défilement vertical de la liste reste possible : on ne capture le doigt qu'une fois le geste horizontal.
 */
export function SwipeRow({ children, actionLabel, onSwipe }: SwipeRowProps) {
  const rowRef = useRef<HTMLLIElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const gesture = useRef({ x0: 0, y0: 0, active: false, decided: false, horizontal: false });
  const [armed, setArmed] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const setX = (x: number, animate: boolean) => {
    const front = frontRef.current;
    if (!front) return;
    front.style.transition = animate ? 'transform 260ms cubic-bezier(.2,.9,.3,1.15)' : 'none';
    front.style.transform = x ? `translateX(${x}px)` : '';
  };

  const onPointerDown = (e: React.PointerEvent) => {
    gesture.current = { x0: e.clientX, y0: e.clientY, active: true, decided: false, horizontal: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g.active) return;
    const mx = e.clientX - g.x0, my = e.clientY - g.y0;
    if (!g.decided && (Math.abs(mx) > 8 || Math.abs(my) > 8)) {
      g.decided = true;
      g.horizontal = Math.abs(mx) > Math.abs(my);
      if (g.horizontal) frontRef.current?.setPointerCapture(e.pointerId);
    }
    if (!g.decided || !g.horizontal) return;
    const width = rowRef.current?.offsetWidth ?? 1;
    const dx = Math.min(0, mx);
    const limit = -width * THRESHOLD;
    const isArmed = dx < limit;
    if (isArmed !== armed) { setArmed(isArmed); if (isArmed) feedback('arm'); }
    // au-delà du seuil, la ligne résiste un peu
    setX(dx > limit ? dx : limit + (dx - limit) * 0.6, false);
  };
  const onPointerEnd = () => {
    const g = gesture.current;
    if (!g.active) return;
    g.active = false;
    if (armed) {
      setLeaving(true);
      setX(-(rowRef.current?.offsetWidth ?? 400) * 1.1, true);
      const row = rowRef.current;
      if (row) {
        row.style.height = `${row.offsetHeight}px`;
        requestAnimationFrame(() => { row.style.height = '0px'; row.style.opacity = '0'; });
      }
      setTimeout(onSwipe, 300);
    } else {
      setX(0, true);
    }
  };

  return (
    <li
      ref={rowRef}
      data-armed={armed || undefined}
      className="relative overflow-hidden transition-[height,opacity] duration-200"
      aria-busy={leaving || undefined}
    >
      <div aria-hidden="true" className="absolute inset-0 flex items-center justify-end pr-5 bg-danger text-on-accent font-semibold text-sm">
        <span className={`inline-flex items-center gap-2 transition-transform ${armed ? 'scale-110' : ''}`}>{actionLabel}</span>
      </div>
      <div
        ref={frontRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        className="relative bg-surface touch-pan-y select-none"
      >
        {children}
      </div>
    </li>
  );
}
