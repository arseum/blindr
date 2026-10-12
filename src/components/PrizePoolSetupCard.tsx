import { Check, Plus, Trash2 } from 'lucide-react';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Stepper } from './ui/Stepper';
import { Switch } from './ui/Switch';
import type { DistributionMode, PalierEntry, PrizePoolConfig } from '../types';
import { getPaidPlaces, defaultPaliers, defaultManualShares, calculatePrizes } from '../utils/prizePool';
import { PlaceCoin } from './ui/PlaceCoin';

/** Pas de 5 % qui retombe sur des multiples de 5 ; `min` borne le bas. */
const snap5 = (v: number, dir: 1 | -1, min: number) =>
  dir > 0 ? Math.floor(v / 5) * 5 + 5 : Math.max(min, Math.ceil(v / 5) * 5 - 5);

const MODES: { id: DistributionMode; label: string }[] = [
  { id: 'auto', label: 'Auto' },
  { id: 'paliers', label: 'Paliers' },
  { id: 'manual', label: 'Manuel' },
];

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
    buyIn > 0 ? `${Math.round(buyIn * pct / 100)} €` : '—';

  const poolAmountStr = (pct: number) =>
    hasAmounts ? `${Math.round(prizePoolAmount * pct / 100)} €` : null;

  const rounded = (n: number) => Math.round(n * 10) / 10;
  const sumLabel = (sum: number, withHint: boolean) => {
    const ok = Math.abs(sum - 100) < 0.1;
    return (
      <span className={`flex items-center gap-1 text-sm num ${ok ? 'text-ink-muted' : 'text-danger font-semibold'}`}>
        Total {rounded(sum)} %
        {ok ? <Check size={14} className="text-accent" aria-label="complet" /> : withHint ? ' — doit être 100 %' : null}
      </span>
    );
  };

  const subTitle = 'text-sm font-semibold text-ink-muted';

  return (
    <Card>
      <h2 className="font-display text-xl font-extrabold mb-5">Prize pool</h2>

      {/* ── Répartition du buy-in ─────────────────────────────────────────── */}
      <section className="flex flex-col gap-3 mb-7">
        <h3 className={subTitle}>
          Répartition du buy-in{buyIn > 0 ? ` (${buyIn} € par joueur)` : ''}
        </h3>

        {/* Barre de répartition */}
        <div className="flex h-3 rounded-full overflow-hidden bg-sunken" role="img" aria-label={`Prize pool ${prizePoolPct} %, kill ${killPct} %, rake ${rakePct} %`}>
          <div className="bg-accent transition-[width] duration-200" style={{ width: `${prizePoolPct}%` }} />
          <div className="bg-chip-5000 transition-[width] duration-200" style={{ width: `${killPct}%` }} />
          <div className="bg-chip-500 transition-[width] duration-200" style={{ width: `${rakePct}%` }} />
        </div>

        {/* Prize pool (calculé, lecture seule) */}
        <div className="flex items-center gap-3 min-h-11">
          <span className="w-3 h-3 rounded-full bg-accent flex-none" aria-hidden />
          <span className="font-semibold flex-1">Prize pool</span>
          <span className="num-display text-2xl">{prizePoolPct} %</span>
          <span className="num-display text-2xl w-20 text-right text-ink-muted">{buyInAmountStr(prizePoolPct)}</span>
        </div>

        {/* Kill */}
        <div className="flex flex-col">
          <Switch label="Kill" description="Une prime pour chaque élimination" checked={killEnabled} onChange={toggleKill} />
          {killEnabled && (
            <div className="flex flex-col gap-3 pl-4 mt-1 border-l-2 border-chip-5000">
              <div className="flex items-center justify-between gap-3">
                <Stepper
                  className="-ml-2.5"
                  label="Part du buy-in pour le kill"
                  onStep={d => setKillPct(snap5(killPct, d, 5))}
                  canDecrease={killPct > 5}
                  canIncrease={killPct < 100 - rakePct}
                >
                  {killPct} %
                </Stepper>
                <span className="num-display text-2xl text-ink-muted">{buyInAmountStr(killPct)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm">Montant par kill</span>
                <span className="flex items-center gap-2">
                  <Input
                    aria-label="Montant par kill"
                    type="number"
                    inputMode="decimal"
                    value={killSystem.amountPerKill}
                    min={0}
                    step={1}
                    onChange={e => update({ killSystem: { ...killSystem, amountPerKill: Number(e.target.value) } })}
                    className="w-20 text-center"
                  />
                  <span className="text-ink-muted">€</span>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Rake */}
        <div className="flex flex-col">
          <Switch label="Rake" description="Frais de l'organisateur" checked={rakeEnabled} onChange={toggleRake} />
          {rakeEnabled && (
            <div className="flex items-center justify-between gap-3 pl-4 mt-1 border-l-2 border-chip-500">
              <Stepper
                className="-ml-2.5"
                label="Part du buy-in pour le rake"
                onStep={d => setRakePct(snap5(rakePct, d, 5))}
                canDecrease={rakePct > 5}
                canIncrease={rakePct < 100 - killPct}
              >
                {rakePct} %
              </Stepper>
              <span className="num-display text-2xl text-ink-muted">{buyInAmountStr(rakePct)}</span>
            </div>
          )}
        </div>

        <div className="flex justify-end">{sumLabel(totalSplit, true)}</div>
      </section>

      {/* ── % ITM ─────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-1 mb-7">
        <h3 className={subTitle}>Places payées (% ITM)</h3>
        <div className="flex items-center justify-between gap-3">
          <Stepper
            className="-ml-2.5"
            label="Pourcentage de joueurs payés"
            onStep={d => update({ itmPct: Math.max(1, Math.min(100, snap5(itmPct, d, 1))) })}
            canDecrease={itmPct > 1}
            canIncrease={itmPct < 100}
          >
            <span className="num-display text-2xl">{itmPct} %</span>
          </Stepper>
          <span className="text-sm text-ink-muted text-right">
            {playerCount > 0
              ? <><span className="num-display text-2xl text-ink">{J}</span> place{J > 1 ? 's' : ''} payée{J > 1 ? 's' : ''} sur {playerCount}</>
              : 'Ajoutez des joueurs'}
          </span>
        </div>
      </section>

      {/* ── Distribution ──────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className={subTitle}>Distribution du prize pool</h3>
          {hasAmounts && <span className="num-display text-2xl">{prizePoolAmount} €</span>}
        </div>

        <div className="grid grid-cols-3 gap-1 p-1 rounded-control bg-sunken">
          {MODES.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => setMode(id)}
              aria-pressed={distributionMode === id}
              className={`min-h-11 rounded-[6px] text-sm font-semibold transition-colors ${distributionMode === id ? 'bg-surface text-ink shadow-raised' : 'text-ink-muted hover:text-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Auto : aperçu des gains */}
        {distributionMode === 'auto' && (() => {
          if (!hasAmounts || J === 0) return (
            <p className="text-sm text-ink-muted">
              Répartition automatique selon la formule Winamax (nombre d'or).
            </p>
          );
          const entries = calculatePrizes(prizePoolAmount, playerCount, prizePool);
          return (
            <ul className="flex flex-col">
              {entries.map(({ position, percentage, amount }) => (
                <li key={position} className="flex items-center gap-3 min-h-11 py-1">
                  <PlaceCoin position={position} />
                  <div className="flex-1 h-2 bg-sunken rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="num text-sm text-ink-muted w-12 text-right">{percentage} %</span>
                  <span className="num-display text-xl w-16 text-right">{amount} €</span>
                </li>
              ))}
            </ul>
          );
        })()}

        {/* Paliers */}
        {distributionMode === 'paliers' && (
          <div className="flex flex-col gap-3">
            {paliers.length === 0 && (
              <p className="text-sm text-ink-muted">
                {J === 0 ? 'Ajoutez des joueurs pour configurer les paliers.' : 'Ajoutez un palier pour répartir le prize pool.'}
              </p>
            )}
            {paliers.map((palier, idx) => {
              const palierTotal = poolAmountStr(palier.totalPct);
              const count = palier.toPosition - palier.fromPosition + 1;
              const perPerson = hasAmounts && count > 1
                ? `${Math.round(prizePoolAmount * palier.totalPct / 100 / count)} € chacun`
                : null;
              return (
                <div key={idx} className="flex flex-col gap-1 p-3 rounded-card bg-sunken">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center">
                      <Stepper
                        label="Première place du palier"
                        onStep={d => updatePalier(idx, { fromPosition: palier.fromPosition + d })}
                        canDecrease={palier.fromPosition > 1}
                        canIncrease={palier.fromPosition < palier.toPosition}
                      >
                        <PlaceCoin position={palier.fromPosition} className="w-8 text-xs" />
                      </Stepper>
                      <span className="text-ink-muted text-sm">à</span>
                      <Stepper
                        label="Dernière place du palier"
                        onStep={d => updatePalier(idx, { toPosition: palier.toPosition + d })}
                        canDecrease={palier.toPosition > palier.fromPosition}
                        canIncrease={palier.toPosition < (J || 999)}
                      >
                        <PlaceCoin position={palier.toPosition} className="w-8 text-xs" />
                      </Stepper>
                    </span>
                    <button
                      type="button"
                      onClick={() => removePalier(idx)}
                      aria-label="Supprimer le palier"
                      className="grid place-items-center w-11 h-11 rounded-full text-ink-muted hover:text-danger flex-none"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      aria-label="Part du prize pool pour ce palier"
                      type="number"
                      inputMode="decimal"
                      value={palier.totalPct}
                      min={0}
                      max={100}
                      step={0.5}
                      onChange={e => updatePalier(idx, { totalPct: Number(e.target.value) })}
                      className="w-20 text-center bg-surface"
                    />
                    <span className="text-ink-muted">%</span>
                    {palierTotal && (
                      <span className="flex-1 text-right">
                        <span className="num-display text-xl">{palierTotal}</span>
                        {perPerson && <span className="block text-xs text-ink-muted num">{perPerson}</span>}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={addPalier}
                disabled={J === 0}
                className="min-h-11 flex items-center gap-1.5 pr-3 text-sm font-semibold text-ink-muted hover:text-ink disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Plus size={16} /> Ajouter un palier
              </button>
              {sumLabel(palierSum, false)}
            </div>
          </div>
        )}

        {/* Manuel */}
        {distributionMode === 'manual' && (
          J === 0 ? (
            <p className="text-sm text-ink-muted">Ajoutez des joueurs pour configurer la distribution manuelle.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {!manualSizeOk && (
                <div className="flex items-center justify-between gap-3 p-3 rounded-control bg-sunken border border-danger text-sm">
                  <span className="text-danger">
                    Le nombre de places a changé ({J} attendu, {manualShares.length} configuré)
                  </span>
                  <button type="button" onClick={resetManual} className="min-h-11 px-2 font-semibold underline flex-none">
                    Réinitialiser
                  </button>
                </div>
              )}
              <ul className="flex flex-col gap-1">
                {Array.from({ length: J }, (_, i) => {
                  const pct = manualShares[i] ?? 0;
                  const amt = poolAmountStr(pct);
                  return (
                    <li key={i} className="flex items-center gap-3">
                      <PlaceCoin position={i + 1} />
                      <Input
                        aria-label={`Part de la place ${i + 1}`}
                        type="number"
                        inputMode="decimal"
                        value={pct}
                        min={0}
                        max={100}
                        step={0.5}
                        onChange={e => updateShare(i, Number(e.target.value))}
                        className="w-20 text-center"
                      />
                      <span className="text-ink-muted">%</span>
                      <span className="num-display text-xl flex-1 text-right">{amt ?? ''}</span>
                    </li>
                  );
                })}
              </ul>
              <div className="flex items-center justify-between gap-3">
                <button type="button" onClick={resetManual} className="min-h-11 pr-3 text-sm font-semibold text-ink-muted hover:text-ink">
                  Répartition égale
                </button>
                {sumLabel(manualSum, true)}
              </div>
            </div>
          )
        )}
      </section>
    </Card>
  );
}
