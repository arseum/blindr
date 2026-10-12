import { useRef, useState } from 'react';
import { feedback } from '../../utils/feedback';

interface HoldButtonProps {
  children: React.ReactNode;
  /** Texte affiché un instant après validation. */
  doneLabel: string;
  onConfirm: () => void;
  tone?: 'danger' | 'neutral';
  durationMs?: number;
  className?: string;
}

/**
 * Bouton à maintenir pour les actions qu'on regretterait : il se remplit pendant l'appui,
 * relâcher avant la fin annule. Remplace les fenêtres « Êtes-vous sûr ? ».
 */
export function HoldButton({ children, doneLabel, onConfirm, tone = 'danger', durationMs = 900, className = '' }: HoldButtonProps) {
  const [state, setState] = useState<'idle' | 'holding' | 'done'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const start = (e: React.SyntheticEvent) => {
    if (state === 'done') return;
    e.preventDefault();
    setState('holding');
    feedback('arm');
    timer.current = setTimeout(() => {
      setState('done');
      feedback('confirm');
      onConfirm();
      setTimeout(() => setState('idle'), 1600);
    }, durationMs);
  };
  const cancel = () => {
    clearTimeout(timer.current);
    setState(s => (s === 'holding' ? 'idle' : s));
  };

  const fill = tone === 'danger' ? 'bg-danger' : 'bg-ink';
  const active = state !== 'idle';

  return (
    <button
      type="button"
      onPointerDown={start}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onPointerCancel={cancel}
      onContextMenu={e => e.preventDefault()}
      onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) start(e); }}
      onKeyUp={cancel}
      className={`relative overflow-hidden min-h-12 px-4 rounded-control border font-semibold select-none touch-none
        [-webkit-touch-callout:none] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
        ${state === 'done' ? `${fill} border-transparent` : 'bg-surface border-line'} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-0 origin-left ${fill}`}
        style={{
          transform: `scaleX(${state === 'idle' ? 0 : 1})`,
          transition: state === 'holding' ? `transform ${durationMs}ms linear` : 'transform 150ms ease-out',
        }}
      />
      <span className={`relative inline-flex items-center gap-2 transition-colors ${active ? (tone === 'danger' ? 'text-on-accent' : 'text-canvas') : 'text-ink'}`}>
        {state === 'done' ? doneLabel : children}
      </span>
    </button>
  );
}
