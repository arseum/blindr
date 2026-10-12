import { useRef } from 'react';

/**
 * Toucher / glisser horizontal sur une même surface :
 * un appui sans mouvement → onTap ; un glissement horizontal franc → onSwipe(-1 | 1).
 * `offset` suit le doigt pour un léger effet de traction.
 */
export function useTapSwipe({ onTap, onSwipe, onDrag }: {
  onTap: () => void;
  onSwipe: (direction: -1 | 1) => void;
  onDrag?: (dx: number) => void;
}) {
  const g = useRef({ x0: 0, y0: 0, down: false, moved: false, horizontal: false });

  return {
    onPointerDown: (e: React.PointerEvent) => {
      g.current = { x0: e.clientX, y0: e.clientY, down: true, moved: false, horizontal: false };
    },
    onPointerMove: (e: React.PointerEvent<HTMLElement>) => {
      const s = g.current;
      if (!s.down) return;
      const dx = e.clientX - s.x0, dy = e.clientY - s.y0;
      if (!s.moved && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
        s.moved = true;
        s.horizontal = Math.abs(dx) > Math.abs(dy);
        if (s.horizontal) e.currentTarget.setPointerCapture(e.pointerId);
      }
      if (s.horizontal) onDrag?.(dx);
    },
    onPointerUp: (e: React.PointerEvent) => {
      const s = g.current;
      if (!s.down) return;
      s.down = false;
      onDrag?.(0);
      const dx = e.clientX - s.x0;
      if (!s.moved) onTap();
      else if (s.horizontal && Math.abs(dx) > 60) onSwipe(dx < 0 ? 1 : -1);
    },
    onPointerCancel: () => { g.current.down = false; onDrag?.(0); },
  };
}
