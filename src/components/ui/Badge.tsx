import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'accent' | 'neutral' | 'danger' | 'success' | 'special';
  className?: string;
}

const variants = {
  accent:  'bg-accent/12 text-accent',
  neutral: 'bg-sunken text-ink-muted',
  danger:  'bg-danger/12 text-danger',
  success: 'bg-success/12 text-success',
  special: 'bg-chip-500/12 text-chip-500',
};

export function Badge({ children, variant = 'neutral', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-[4px] text-xs font-semibold ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
