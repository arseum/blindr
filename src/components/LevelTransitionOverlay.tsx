import { useEffect, useMemo } from 'react';

export type TransitionEffect = 'radial' | 'curtain' | 'ascend';

interface Props {
  effect: TransitionEffect;
  levelLabel: string;
  onDone: () => void;
}

const DURATIONS: Record<TransitionEffect, number> = {
  radial:  1500,
  curtain: 2400,
  ascend:  2200,
};

const EFFECTS: TransitionEffect[] = ['radial', 'curtain', 'ascend'];

export function pickRandomEffect(): TransitionEffect {
  return EFFECTS[Math.floor(Math.random() * EFFECTS.length)];
}

function useDone(onDone: () => void, duration: number) {
  useEffect(() => {
    const t = setTimeout(onDone, duration);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
}

export function LevelTransitionOverlay({ effect, levelLabel, onDone }: Props) {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 9999 }}>
      {effect === 'radial'  && <RadialEffect  onDone={onDone} duration={DURATIONS.radial}  label={levelLabel} />}
      {effect === 'curtain' && <CurtainEffect onDone={onDone} duration={DURATIONS.curtain} label={levelLabel} />}
      {effect === 'ascend'  && <AscendEffect  onDone={onDone} duration={DURATIONS.ascend}  label={levelLabel} />}
    </div>
  );
}

/* ── 1. Vague radiale — anneau + texte qui ondule ── */
function RadialEffect({ onDone, duration, label }: { onDone: () => void; duration: number; label: string }) {
  useDone(onDone, duration);
  const d = `${duration}ms`;
  return (
    <>
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: '40vmax', height: '40vmax', borderRadius: '50%',
        background: 'radial-gradient(circle, color-mix(in srgb, var(--color-accent) 60%, transparent) 0%, transparent 70%)',
        animation: `lt-radial-glow ${d} ease-out forwards`,
      }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: '200vmax', height: '200vmax', borderRadius: '50%',
        border: '30px solid color-mix(in srgb, var(--color-accent) 75%, transparent)',
        boxShadow: '0 0 60px 20px color-mix(in srgb, var(--color-accent) 30%, transparent), inset 0 0 60px 20px color-mix(in srgb, var(--color-accent) 15%, transparent)',
        animation: `lt-radial-ring ${d} cubic-bezier(0.15, 0.8, 0.4, 1) forwards`,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span className="font-display font-black tracking-widest uppercase" style={{
          fontSize: 'clamp(2rem, 7vw, 6rem)',
          color: 'var(--color-accent)',
          textShadow: '0 0 40px color-mix(in srgb, var(--color-accent) 90%, transparent), 0 0 80px color-mix(in srgb, var(--color-accent) 50%, transparent)',
          animation: `lt-radial-text ${d} ease forwards`,
        }}>
          {label}
        </span>
      </div>
    </>
  );
}

/* ── 2. Rideau cinématique ── */
function CurtainEffect({ onDone, duration, label }: { onDone: () => void; duration: number; label: string }) {
  useDone(onDone, duration);
  const d = `${duration}ms`;
  const ease = 'cubic-bezier(0.7, 0, 0.3, 1)';
  return (
    <>
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '50%', height: '100%',
        background: 'linear-gradient(to right, var(--color-canvas), var(--color-surface))',
        borderRight: '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)',
        animation: `lt-curtain-left ${d} ${ease} forwards`,
      }}>
        <div style={{
          position: 'absolute', top: 0, right: 0, width: '60px', height: '100%',
          background: 'linear-gradient(to right, transparent, color-mix(in srgb, var(--color-accent) 8%, transparent))',
        }} />
      </div>
      <div style={{
        position: 'absolute', top: 0, right: 0, width: '50%', height: '100%',
        background: 'linear-gradient(to left, var(--color-canvas), var(--color-surface))',
        borderLeft: '1px solid color-mix(in srgb, var(--color-accent) 30%, transparent)',
        animation: `lt-curtain-right ${d} ${ease} forwards`,
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0, width: '60px', height: '100%',
          background: 'linear-gradient(to left, transparent, color-mix(in srgb, var(--color-accent) 8%, transparent))',
        }} />
      </div>
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '2px', height: '100%',
        background: 'linear-gradient(to bottom, transparent, color-mix(in srgb, var(--color-accent) 60%, transparent), transparent)',
        animation: `lt-curtain-label ${d} ease forwards`,
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px',
        animation: `lt-curtain-label ${d} ease forwards`,
      }}>
        <span className="font-display font-black tracking-widest uppercase" style={{
          fontSize: 'clamp(2rem, 8vw, 7rem)',
          color: 'var(--color-accent)',
          textShadow: '0 0 60px color-mix(in srgb, var(--color-accent) 90%, transparent), 0 0 120px color-mix(in srgb, var(--color-accent) 40%, transparent)',
        }}>
          {label}
        </span>
        <div style={{
          width: 'clamp(80px, 20vw, 300px)', height: '1px',
          background: 'linear-gradient(to right, transparent, var(--color-accent), transparent)',
        }} />
      </div>
    </>
  );
}

/* ── 3. Ascension — fond qui monte + traînées lumineuses ── */
const STREAK_COLORS = [
  'color-mix(in srgb, var(--color-canvas) 90%, transparent)',
  'color-mix(in srgb, var(--color-accent) 80%, transparent)',
  'color-mix(in srgb, var(--color-accent) 70%, transparent)',
  'color-mix(in srgb, var(--color-accent) 85%, transparent)',
];

function AscendEffect({ onDone, duration, label }: {
  onDone: () => void; duration: number; label: string;
}) {
  useDone(onDone, duration);
  const d = `${duration}ms`;

  const streaks = useMemo(() =>
    Array.from({ length: 22 }, () => ({
      left:   `${2 + Math.random() * 96}%`,
      width:  `${1 + Math.random() * 3}px`,
      height: `${80 + Math.random() * 200}px`,
      delay:  Math.random() * 400,
      dur:    600 + Math.random() * 800,
      color:  STREAK_COLORS[Math.floor(Math.random() * STREAK_COLORS.length)],
      blur:   Math.random() > 0.5 ? '2px' : '0px',
    }))
  , []);

  return (
    <>
      {/* Image de fond qui zoome vers le haut */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 60%, color-mix(in srgb, var(--color-accent) 45%, var(--color-canvas)) 0%, var(--color-canvas) 75%)',
        animation: `lt-ascend-bg ${d} cubic-bezier(0.3, 0, 0.7, 1) forwards`,
      }} />

      {/* Vignette tunnel qui s'intensifie */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at center, transparent 20%, color-mix(in srgb, var(--color-canvas) 50%, transparent) 60%, var(--color-canvas) 100%)',
        animation: `lt-ascend-vignette ${d} ease-in forwards`,
      }} />

      {/* Traînées lumineuses verticales */}
      {streaks.map((s, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: s.left,
          top: 0,
          width: s.width,
          height: s.height,
          background: `linear-gradient(to top, transparent, ${s.color}, transparent)`,
          filter: `blur(${s.blur})`,
          animation: `lt-ascend-streak ${s.dur}ms ease-in ${s.delay}ms forwards`,
          opacity: 0,
        }} />
      ))}

      {/* Label qui monte et disparaît */}
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: `lt-ascend-label ${d} ease forwards`,
      }}>
        <span className="font-display font-black tracking-widest uppercase" style={{
          fontSize: 'clamp(2rem, 7vw, 6rem)',
          color: 'var(--color-ink)',
          textShadow: '0 0 30px color-mix(in srgb, var(--color-canvas) 80%, transparent), 0 0 80px color-mix(in srgb, var(--color-accent) 60%, transparent)',
        }}>
          {label}
        </span>
      </div>
    </>
  );
}
