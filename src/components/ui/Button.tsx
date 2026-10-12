import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

const variants = {
  primary:   'bg-accent text-on-accent hover:brightness-110',
  secondary: 'bg-ink text-canvas hover:brightness-125',
  danger:    'bg-danger text-on-accent hover:brightness-110',
  success:   'bg-success text-on-accent hover:brightness-110',
  ghost:     'bg-transparent text-ink-muted border border-line hover:bg-surface hover:text-ink',
};

const sizes = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-5 text-base',
  lg: 'min-h-13 px-7 text-lg',
};

export function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  type = 'button',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 rounded-control font-semibold select-none
        transition-[filter,background-color,color,transform] duration-150 active:scale-[0.98]
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
        disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100
        ${variants[variant]} ${sizes[size]} ${className}
      `}
    >
      {children}
    </button>
  );
}
