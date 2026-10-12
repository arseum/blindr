import { Minus, Plus } from 'lucide-react';
import { feedback } from '../../utils/feedback';

interface StepperProps {
  label: string;
  onStep: (direction: 1 | -1) => void;
  canDecrease: boolean;
  canIncrease: boolean;
  /** Valeur affichée entre les boutons. */
  children: React.ReactNode;
  className?: string;
}

/** − valeur + : chaque pas est une valeur valide, pas de saisie libre. */
export function Stepper({ label, onStep, canDecrease, canIncrease, children, className = '' }: StepperProps) {
  const step = (d: 1 | -1) => { onStep(d); feedback('tick'); };
  return (
    <span className={`inline-flex items-center ${className}`} role="group" aria-label={label}>
      <button type="button" onClick={() => step(-1)} disabled={!canDecrease} aria-label="Moins" className="grid place-items-center w-11 h-11 rounded-full text-ink hover:bg-sunken disabled:opacity-30">
        <Minus size={18} />
      </button>
      <span className="min-w-8 text-center font-bold num" aria-live="polite">{children}</span>
      <button type="button" onClick={() => step(1)} disabled={!canIncrease} aria-label="Plus" className="grid place-items-center w-11 h-11 rounded-full text-ink hover:bg-sunken disabled:opacity-30">
        <Plus size={18} />
      </button>
    </span>
  );
}
