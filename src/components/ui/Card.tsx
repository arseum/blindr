import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Met la carte en avant avec un liseré de la couleur d'accent. */
  highlight?: boolean;
  onClick?: () => void;
}

export function Card({ children, className = '', highlight = false, onClick }: CardProps) {
  return (
    <div
      className={`
        bg-surface rounded-card p-5 shadow-raised
        ${highlight ? 'ring-2 ring-accent' : 'border border-line'}
        ${onClick ? 'cursor-pointer transition-[filter] hover:brightness-[0.98]' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
