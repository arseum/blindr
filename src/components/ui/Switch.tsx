interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

export function Switch({ checked, onChange, label, description }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-full min-h-12 flex items-center justify-between gap-4 text-left rounded-control focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span className="flex flex-col">
        <span className="font-semibold text-ink">{label}</span>
        {description && <span className="text-sm text-ink-muted">{description}</span>}
      </span>
      <span className={`relative flex-none w-12 h-7 rounded-full transition-colors ${checked ? 'bg-accent' : 'bg-line'}`}>
        <span className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-surface shadow-raised transition-transform ${checked ? 'translate-x-5' : ''}`} />
      </span>
    </button>
  );
}
