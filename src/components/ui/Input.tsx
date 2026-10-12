import React, { useId } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  className?: string;
}

export function Input({ label, className = '', id, ...props }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-muted">
          {label}
        </label>
      )}
      <input
        {...props}
        id={inputId}
        className={`
          min-h-11 bg-sunken border border-line rounded-control px-3
          text-ink placeholder-ink-faint num
          focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/25
          transition-colors
          ${className}
        `}
      />
    </div>
  );
}
