import { useState } from 'react';
import { ChevronDown, ChevronRight, Minus, Plus, Spade, Trash2, UserPlus } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ChipWheel } from '../components/ui/ChipWheel';
import { Odometer } from '../components/ui/Odometer';
import { Switch } from '../components/ui/Switch';
import { PageHeader } from '../components/PageHeader';
import { InstallCard } from '../components/InstallCard';
import { BlindCurve } from '../components/BlindCurve';
import { SeatDraw } from '../components/SeatDraw';
import { PrizePoolSetupCard } from '../components/PrizePoolSetupCard';
import { BlindStructureEditor } from '../components/BlindStructureEditor';
import { useTournamentStore } from '../store/tournamentStore';
import { DEFAULT_PRIZE_POOL_CONFIG } from '../constants';
import { generateBlindStructure } from '../utils/tournamentEstimator';
import { feedback } from '../utils/feedback';
import {
  PRESETS, STACK_VALUES, BIG_BLIND_VALUES, BUY_IN_VALUES, SMALLEST_CHIP_VALUES,
  depthLabel, nearestValue, type TournamentPreset,
} from '../utils/presets';
import { chipColorVar } from '../utils/chips';
import type { BlindLevel, Page, TournamentConfig } from '../types';

const INSTALL_DISMISSED_KEY = 'blindr-install-dismissed';
const fmt = new Intl.NumberFormat('fr-FR');

interface SetupPageProps {
  onNavigate: (page: Page) => void;
}

const DEFAULT_PRESET = PRESETS.find(p => p.id === 'soiree')!;

function structureFor(preset: TournamentPreset, stack: number, smallestChip: number, startBB: number) {
  return generateBlindStructure(stack, smallestChip, preset.targetMinutes, preset.levelMinutes, startBB);
}

function formatMinutes(total: number) {
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60), m = total % 60;
  return m ? `${h} h ${String(m).padStart(2, '0')}` : `${h} h`;
}

export function SetupPage({ onNavigate }: SetupPageProps) {
  const { initTournament, tournament } = useTournamentStore();

  // Formule de base ; `custom` = structure retouchée à la main (« sur mesure »)
  const [preset, setPreset] = useState<TournamentPreset>(DEFAULT_PRESET);
  const [custom, setCustom] = useState(false);
  const [startBB, setStartBB] = useState(100);
  const [config, setConfig] = useState<TournamentConfig>(() => ({
    name: 'Tournoi du vendredi',
    buyIn: 20,
    startingStack: 10000,
    maxPlayersPerTable: 9,
    blindStructure: structureFor(DEFAULT_PRESET, 10000, 25, 100),
    prizePool: DEFAULT_PRIZE_POOL_CONFIG,
    smallestChip: 25,
    reEntry: null,
  }));

  const [playerNames, setPlayerNames] = useState<string[]>(['', '']);
  const [bulkCount, setBulkCount] = useState(8);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(!!tournament);
  const [showInstall, setShowInstall] = useState(() => {
    try { return localStorage.getItem(INSTALL_DISMISSED_KEY) !== '1'; } catch { return true; }
  });
  const dismissInstall = () => {
    setShowInstall(false);
    try { localStorage.setItem(INSTALL_DISMISSED_KEY, '1'); } catch { /* stockage indisponible */ }
  };

  /** Recalcule la structure depuis la formule quand un réglage de base change (annule le « sur mesure »). */
  const rebuild = (next: { preset?: TournamentPreset; stack?: number; bb?: number; smallestChip?: number }) => {
    const p = next.preset ?? preset;
    setCustom(false);
    const stack = next.stack ?? config.startingStack;
    const bb = next.bb ?? startBB;
    const chip = next.smallestChip ?? config.smallestChip;
    setConfig(c => ({ ...c, startingStack: stack, smallestChip: chip, blindStructure: structureFor(p, stack, chip, bb) }));
  };

  const choosePreset = (p: TournamentPreset) => {
    const bb = nearestValue(BIG_BLIND_VALUES, config.startingStack / p.depthBB);
    setPreset(p);
    setStartBB(bb);
    rebuild({ preset: p, bb });
    feedback('select');
  };

  const editStructure = (structure: BlindLevel[]) => {
    setCustom(true);
    setConfig(c => ({ ...c, blindStructure: structure }));
  };

  // ── Joueurs ──
  const addPlayer = () => setPlayerNames(prev => [...prev, '']);
  const removePlayer = (idx: number) => setPlayerNames(prev => prev.filter((_, i) => i !== idx));
  const updatePlayer = (idx: number, name: string) => setPlayerNames(prev => prev.map((n, i) => (i === idx ? name : n)));
  const addBulkPlayers = () => setPlayerNames(prev => {
    const named = prev.filter(n => n.trim());
    return [...named, ...Array.from({ length: bulkCount }, (_, i) => `Joueur ${named.length + i + 1}`)];
  });
  /** Entrée sur le dernier nom : nouvelle ligne et focus dessus, pour enchaîner la saisie. */
  const onNameKeyDown = (idx: number) => (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    if (idx === playerNames.length - 1) addPlayer();
    setTimeout(() => document.getElementById(`player-${idx + 1}`)?.focus(), 0);
  };

  const validPlayers = playerNames.filter(n => n.trim().length > 0);
  const canStart = validPlayers.length >= 2 && config.name.trim().length > 0;
  const startHint = config.name.trim().length === 0 ? 'Donne un nom au tournoi' : 'Ajoute au moins 2 joueurs';

  const handleStart = () => {
    if (!canStart) return;
    initTournament(config, validPlayers.map(n => n.trim()));
    setDrawing(true);
  };

  // ── Résumé de la structure ──
  const gameLevels = config.blindStructure.filter(l => !l.isBreak);
  const totalMinutes = config.blindStructure.reduce((s, l) => s + l.duration, 0);
  const depth = Math.round(config.startingStack / Math.max(1, gameLevels[0]?.bigBlind ?? startBB));

  if (drawing && tournament) {
    return <SeatDraw tournament={tournament} onDone={() => { setDrawing(false); onNavigate('tournament'); }} />;
  }

  if (showResumePrompt && tournament) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6">
        <Card highlight className="max-w-md w-full text-center">
          <Spade size={48} className="text-accent mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-accent mb-2">Tournoi en cours</h2>
          <p className="text-ink-muted mb-2">{tournament.config.name}</p>
          <p className="text-ink mb-6">
            {tournament.players.filter(p => !p.isEliminated).length} joueurs restants — Niveau {tournament.currentLevelIndex + 1}
          </p>
          <div className="flex flex-col gap-3">
            <Button size="lg" onClick={() => { setShowResumePrompt(false); onNavigate('tournament'); }}>
              Reprendre le tournoi
            </Button>
            <Button variant="ghost" onClick={() => setShowResumePrompt(false)}>Nouveau tournoi</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8 pb-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-8">
        <PageHeader
          title={<span className="flex items-center gap-3"><img src="/favicon.svg" alt="" className="w-10 h-10 lg:hidden" />blindr</span>}
          subtitle="Nouveau tournoi"
        />

        {showInstall && <InstallCard onDismiss={dismissInstall} />}

        <Input
          id="tournament-name"
          label="Nom du tournoi"
          value={config.name}
          onChange={e => setConfig(c => ({ ...c, name: e.target.value }))}
          placeholder="Tournoi du vendredi"
        />

        {/* ── Formule ── */}
        <Section title="Formule" aside={custom && <span className="text-sm text-ink-muted">Sur mesure</span>}>
          <div className="grid grid-cols-2 gap-2.5">
            {PRESETS.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => choosePreset(p)}
                aria-pressed={!custom && preset.id === p.id}
                className={`text-left flex flex-col gap-0.5 p-3.5 rounded-card border bg-surface transition-[box-shadow,transform] active:scale-[0.98]
                  focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
                  ${!custom && preset.id === p.id ? 'border-accent ring-2 ring-inset ring-accent' : 'border-line'}`}
              >
                <span className="font-display text-2xl font-extrabold">{p.name}</span>
                <span className="text-sm text-ink-muted">{p.description}</span>
              </button>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Niveaux"><Odometer value={String(gameLevels.length)} /></Stat>
            <Stat label="Par niveau">{gameLevels[0]?.duration ?? 0} min</Stat>
            <Stat label="Durée">{formatMinutes(totalMinutes)}</Stat>
          </div>
          <div>
            <p className="text-sm text-ink-muted mb-1.5">Montée des blindes</p>
            <BlindCurve structure={config.blindStructure} />
          </div>
        </Section>

        {/* ── Joueurs ── */}
        <Section
          title={<>Joueurs <span className="text-ink-muted num">{validPlayers.length}</span></>}
          aside={playerNames.length > 2 && (
            <button onClick={() => setPlayerNames(['', ''])} className="inline-flex items-center gap-1 min-h-11 px-2 text-sm text-ink-muted hover:text-danger">
              <Trash2 size={15} /> Tout effacer
            </button>
          )}
        >
          <ul className="rounded-card bg-surface border border-line divide-y divide-line overflow-hidden">
            {playerNames.map((name, idx) => (
              <li key={idx} className="flex items-center min-h-12 pl-4">
                <span className="w-6 text-xs text-ink-faint num">{idx + 1}</span>
                <input
                  id={`player-${idx}`}
                  className="flex-1 min-w-0 min-h-12 bg-transparent text-ink placeholder-ink-faint focus:outline-none"
                  placeholder={`Joueur ${idx + 1}`}
                  value={name}
                  enterKeyHint="next"
                  autoCapitalize="words"
                  onChange={e => updatePlayer(idx, e.target.value)}
                  onKeyDown={onNameKeyDown(idx)}
                />
                {playerNames.length > 2 && (
                  <button onClick={() => removePlayer(idx)} aria-label={`Retirer ${name || `le joueur ${idx + 1}`}`} className="grid place-items-center w-12 h-12 text-ink-faint hover:text-danger">
                    <Trash2 size={16} />
                  </button>
                )}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={addPlayer}><Plus size={16} /> Ajouter un joueur</Button>
            <div className="inline-flex items-center gap-1 rounded-control border border-line pl-3">
              <UserPlus size={16} className="text-ink-muted" />
              <Stepper value={bulkCount} min={1} max={50} onChange={setBulkCount} label="Nombre de joueurs à ajouter" />
              <button onClick={addBulkPlayers} className="min-h-9 px-3 text-sm font-semibold text-ink-muted hover:text-ink">joueurs anonymes</button>
            </div>
          </div>
        </Section>

        {/* ── Jetons ── */}
        <Section title="Jetons">
          <div className="flex flex-col gap-1">
            <p className="text-sm text-ink-muted">Tapis de départ</p>
            <p className="num-display text-6xl"><Odometer value={fmt.format(config.startingStack)} /></p>
            <ChipWheel
              label="Tapis de départ"
              values={STACK_VALUES}
              value={config.startingStack}
              onChange={stack => rebuild({ stack })}
            />
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm text-ink-muted">Grosse blinde de départ</p>
            <p className="num-display text-6xl"><Odometer value={fmt.format(gameLevels[0]?.bigBlind ?? startBB)} /></p>
            <ChipWheel
              label="Grosse blinde de départ"
              values={BIG_BLIND_VALUES}
              value={startBB}
              onChange={bb => { setStartBB(bb); rebuild({ bb }); }}
            />
          </div>
          <div className="flex flex-col gap-1.5 p-3.5 rounded-card bg-sunken">
            <div className="flex items-center gap-3">
              <span className="text-sm">Profondeur</span>
              <span className="flex-1 h-1.5 rounded-full bg-line overflow-hidden">
                <span className="block h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${Math.min(100, depth / 2)}%` }} />
              </span>
              <b className="num">{fmt.format(depth)} BB</b>
            </div>
            <p className="text-sm text-ink-muted">{depthLabel(depth)}</p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-sm text-ink-muted">Buy-in</p>
            <p className="num-display text-6xl"><Odometer value={`${config.buyIn} €`} /></p>
            <ChipWheel
              label="Buy-in en euros"
              values={BUY_IN_VALUES}
              value={config.buyIn}
              format={v => `${v}€`}
              onChange={buyIn => setConfig(c => ({ ...c, buyIn }))}
            />
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-sm text-ink-muted">Plus petit jeton sur la table</p>
            <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Plus petit jeton">
              {SMALLEST_CHIP_VALUES.map(v => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={config.smallestChip === v}
                  onClick={() => { rebuild({ smallestChip: v }); feedback('select'); }}
                  className={`chip-coin w-12 text-sm transition-transform ${config.smallestChip === v ? 'scale-110 ring-2 ring-offset-2 ring-offset-canvas ring-ink' : 'opacity-70'}`}
                  style={{ '--c': chipColorVar(v) } as React.CSSProperties}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* ── Options avancées ── */}
        <section>
          <button
            type="button"
            onClick={() => setShowAdvanced(v => !v)}
            aria-expanded={showAdvanced}
            className="w-full flex items-center justify-between min-h-12 font-display text-2xl font-extrabold"
          >
            Plus d'options
            <ChevronDown className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>
          {showAdvanced && (
            <div className="flex flex-col gap-6 mt-3">
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold">Joueurs max par table</span>
                <Stepper value={config.maxPlayersPerTable} min={2} max={10} onChange={n => setConfig(c => ({ ...c, maxPlayersPerTable: n }))} label="Joueurs max par table" />
              </div>
              <div className="flex flex-col gap-3">
                <Switch
                  label="Re-entry"
                  description="Un joueur éliminé peut racheter un tapis"
                  checked={config.reEntry !== null}
                  onChange={on => setConfig(c => ({ ...c, reEntry: on ? { maxLevel: 4, maxPerPlayer: 1 } : null }))}
                />
                {config.reEntry && (
                  <div className="flex flex-col gap-3 pl-4 border-l-2 border-line">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm">Jusqu'au niveau</span>
                      <Stepper value={config.reEntry.maxLevel} min={1} max={gameLevels.length} label="Dernier niveau de re-entry"
                        onChange={n => setConfig(c => ({ ...c, reEntry: c.reEntry && { ...c.reEntry, maxLevel: n } }))} />
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm">Par joueur <span className="text-ink-muted">(0 = illimité)</span></span>
                      <Stepper value={config.reEntry.maxPerPlayer} min={0} max={10} label="Re-entry par joueur"
                        onChange={n => setConfig(c => ({ ...c, reEntry: c.reEntry && { ...c.reEntry, maxPerPlayer: n } }))} />
                    </div>
                  </div>
                )}
              </div>
              <PrizePoolSetupCard
                buyIn={config.buyIn}
                playerCount={validPlayers.length}
                prizePool={config.prizePool}
                onChange={pp => setConfig(c => ({ ...c, prizePool: pp }))}
              />
              <Card>
                <h2 className="font-display text-xl font-extrabold mb-1">Structure des blindes</h2>
                <p className="text-sm text-ink-muted mb-4">Modifier un niveau passe la formule en « sur mesure ».</p>
                <BlindStructureEditor
                  structure={config.blindStructure}
                  onChange={editStructure}
                  playerCount={validPlayers.length}
                  startingStack={config.startingStack}
                  maxPlayersPerTable={config.maxPlayersPerTable}
                  smallestChip={config.smallestChip}
                  reEntry={config.reEntry}
                />
              </Card>
            </div>
          )}
        </section>

        {/* Lancer : collé en bas de l'écran pour rester accessible pendant la saisie */}
        <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] lg:bottom-4 short:bottom-3 flex justify-center pointer-events-none">
          <Button
            size="lg"
            onClick={handleStart}
            disabled={!canStart}
            className="pointer-events-auto w-full sm:w-auto sm:px-12 shadow-sheet disabled:opacity-100 disabled:bg-sunken disabled:text-ink-muted disabled:border disabled:border-line"
          >
            {canStart ? <>Tirer les places et lancer <ChevronRight size={22} /></> : startHint}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, aside, children }: { title: React.ReactNode; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-2xl font-extrabold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2.5 rounded-card bg-sunken">
      <span className="text-xs text-ink-muted">{label}</span>
      <span className="num-display text-3xl">{children}</span>
    </div>
  );
}

function Stepper({ value, min, max, onChange, label }: {
  value: number; min: number; max: number; onChange: (n: number) => void; label: string;
}) {
  const set = (n: number) => { onChange(Math.max(min, Math.min(max, n))); feedback('tick'); };
  return (
    <span className="inline-flex items-center" role="group" aria-label={label}>
      <button type="button" onClick={() => set(value - 1)} disabled={value <= min} aria-label="Moins" className="grid place-items-center w-11 h-11 rounded-full text-ink hover:bg-sunken disabled:opacity-30">
        <Minus size={18} />
      </button>
      <span className="w-8 text-center font-bold num" aria-live="polite">{value}</span>
      <button type="button" onClick={() => set(value + 1)} disabled={value >= max} aria-label="Plus" className="grid place-items-center w-11 h-11 rounded-full text-ink hover:bg-sunken disabled:opacity-30">
        <Plus size={18} />
      </button>
    </span>
  );
}
