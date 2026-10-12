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

## Phase 3b — Interactions (validées dans le labo https://claude.ai/artifact/61Vy25dMGNq3Lb8P2U1GPU)
- [x] Logique : grosse blinde de départ choisie (`generateBlindStructure`), formules (presets), tirage des places aléatoire, état de la bulle — avec tests
- [x] Sons : clac de jeton, bulle, célébration
- [x] Composants : `ChipWheel`, `Odometer`, `HoldButton`, `SwipeRow`, `BlindCurve`
- [x] Config refaite : formules → joueurs → jetons (roulettes tapis / grosse blinde / buy-in, profondeur en BB) → options avancées repliées
- [x] Timer : toucher = pause, glisser = niveau, blindes en odomètre, « Recommencer » et « Terminer » à maintenir
- [x] Joueurs : glisser pour éliminer + bandeau « Annuler » 5 s
- [x] Historique : vider à maintenir
- [x] Tirage des places animé au lancement
- [x] Bulle : bandeau « Bulle ! » (Timer + TV) puis célébration quand elle éclate
- [x] Vérification : tests, build, captures, gestes testés par CDP
- Reporté : coller une liste de noms

### Phase 3b — terminée
- Config refaite : nom, formules (Turbo, Apéro, Soirée, Deepstack) + résumé et courbe, joueurs (Entrée enchaîne la saisie), roulettes tapis / grosse blinde / buy-in, profondeur en BB, plus petit jeton en jetons cliquables, options avancées repliées.
- Timer : toucher = pause, glisser = niveau, blindes en odomètre, Recommencer / Terminer à maintenir, bandeau Bulle, badge « Dans l'argent ».
- Joueurs : glisser pour éliminer + « Annuler » 5 s ; Historique : vider à maintenir.
- Tirage des places : placement aléatoire (Fisher-Yates) + donne animée ; Bulle : annonce + célébration (pluie de jetons), bandeau sur l'écran TV.
- Retours centralisés dans `utils/feedback.ts` (son + vibration selon Réglages).
- Fix générateur : les pauses (5 à 15 min selon le niveau) sont comptées correctement ; Turbo passait à 4 niveaux / 32 min.
- Vérifié par CDP (Chrome mobile 390×844) : formule, roulette (souris), tirage, toucher/glisser timer, glisser pour éliminer + annuler, bulle et célébration. 62 tests.

## Phase 4 — PWA
Décisions :
- Mise à jour en mode « prompt » : jamais de rechargement automatique en plein tournoi. Un bandeau propose « Mettre à jour ».
- Icônes PNG générées une fois depuis `public/icon.svg` (assets-generator) et commitées : pas de génération au build sur Vercel.

- [x] `vite-plugin-pwa` : manifest (nom, couleurs, standalone), service worker Workbox (précache app + polices + icônes)
- [x] Icônes : 64/192/512, maskable 512, apple-touch-icon 180, favicon.ico
- [x] Méta iOS (`apple-mobile-web-app-*`, apple-touch-icon) dans `index.html`
- [x] Bandeau « Nouvelle version » + « Prêt hors ligne » (`useRegisterSW`)
- [x] Installation : bouton « Installer » (Android/Chrome via `beforeinstallprompt`), instructions iPhone (Partager → Sur l'écran d'accueil), dans Réglages + bandeau discret sur Config
- [x] Vérification : build, fichiers servis, test hors ligne (Chrome piloté par CDP)
- [ ] Test réel par l'utilisateur : installation iPhone + Android, son, vibration, écran allumé

## Cohérence de la création de tournoi
- [x] Ordre des réglages : plus petit jeton → tapis → grosse blinde (les roulettes ne proposent que des valeurs jouables avec ce jeton)
- [x] Nouveau calcul des niveaux (`utils/blinds.ts`) : échelle de blindes « de vrai poker », progression calée sur la durée et le nombre de joueurs, petits jetons retirés au fil du tournoi (SB = BB/2, sinon 2/3 de la BB quand les jetons l'imposent : 1 000-1 500 et non 750-1 500)
- [x] Structure dérivée des réglages (plus d'état dupliqué), « sur mesure » seulement après retouche
- [x] Tests (`utils/__tests__/blinds.test.ts`)
- [x] Niveaux de réserve après la fin estimée ; « Durée » = fin estimée (le chrono s'arrêtait au dernier niveau alors qu'il restait des joueurs)
- [x] Estimateur fiabilisé : joueurs comptés en continu (plus de blocage à 2), re-entrants réintégrés, mains plus rapides à table incomplète, fin interpolée
- [x] Calcul calé sur l'estimateur (re-entry compris) : on garde la vitesse de montée dont la fin estimée tombe sur la durée visée
- [x] Éditeur : niveaux dépliables, blindes par pas jouables, jeton d'ante à toucher (fini la case à cocher), `ui/Stepper.tsx`
- [x] Suppression de `DEFAULT_BLIND_STRUCTURE` (inutilisé)
- [x] ESLint à zéro : tirages aléatoires et `Date.now` hors du rendu (`useState` paresseux), `utils/transitionEffect.ts`, `contexts/colorScheme.ts` (constantes + hook), `_get`, `catch {}` commenté

## Identité « Jeton » sur toute l'app
- [x] Jeton de 100 framboise au lieu de noir (l'app devenait noire aux premiers niveaux)
- [x] Timer : jetons de places payées, pause et lecture en couleur du niveau, paysage sans débordement
- [x] Joueurs : jetons-avatars, éliminés grisés ; Historique : pile de jetons, podium en jetons
- [x] Prize Pool : interrupteurs, − / +, barre de répartition, jetons
- [x] Écran TV : toujours sombre, ChipTimer, couleur du niveau, tient en 720p et 1080p
- [x] Tables : table ovale (maquette A), slider horizontal table par table ; tirage en cartes à retourner (maquette B)

## Phase 5 — Publication
- [ ] Hébergement (ex. Cloudflare Pages) + domaine
- [ ] Vrai README
- [ ] i18n FR/EN (optionnel V1)

## Revue
### Phase 0 — terminée
- Vitest + `npm test` : 28 tests (prizePool, estimateur, store/timer).
- Bug corrigé : le temps écoulé app fermée (fréquent en PWA iOS) était perdu → `lastTickAt` persisté dans `TournamentState`, repris par `initTimerLoop`.
- Stores persistés versionnés (v1) avec migration v0 → v1.

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

### Phase 4 — terminée
- `vite-plugin-pwa` 2.0 (`registerType: 'prompt'`), manifest Blindr, Workbox précache 24 fichiers (app, police Archivo, icônes).
- Icônes générées depuis `public/icon.svg` via `npm run icons` (config `pwa-assets.config.ts`), commitées.
- `UpdateToast` : « prêt hors ligne » / « nouvelle version → Mettre à jour » ; jamais de rechargement automatique.
- `useInstallPrompt` + `InstallCard` : bouton natif (Chrome/Android), mode d'emploi iPhone ; dans Réglages et sur Config (masquable).
- Vérifié hors ligne : SW actif, réseau coupé → app, police et écran TV se chargent.
- Fix : bouton « Lancer le tournoi » désactivé était translucide par-dessus le formulaire ; il dit maintenant ce qui manque.

### Cohérence de la création — terminée
- `utils/blinds.ts` remplace `generateBlindStructure` de `tournamentEstimator.ts` (qui ne garde que validation + estimation).
- Limite connue : avec beaucoup de joueurs en Turbo/Apéro, la cible est inatteignable (montée plafonnée à ×2 par niveau) ; la fin estimée affichée le dit honnêtement.
- Exemple (1re version) Soirée, 10 joueurs, 10 000 / jeton 25 : 50/100 · 75/150 · 125/250 · 250/500 · 400/800 · 600/1200 · 1000/2000 (200) · 1500/3000 (300).
- La structure dépend du nombre de joueurs inscrits (9 par défaut tant que la liste est vide), sauf si elle est « sur mesure ».
