/**
 * Nombre dont chaque chiffre défile comme un compteur mécanique quand la valeur change.
 * Les colonnes sont indexées depuis la droite : les unités restent les unités quand le nombre grandit.
 */
export function Odometer({ value, className = '' }: { value: string; className?: string }) {
  const chars = value.split('');
  return (
    <span className={`inline-flex ${className}`} aria-label={value} role="text">
      {chars.map((ch, i) => {
        const key = chars.length - i;
        if (!/\d/.test(ch)) return <span key={`s${key}`} aria-hidden="true">{ch}</span>;
        return (
          <span key={`d${key}`} className="odo" aria-hidden="true">
            <span className="odo-col" style={{ transform: `translateY(${-Number(ch)}em)` }}>
              {'0123456789'.split('').map(d => <span key={d}>{d}</span>)}
            </span>
          </span>
        );
      })}
    </span>
  );
}
