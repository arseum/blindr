## Architecture du projet — Blindr

> **LIS CETTE SECTION EN PREMIER.** Elle évite de rescanner le projet à chaque session.
> Ex-« Poker Royale » (thème Clash Royale supprimé). Cible : PWA grand public, téléphones + tablettes. Plan : `tasks/todo.md`.

### Stack
- React 19 + TypeScript 5 + Vite 8
- Tailwind CSS 4 (`@import "tailwindcss"` dans `index.css`, pas de `tailwind.config.js`)
- Zustand 5 (state + persistance localStorage, stores versionnés)
- Vitest (`npm test`) — tests dans `src/**/__tests__/`
- Police Archivo variable auto-hébergée (`@fontsource-variable/archivo/wdth.css`, importée dans `main.tsx`)
- Lucide React (icônes)

### Arborescence clé
```
src/
  main.tsx              — entry point. Si ?display → DisplayPage (écran TV), sinon App. Lance initTimerLoop()
  App.tsx               — routing (setup/tournament/tables/history)
  index.css             — base + animations (transitions de niveau, écran TV)
  styles/tokens.css     — DESIGN TOKENS (couleurs clair/sombre, jetons, rayons, ombres, num-display)
  timer.ts / timerWorker.ts — timer singleton hors React ; rattrape le temps écoulé via lastTickAt

  contexts/ColorSchemeContext.tsx — 'system' | 'light' | 'dark', clé localStorage 'blindr-scheme', pose data-scheme sur <html>

  components/
    Navigation.tsx       — 5 onglets ; barre en bas, rail à gauche en lg et en paysage téléphone (variante `short:`)
    PageHeader.tsx       — en-tête commun + roue dentée → SettingsSheet (apparence, son, vibration, écran TV)
    TournamentEvents.tsx — monté dans App : alertes de niveau (store.subscribe), Wake Lock, fin de tournoi
    ChipTimer.tsx        — progression du niveau en 10 jetons
    EmptyTournament.tsx  — état vide « Aucun tournoi en cours »
    SeatDraw.tsx         — tirage des places animé au lancement
    BubbleBurst.tsx      — célébration quand la bulle éclate
    BlindCurve.tsx       — montée des blindes en barres
    ui/ChipWheel.tsx     — roulette de jetons (doigt, souris, molette, flèches)
    ui/Odometer.tsx, ui/HoldButton.tsx (maintenir pour confirmer), ui/SwipeRow.tsx (glisser pour agir), ui/UndoToast.tsx
    ui/Button.tsx        — variants primary/secondary/danger/success/ghost
    ui/Card.tsx          — prop highlight= (liseré accent)
    ui/Input.tsx, ui/Badge.tsx (accent/neutral/danger/success/special)
    BlindStructureEditor, PrizePoolSetupCard, EndTournamentOverlay, LevelTransitionOverlay

  pages/  SetupPage (Config), TournamentPage (Timer), PlayersPage, TablesPage, HistoryPage, DisplayPage (?display, synchro via storage events)
  hooks/useWakeLock.ts — écran allumé pendant le jeu
  utils/sound.ts       — sons Web Audio (débloqués au premier toucher dans main.tsx) + vibrate()
  utils/feedback.ts    — feedback('tick' | 'select' | 'eliminate' | …) : son + vibration selon les Réglages. Tout geste passe par là.
  utils/presets.ts     — formules + valeurs des roulettes ; utils/bubble.ts — état de la bulle
  hooks/useTapSwipe.ts — toucher vs glisser horizontal sur une même surface
  store/  tournamentStore.ts ('poker-tournament-state', v1), historyStore.ts ('poker-history-state', v1), settingsStore.ts ('blindr-settings')
  utils/  prizePool.ts, tournamentEstimator.ts, chips.ts (levelChip)
  constants.ts — DEFAULT_BLIND_STRUCTURE, formatChips() (exact sous 100 000), formatTime()
public/ — favicon.svg (icône arrondie), icon.svg (icône pleine, source PWA)
```

### Design system (direction « Jeton »)
- Classes sémantiques uniquement : `bg-canvas`, `bg-surface`, `bg-sunken`, `border-line`, `text-ink`, `text-ink-muted`, `text-ink-faint`, `bg-accent`, `text-on-accent`, `text-danger`, `text-success`, `bg-chip-<1|5|10|25|100|500|1000|5000>`
- **Accent = couleur du jeton du niveau** : App pose `data-chip={levelChip(level)}` sur la racine, toute l'app suit. Par défaut : vert (chip-25).
- Variante `short:` = téléphone en paysage (hauteur ≤ 520 px). Cibles tactiles ≥ 44 px (`min-h-11`).
- Chiffres : `num-display` (Archivo condensée, tabulaire) pour le timer et les gros nombres, `num` pour les chiffres en ligne. Titres : `font-display`.
- Rayons : `rounded-control`, `rounded-card`, `rounded-sheet`. Ombres : `shadow-raised`, `shadow-sheet`.
- **NE PAS** écrire de couleur hex/rgba dans les composants ; dans un `style`, utiliser `var(--color-…)`.
- Hauteurs plein écran : `min-h-dvh` (jamais `100vh`/`min-h-screen`).

### PWA
- `vite-plugin-pwa` dans `vite.config.ts` (manifest + Workbox), `registerType: 'prompt'` → `components/UpdateToast.tsx`
- Icônes : `npm run icons` régénère les PNG de `public/` depuis `public/icon.svg` (`pwa-assets.config.ts`)
- Installation : `hooks/useInstallPrompt.ts` + `components/InstallCard.tsx`
- Déploiement : Vercel (projet `clash-poker-tournament`, équipe `arseums-projects`), automatique à chaque push sur `main` (pas de règle de tag). Les statuts n'apparaissent pas toujours sur GitHub : vérifier avec `vercel ls clash-poker-tournament --scope arseums-projects` puis `curl` du site (1 à 2 min).

### Conventions
- Pages reçoivent `onNavigate: (page: Page) => void`
- Vérifier avec `npm test`, `npm run build`, puis `npm run dev`

---

## Orchestration du flux de travail
### 1. Planification par défaut du nœud

- Activez le mode planification pour TOUTE tâche non triviale (3 étapes ou plus, ou décisions architecturales).
- En cas d'imprévu, ARRÊTEZ et replanifiez immédiatement ; n'insistez pas.
- Utilisez le mode planification pour les étapes de vérification, et pas seulement pour la construction.
- Rédigez des spécifications détaillées en amont pour réduire l'ambiguïté.
### 2. Stratégie des sous-agents
- Utilisez les sous-agents de manière judicieuse pour garder la fenêtre principale propre.
- Déchargez la recherche, l'exploration et l'analyse parallèle sur les sous-agents.
- Pour les problèmes complexes, allouez davantage de ressources de calcul via les sous-agents.

- Une tâche par sous-agent pour une exécution ciblée.
### 3. Boucle d'auto-amélioration
- Après TOUTE correction de l'utilisateur : mettez à jour « tasks/lessons.md » avec le modèle.
- Établissez des règles pour éviter de reproduire la même erreur.
- Itérez sans relâche sur ces leçons jusqu'à ce que le taux d'erreur diminue.

- Revoyez les leçons au début de la session pour le projet concerné.
### 4. Vérification avant la validation
- Ne marquez jamais une tâche comme terminée sans avoir prouvé son bon fonctionnement.
- Différence de comportement. Entre le code principal et vos modifications, le cas échéant
- Demandez-vous : « Un ingénieur senior approuverait-il cela ? »

- Exécutez les tests, vérifiez les journaux, démontrez la correction
### 5. Exiger l'élégance (équilibré)
- Pour les modifications importantes : faites une pause et demandez-vous : « Existe-t-il une solution plus élégante ? »

- Si une correction semble bricolée : « Maintenant que je sais tout, j'implémente la solution élégante. »

- Ignorez cette étape pour les corrections simples et évidentes ; ne sur-ingénierez pas.
- Remettez en question votre propre travail avant de le présenter.
### 6. Correction autonome des bogues
- Lorsqu'un rapport de bogue vous est fourni : corrigez-le simplement. Ne demandez pas d'assistance.

- Indiquez les journaux, les erreurs, les tests en échec, puis résolvez-les.

- Aucune modification du contexte n'est requise de la part de l'utilisateur.

- Corrigez les tests d'intégration continue en échec sans qu'on vous dise comment faire.
## Gestion des tâches

1. **Planifier d'abord** : Rédigez un plan dans « tasks/todo.md » avec des éléments cochables.

2. **Vérifier le plan** : Enregistrez-le avant de commencer l'implémentation.

3. **Suivre** Progression : Marquez les éléments comme terminés au fur et à mesure.

4. Explication des modifications : Résumé à chaque étape.

5. Documentation des résultats : Ajoutez une section de révision à « tasks/todo.md ».

6. Retour d’expérience : Mettez à jour « tasks/lessons.md » après les corrections.

## Principes fondamentaux
- **La simplicité avant tout** : Simplifiez au maximum chaque modification. Impact minimal sur le code.

- **Exigence de la qualité** : Identifiez les causes profondes. Pas de solutions temporaires. Respectez les standards des développeurs expérimentés.

- **Impact minimal** : Les modifications ne doivent concerner que le nécessaire. Évitez d’introduire des bogues.