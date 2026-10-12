import { useState, useMemo } from 'react';
import { Plus, Trash2, Coffee, ChevronDown, ChevronUp, AlertTriangle, BarChart2 } from 'lucide-react';
import type { BlindLevel, ReEntryConfig } from '../types';
import { Button } from './ui/Button';
import { validateBlindStructure, estimateTournament } from '../utils/tournamentEstimator';

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
  if (h === 0) return `${m}min`;
  return `${h}h${String(m).padStart(2, '0')}`;
}

export function BlindStructureEditor({ structure, onChange, playerCount, startingStack, maxPlayersPerTable, smallestChip, reEntry }: Props) {
  const [analysisOpen, setAnalysisOpen] = useState(true);

  const validationErrors = useMemo(() =>
    smallestChip && smallestChip > 0
      ? validateBlindStructure(structure, smallestChip)
      : [],
    [structure, smallestChip]
  );

  const estimate = useMemo(() => {
    if (!playerCount || !startingStack || !maxPlayersPerTable || playerCount < 2) return null;
    return estimateTournament(structure, playerCount, startingStack, maxPlayersPerTable, reEntry ?? null);
  }, [structure, playerCount, startingStack, maxPlayersPerTable, reEntry]);

  const hasError = (idx: number, field: 'smallBlind' | 'bigBlind' | 'ante') =>
    validationErrors.some(e => e.levelIndex === idx && e.field === field);

  const updateLevel = (idx: number, patch: Partial<BlindLevel>) => {
    const updated = structure.map((l, i) => {
      if (i !== idx) return l;
      const next = { ...l, ...patch };
      if (patch.bigBlind !== undefined) {
        next.smallBlind = Math.floor(patch.bigBlind / 2);
      }
      return next;
    });
    onChange(updated);
  };

  const addLevel = () => {
    const last = structure.filter(l => !l.isBreak).at(-1);
    const newBB = last ? last.bigBlind * 2 : 100;
    const newLevel: BlindLevel = {
      level: structure.length + 1,
      smallBlind: Math.floor(newBB / 2),
      bigBlind: newBB,
      ante: last?.ante ?? 0,
      duration: 20,
    };
    onChange(recalcLevels([...structure, newLevel]));
  };

  const addBreak = () => {
    const newBreak: BlindLevel = {
      level: structure.length + 1,
      smallBlind: 0,
      bigBlind: 0,
      ante: 0,
      duration: 15,
      isBreak: true,
    };
    onChange(recalcLevels([...structure, newBreak]));
  };

  const removeLevel = (idx: number) => {
    onChange(recalcLevels(structure.filter((_, i) => i !== idx)));
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-ink-muted border-b border-line">
              <th className="text-left py-2 px-2 w-10">Niv.</th>
              <th className="text-right py-2 px-2">Grande blinde</th>
              <th className="text-right py-2 px-2">Petite blinde</th>
              <th className="text-center py-2 px-2">Ante</th>
              <th className="text-right py-2 px-2">Durée (min)</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {structure.map((level, idx) => (
              <tr
                key={idx}
                className={`border-b border-line ${level.isBreak ? 'bg-chip-500/10' : ''}`}
              >
                <td className="py-1.5 px-2 font-bold text-ink-muted">{level.level}</td>

                {level.isBreak ? (
                  <>
                    <td colSpan={3} className="py-1.5 px-2 text-center text-chip-500 font-bold tracking-widest">
                      — PAUSE —
                    </td>
                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        value={level.duration}
                        onChange={e => updateLevel(idx, { duration: Math.max(1, Number(e.target.value)) })}
                        min={1}
                        className="w-16 bg-surface border border-line rounded px-2 py-1 text-ink text-sm text-right focus:outline-none focus:border-accent ml-auto block"
                      />
                    </td>
                  </>
                ) : (
                  <>
                    {/* Grande blinde */}
                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        value={level.bigBlind}
                        onChange={e => updateLevel(idx, { bigBlind: Math.max(2, Number(e.target.value)) })}
                        min={2}
                        step={50}
                        className={`w-24 bg-surface border rounded px-2 py-1 text-ink text-sm text-right focus:outline-none focus:border-accent ml-auto block ${
                          hasError(idx, 'bigBlind') ? 'border-orange-400' : 'border-line'
                        }`}
                      />
                    </td>
                    {/* Petite blinde (auto) */}
                    <td className="py-1.5 px-2 text-right text-ink-muted">
                      <div className="flex items-center justify-end gap-1">
                        {hasError(idx, 'smallBlind') && <AlertTriangle size={12} className="text-orange-400 flex-shrink-0" />}
                        <span className={hasError(idx, 'smallBlind') ? 'text-orange-400' : ''}>
                          {level.smallBlind.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    {/* Ante */}
                    <td className="py-1.5 px-2">
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="checkbox"
                          checked={level.ante > 0}
                          onChange={e => updateLevel(idx, { ante: e.target.checked ? Math.max(1, Math.floor(level.bigBlind * 0.1)) : 0 })}
                          className="accent-accent cursor-pointer"
                        />
                        {level.ante > 0 && (
                          <input
                            type="number"
                            value={level.ante}
                            onChange={e => updateLevel(idx, { ante: Math.max(1, Number(e.target.value)) })}
                            min={1}
                            className={`w-20 bg-surface border rounded px-2 py-1 text-ink text-sm text-right focus:outline-none focus:border-accent ${
                              hasError(idx, 'ante') ? 'border-orange-400' : 'border-line'
                            }`}
                          />
                        )}
                      </div>
                    </td>
                    {/* Durée */}
                    <td className="py-1.5 px-2">
                      <input
                        type="number"
                        value={level.duration}
                        onChange={e => updateLevel(idx, { duration: Math.max(1, Number(e.target.value)) })}
                        min={1}
                        className="w-16 bg-surface border border-line rounded px-2 py-1 text-ink text-sm text-right focus:outline-none focus:border-accent ml-auto block"
                      />
                    </td>
                  </>
                )}

                {/* Delete */}
                <td className="py-1.5 px-1">
                  {structure.length > 1 && (
                    <button
                      onClick={() => removeLevel(idx)}
                      className="text-ink-faint hover:text-danger transition-colors p-1"
                      title="Supprimer ce niveau"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add buttons */}
      <div className="flex gap-2 mt-3">
        <Button variant="secondary" size="sm" onClick={addLevel} className="flex items-center gap-1.5">
          <Plus size={14} /> Ajouter un niveau
        </Button>
        <Button variant="ghost" size="sm" onClick={addBreak} className="flex items-center gap-1.5">
          <Coffee size={14} /> Ajouter une pause
        </Button>
      </div>

      {/* Panneau d'analyse */}
      {(estimate || validationErrors.length > 0) && (
        <div className="mt-4 border border-line rounded-lg overflow-hidden">
          <button
            onClick={() => setAnalysisOpen(o => !o)}
            className="w-full flex items-center justify-between px-4 py-2 bg-sunken text-ink-muted hover:text-accent transition-colors text-sm font-semibold"
          >
            <span className="flex items-center gap-2"><BarChart2 size={14} /> Analyse du tournoi</span>
            {analysisOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {analysisOpen && (
            <div className="p-4 bg-sunken">
              {/* Erreurs de validation */}
              {validationErrors.length > 0 && (
                <div className="flex items-center gap-2 text-orange-400 text-sm mb-3 p-2 bg-orange-400/10 rounded-lg border border-orange-400/30">
                  <AlertTriangle size={14} className="flex-shrink-0" />
                  <span>
                    {validationErrors.length} valeur{validationErrors.length > 1 ? 's' : ''} non-multiple{validationErrors.length > 1 ? 's' : ''} du plus petit jeton ({smallestChip})
                  </span>
                </div>
              )}

              {/* Stats globales — inline, sans boxes */}
              {estimate && (
                <>
                  <div className="flex flex-wrap gap-6 mb-4 pb-3 border-b border-line/40">
                    <div>
                      <div className="text-xs text-ink-muted mb-0.5">Durée totale</div>
                      <div className="text-accent font-bold text-sm">{formatDuration(estimate.totalDurationMinutes)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-ink-muted mb-0.5">Fin estimée</div>
                      <div className="text-ink-muted font-bold text-sm">Niv. {estimate.estimatedEndLevel + 1}</div>
                    </div>
                    <div>
                      <div className="text-xs text-ink-muted mb-0.5">Durée estimée</div>
                      <div className="text-ink-muted font-bold text-sm">{formatDuration(estimate.estimatedDurationMinutes)}</div>
                    </div>
                  </div>

                  {/* Tableau par niveau */}
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
                        {estimate.levels.map((lv) => {
                          const level = structure[lv.levelIndex];
                          if (lv.isBreak) {
                            return (
                              <tr key={lv.levelIndex} className="border-b border-line text-chip-500">
                                <td className="py-1 px-2">{lv.levelIndex + 1}</td>
                                <td className="py-1 px-2 text-right">{level.duration}min</td>
                                <td colSpan={3} className="py-1 px-2 text-center tracking-widest">— PAUSE —</td>
                              </tr>
                            );
                          }
                          const m = lv.avgM;
                          const healthColor = m > 15 ? 'var(--color-success)' : m > 8 ? 'var(--color-chip-5000)' : 'var(--color-danger)';
                          const healthWidth = Math.min(100, Math.max(5, (m / 30) * 100));
                          return (
                            <tr key={lv.levelIndex} className="border-b border-line">
                              <td className="py-1 px-2 text-ink-muted">{lv.levelIndex + 1}</td>
                              <td className="py-1 px-2 text-right text-ink-muted">{level.duration}min</td>
                              <td className="py-1 px-2 text-right text-ink">{lv.playersRemaining}</td>
                              <td className="py-1 px-2 text-right text-ink-muted">
                                {m > 100 ? '>100' : m.toFixed(1)}
                              </td>
                              <td className="py-1 px-2">
                                <div className="h-2 bg-surface rounded-full overflow-hidden w-20">
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${healthWidth}%`, backgroundColor: healthColor }}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {!estimate && (
                <p className="text-ink-faint text-xs text-center py-2">
                  Ajoutez des joueurs pour voir l'estimation
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
