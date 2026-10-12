# Transformation en PWA grand public

Cible : PWA installable, mobile-first (téléphones + tablettes, portrait et paysage).
Identité visuelle originale, plus aucun asset ni référence Clash Royale.
Multi-appareils : hors périmètre V1.

## Phase 0 — Fondations
- [x] Installer Vitest, tester `utils/prizePool.ts`, `utils/tournamentEstimator.ts`, `timer.ts`
- [x] Versionner le state persisté Zustand (`version` + `migrate`) des deux stores
- [x] Timer fiable après fermeture de l'app : `lastTickAt` persisté, rattrapé au démarrage

## Phase 1 — Identité visuelle
- [x] Nom : **Blindr** (reste à vérifier : domaine + marque INPI/EUIPO)
- [x] Audit de l'existant (skill `redesign-existing-projects`)
- [x] Proposer 2-3 directions visuelles → https://claude.ai/artifact/X6w1ET7N8YT5UqyUgd3kyW
- [x] Direction B « Jeton » retenue — jetons = barre de progression du temps du niveau (10 jetons, 1 = 1/10 du niveau)
- [x] Maquettes timer téléphone + tablette (dans l'artifact) — autres écrans à maquetter en phase 3
- [x] Tokens dans `src/styles/tokens.css` (clair/sombre, jetons par dénomination, `[data-chip]`, `num-display`) + Archivo auto-hébergée + `utils/chips.ts` (`levelChip`)
- [x] Icône « jeton-chrono » : `public/icon.svg` (pleine, pour la PWA) + `public/favicon.svg`

## Phase 2 — Nettoyage et design system
- [x] Supprimer le thème `supercell`, `public/clash_royal_todo`, `public/arenas`, `public/asset`
- [x] Remplacer les ~326 hex hardcodés par des tokens
- [x] Renommer `CR*` → `Button`, `Card`, `Input`, `Badge` ; renommer les variables `--color-cr-*`
- [x] Décider du sort du sélecteur de thème (clair/sombre ? variantes ?)

## Phase 3 — UX mobile & tablette
Décisions :
- Navigation à 5 onglets : Config · Timer · Joueurs · Tables · Historique. Barre en bas sur téléphone et tablette portrait, rail à gauche dès `lg` (tablette paysage, ordinateur).
- Réglages (apparence, son, vibration, écran TV) dans un panneau ouvert par une roue dentée dans l'en-tête des pages.
- Alertes de niveau (transition, son, vibration) et fin de tournoi gérées au niveau de l'App : elles marchent quel que soit l'onglet ouvert.

- [x] `settingsStore` (son, vibration) + `utils/sound.ts` (Web Audio, sans fichier) + hook `useWakeLock`
- [x] Hook `useTournamentAlerts` dans App : changement de niveau → transition + son + vibration + effet TV ; dernière minute → bip ; fin de tournoi → overlay
- [x] Composant `ChipTimer` : 10 jetons, 1 jeton = 1/10 du niveau, le jeton en cours se vide, dernière minute → pulsation
- [x] Navigation : onglets en bas (safe area) / rail à gauche en `lg`, `PageHeader` + `SettingsSheet`
- [x] Écran Timer refait (maquette B) : téléphone portrait sur un écran, paysage et tablette en 2 colonnes
- [x] Nouvelle page Joueurs : recherche, élimination, annulation visible au toucher, re-entry (si autorisé)
- [x] Tables : déplacer un joueur au toucher (sélection puis table cible) en plus du glisser-déposer
- [x] App ouvre directement le Timer si un tournoi est en cours
- [x] Vérification : tests, build, captures téléphone portrait/paysage + tablette, clair/sombre

## Phase 4 — PWA
- [ ] `vite-plugin-pwa` : manifest, service worker, fonctionnement hors ligne
- [ ] Icônes (toutes tailles, maskable), splash screens, `theme-color`
- [ ] Méta iOS (`apple-mobile-web-app-*`), `lang="fr"` dans `index.html`
- [ ] Invite d'installation + gestion des mises à jour
- [ ] Tests sur vrais appareils : iPhone (Safari), Android (Chrome), iPad

## Phase 5 — Publication
- [ ] Hébergement (ex. Cloudflare Pages) + domaine
- [ ] Vrai README
- [ ] i18n FR/EN (optionnel V1)

## Revue
### Phase 0 — terminée
- Vitest + `npm test` : 28 tests (prizePool, estimateur, store/timer).
- Bug corrigé : le temps écoulé app fermée (fréquent en PWA iOS) était perdu → `lastTickAt` persisté dans `TournamentState`, repris par `initTimerLoop`.
- Stores persistés versionnés (v1) avec migration v0 → v1.
- Bug trouvé à l'audit : l'historique enregistre `prize: 0` pour chaque place (TournamentPage `handleCloseEnd`) — à corriger.
- Restent 2 erreurs ESLint préexistantes (`_get` inutilisé, `catch {}` vide) — à traiter lors du nettoyage.

### Phase 2 — terminée
- Thème Clash Royale supprimé : assets `public/`, CSS supercell (~450 lignes), images d'arène de l'écran TV.
- `ThemeContext` → `ColorSchemeContext` (Automatique / Clair / Sombre).
- `CRButton/CRCard/CRInput/CRBadge` → `Button/Card/Input/Badge` réécrits sur les tokens (focus visible, cibles ≥ 44 px).
- Toutes les couleurs en dur migrées vers les tokens (0 hex restant dans les composants).
- Écran TV et écran de fin réécrits sur les tokens ; l'accent suit le jeton du niveau.
- Bugs corrigés : gains à 0 € dans l'historique ; `formatChips` arrondissait les blindes (1 150 → « 1K »).
- `min-h-screen` → `min-h-dvh` partout.
- Vérifié : 45 tests OK, build OK, captures téléphone clair/sombre + écran TV.
- Reste (lint préexistant) : `react-hooks/purity` (Math.random/Date.now dans le rendu), `only-export-components`, `_get`, `catch {}` vide.

### Phase 3 — terminée
- Navigation 5 onglets (Config · Timer · Joueurs · Tables · Historique) : barre en bas, rail à gauche en `lg` et en paysage téléphone (variante `short`).
- Réglages (apparence, son, vibration, écran TV) dans `SettingsSheet`, ouvert depuis `PageHeader`.
- `TournamentEvents` (monté dans App) : transition + son + vibration au changement de niveau, double bip à 1 min, écran maintenu allumé pendant le jeu, fin de tournoi détectée quel que soit l'onglet (et restaurée après rechargement via `isEnded`).
- `ChipTimer` : 10 jetons dimensionnés par container query, jamais de débordement.
- Timer refait (maquette B), page Joueurs (élimination, annulation visible au toucher, re-entry avec limite par joueur), Tables au toucher.
- L'accent de toute l'app suit le jeton du niveau (`data-chip` posé par App).
- Fix : re-entry existait dans le store mais sans bouton ; les positions sont maintenant recalculées comme pour une annulation.
- Vérifié : 47 tests, build, captures téléphone portrait/paysage, tablette portrait/paysage, clair/sombre, panneau Réglages.
- Non vérifiable en headless : son, vibration et Wake Lock → à tester sur un vrai téléphone.
