import { useEffect } from 'react';

interface UndoToastProps {
  message: string;
  onUndo: () => void;
  onClose: () => void;
  durationMs?: number;
}

/** Bandeau « Annuler » : remplace la confirmation avant une action qu'on peut défaire. */
export function UndoToast({ message, onUndo, onClose, durationMs = 5000 }: UndoToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, durationMs);
    return () => clearTimeout(t);
  }, [message, onClose, durationMs]);

  return (
    <div
      role="status"
      className="toast-in fixed z-50 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 bottom-[calc(5rem+env(safe-area-inset-bottom))] lg:bottom-6 short:bottom-4
                 flex items-center gap-3 pl-4 pr-2 py-2 rounded-card bg-ink text-canvas shadow-sheet overflow-hidden"
    >
      <p className="flex-1 text-sm">{message}</p>
      <button onClick={onUndo} className="min-h-11 px-4 rounded-control font-semibold text-sm bg-canvas text-ink">
        Annuler
      </button>
      <span
        aria-hidden="true"
        className="toast-timer absolute left-0 right-0 bottom-0 h-0.5 bg-canvas/40 origin-left"
        style={{ animationDuration: `${durationMs}ms` }}
      />
    </div>
  );
}
