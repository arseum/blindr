import { useState, useMemo } from 'react';
import { Plus, Trash2, Coffee, ChevronDown, ChevronUp, AlertTriangle, BarChart2, Flag } from 'lucide-react';
import type { BlindLevel, ReEntryConfig } from '../types';
import { Button } from './ui/Button';
import { Stepper } from './ui/Stepper';
import { validateBlindStructure, estimateTournament } from '../utils/tournamentEstimator';
import { DEFAULT_FIELD, anteFor, activeChip, chipSet, followingBigBlind, levelBlinds, stepBigBlind } from '../utils/blinds';
import { chipColorVar } from '../utils/chips';
import { formatChips } from '../constants';
import { feedback } from '../utils/feedback';

interface Props {
  structure: BlindLevel[];
  onChange: (structure: BlindLevel[]) => void;
  playerCount?: number;
  startingStack?: number;
  maxPlayersPerTable?: number;
  smallestChip?: number;
  reEntry?: ReEntryConfig | null;
}

function recalcLevels(levels: BlindLevel[]): BlindLevel[] {
  return levels.map((l, i) => ({ ...l, level: i + 1 }));
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return `${h} h ${String(m).padStart(2, '0')}`;
}

/**
 * Éditeur de structure : un niveau se déplie au toucher. Les blindes avancent par valeurs jouables
 * (petite blinde recalculée selon les jetons en jeu), l'ante se pose ou s'enlève d'un toucher sur son jeton.
 */
export function BlindStructureEditor({ structure, onChange, playerCount = 0, startingStack, maxPlayersPerTable = 9, smallestChip = 1, reEntry }: Props) {
  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const chips = useMemo(() => chipSet(smallestChip), [smallestChip]);

  const validationErrors = useMemo(() => validateBlindStructure(structure, smallestChip), [structure, smallestChip]);

  const field = playerCount >= 2 ? playerCount : DEFAULT_FIELD;
  const estimate = useMemo(
    () => (startingStack ? estimateTournament(structure, field, startingStack, maxPlayersPerTable, reEntry ?? null) : null),
    [structure, field, startingStack, maxPlayersPerTable, reEntry],
  );
  const endIdx = estimate && estimate.estimatedEndLevel < structure.length - 1 ? estimate.estimatedEndLevel : -1;

  const hasError = (idx: number) => validationErrors.some(e => e.levelIndex === idx);

  const update = (idx: number, patch: Partial<BlindLevel>) =>
    onChange(structure.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  /** Grosses blindes des niveaux de jeu voisins : un niveau reste entre les deux. */
  const neighbours = (idx: number) => {
    const before = structure.slice(0, idx).filter(l => !l.isBreak).at(-1)?.bigBlind ?? 0;
    const after = structure.slice(idx + 1).find(l => !l.isBreak)?.bigBlind ?? Infinity;
    return { before, after };
  };

  const stepBlinds = (idx: number, direction: 1 | -1) => {
    const level = structure[idx];
    const bb = stepBigBlind(level.bigBlind, direction, chips);
    if (bb) update(idx, levelBlinds(bb, chips, level.ante > 0));
  };

  const toggleAnte = (idx: number) => {
    const level = structure[idx];
    update(idx, { ante: level.ante > 0 ? 0 : anteFor(level.bigBlind, activeChip(level.bigBlind, chips)) });
    feedback('select');
  };

  const addLevel = () => {
    const last = structure.filter(l => !l.isBreak).at(-1);
    const bb = last ? followingBigBlind(last.bigBlind, chips) : 2 * chips[0];
    const newLevel: BlindLevel = {
      level: structure.length + 1,
      ...levelBlinds(bb, chips, (last?.ante ?? 0) > 0),
      duration: last?.duration ?? 20,
    };
    onChange(recalcLevels([...structure, newLevel]));
  };

  const addBreak = () => {
    const duration = structure.find(l => l.isBreak)?.duration ?? 10;
    onChange(recalcLevels([...structure, { level: structure.length + 1, smallBlind: 0, bigBlind: 0, ante: 0, duration, isBreak: true }]));
  };

  const removeLevel = (idx: number) => {
    setOpenIdx(null);
    onChange(recalcLevels(structure.filter((_, i) => i !== idx)));
  };

  return (
    <div>
      <ol className="rounded-card border border-line divide-y divide-line overflow-hidden">
        {structure.map((level, idx) => {
          const open = openIdx === idx;
          const { before, after } = neighbours(idx);
          const prevBB = level.isBreak ? null : stepBigBlind(level.bigBlind, -1, chips);
          const nextBB = level.isBreak ? null : stepBigBlind(level.bigBlind, 1, chips);
          return (
            <li key={idx} className={level.isBreak ? 'bg-sunken' : 'bg-surface'}>
              <button
                type="button"
                onClick={() => setOpenIdx(open ? null : idx)}
                aria-expanded={open}
                className="w-full flex items-center gap-3 min-h-12 px-3 text-left"
              >
                <span className="w-6 text-xs text-ink-faint num">{level.level}</span>
                {level.isBreak ? (
                  <span className="flex-1 flex items-center gap-2 text-ink-muted font-semibold">
                    <Coffee size={16} /> Pause
                  </span>
                ) : (
                  <span className="flex-1 flex flex-wrap items-baseline gap-x-2 min-w-0">
                    <span className="num font-bold text-lg whitespace-nowrap">{formatChips(level.smallBlind)} / {formatChips(level.bigBlind)}</span>
                    {level.ante > 0 && <span className="text-sm text-ink-muted num whitespace-nowrap">ante {formatChips(level.ante)}</span>}
                    {hasError(idx) && <AlertTriangle size={14} className="text-danger self-center" aria-label="Valeur injouable avec ces jetons" />}
                  </span>
                )}
                <span className="text-sm text-ink-muted num">{level.duration} min</span>
                <ChevronDown size={16} className={`text-ink-faint transition-transform ${open ? 'rotate-180' : ''}`} />
              </button>

              {open && (
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-3 pb-3">
                  {!level.isBreak && (
                    <>
                      <Stepper
                        label="Blindes"
                        canDecrease={prevBB !== null && prevBB > before}
                        canIncrease={nextBB !== null && nextBB < after}
                        onStep={d => stepBlinds(idx, d)}
                      >
                        <span className="px-1">Blindes</span>
                      </Stepper>
                      <button
                        type="button"
                        onClick={() => toggleAnte(idx)}
                        aria-pressed={level.ante > 0}
                        className="inline-flex items-center gap-2 min-h-11 text-sm font-semibold"
                      >
                        <span
                          className={`chip-coin w-10 text-[11px] transition-[opacity,transform] ${level.ante > 0 ? 'scale-105' : 'opacity-35 grayscale'}`}
                          style={{ '--c': level.ante > 0 ? chipColorVar(level.ante) : 'var(--color-ink-faint)' } as React.CSSProperties}
                          aria-hidden="true"
                        >
                          {level.ante > 0 ? formatChips(level.ante) : 'A'}
                        </span>
                        {level.ante > 0 ? 'Ante' : 'Sans ante'}
                      </button>
                    </>
                  )}
                  <Stepper
                    label="Durée du niveau"
                    canDecrease={level.duration > 1}
                    canIncrease={level.duration < 120}
                    onStep={d => update(idx, { duration: level.duration + d })}
                  >
                    {level.duration} min
                  </Stepper>
                  {structure.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLevel(idx)}
                      className="ml-auto inline-flex items-center gap-1 min-h-11 px-2 text-sm text-ink-muted hover:text-danger"
                    >
                      <Trash2 size={15} /> Retirer
                    </button>
                  )}
                </div>
              )}

              {idx === endIdx && estimate && (
                <p className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-ink-muted bg-sunken border-t border-line">
                  <Flag size={13} /> Fin estimée vers {formatDuration(Math.round(estimate.estimatedDurationMinutes / 5) * 5)} · niveaux de réserve ensuite
                </p>
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex gap-2 mt-3">
        <Button variant="secondary" size="sm" onClick={addLevel} className="flex items-center gap-1.5">
          <Plus size={14} /> Niveau
        </Button>
        <Button variant="ghost" size="sm" onClick={addBreak} className="flex items-center gap-1.5">
          <Plus size={14} /> Pause
        </Button>
      </div>

      {validationErrors.length > 0 && (
        <p className="flex items-center gap-2 mt-3 text-sm text-danger">
          <AlertTriangle size={14} className="flex-shrink-0" />
          {validationErrors.length} valeur{validationErrors.length > 1 ? 's' : ''} injouable{validationErrors.length > 1 ? 's' : ''} avec le plus petit jeton ({smallestChip})
        </p>
      )}

      {/* Panneau d'analyse */}
      {estimate && estimate.levels.length > 0 && (
        <div className="mt-4 border border-line rounded-card overflow-hidden">
          <button
            onClick={() => setAnalysisOpen(o => !o)}
            aria-expanded={analysisOpen}
            className="w-full flex items-center justify-between min-h-11 px-4 bg-sunken text-ink-muted hover:text-ink text-sm font-semibold"
          >
            <span className="flex items-center gap-2"><BarChart2 size={14} /> Analyse du tournoi</span>
            {analysisOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {analysisOpen && (
            <div className="p-4 bg-sunken">
              <div className="flex flex-wrap gap-6 mb-4 pb-3 border-b border-line">
                <div>
                  <div className="text-xs text-ink-muted mb-0.5">Fin estimée</div>
                  <div className="text-accent font-bold text-sm">{formatDuration(estimate.estimatedDurationMinutes)} · niv. {estimate.estimatedEndLevel + 1}</div>
                </div>
                <div>
                  <div className="text-xs text-ink-muted mb-0.5">Structure complète</div>
                  <div className="text-ink-muted font-bold text-sm">{formatDuration(estimate.totalDurationMinutes)}</div>
                </div>
              </div>
              {playerCount < 2 && <p className="text-xs text-ink-faint mb-3">Estimation pour {DEFAULT_FIELD} joueurs, en attendant la liste.</p>}

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-ink-muted border-b border-line">
                      <th className="text-left py-1 px-2">Niv.</th>
                      <th className="text-right py-1 px-2">Durée</th>
                      <th className="text-right py-1 px-2">Joueurs restants est.</th>
                      <th className="text-right py-1 px-2">Orbites</th>
                      <th className="text-left py-1 px-2 w-24">Santé</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estimate.levels.map(lv => {
                      const level = structure[lv.levelIndex];
                      if (lv.isBreak) {
                        return (
                          <tr key={lv.levelIndex} className="border-b border-line text-ink-muted">
                            <td className="py-1 px-2">{lv.levelIndex + 1}</td>
                            <td className="py-1 px-2 text-right">{level.duration} min</td>
                            <td colSpan={3} className="py-1 px-2 text-center">Pause</td>
                          </tr>
                        );
                      }
                      const m = lv.avgM;
                      const healthColor = m > 15 ? 'var(--color-success)' : m > 8 ? 'var(--color-chip-5000)' : 'var(--color-danger)';
                      const healthWidth = Math.min(100, Math.max(5, (m / 30) * 100));
                      return (
                        <tr key={lv.levelIndex} className={`border-b border-line ${lv.levelIndex > estimate.estimatedEndLevel ? 'opacity-40' : ''}`}>
                          <td className="py-1 px-2 text-ink-muted">{lv.levelIndex + 1}</td>
                          <td className="py-1 px-2 text-right text-ink-muted">{level.duration} min</td>
                          <td className="py-1 px-2 text-right text-ink">{lv.playersRemaining}</td>
                          <td className="py-1 px-2 text-right text-ink-muted">{m > 100 ? '>100' : m.toFixed(1)}</td>
                          <td className="py-1 px-2">
                            <div className="h-2 bg-surface rounded-full overflow-hidden w-20">
                              <div className="h-full rounded-full transition-all" style={{ width: `${healthWidth}%`, backgroundColor: healthColor }} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
