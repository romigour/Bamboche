# Bamboche — coquille + Time Up : plan de mise en œuvre

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** dessiner et faire valider les écrans manquants, puis livrer la PWA Bamboche (accueil, joueurs, réglages) avec le jeu Time Up complet, déployable sur GitHub Pages.

**Architecture :** SPA Svelte 5 + TypeScript construite par Vite, rendue installable et hors ligne par `vite-plugin-pwa`. Chaque jeu est un module `src/games/<id>/` déclaré dans un registre ; la logique de jeu est faite de fonctions pures testées (Vitest) et l'affichage ne fait que lire un état et appeler ces fonctions. L'état (joueurs, réglages, partie en cours) est persisté dans `localStorage`.

**Tech Stack :** Svelte 5, Vite, TypeScript, vite-plugin-pwa, Vitest (+ jsdom, @testing-library/svelte), @fontsource/fredoka, @fontsource/nunito, GitHub Actions → GitHub Pages.

**Spec :** `docs/superpowers/specs/2026-11-15-bamboche-design.md` (à lire en entier avant de commencer). Canvas de référence : https://claude.ai/artifact/Xi2FYxsuJQ4rXjPX5ccdEk

Le Blindtest (phase 2) fera l'objet d'un plan séparé, écrit après le dessin et la validation de ses écrans.

## Global Constraints

- Interface 100 % en français ; noms de jeux actuels conservés : « Time Up », « Blindtest », « Hipster », « Undercover ».
- Smartphone portrait d'abord (iOS Safari, Android Chrome) ; cibles tactiles ≥ 56 px ; un seul bouton jaune (Pop) par écran.
- Couleurs, typo et boutons exactement selon la section 6 du spec (tokens repris tels quels dans `src/lib/theme/tokens.css`).
- Polices embarquées (Fontsource), jamais chargées depuis Google Fonts : l'app doit marcher hors ligne.
- Pas de serveur, pas de compte : tout est statique, état dans `localStorage` sous des clés préfixées `bamboche:v1:`.
- Routage par hash (`#/…`) ; `base: './'` dans Vite pour fonctionner sous n'importe quel sous-chemin GitHub Pages.
- Icônes : SVG au trait arrondi, jamais d'emoji.
- Vibration et Wake Lock utilisés seulement s'ils existent ; leur absence (iOS) ne doit jamais lever d'erreur.
- Conventions validées sur le canvas (Task 1) : une pastille ou option sélectionnée est blanche (fond `--texte`, texte `--nuit`), jamais jaune ; les écrans en plein aplat de couleur d'équipe (passage du téléphone, lancement du tour) portent un bouton nuit (`--nuit`, texte blanc) ; sur l'écran Équipes, toucher un joueur le fait passer à l'équipe suivante (pas de glisser-déposer).
- Time Up : durée de tour par défaut 60 s ; manches 1 à 3 (défaut 3) ; 40 cartes en partie rapide ; 5 mots par équipe en partie perso ; ≥ 2 équipes ; ≥ 2 joueurs par équipe.

## Review Focus

1. **Fermeture ou rechargement en plein tour** → au retour, la partie reprend en pause, même carte, même temps restant ; le chrono n'a pas tourné pendant la fermeture. *(Test : Task 6 `pause/reprise`, Task 10 étape persistance.)*
2. **« Passer » quand il ne reste qu'une carte** → la même carte reste affichée, rien ne casse. *(Test : Task 6.)*
3. **Double tap rapide sur « Trouvé » ou tap après la fin du chrono** → un seul point, aucune action une fois le tour fini. *(Test : Task 6 « actions hors tour ignorées ».)*
4. **Joueur supprimé ou renommé dans la liste globale pendant qu'une partie est sauvegardée** → la partie garde les noms d'origine (instantané dans l'état). *(Test : Task 6 `createGame` copie les noms.)*
5. **Mots perso vides, en double dans la même équipe, ou ne différant que par les accents/majuscules** → refusés ou signalés comme doublons. *(Test : Task 7.)*

---

## Phase A — Design (canvas)

### Task 1 : écrans manquants sur le canvas, puis validation

Travail sur le canvas Design existant (pas de code). Suivre les instructions du type Design (fichiers sous `project/`, un `.dc.html` par écran 390×844, publication fichier par fichier) et la charte déjà dessinée dans `project/Main.dc.html`.

**Files (canvas) :**
- Modify : `project/canvas.json` (nouvelles entrées dans `boards` et `order`, rangées de 4 écrans, 80 px entre écrans, 120 px entre rangées, une note `title1` par rangée)
- Modify : `project/Reglages.dc.html` → devient l'écran **Équipes** (titre « Time Up — Équipes ») : liste des équipes, stepper d'équipes, « Tirage au sort », « Configurer les joueurs », durée du tour, bouton Continuer
- Create : `Joueurs.dc.html` (réglages globaux : liste, ajout, renommage, suppression), `Mode.dc.html`, `Saisie.dc.html`, `Transition.dc.html` (« Passe le téléphone à l'équipe X »), `Doublons.dc.html`, `Manche.dc.html` (annonce de manche + règle), `Lancement.dc.html` (« Au tour des Flamants — Tom fait deviner », Lancer), `Recap.dc.html`, `FinManche.dc.html`, `Podium.dc.html`, `Pause.dc.html`, `Reprise.dc.html` (accueil avec la proposition « Reprendre la partie »)
- Modify : `project/TimeUp.dc.html` uniquement si un écran ci-dessus impose une cohérence (ex. pastille de score)

- [ ] **Step 1 :** mettre à jour `project/canvas.json` avec toutes les entrées, puis réécrire `Reglages.dc.html` (Équipes) ; publier.
- [ ] **Step 2 :** écrire et publier chaque écran à créer, un fichier par publication, dans l'ordre du parcours (section 7.2 du spec).
- [ ] **Step 3 :** demander au partenaire de valider les écrans. Appliquer ses corrections sur le canvas.
- [ ] **Step 4 :** reporter dans ce plan tout changement de charte décidé pendant la validation (couleurs, tailles, composants) avant de lancer la Phase B.

**Checkpoint bloquant :** la Phase B ne démarre pas sans validation explicite des écrans.

---

## Phase B — Code

## Structure des fichiers

```
index.html, package.json, vite.config.ts, svelte.config.js, tsconfig.json, vitest.config.ts
.github/workflows/deploy.yml
public/icons/ (icônes PWA 192/512/maskable)
src/main.ts, src/App.svelte                 point d'entrée, routeur de haut niveau
src/lib/theme/tokens.css, global.css        tokens de la charte, styles de base
src/lib/storage.ts                          lecture/écriture localStorage typées
src/lib/router.ts                           routeur hash
src/lib/players.ts                          store des joueurs (réglages globaux)
src/lib/teams.ts                            équipes : noms, couleurs, tirage, validation (partagé entre jeux)
src/lib/random.ts                           shuffle / sample avec RNG injectable
src/lib/normalize.ts                        normalisation des mots
src/lib/feedback.ts                         sons (WebAudio), vibration, sans erreur si absents
src/lib/wakelock.ts                         écran allumé
src/lib/settings.ts                         réglages par jeu (schéma → valeurs mémorisées)
src/lib/activeGame.ts                       partie en cours (reprise)
src/lib/ui/*.svelte                         BigButton, IconButton, Icon, GameCard, Stepper, Pills, TimerBar, TeamRow, TransitionScreen, Screen
src/screens/Home.svelte, Players.svelte, GameSettings.svelte
src/games/types.ts, registry.ts
src/games/{blindtest,hipster,undercover}/module.ts   statut « bientot »
src/games/timeup/module.ts, words.json
src/games/timeup/logic/{deck,game,dedupe}.ts (+ .test.ts à côté)
src/games/timeup/TimeUpApp.svelte          aiguillage par phase
src/games/timeup/screens/*.svelte          Teams, Mode, CustomEntry, Duplicates, RoundIntro, TurnStart, Turn, TurnRecap, RoundEnd, Podium, PauseMenu
```

Les tests sont à côté du fichier testé (`*.test.ts`).

### Task 2 : socle du projet (Vite, Svelte, PWA, tokens, stockage)

**Files :**
- Create : fichiers racine listés ci-dessus, `src/main.ts`, `src/App.svelte` (affiche « Bamboche » pour l'instant), `src/lib/theme/tokens.css`, `src/lib/theme/global.css`, `src/lib/storage.ts`, `.github/workflows/deploy.yml`, `.gitignore`
- Test : `src/lib/storage.test.ts`

**Interfaces :**
- Produces : `load<T>(key: string, fallback: T): T` ; `save<T>(key: string, value: T): void` ; `remove(key: string): void` ; constante `KEY_PREFIX = 'bamboche:v1:'` (les fonctions préfixent elles-mêmes). Tokens CSS : `--nuit --surface --surface-plus --ligne --texte --texte-doux --pop --pop-ombre --timeup --timeup-ombre --blindtest --blindtest-ombre --hipster --hipster-ombre --undercover --undercover-ombre --ok --ok-ombre --ko --ko-ombre --font-display --font-text`.

- [ ] **Step 1 :** `git init` dans `C:\GIT\Bamboche`, puis `npm create vite@latest . -- --template svelte-ts` (garder les fichiers `docs/`). Ajouter `vite-plugin-pwa`, `vitest`, `jsdom`, `@testing-library/svelte`, `@fontsource/fredoka`, `@fontsource/nunito`. Scripts : `dev`, `build`, `preview`, `test` (`vitest run`).
- [ ] **Step 2 :** écrire les tests de stockage :

```ts
test('load renvoie le fallback si absent', () => expect(load('x', 42)).toBe(42));
test('save puis load fait l’aller-retour et préfixe la clé', () => {
  save('players', [{ id: 'a', name: 'Léa' }]);
  expect(localStorage.getItem('bamboche:v1:players')).not.toBeNull();
  expect(load('players', [])).toEqual([{ id: 'a', name: 'Léa' }]);
});
test('load renvoie le fallback si le JSON est corrompu', () => {
  localStorage.setItem('bamboche:v1:bad', '{oops'); expect(load('bad', 'ok')).toBe('ok');
});
test('save ne lève pas si localStorage est indisponible', () => { /* stub setItem qui throw */ });
```

- [ ] **Step 3 :** lancer `npm test` → échec (module absent).
- [ ] **Step 4 :** implémenter `storage.ts` (try/catch autour de chaque accès).
- [ ] **Step 5 :** `npm test` → PASS.
- [ ] **Step 6 :** `tokens.css` avec les valeurs exactes du spec §6 ; `global.css` : fond `--nuit`, texte blanc, polices Fredoka/Nunito importées via Fontsource, `body{margin:0}`, `-webkit-tap-highlight-color: transparent`, `overscroll-behavior: none`.
- [ ] **Step 7 :** `vite.config.ts` : `base: './'`, plugin PWA (`registerType: 'autoUpdate'`, manifest `name: 'Bamboche'`, `short_name: 'Bamboche'`, `lang: 'fr'`, `display: 'standalone'`, `orientation: 'portrait'`, `background_color` et `theme_color` `#1A1033`, `start_url: './'`, `scope: './'`, icônes 192/512/maskable ; précache de tous les assets construits, `words.json` inclus).
- [ ] **Step 8 :** `deploy.yml` : à chaque push sur `main`, `npm ci && npm test && npm run build`, puis `actions/upload-pages-artifact` (dossier `dist`) et `actions/deploy-pages`.
- [ ] **Step 9 :** `npm run build` → succès ; `npm run preview` affiche « Bamboche » sur fond nuit.
- [ ] **Step 10 :** commit `chore: socle Vite + Svelte + PWA, tokens de la charte, stockage`.

### Task 3 : kit d'interface, registre des jeux et accueil

**Files :**
- Create : `src/lib/ui/{Icon,BigButton,IconButton,GameCard,Stepper,Pills,TimerBar,TeamRow,TransitionScreen,Screen}.svelte`, `src/games/types.ts`, `src/games/registry.ts`, `src/games/{timeup,blindtest,hipster,undercover}/module.ts`, `src/screens/Home.svelte`
- Test : `src/games/registry.test.ts`, `src/lib/ui/BigButton.test.ts`

**Interfaces :**
- Produces (types) :

```ts
export type GameColor = 'pop' | 'timeup' | 'blindtest' | 'hipster' | 'undercover' | 'ok' | 'ko';
export type SettingDef =
  | { key: string; label: string; type: 'choice'; options: number[]; unit?: string; default: number }
  | { key: string; label: string; type: 'int'; min: number; max: number; unit?: string; default: number };
export interface GameModule {
  id: string; name: string; color: GameColor; icon: IconName;
  players: { min: number; max: number }; status: 'disponible' | 'bientot';
  settings: SettingDef[];
  route: string; // ex. '/timeup'
}
export const games: GameModule[]; // registry.ts, ordre d'affichage : timeup, blindtest, hipster, undercover
```

- Composants (props) : `BigButton { variant: 'pop'|'secondary'|'ghost'|GameColor; size?: 'md'|'lg'|'action'; disabled?: boolean; onclick }` (hauteurs 56/64/~100, rayon 22, ombre pleine 6 px avec la couleur `--<variant>-ombre`, descente de 4 px à l'appui) ; `IconButton { icon; label (aria-label); onclick }` ; `Icon { name: IconName; size?: number }` avec `IconName = 'play'|'back'|'settings'|'users'|'timer'|'music'|'disc'|'eyeoff'|'check'|'cross'|'pause'|'plus'|'minus'|'shuffle'|'chevron'|'trash'|'edit'` ; `GameCard { game: GameModule; onclick }` ; `Stepper { value; min; max; format?: (n)=>string; onchange }` ; `Pills { options: {value,label}[]; value; onchange }` ; `TimerBar { ratio: number; color: GameColor }` ; `TeamRow { name; color; subtitle?; score? }` ; `TransitionScreen { color; title; subtitle?; actionLabel; onaction }` ; `Screen { color?: GameColor; title?; back?: () => void }` (en-tête coloré arrondi comme sur le canvas, slot pour le contenu).
- Le tap de chaque bouton appelle `feedback.tap()` (Task 8) — d'ici là, un import d'une fonction vide ; Task 8 la remplit.

- [ ] **Step 1 :** tests du registre : ids uniques ; `timeup` est `disponible` avec `players.min === 4` (2 équipes × 2) ; les trois autres sont `bientot` ; chaque `SettingDef.default` est dans ses options/bornes.
- [ ] **Step 2 :** test `BigButton` : désactivé → `disabled` sur le `<button>` et `onclick` non appelé au clic.
- [ ] **Step 3 :** `npm test` → échec.
- [ ] **Step 4 :** implémenter types, modules (Time Up : nom « Time Up », couleur `timeup`, icône `timer`, `players {min:4, max:40}`, `route '/timeup'`, settings ci-dessous), registre, composants.

Time Up `settings` :
```ts
[{ key: 'turnSeconds', label: 'Temps par tour', type: 'choice', options: [30, 45, 60, 90], unit: 's', default: 60 },
 { key: 'rounds', label: 'Nombre de manches', type: 'int', min: 1, max: 3, default: 3 },
 { key: 'quickCards', label: 'Cartes en partie rapide', type: 'choice', options: [20, 30, 40, 50], default: 40 },
 { key: 'wordsPerTeam', label: 'Mots par équipe (perso)', type: 'int', min: 3, max: 10, default: 5 }]
```
- [ ] **Step 5 :** `Home.svelte` conforme à l'artboard Accueil (logo multicolore, « On joue à quoi ? », grille 2 colonnes de `GameCard`, jeux `bientot` en pointillés non cliquables avec « Bientôt », bouton Réglages, ligne « Joueurs de la soirée »). `App.svelte` affiche Home.
- [ ] **Step 6 :** `npm test` → PASS ; `npm run dev`, vue 390×844 : l'accueil correspond au canvas, les boutons s'enfoncent.
- [ ] **Step 7 :** commit `feat: kit d’interface, registre des jeux et accueil`.

### Task 4 : routeur, joueurs (réglages globaux), réglages par jeu

**Files :**
- Create : `src/lib/router.ts`, `src/lib/players.ts`, `src/lib/settings.ts`, `src/screens/Players.svelte`, `src/screens/GameSettings.svelte`
- Modify : `src/App.svelte` (aiguillage par route)
- Test : `src/lib/router.test.ts`, `src/lib/players.test.ts`, `src/lib/settings.test.ts`

**Interfaces :**
- Produces :
  - `parseHash(hash: string): { path: string; query: Record<string, string> }` ; store `route` (Readable de ce résultat, suit `hashchange`) ; `navigate(path: string, query?: Record<string,string>): void`.
  - Routes : `/` Home, `/joueurs` Players (query `retour` = chemin où revenir), `/reglages/:gameId` GameSettings, `/timeup` setup Time Up, `/timeup/partie` partie en cours.
  - `interface Player { id: string; name: string }` ; store `players` (Writable persisté sous `players`) ; `addPlayer(name: string): Player | null` (nom rogné, `null` si vide) ; `renamePlayer(id, name): boolean` (faux si vide) ; `removePlayer(id): void`.
  - `getSettings(game: GameModule): Record<string, number>` (défauts + valeurs mémorisées, valeurs hors bornes ramenées au défaut) ; `setSetting(gameId: string, key: string, value: number): void` (persisté sous `settings:<gameId>`).

- [ ] **Step 1 :** tests :
  - `parseHash('#/joueurs?retour=%2Ftimeup')` → `{ path: '/joueurs', query: { retour: '/timeup' } }` ; `parseHash('')` → `{ path: '/', query: {} }`.
  - `addPlayer('  Léa ')` → nom `'Léa'` ; `addPlayer('   ')` → `null` ; deux joueurs de même nom sont acceptés (ids distincts) ; `renamePlayer(id, '')` → `false` ; `removePlayer` retire ; la liste persiste (relecture via `load('players', [])`).
  - `getSettings(timeup)` sans rien stocké → `{ turnSeconds: 60, rounds: 3, quickCards: 40, wordsPerTeam: 5 }` ; après `setSetting('timeup','turnSeconds',45)` → 45 ; une valeur stockée invalide (`turnSeconds: 7`) → 60.
- [ ] **Step 2 :** `npm test` → échec.
- [ ] **Step 3 :** implémenter.
- [ ] **Step 4 :** `npm test` → PASS.
- [ ] **Step 5 :** écran `Players` conforme à `Joueurs.dc.html` (champ « Ajouter un joueur » + bouton, liste avec renommage en place et suppression, bouton retour → `query.retour` ou `/`) ; écran `GameSettings` générique : un `Pills` par réglage `choice`, un `Stepper` par réglage `int`.
- [ ] **Step 6 :** vérif manuelle : ajouter 6 joueurs, recharger la page → toujours là ; l'icône Réglages de l'accueil mène à `/joueurs`.
- [ ] **Step 7 :** commit `feat: routeur, joueurs et réglages par jeu`.

### Task 5 : aléatoire, équipes et paquet de cartes

**Files :**
- Create : `src/lib/random.ts`, `src/lib/teams.ts`, `src/games/timeup/logic/deck.ts`
- Test : `src/lib/random.test.ts`, `src/lib/teams.test.ts`, `src/games/timeup/logic/deck.test.ts`

**Interfaces :**
- Produces :
  - `type Rng = () => number` ; `shuffle<T>(items: readonly T[], rng?: Rng): T[]` (nouvelle liste, Fisher-Yates) ; `sample<T>(items: readonly T[], n: number, rng?: Rng): T[]` (n bornée à la taille).
  - `interface TeamDraft { id: string; name: string; color: GameColor; playerIds: string[] }`.
  - `TEAM_NAMES = ['Les Flamants','Les Pingouins','Les Loutres','Les Koalas','Les Lamas','Les Hiboux','Les Pandas','Les Ratons']` ; `TEAM_COLORS: GameColor[] = ['blindtest','hipster','pop','undercover','timeup','ok']`.
  - `newTeam(index: number): TeamDraft` (nom et couleur selon l'index, cycliques ; au-delà de la liste : « Équipe N »).
  - `randomAssign(playerIds: string[], teamCount: number, rng?: Rng): string[][]` (répartition équilibrée, écart de taille ≤ 1).
  - `validateTeams(teams: TeamDraft[], minTeams: number, minPlayersPerTeam: number): { ok: boolean; errors: string[] }` — messages : « Il faut au moins {minTeams} équipes. », « {nom} : au moins {min} joueurs. », « {joueur} est dans deux équipes. ».
  - `interface WordEntry { text: string; category: string }` ; `interface Card { id: string; text: string; category?: string; byTeamId?: string }` ; `drawQuickCards(words: WordEntry[], n: number, rng?: Rng): Card[]` (ids `c0…c{n-1}`, textes uniques).

- [ ] **Step 1 :** tests (RNG déterministe : `const rng = seq(0.1, 0.7, 0.3, …)` défini dans le test) : `shuffle` garde les mêmes éléments et ne modifie pas l'entrée ; `sample(x, 99)` renvoie `x.length` éléments ; `randomAssign(7 joueurs, 3)` → tailles `{3,2,2}` et chaque joueur une seule fois ; `validateTeams` : 1 équipe → erreur ; équipe à 1 joueur → erreur nommant l'équipe ; joueur en double → erreur ; 2 × 2 → `ok` ; `newTeam(0).name === 'Les Flamants'`, `newTeam(8).name === 'Équipe 9'` ; `drawQuickCards(words, 40)` → 40 cartes, textes uniques même si `words` contient un doublon.
- [ ] **Step 2 :** `npm test` → échec.
- [ ] **Step 3 :** implémenter.
- [ ] **Step 4 :** `npm test` → PASS.
- [ ] **Step 5 :** commit `feat: aléatoire, équipes et tirage des cartes`.

### Task 6 : machine à états d'une partie de Time Up

**Files :**
- Create : `src/games/timeup/logic/game.ts`
- Test : `src/games/timeup/logic/game.test.ts`

**Interfaces :**
- Consumes : `Card`, `TeamDraft`, `shuffle`, `Rng` (Task 5) ; `Player` (Task 4).
- Produces :

```ts
export type Phase = 'roundIntro' | 'turnStart' | 'turn' | 'turnRecap' | 'roundEnd' | 'podium';
export interface TeamState { id: string; name: string; color: GameColor; players: Player[]; nextPlayer: number }
export interface TurnState { endsAt: number | null; remainingMs: number; foundIds: string[]; over: boolean }
export interface TimeUpSettings { turnSeconds: number; rounds: number }
export interface TimeUpState {
  version: 1; settings: TimeUpSettings; teams: TeamState[]; cards: Card[];
  round: number;            // 1..settings.rounds
  deck: string[];           // ids restant à trouver dans la manche, deck[0] = carte affichée
  currentTeam: number;      // index dans teams
  scores: Record<string, number[]>; // teamId → points par manche
  turn: TurnState | null; phase: Phase;
}
export const ROUND_RULES: Record<1|2|3, { title: string; rule: string }> = {
  1: { title: 'Décrire', rule: 'Fais deviner en parlant librement, sans dire le mot.' },
  2: { title: 'Un seul mot', rule: 'Un seul mot comme indice, pas plus !' },
  3: { title: 'Mimer', rule: 'Mime, sans un bruit !' },
};
createGame(teams: TeamDraft[], players: Player[], cards: Card[], settings: TimeUpSettings, rng?: Rng): TimeUpState // phase 'roundIntro', round 1, noms des joueurs copiés
beginRound(s): TimeUpState                       // 'roundIntro' → 'turnStart'
currentGuesser(s): Player                         // joueur qui fait deviner pour l'équipe courante
startTurn(s, now: number): TimeUpState           // 'turnStart' → 'turn', endsAt = now + turnSeconds*1000
currentCard(s): Card | null
timeLeft(s, now: number): number                 // ms, ≥ 0
markFound(s, now: number): TimeUpState
markPassed(s, now: number): TimeUpState
pauseTurn(s, now: number): TimeUpState           // fige remainingMs, endsAt = null
resumeTurn(s, now: number): TimeUpState
endTurnIfExpired(s, now: number): TimeUpState     // appelé par le minuteur de l'écran
undoFound(s, cardId: string): TimeUpState         // seulement en 'turnRecap'
confirmTurn(s): TimeUpState                       // 'turnRecap' → applique le score, équipe/joueur suivants, puis 'roundEnd' si deck vide sinon 'turnStart'
nextRound(s, rng?: Rng): TimeUpState              // 'roundEnd' → 'roundIntro' (round+1, deck remélangé) ou 'podium' si dernière manche
totals(s): { teamId: string; total: number; rank: number }[] // trié décroissant, ex æquo = même rang
```

Règles qui ne découlent pas des signatures :
- Toute action appelée hors de sa phase (ou avec `turn.over`) renvoie l'état **inchangé** (même référence).
- `markFound`/`markPassed` appellent d'abord `endTurnIfExpired` : après la fin du chrono, elles ne font rien.
- `markFound` retire `deck[0]` et l'ajoute à `foundIds` ; deck vide → tour fini (`over: true`, phase `turnRecap`).
- `markPassed` déplace `deck[0]` en fin de paquet (sans effet visible s'il ne reste qu'une carte).
- Fin du chrono → `over: true`, phase `turnRecap` ; la carte affichée reste dans le paquet.
- `undoFound` remet la carte en fin de paquet et la retire de `foundIds`.
- `confirmTurn` : `scores[team][round-1] += foundIds.length` ; `teams[currentTeam].nextPlayer++` ; `currentTeam = (currentTeam+1) % n` ; `turn = null`. La manche suivante commence donc avec l'équipe suivante.
- Immutabilité : chaque fonction renvoie un nouvel objet (sérialisable en JSON pour la persistance).

- [ ] **Step 1 :** tests (2 équipes de 2, 3 cartes, `turnSeconds: 60`, `rounds: 3`, `now` explicite) :
  - `createGame` : phase `roundIntro`, deck de 3 ids, scores `{A:[0,0,0],B:[0,0,0]}` ; les noms sont copiés (modifier `players` ensuite ne change pas `s.teams[0].players[0].name`).
  - `startTurn(s, 0)` puis `timeLeft(s, 15000) === 45000`.
  - `markFound` ×1 → `foundIds.length === 1`, `deck.length === 2`.
  - `markPassed` avec une seule carte → même `currentCard`.
  - Actions hors tour ignorées : `markFound(s, 61000)` après `startTurn(s, 0)` → tour fini, aucun point ajouté ; `markFound` en phase `turnRecap` renvoie la même référence.
  - Pause/reprise : `startTurn(0)`, `pauseTurn(20000)`, `resumeTurn(500000)` → `timeLeft(s, 500000) === 40000` ; l'état en pause survit à `JSON.parse(JSON.stringify(s))`.
  - Deck vidé en plein tour → phase `turnRecap`, puis `confirmTurn` → `roundEnd`, score de l'équipe = 3.
  - `undoFound` en recap → `foundIds` diminue, la carte revient dans `deck`.
  - Rotation : après deux `confirmTurn`, `currentTeam` revient à 0 et `currentGuesser` est le 2e joueur de l'équipe A.
  - `nextRound` en manche 3 (ou `rounds: 1`) → `podium` ; sinon `round` + 1, deck de nouveau complet.
  - `totals` avec égalité → les deux équipes ont `rank: 1`.
- [ ] **Step 2 :** `npm test` → échec.
- [ ] **Step 3 :** implémenter `game.ts`.
- [ ] **Step 4 :** `npm test` → PASS.
- [ ] **Step 5 :** commit `feat: logique de partie Time Up`.

### Task 7 : mots perso et doublons

**Files :**
- Create : `src/lib/normalize.ts`, `src/games/timeup/logic/dedupe.ts`
- Test : `src/lib/normalize.test.ts`, `src/games/timeup/logic/dedupe.test.ts`

**Interfaces :**
- Produces :
  - `normalizeWord(s: string): string` — minuscules, accents retirés (NFD + suppression des diacritiques), ponctuation retirée, espaces multiples réduits, rogné.
  - `interface TeamWords { teamId: string; words: string[] }` (dans l'ordre de saisie des équipes).
  - `interface Duplicate { teamId: string; index: number; word: string; sameAs: string }`.
  - `validateEntry(words: string[], expected: number): { ok: boolean; error?: string }` — erreur « Il manque des mots. » si un mot est vide après rognage ou si le nombre ≠ `expected`.
  - `findDuplicates(entries: TeamWords[]): Duplicate[]` — chaque occurrence après la première (même équipe incluse), première occurrence dans l'ordre des équipes puis des mots.
  - `replaceWord(entries: TeamWords[], teamId: string, index: number, word: string): TeamWords[]`.
  - `toCards(entries: TeamWords[]): Card[]` (ids `c0…`, `byTeamId` renseigné, texte rogné).

- [ ] **Step 1 :** tests : `normalizeWord('  Astérix !  ') === 'asterix'` ; `normalizeWord('Jean-Paul  Belmondo') === 'jean paul belmondo'` ; `validateEntry(['a', '  '], 2).ok === false` ; `findDuplicates([{A:['Astérix','Tour Eiffel']},{B:['asterix','Zidane']}])` → un doublon `{teamId:'B', index:0, sameAs:'Astérix'}` ; doublon dans une même équipe détecté ; après `replaceWord`, `findDuplicates` → `[]` ; `toCards` → 4 cartes avec `byTeamId`.
- [ ] **Step 2 :** `npm test` → échec.
- [ ] **Step 3 :** implémenter.
- [ ] **Step 4 :** `npm test` → PASS.
- [ ] **Step 5 :** commit `feat: saisie de mots perso et détection des doublons`.

### Task 8 : retours (son, vibration) et écran allumé

**Files :**
- Create : `src/lib/feedback.ts`, `src/lib/wakelock.ts`
- Test : `src/lib/feedback.test.ts`, `src/lib/wakelock.test.ts`

**Interfaces :**
- Produces :
  - `type Sound = 'tap' | 'found' | 'pass' | 'tick' | 'end'` ; `unlockAudio(): void` (crée/reprend l'`AudioContext` ; appelé au premier geste) ; `play(sound: Sound): void` (sons synthétisés via oscillateurs WebAudio, aucun fichier) ; `vibrate(pattern: number | number[]): void` ; `tap(): void` (= `play('tap')` + `vibrate(10)`) ; store `soundOn` persisté sous `soundOn` (défaut `true`), `play` ne fait rien s'il est faux.
  - `keepAwake(): Promise<void>` ; `releaseAwake(): Promise<void>` ; réacquisition automatique sur `visibilitychange` tant que demandé.
- Sons (choix du constructeur dans cet esprit) : `found` deux notes montantes, `pass` note descendante, `tick` clic bref, `end` signal plus long.

- [ ] **Step 1 :** tests : sans `navigator.vibrate`, `vibrate(10)` ne lève pas ; sans `AudioContext`, `play('found')` ne lève pas ; avec `soundOn` à faux, aucun oscillateur créé (mock) ; sans `navigator.wakeLock`, `keepAwake()` se résout.
- [ ] **Step 2 :** `npm test` → échec.
- [ ] **Step 3 :** implémenter ; brancher `tap()` dans `BigButton`/`IconButton` (remplace la fonction vide de Task 3) et `unlockAudio()` au premier `pointerdown` dans `App.svelte`.
- [ ] **Step 4 :** `npm test` → PASS.
- [ ] **Step 5 :** commit `feat: sons, vibration et écran allumé`.

### Task 9 : préparation d'une partie de Time Up

**Files :**
- Create : `src/games/timeup/TimeUpApp.svelte`, `src/games/timeup/screens/{Teams,Mode,CustomEntry,Duplicates}.svelte`, `src/games/timeup/words.json` (version courte de 50 mots pour l'instant ; complétée en Task 11)
- Modify : `src/App.svelte` (route `/timeup`)
- Test : `src/games/timeup/screens/Teams.test.ts`

**Interfaces :**
- Consumes : `players`, `navigate`, `getSettings`/`setSetting` (Task 4) ; `newTeam`, `randomAssign`, `validateTeams`, `drawQuickCards` (Task 5) ; `createGame` (Task 6) ; `validateEntry`, `findDuplicates`, `replaceWord`, `toCards` (Task 7) ; composants UI (Task 3).
- Produces : `startGame(state: TimeUpState): void` dans `src/games/timeup/session.ts` (créé ici, enrichi en Task 10) — enregistre la partie et navigue vers `/timeup/partie`. Format de `words.json` : `WordEntry[]`.

Étapes de setup (état local de `TimeUpApp`, pas d'URL par étape) : `teams` → `mode` → (`customEntry` → `duplicates`) → `startGame`.

- [ ] **Step 1 :** test du composant `Teams` (testing-library) : avec 2 équipes dont une à 1 joueur, le bouton « Continuer » est désactivé et le message « … : au moins 2 joueurs. » est visible ; avec 2 × 2, il est actif.
- [ ] **Step 2 :** `npm test` → échec.
- [ ] **Step 3 :** `Teams.svelte` conforme à l'artboard Équipes : stepper du nombre d'équipes (min 2, pas de max), affectation des joueurs par tap (un joueur tapé passe à l'équipe suivante, ou chips par équipe), « Tirage au sort », « Configurer les joueurs » → `navigate('/joueurs', { retour: '/timeup' })`, `Pills` de durée (`turnSeconds`, mémorisée par `setSetting`), icône Réglages dans l'en-tête → `navigate('/reglages/timeup')` (tous les réglages du jeu), bouton « Continuer » désactivé + erreurs de `validateTeams(teams, 2, 2)`. Les équipes en cours de préparation sont gardées en mémoire de session pour survivre au détour par `/joueurs`.
- [ ] **Step 4 :** `Mode.svelte` : deux grandes cartes « Partie rapide » (« {quickCards} cartes de l'app ») et « Partie personnalisée » (stepper `wordsPerTeam`) ; rapide → `drawQuickCards(words, quickCards)` puis `createGame` puis `startGame`.
- [ ] **Step 5 :** `CustomEntry.svelte` : pour chaque équipe, `TransitionScreen` « Passe le téléphone à {équipe} », puis N champs + « Valider » (bloqué tant que `validateEntry` échoue) ; les mots des autres équipes ne sont jamais affichés.
- [ ] **Step 6 :** `Duplicates.svelte` : tant que `findDuplicates` n'est pas vide, pour l'équipe concernée : transition puis « « {word} » est déjà pris, propose un autre mot » ; puis `toCards` → `createGame` → `startGame`.
- [ ] **Step 7 :** `npm test` → PASS ; vérif manuelle à 390 px : parcours rapide et perso jusqu'à l'appel de `startGame` (un doublon saisi exprès est bien redemandé).
- [ ] **Step 8 :** commit `feat: préparation d’une partie de Time Up`.

### Task 10 : partie de Time Up, persistance et reprise

**Files :**
- Create : `src/games/timeup/screens/{RoundIntro,TurnStart,Turn,TurnRecap,RoundEnd,Podium,PauseMenu}.svelte`, `src/lib/activeGame.ts`
- Modify : `src/games/timeup/session.ts`, `src/games/timeup/TimeUpApp.svelte` (route `/timeup/partie` : aiguillage par `state.phase`), `src/screens/Home.svelte` (proposition de reprise)
- Test : `src/games/timeup/session.test.ts`, `src/lib/activeGame.test.ts`

**Interfaces :**
- Consumes : toutes les fonctions de `game.ts` (Task 6), `feedback`, `keepAwake`/`releaseAwake` (Task 8).
- Produces :
  - `session.ts` : store `game: Writable<TimeUpState | null>` persisté sous `timeup:game` à chaque changement ; `startGame(s)` ; `loadSavedGame(now: number): TimeUpState | null` (si la phase sauvegardée est `turn` et non en pause, renvoie l'état passé par `pauseTurn(s, savedAt)` — le temps écoulé pendant la fermeture n'est pas décompté ; nécessite d'enregistrer `savedAt` avec l'état) ; `abandonGame(): void`.
  - `activeGame.ts` : `getActiveGame(): { gameId: string } | null` ; `setActiveGame(gameId: string | null): void` (persisté sous `activeGame`).

- [ ] **Step 1 :** tests : `startGame` met `activeGame` à `{gameId:'timeup'}` ; un état en phase `turn` sauvegardé à `savedAt = 10000` avec `endsAt = 40000` est rechargé en pause avec `remainingMs === 30000`, quel que soit `now` ; `abandonGame` efface la partie et `activeGame`.
- [ ] **Step 2 :** `npm test` → échec.
- [ ] **Step 3 :** implémenter `session.ts` et `activeGame.ts`.
- [ ] **Step 4 :** `npm test` → PASS.
- [ ] **Step 5 :** écrans, conformes au canvas :
  - `RoundIntro` : « Manche N : {title} » + `rule`, bouton « C'est compris » → `beginRound`.
  - `TurnStart` : couleur de l'équipe, « Au tour des {équipe} », « {joueur} fait deviner », bouton Pop « Lancer » → `startTurn(Date.now())`, `keepAwake()`.
  - `Turn` : chrono géant + `TimerBar`, carte blanche bordée orange, boutons Passer/Trouvé (taille `action`), balayage de la carte (seuil 80 px : droite = trouvé, gauche = passer, la carte suit le doigt) ; minuteur `requestAnimationFrame` qui affiche `timeLeft` et appelle `endTurnIfExpired` ; `play('tick')` chaque seconde des 5 dernières, `play('end')` + `vibrate([200,100,200])` à la fin ; `found`/`pass` sur les actions ; bouton Pause → `pauseTurn` + `PauseMenu` (Reprendre → `resumeTurn`, Scores, Quitter la partie → confirmation puis `abandonGame`) ; passage en arrière-plan (`visibilitychange` caché) → `pauseTurn`.
  - `TurnRecap` : « {n} mots trouvés », liste des mots avec annulation par tap (`undoFound`), total de l'équipe sur la manche, « Prochaine équipe : {nom} », bouton « Équipe suivante » → `confirmTurn`, `releaseAwake()`.
  - `RoundEnd` : scores de la manche + cumul, bouton → `nextRound`.
  - `Podium` : classement `totals` (ex æquo affichés au même rang), « Rejouer » (mêmes équipes, nouvelles cartes du même mode : retour à l'étape Mode avec les équipes conservées) et « Accueil » (→ `abandonGame`).
- [ ] **Step 6 :** `Home.svelte` : si `getActiveGame()` existe au chargement, afficher la proposition conforme à `Reprise.dc.html` (« Reprendre la partie » / « Abandonner »).
- [ ] **Step 7 :** vérif manuelle à 390 px, en entier : partie rapide 2 équipes, `turnSeconds` 30, `rounds` 2 ; recharger la page en plein tour → reprise en pause au même temps ; double tap rapide sur Trouvé → un seul point ; finir sur le podium.
- [ ] **Step 8 :** commit `feat: partie de Time Up avec reprise après fermeture`.

### Task 11 : paquet de mots, finitions PWA et mise en ligne

**Files :**
- Modify : `src/games/timeup/words.json` (environ 200 entrées), `public/icons/*`, `index.html` (meta `theme-color`, `apple-mobile-web-app-capable`, titre), `README.md` (créer : lancer, tester, déployer, ajouter un jeu)
- Test : `src/games/timeup/words.test.ts`

- [ ] **Step 1 :** test : `words.json` contient ≥ 200 entrées, aucun texte vide, aucun doublon après `normalizeWord`, `category` dans `['Célébrité','Personnage','Objet','Lieu','Animal','Film & série']`.
- [ ] **Step 2 :** `npm test` → échec (50 mots).
- [ ] **Step 3 :** compléter le paquet (français, tous publics, connu de la plupart des gens).
- [ ] **Step 4 :** `npm test` → PASS.
- [ ] **Step 5 :** icônes PWA (192, 512, maskable) dans l'esprit du logo (« B » Fredoka jaune sur fond nuit) ; `npm run build && npm run preview` : Lighthouse « installable », l'app recharge hors ligne (DevTools → Offline) et une partie rapide se joue hors ligne.
- [ ] **Step 6 :** commit `feat: paquet de mots complet, icônes et finitions PWA`.
- [ ] **Step 7 :** **avec l'accord explicite du partenaire** (dépôt public = publication) : créer le dépôt GitHub public, pousser `main`, activer Pages (source : GitHub Actions), vérifier que le workflow passe et que le site s'ouvre et s'installe sur un vrai téléphone.

---

## Suite

- Plan Blindtest (phase 2) : dessiner puis faire valider ses écrans (choix de playlist, écoute, « Qui a trouvé ? », révélation, hors ligne), puis écrire son plan (script d'import Exportify, `MusicSource`/`PreviewSource`, module `blindtest` passé en `disponible`).
