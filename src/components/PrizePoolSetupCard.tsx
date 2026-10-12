import { Plus, Trash2, TrendingUp } from 'lucide-react';
import { Card } from './ui/Card';
import type { DistributionMode, PalierEntry, PrizePoolConfig } from '../types';
import { getPaidPlaces, defaultPaliers, defaultManualShares, calculatePrizes, positionLabel } from '../utils/prizePool';

interface Props {
  buyIn: number;
  playerCount: number;
  prizePool: PrizePoolConfig;
  onChange: (pp: PrizePoolConfig) => void;
}

export function PrizePoolSetupCard({ buyIn, playerCount, prizePool, onChange }: Props) {
  const { prizePoolPct, killPct, rakePct, itmPct, distributionMode, paliers, manualShares, killSystem } = prizePool;

  const killEnabled = killPct > 0;
  const rakeEnabled = rakePct > 0;
  const totalSplit  = prizePoolPct + killPct + rakePct;
  const splitOk     = Math.abs(totalSplit - 100) < 0.1;
  const J           = getPaidPlaces(playerCount, itmPct);

  // Montant total du prize pool (aperçu basé sur la config actuelle)
  const prizePoolAmount = buyIn > 0 && playerCount > 0
    ? Math.round(buyIn * playerCount * prizePoolPct / 100)
    : 0;
  const hasAmounts = prizePoolAmount > 0;

  const update = (patch: Partial<PrizePoolConfig>) => onChange({ ...prizePool, ...patch });

  // ─── Buy-in split toggles ────────────────────────────────────────────────
  const toggleKill = () => {
    if (killEnabled) {
      update({ killPct: 0, prizePoolPct: 100 - rakePct });
    } else {
      const k = Math.min(10, 100 - rakePct);
      update({ killPct: k, prizePoolPct: 100 - k - rakePct });
    }
  };

  const toggleRake = () => {
    if (rakeEnabled) {
      update({ rakePct: 0, prizePoolPct: 100 - killPct });
    } else {
      const r = Math.min(10, 100 - killPct);
      update({ rakePct: r, prizePoolPct: 100 - killPct - r });
    }
  };

  const setKillPct = (v: number) => {
    const k = Math.max(0, Math.min(100 - rakePct, v));
    update({ killPct: k, prizePoolPct: 100 - k - rakePct });
  };

  const setRakePct = (v: number) => {
    const r = Math.max(0, Math.min(100 - killPct, v));
    update({ rakePct: r, prizePoolPct: 100 - killPct - r });
  };

  // ─── Distribution mode switch ─────────────────────────────────────────────
  const setMode = (mode: DistributionMode) => {
    const patch: Partial<PrizePoolConfig> = { distributionMode: mode };
    if (mode === 'paliers' && paliers.length === 0 && J > 0) patch.paliers = defaultPaliers(J);
    if (mode === 'manual'  && manualShares.length !== J && J > 0) patch.manualShares = defaultManualShares(J);
    update(patch);
  };

  // ─── Paliers editing ──────────────────────────────────────────────────────
  const addPalier = () => {
    const lastTo  = paliers.length > 0 ? paliers[paliers.length - 1].toPosition : 0;
    const from    = lastTo + 1;
    if (J > 0 && from > J) return;
    const usedPct = paliers.reduce((s, p) => s + p.totalPct, 0);
    const rem     = Math.max(0, Math.round((100 - usedPct) * 10) / 10);
    update({ paliers: [...paliers, { fromPosition: from, toPosition: J > 0 ? Math.min(from, J) : from, totalPct: rem }] });
  };

  const updatePalier = (idx: number, patch: Partial<PalierEntry>) =>
    update({ paliers: paliers.map((p, i) => i === idx ? { ...p, ...patch } : p) });

  const removePalier = (idx: number) =>
    update({ paliers: paliers.filter((_, i) => i !== idx) });

  // ─── Manual shares editing ────────────────────────────────────────────────
  const updateShare = (idx: number, pct: number) => {
    const shares = [...manualShares];
    shares[idx] = pct;
    update({ manualShares: shares });
  };

  const resetManual = () => update({ manualShares: defaultManualShares(J) });

  const manualSum    = manualShares.reduce((s, p) => s + p, 0);
  const palierSum    = paliers.reduce((s, p) => s + p.totalPct, 0);
  const manualSizeOk = manualShares.length === J;

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const buyInAmountStr = (pct: number) =>
    buyIn > 0 ? `${Math.round(buyIn * pct / 100)}€` : '—';

  const poolAmountStr = (pct: number) =>
    hasAmounts ? `${Math.round(prizePoolAmount * pct / 100)}€` : null;

  const medal = (i: number) => i === 0 ? '#1' : i === 1 ? '#2' : i === 2 ? '#3' : `${i + 1}e`;

  return (
    <Card>
      <h2 className="font-display text-lg font-bold text-accent mb-5 flex items-center gap-2">
        <TrendingUp size={18} className="text-ink-muted" /> Prize Pool
      </h2>

      {/* ── Buy-in split ─────────────────────────────────────────────────── */}
      <div className="mb-5">
        <p className="text-ink-muted text-xs uppercase tracking-widest mb-3">
          Répartition du buy-in{buyIn > 0 ? ` (${buyIn}€ / joueur)` : ''}
        </p>

        {/* Prize pool row (auto-computed, read-only) */}
        <div className="flex items-center gap-2 mb-2">
          <span className="w-24 sm:w-28 text-sm font-medium text-success">Prize pool</span>
          <div className="flex-1 bg-sunken border border-success/40 rounded px-2 py-2 text-center font-display font-bold text-success">
            {prizePoolPct}%
          </div>
          <span className="w-12 sm:w-14 text-right text-sm font-bold text-success">{buyInAmountStr(prizePoolPct)}</span>
        </div>

        {/* Kill system row */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={toggleKill}
            className={`w-24 sm:w-28 text-sm font-medium flex items-center gap-2 transition-colors flex-shrink-0 ${killEnabled ? 'text-chip-5000' : 'text-ink-faint hover:text-ink-muted'}`}
          >
            <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center text-[9px] transition-colors ${killEnabled ? 'bg-chip-5000 border-chip-5000 text-on-accent' : 'border-ink-faint'}`}>
              {killEnabled ? '✓' : ''}
            </span>
            Kill
          </button>
          {killEnabled ? (
            <input
              type="number"
              value={killPct}
              min={0}
              max={100 - rakePct}
              step={1}
              onChange={e => setKillPct(Number(e.target.value))}
              className="flex-1 bg-sunken border border-chip-5000/50 rounded px-2 py-2 text-center text-ink text-sm focus:outline-none focus:border-chip-5000"
            />
          ) : (
            <div className="flex-1 bg-sunken/30 border border-line rounded px-2 py-2 text-center text-ink-faint text-sm">désactivé</div>
          )}
          <span className={`w-12 sm:w-14 text-right text-sm font-bold ${killEnabled ? 'text-chip-5000' : 'text-ink-faint'}`}>
            {killEnabled ? buyInAmountStr(killPct) : '—'}
          </span>
        </div>

        {/* Rake row */}
        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={toggleRake}
            className={`w-24 sm:w-28 text-sm font-medium flex items-center gap-2 transition-colors flex-shrink-0 ${rakeEnabled ? 'text-chip-500' : 'text-ink-faint hover:text-ink-muted'}`}
          >
            <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center text-[9px] transition-colors ${rakeEnabled ? 'bg-chip-500 border-chip-500 text-on-accent' : 'border-ink-faint'}`}>
              {rakeEnabled ? '✓' : ''}
            </span>
            Rake
          </button>
          {rakeEnabled ? (
            <input
              type="number"
              value={rakePct}
              min={0}
              max={100 - killPct}
              step={1}
              onChange={e => setRakePct(Number(e.target.value))}
              className="flex-1 bg-sunken border border-chip-500/50 rounded px-2 py-2 text-center text-ink text-sm focus:outline-none focus:border-chip-500"
            />
          ) : (
            <div className="flex-1 bg-sunken/30 border border-line rounded px-2 py-2 text-center text-ink-faint text-sm">désactivé</div>
          )}
          <span className={`w-12 sm:w-14 text-right text-sm font-bold ${rakeEnabled ? 'text-chip-500' : 'text-ink-faint'}`}>
            {rakeEnabled ? buyInAmountStr(rakePct) : '—'}
          </span>
        </div>

        <p className={`text-xs mt-1 ${splitOk ? 'text-success' : 'text-danger'}`}>
          Total : {totalSplit}%{splitOk ? ' ✓' : ' — doit être 100%'}
        </p>
      </div>

      {/* ── Kill system details ───────────────────────────────────────────── */}
      {killEnabled && (
        <div className="mb-5 p-3 bg-chip-5000/5 border border-chip-5000/20 rounded-lg">
          <p className="text-chip-5000 text-xs uppercase tracking-widest mb-3">Détail kill system</p>
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-muted flex-1">Montant par kill</span>
            <input
              type="number"
              value={killSystem.amountPerKill}
              min={0}
              step={1}
              onChange={e => update({ killSystem: { ...killSystem, amountPerKill: Number(e.target.value) } })}
              className="w-24 bg-sunken border border-chip-5000/50 rounded px-3 py-2 text-center text-ink text-sm focus:outline-none focus:border-chip-5000"
            />
            <span className="text-sm text-ink-muted">€</span>
          </div>
        </div>
      )}

      {/* ── % ITM ─────────────────────────────────────────────────────────── */}
      <div className="mb-5">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <label className="text-ink-muted text-xs uppercase tracking-widest w-14 flex-shrink-0">% ITM</label>
          <input
            type="number"
            value={itmPct}
            min={1}
            max={100}
            step={1}
            onChange={e => update({ itmPct: Math.max(1, Math.min(100, Number(e.target.value))) })}
            className="w-20 bg-sunken border border-line rounded px-3 py-2 text-center text-ink text-sm focus:outline-none focus:border-accent"
          />
          <span className="text-ink-muted text-sm">
            {playerCount > 0
              ? `→ ${J} place${J > 1 ? 's' : ''} payée${J > 1 ? 's' : ''} / ${playerCount} joueur${playerCount > 1 ? 's' : ''}`
              : "→ ajoutez des joueurs"}
          </span>
        </div>
      </div>

      {/* ── Distribution mode ─────────────────────────────────────────────── */}
      <div>
        {/* Header avec dotation totale */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-ink-muted text-xs uppercase tracking-widest">Distribution du prize pool</p>
          {hasAmounts && (
            <span className="font-display font-bold text-success text-sm">
              Dotation : {prizePoolAmount}€
            </span>
          )}
        </div>

        <div className="flex gap-2 mb-4">
          {(['auto', 'paliers', 'manual'] as const).map(mode => {
            const selected = distributionMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setMode(mode)}
                aria-pressed={selected}
                className={`flex-1 min-h-11 rounded-control text-sm font-semibold transition-colors duration-150 select-none ${
                  selected
                    ? 'bg-accent text-on-accent'
                    : 'bg-sunken text-ink-muted hover:text-ink'
                }`}
              >
                {mode === 'auto' ? 'Auto' : mode === 'paliers' ? 'Paliers' : 'Manuel'}
              </button>
            );
          })}
        </div>

        {/* Auto mode — prévisualisation séparée */}
        {distributionMode === 'auto' && (() => {
          if (!hasAmounts || J === 0) return (
            <p className="text-ink-faint text-xs text-center italic py-2">
              Distribution automatique selon la formule Winamax (nombre d'or)
            </p>
          );
          const entries = calculatePrizes(prizePoolAmount, playerCount, prizePool);
          return (
            <div className="flex flex-col gap-1">
              {entries.map(({ position, percentage, amount }) => (
                <div
                  key={position}
                  className={`flex items-center gap-3 rounded px-3 py-1.5 text-sm ${
                    position === 1 ? 'bg-chip-1000/10 border border-chip-1000/20' :
                    position === 2 ? 'bg-sunken border border-line' :
                    position === 3 ? 'bg-chip-5000/10 border border-chip-5000/15' :
                    'bg-sunken'
                  }`}
                >
                  <span className={`font-display font-bold w-8 flex-shrink-0 ${position <= 3 ? 'text-accent' : 'text-ink-faint'}`}>
                    {positionLabel(position)}
                  </span>
                  <div className="flex-1">
                    <div className="h-1 bg-sunken rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-success" style={{ width: `${percentage}%` }} />
                    </div>
                  </div>
                  <span className="text-ink-muted text-xs w-10 text-right">{percentage}%</span>
                  <span className="font-display font-bold text-success w-14 text-right">{amount}€</span>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Paliers mode — montants inline */}
        {distributionMode === 'paliers' && (
          <div className="flex flex-col gap-2">
            {paliers.length === 0 && (
              <p className="text-ink-faint text-xs text-center italic py-1">
                {J === 0 ? 'Ajoutez des joueurs pour configurer les paliers' : 'Cliquez sur + pour ajouter un palier'}
              </p>
            )}
            {paliers.map((palier, idx) => {
              const palierTotal = poolAmountStr(palier.totalPct);
              const count = palier.toPosition - palier.fromPosition + 1;
              const perPerson = hasAmounts && count > 1
                ? `${Math.round(prizePoolAmount * palier.totalPct / 100 / count)}€ chacun`
                : null;
              return (
                <div key={idx} className="overflow-x-auto">
                <div className="flex items-center gap-2 min-w-max">
                  <span className="text-ink-faint text-xs w-12 flex-shrink-0">Places</span>
                  <input
                    type="number"
                    value={palier.fromPosition}
                    min={1}
                    max={palier.toPosition}
                    onChange={e => updatePalier(idx, { fromPosition: Number(e.target.value) })}
                    className="w-12 bg-sunken border border-line rounded px-2 py-1.5 text-center text-ink text-sm focus:outline-none focus:border-accent"
                  />
                  <span className="text-ink-faint text-xs">→</span>
                  <input
                    type="number"
                    value={palier.toPosition}
                    min={palier.fromPosition}
                    max={J || 999}
                    onChange={e => updatePalier(idx, { toPosition: Number(e.target.value) })}
                    className="w-12 bg-sunken border border-line rounded px-2 py-1.5 text-center text-ink text-sm focus:outline-none focus:border-accent"
                  />
                  <span className="text-ink-faint text-xs">:</span>
                  <input
                    type="number"
                    value={palier.totalPct}
                    min={0}
                    max={100}
                    step={0.5}
                    onChange={e => updatePalier(idx, { totalPct: Number(e.target.value) })}
                    className="w-16 bg-sunken border border-line rounded px-2 py-1.5 text-center text-ink text-sm focus:outline-none focus:border-accent"
                  />
                  <span className="text-ink-muted text-xs">%</span>
                  {palierTotal && (
                    <span className="text-success font-bold text-xs flex-1 text-right">
                      {palierTotal}{perPerson ? ` (${perPerson})` : ''}
                    </span>
                  )}
                  {!palierTotal && <span className="flex-1" />}
                  <button
                    onClick={() => removePalier(idx)}
                    className="text-ink-faint hover:text-danger transition-colors flex-shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between mt-1">
              <button
                onClick={addPalier}
                disabled={J === 0}
                className="flex items-center gap-1 text-xs text-ink-muted hover:text-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus size={13} /> Ajouter un palier
              </button>
              <span className={`text-xs ${Math.abs(palierSum - 100) < 0.1 ? 'text-success' : 'text-danger'}`}>
                Total : {Math.round(palierSum * 10) / 10}%{Math.abs(palierSum - 100) < 0.1 ? ' ✓' : ''}
              </span>
            </div>
          </div>
        )}

        {/* Manuel mode — montants inline */}
        {distributionMode === 'manual' && (
          <div>
            {J === 0 ? (
              <p className="text-ink-faint text-xs text-center italic py-2">
                Ajoutez des joueurs pour configurer la distribution manuelle
              </p>
            ) : (
              <>
                {!manualSizeOk && (
                  <div className="flex items-center justify-between mb-2 p-2 bg-danger/10 border border-danger/30 rounded text-xs">
                    <span className="text-danger">
                      Le nombre de places a changé ({J} attendu, {manualShares.length} configuré)
                    </span>
                    <button onClick={resetManual} className="text-accent hover:underline ml-2 flex-shrink-0">
                      Réinitialiser
                    </button>
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  {Array.from({ length: J }, (_, i) => {
                    const pct = manualShares[i] ?? 0;
                    const amt = poolAmountStr(pct);
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-ink-muted text-sm w-8 text-right flex-shrink-0">{medal(i)}</span>
                        <input
                          type="number"
                          value={pct}
                          min={0}
                          max={100}
                          step={0.5}
                          onChange={e => updateShare(i, Number(e.target.value))}
                          className="flex-1 bg-sunken border border-line rounded px-3 py-1.5 text-center text-ink text-sm focus:outline-none focus:border-accent"
                        />
                        <span className="text-ink-muted text-xs w-4">%</span>
                        {amt
                          ? <span className="font-display font-bold text-success text-sm w-14 text-right flex-shrink-0">{amt}</span>
                          : <span className="w-14 flex-shrink-0" />
                        }
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <button
                    onClick={resetManual}
                    className="text-xs text-ink-faint hover:text-ink-muted transition-colors"
                  >
                    Répartition égale
                  </button>
                  <span className={`text-xs ${Math.abs(manualSum - 100) < 0.1 ? 'text-success' : 'text-danger'}`}>
                    Total : {Math.round(manualSum * 10) / 10}%{Math.abs(manualSum - 100) < 0.1 ? ' ✓' : ' — doit être 100%'}
                  </span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
