const COLORS = [5, 10, 25, 100, 500, 1000, 5000].map(n => `var(--color-chip-${n})`);

/** Initiales : « Joueur 12 » → « 12 », « Marie Dupont » → « MD », « Léa » → « LÉ ». */
function playerInitials(name: string): string {
  const trimmed = name.trim();
  const numbered = /^joueur\s+(\d+)$/i.exec(trimmed);
  if (numbered) return numbered[1].slice(-2);
  const words = trimmed.split(/[\s-]+/).filter(Boolean);
  if (words.length === 0) return '?';
  const letters = words.length > 1 ? words[0][0] + words[1][0] : Array.from(words[0]).slice(0, 2).join('');
  return letters.toLocaleUpperCase('fr-FR');
}

/** Couleur de jeton stable pour un nom (hash simple). */
function playerColor(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.codePointAt(0)!) >>> 0;
  return COLORS[h % COLORS.length];
}

interface PlayerCoinProps {
  name: string;
  eliminated?: boolean;
  className?: string;
}

/** Jeton-avatar d'un joueur : initiales sur un jeton dont la couleur dépend du nom. */
export function PlayerCoin({ name, eliminated = false, className = 'w-10 text-sm' }: PlayerCoinProps) {
  return (
    <span
      aria-hidden="true"
      className={`chip-coin cursor-[inherit] ${eliminated ? 'opacity-60' : ''} ${className}`}
      style={{ '--c': eliminated ? 'var(--color-ink-faint)' : playerColor(name) } as React.CSSProperties}
    >
      {playerInitials(name)}
    </span>
  );
}
