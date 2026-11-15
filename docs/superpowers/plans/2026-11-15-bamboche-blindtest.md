# Bamboche — Blindtest (phase 2) : plan de mise en œuvre

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** rendre le Blindtest jouable dans Bamboche : une playlist intégrée (« Hits de toujours »), l'animateur tient le téléphone, extraits de 30 s, attribution du point, révélation, podium, reprise après fermeture.

**Architecture :** même schéma que le Time Up. Un script de développeur convertit l'export Exportify en JSON de playlist dans le dépôt. La logique (tirage, partie, scores) est faite de fonctions pures testées. Le son passe par une interface `MusicSource`, implémentée en v1 par `PreviewSource` (élément `<audio>` sur l'URL d'extrait). Les écrans ne font que lire l'état et appeler ces fonctions. Les composants Équipes et Podium du Time Up sont d'abord rendus génériques pour être partagés.

**Tech Stack :** l'existant (Svelte 5, Vite, TypeScript, vite-plugin-pwa, Vitest + jsdom + testing-library). `vite-node` (fourni avec Vitest) pour lancer le script d'import.

**Spec :** `docs/superpowers/specs/2026-11-15-bamboche-design.md`, sections 7.3 et 7.4 (et 2, 3, 6 pour les règles générales). Écrans validés le 2026-11-15 sur le canvas https://claude.ai/artifact/Xi2FYxsuJQ4rXjPX5ccdEk, rangée « Blindtest » : `BtEquipes`, `BtPlaylist`, `Blindtest` (écoute), `BtRevelation`, `BtHorsLigne`. Fin de partie : même podium que le Time Up.

## Global Constraints

- Toutes les contraintes globales du plan Time Up (`docs/superpowers/plans/2026-11-15-bamboche-timeup.md`) s'appliquent : français, cibles ≥ 56 px, un seul bouton jaune par écran, pastilles sélectionnées blanches, bouton nuit sur les écrans en couleur d'équipe, `bamboche:v1:` dans `localStorage`, routage par hash, icônes SVG, pas d'erreur si vibration/Wake Lock absents.
- Couleur du jeu : Blindtest `#FF5C9A` / ombre `#C42E6A` (`blindtest` dans les tokens).
- Réglages : nombre d'extraits **10 / 15 / 20** (défaut 15), durée d'écoute **10 / 20 / 30 s** (défaut 20).
- Réseau requis pour la musique ; l'app elle-même reste installable et hors ligne. Les extraits et pochettes ne sont **jamais** mis en cache par le service worker.
- iOS : `audio.play()` doit être appelé **de façon synchrone dans le gestionnaire du tap** (« C'est parti », « Extrait suivant », « Réécouter »), sans `await` avant. Jamais de lecture automatique hors d'un geste.
- Playlist v1 : une seule, id `hits-de-toujours`, nom « Hits de toujours », générée depuis `hitster_original_-_france.csv` (308 titres, tous avec extrait).
- L'animateur ne joue pas (il voit les réponses à la révélation).

## Review Focus

1. **Extrait qui ne charge pas** (URL morte, 403, délai) → message « Extrait indisponible, on passe au suivant », un remplaçant prend sa place ; le nombre d'extraits joués reste celui demandé tant qu'il reste des remplaçants. *(Tests : Task 2 `skipCurrent`, Task 3 erreur de `PreviewSource`.)*
2. **Réseau coupé en pleine partie** → pas d'extrait sauté à tort : écran « Connexion requise pour la musique » par-dessus la partie, partie et scores conservés, « Réessayer » relance le même extrait. *(Test : Task 3 `isOnline` + Task 6 `Listen.test`.)*
3. **Double tap sur un joueur dans « Qui a trouvé ? »** → un seul point ; aucun point possible hors de la phase d'écoute. *(Test : Task 2.)*
4. **Rechargement ou fermeture pendant l'écoute ou la révélation** → reprise au même extrait, scores intacts, musique arrêtée (on relance avec « Réécouter »). *(Test : Task 4 `loadSavedBlindtest`.)*
5. **Historique qui épuise la playlist, ou demande plus grande que la playlist** → l'historique est remis à zéro plutôt que de jouer moins d'extraits ; une demande supérieure au nombre de titres est bornée. *(Test : Task 2 `drawTracks`.)*

---

## Structure des fichiers

```
scripts/import-playlist.ts                     CSV Exportify → JSON de playlist (lancé par le développeur)
src/games/blindtest/playlists/hits-de-toujours.json
src/games/blindtest/playlists/index.ts         liste des playlists intégrées
src/games/blindtest/logic/csv.ts               analyse d'un CSV Exportify (pure, testée)
src/games/blindtest/logic/draw.ts              tirage avec historique
src/games/blindtest/logic/game.ts              machine à états d'une partie
src/games/blindtest/music/source.ts            interface MusicSource + PreviewSource
src/games/blindtest/session.ts                 partie en cours, persistance, reprise
src/games/blindtest/BlindtestApp.svelte        préparation (joueurs → playlist)
src/games/blindtest/Play.svelte                partie (écoute → révélation → podium)
src/games/blindtest/screens/{Players,Playlist,Listen,Reveal,Offline,PauseSheet}.svelte
src/lib/online.ts                              état du réseau
src/lib/ranking.ts                             classement avec ex æquo (partagé)
src/lib/ui/TeamBuilder.svelte                  extrait de Teams.svelte (Time Up)
src/lib/ui/PodiumView.svelte                   extrait de Podium.svelte (Time Up)
```

### Task 1 : import de la playlist

**Files :**
- Create : `src/games/blindtest/logic/csv.ts`, `scripts/import-playlist.ts`, `src/games/blindtest/playlists/hits-de-toujours.json`, `src/games/blindtest/playlists/index.ts`
- Test : `src/games/blindtest/logic/csv.test.ts`, `src/games/blindtest/playlists/playlists.test.ts`

**Interfaces :**
- Produces :

```ts
export interface Track {
  id: string;            // URI Spotify, ex. 'spotify:track:…'
  title: string;         // tel quel
  displayTitle: string;  // sans « - Remastered … », « - From "…" », « (feat. …) »
  artists: string[];
  album: string;
  year: number | null;   // 4 premiers chiffres de la date de sortie
  annee_corrigee?: number;
  cover: string;         // URL pochette ('' si absente)
  preview: string;       // URL de l'extrait
  durationMs: number;
  isrc: string;
  popularity: number;
}
export interface Playlist { id: string; name: string; description: string; color: GameColor; tracks: Track[] }
export function parseExportifyCsv(text: string): { tracks: Track[]; rejected: { title: string; reason: string }[] }
export const playlists: Playlist[]   // playlists/index.ts
export function playlistById(id: string): Playlist | undefined
```

- [ ] **Step 1 :** tests `csv.test.ts`, sur un CSV de 3 lignes écrit dans le test, avec les en-têtes français d'Exportify (`URI du titre`, `Nom du titre`, `Nom(s) de l'artiste`, `Nom de l'album`, `Date de sortie de l'album`, `URL de l'image de l'album`, `Durée du titre (ms)`, `URL de prévisualisation du titre`, `Popularité`, `ISRC`) et une virgule dans un titre entre guillemets :
  - les artistes `"Icona Pop, Charli xcx"` → `['Icona Pop', 'Charli xcx']` ;
  - `year` de `'2008-09-23'` → 2008 ; date vide → `null` ;
  - `displayTitle` de `'Love Is All Around - From "Four Weddings And A Funeral"'` → `'Love Is All Around'`, de `'I Love It (feat. Charli XCX)'` → `'I Love It'`, de `'Zombie - Remastered 2002'` → `'Zombie'` ;
  - une ligne sans URL d'extrait est dans `rejected` avec `reason: 'pas d’extrait'` et absente de `tracks` ;
  - les en-têtes anglais (`Track URI`, `Track Name`, `Artist Name(s)`, …) donnent le même résultat.
- [ ] **Step 2 :** `npm test` → échec.
- [ ] **Step 3 :** implémenter `parseExportifyCsv` (analyseur CSV avec guillemets doublés et retours à la ligne entre guillemets, pas de dépendance) ; `scripts/import-playlist.ts <csv> <id> "<nom>" "<description>"` écrit `src/games/blindtest/playlists/<id>.json` (JSON indenté) et affiche le nombre de titres gardés et la liste des rejetés. Ajouter le script npm `"import-playlist": "vite-node scripts/import-playlist.ts"`.
- [ ] **Step 4 :** générer la playlist : `npm run import-playlist -- "C:\Users\romi\Downloads\hitster_original_-_france.csv" hits-de-toujours "Hits de toujours" "Des années 50 à aujourd'hui"`. Attendu : 308 titres gardés, 0 rejeté.
- [ ] **Step 5 :** test `playlists.test.ts` : `playlistById('hits-de-toujours')` a ≥ 300 titres, ids uniques, chaque `preview` commence par `https://`, chaque `displayTitle` non vide.
- [ ] **Step 6 :** `npm test` → PASS ; commit `feat: import de playlist Exportify et playlist « Hits de toujours »`.

### Task 2 : tirage et logique de partie

**Files :**
- Create : `src/lib/ranking.ts`, `src/games/blindtest/logic/draw.ts`, `src/games/blindtest/logic/game.ts`
- Test : `src/lib/ranking.test.ts`, `src/games/blindtest/logic/draw.test.ts`, `src/games/blindtest/logic/game.test.ts`

**Interfaces :**
- Consumes : `Rng`, `shuffle` (lib/random), `TeamDraft`, `Player`.
- Produces :

```ts
// lib/ranking.ts
export function rankScores(entries: { id: string; total: number }[]): { id: string; total: number; rank: number }[] // décroissant, ex æquo même rang

// draw.ts
export const SPARES = 5;
export function drawTracks(trackIds: string[], n: number, history: string[], rng?: Rng): { picked: string[]; history: string[] }
// picked : n + SPARES ids (bornés à la taille de la playlist), d'abord des titres absents de l'historique ;
// s'il n'y en a pas assez, l'historique est vidé et on retire parmi tous les titres.
// history renvoyé = ancien historique (ou vide si remis à zéro) + les n premiers de picked.

// game.ts
export type BtPhase = 'listen' | 'reveal' | 'podium';
export interface BtTeam { id: string; name: string; color: GameColor; players: Player[] }
export interface BtSettings { tracks: number; listenSeconds: number }
export interface BlindtestState {
  version: 1; playlistId: string; settings: BtSettings; teams: BtTeam[];
  queue: string[];            // ids à jouer, queue[current] = extrait courant
  spares: string[];           // remplaçants
  current: number;            // 0..queue.length-1
  winners: (string | null)[]; // par extrait joué : id d'équipe ou null (personne)
  skipped: string[];          // extraits indisponibles, pour le message
  phase: BtPhase;
}
export function createBlindtest(teams: TeamDraft[], players: Player[], picked: string[], playlistId: string, settings: BtSettings): BlindtestState
  // queue = picked.slice(0, settings.tracks), spares = le reste, noms des joueurs copiés, phase 'listen'
export function currentTrackId(s): string
export function award(s, teamId: string | null): BlindtestState      // 'listen' → 'reveal', winners[current] = teamId
export function changeWinner(s, teamId: string | null): BlindtestState // seulement en 'reveal'
export function nextTrack(s): BlindtestState                          // 'reveal' → 'listen' (current+1) ou 'podium' après le dernier
export function skipCurrent(s): BlindtestState                        // 'listen' : remplace queue[current] par spares[0] et l'ajoute à skipped ; sans remplaçant, retire l'extrait de la queue (podium si c'était le dernier)
export function scores(s): Record<string, number>                     // 1 point par extrait gagné
```

Toute action hors de sa phase renvoie la **même référence** (comme le Time Up).

- [ ] **Step 1 :** tests :
  - `rankScores([{id:'a',total:5},{id:'b',total:5},{id:'c',total:2}])` → rangs 1, 1, 3.
  - `drawTracks(ids(30), 15, [])` → 20 ids distincts, `history` de 15 ; avec un historique de 25 ids sur 30 → historique remis à zéro, toujours 20 ids ; `drawTracks(ids(8), 15, [])` → 8 ids ; aucun id hors de la liste.
  - `award(s,'A')` en écoute → phase `reveal`, `scores(s).A === 1` ; un second `award` renvoie la même référence (double tap) ; `award` en `reveal` ou `podium` → même référence.
  - `changeWinner(s,'B')` en révélation → A 0, B 1 ; `changeWinner(s,null)` → personne ne marque.
  - `nextTrack` après le dernier extrait → `podium` ; sinon `current + 1` et phase `listen`.
  - `skipCurrent` avec remplaçant → `queue.length` inchangé, `currentTrackId` = ancien `spares[0]`, `skipped` contient l'ancien ; sans remplaçant sur le dernier extrait → `podium` ; sans remplaçant ailleurs → `queue` raccourcie, même `current`.
  - `createBlindtest` copie les noms (renommer le joueur après ne change rien).
- [ ] **Step 2 :** `npm test` → échec.
- [ ] **Step 3 :** implémenter.
- [ ] **Step 4 :** `npm test` → PASS ; commit `feat: tirage et logique de partie du Blindtest`.

### Task 3 : son et réseau

**Files :**
- Create : `src/games/blindtest/music/source.ts`, `src/lib/online.ts`
- Test : `src/games/blindtest/music/source.test.ts`, `src/lib/online.test.ts`

**Interfaces :**
- Produces :

```ts
export interface MusicSource {
  play(url: string, fromMs?: number): Promise<void>; // rejette si le navigateur refuse ou si l'extrait ne charge pas
  preload(url: string): void;                         // charge l'extrait suivant pendant la révélation
  pause(): void;
  stop(): void;                                       // pause + retour à 0
  positionMs(): number;
  onEnded(cb: () => void): () => void;                // renvoie la fonction de désabonnement
  onError(cb: () => void): () => void;
}
export class PreviewSource implements MusicSource { constructor(createAudio?: () => HTMLAudioElement) }
export const LOAD_TIMEOUT_MS = 8000;               // sans 'playing' dans ce délai → onError

// online.ts
export const online: Readable<boolean>;            // navigator.onLine + événements online/offline
export function isOnline(): boolean;
```

- [ ] **Step 1 :** tests avec un faux élément audio injecté (objet avec `src`, `currentTime`, `play`, `pause`, `addEventListener`, `dispatch`) :
  - `play(url, 0)` affecte `src` et appelle `play()` **dans le même appel synchrone** (vérifier que `play` a été appelé avant toute micro-tâche) ;
  - un événement `error` déclenche `onError` ; un `play()` qui rejette fait rejeter `play(url)` ;
  - sans `playing` au bout de `LOAD_TIMEOUT_MS` (faux minuteurs) → `onError` ;
  - `stop()` met `currentTime` à 0 et appelle `pause()` ;
  - `online` suit les événements `offline` puis `online` de `window`.
- [ ] **Step 2 :** `npm test` → échec.
- [ ] **Step 3 :** implémenter ; `PreviewSource` réutilise un seul élément `<audio>` (iOS débloque l'élément, pas l'URL) et un second pour `preload`, qu'il échange au `play` si l'URL correspond.
- [ ] **Step 4 :** `npm test` → PASS ; commit `feat: lecture des extraits et état du réseau`.

### Task 4 : module, persistance et reprise

**Files :**
- Modify : `src/games/blindtest/module.ts`, `src/games/registry.test.ts`, `src/App.svelte` (proposition de reprise générique)
- Create : `src/games/blindtest/session.ts`
- Test : `src/games/blindtest/session.test.ts`

**Interfaces :**
- Produces : module Blindtest `status: 'disponible'`, `players: { min: 2, max: 20 }`, `route: '/blindtest'`, settings `[{ key: 'tracks', label: "Nombre d'extraits", type: 'choice', options: [10, 15, 20], default: 15 }, { key: 'listenSeconds', label: "Durée d'écoute", type: 'choice', options: [10, 20, 30], unit: 's', default: 20 }]`.
- `session.ts` : store `btGame: Writable<BlindtestState | null>` persisté sous `blindtest:game` ; `startBlindtest(s)` (enregistre, `setActiveGame('blindtest')`, navigue vers `/blindtest/partie`, ajoute les `n` extraits à l'historique `blindtest:history:<playlistId>`) ; `loadSavedBlindtest(): BlindtestState | null` (valide `version`, `phase`, `queue`, `teams`, `current` dans les bornes) ; `abandonBlindtest()` ; `readHistory(playlistId): string[]`.
- `App.svelte` : la proposition de reprise lit `getActiveGame()` et affiche le résumé du jeu concerné (Time Up : existant ; Blindtest : « Blindtest · Extrait {current+1} / {n} », scores, playlist) ; « Reprendre » → `/blindtest/partie`.

- [ ] **Step 1 :** tests : registre — Blindtest `disponible`, réglages par défaut 15 et 20 (adapter le test « les trois autres jeux sont bientôt » → Hipster et Undercover) ; session — aller-retour de sauvegarde, un état sauvegardé en `listen` revient en `listen` au même `current`, un état corrompu (`current` hors bornes) → `null`, `abandonBlindtest` efface partie et partie active, `startBlindtest` ajoute les extraits à l'historique ; `App.test` — avec une partie Blindtest sauvegardée, l'accueil affiche « Une partie est en cours » et « Blindtest ».
- [ ] **Step 2 :** `npm test` → échec.
- [ ] **Step 3 :** implémenter.
- [ ] **Step 4 :** `npm test` → PASS ; commit `feat: module Blindtest, sauvegarde et reprise`.

### Task 5 : composants partagés (équipes, podium, carte de jeu)

**Files :**
- Create : `src/lib/ui/TeamBuilder.svelte`, `src/lib/ui/PodiumView.svelte`
- Modify : `src/games/timeup/screens/Teams.svelte`, `src/games/timeup/screens/Podium.svelte` (deviennent des enveloppes), `src/lib/ui/GameCard.svelte`, `src/screens/Home.svelte`, `src/lib/teams.ts`
- Test : `src/lib/ui/TeamBuilder.test.ts`, `src/lib/ui/PodiumView.test.ts` ; les tests Time Up existants restent verts sans modification.

**Interfaces :**
- `TeamBuilder { color: GameColor; minPerTeam: number }` : stepper d'équipes, « Au hasard », équipes et joueurs à toucher, « Sans équipe », « Configurer les joueurs » (prop `onconfigure`), lit et écrit le store `teamsDraft` passé en prop `draft: Writable<TeamDraft[]>` ; expose les erreurs via `validateTeams(teams, 2, minPerTeam, names)`. `teamsDraft` du Time Up reste dans `games/timeup/setup.ts` ; le Blindtest a le sien (`games/blindtest/setup.ts`, mêmes fonctions importées).
- `PodiumView { ranking: { id: string; name: string; color: GameColor; total: number; rank: number }[]; onreplay; onhome }` : rendu actuel du podium (3 marches, ex æquo, confettis, « Rejouer » / « Retour à l'accueil »).
- `GameCard` : prop `note?: string` affichée à la place de « N joueurs et + » (le Blindtest affiche « Connexion requise » quand `online` est faux).
- `teams.ts` : `soloTeams(players: Player[]): TeamDraft[]` — une équipe par joueur, nom = nom du joueur, couleurs dans l'ordre de `TEAM_COLORS`.

- [ ] **Step 1 :** tests : `TeamBuilder` avec `minPerTeam: 1` accepte deux équipes d'un joueur (pas d'erreur), avec `minPerTeam: 2` affiche « … : au moins 2 joueurs. » ; `PodiumView` avec deux premiers ex æquo affiche « Égalité parfaite en tête ! » ; `soloTeams` de 3 joueurs → 3 équipes, noms des joueurs, couleurs distinctes ; `GameCard` avec `note` l'affiche.
- [ ] **Step 2 :** `npm test` → échec.
- [ ] **Step 3 :** extraire les composants (le Time Up garde exactement son rendu et son comportement).
- [ ] **Step 4 :** `npm test` → PASS (tests Time Up inclus) ; vérif manuelle rapide : écran Équipes et podium du Time Up inchangés ; commit `refactor: équipes et podium partagés entre les jeux`.

### Task 6 : écrans du Blindtest

**Files :**
- Create : `src/games/blindtest/setup.ts`, `src/games/blindtest/BlindtestApp.svelte`, `src/games/blindtest/Play.svelte`, `src/games/blindtest/screens/{Players,Playlist,Listen,Reveal,Offline,PauseSheet}.svelte`
- Modify : `src/App.svelte` (routes `/blindtest`, `/blindtest/partie`), `src/screens/Home.svelte` (note « Connexion requise »)
- Test : `src/games/blindtest/screens/Players.test.ts`, `src/games/blindtest/screens/Listen.test.ts`

Écrans conformes au canvas :
- **Players** (`BtEquipes`) : pastilles « En équipes » / « Chacun pour soi » (mémorisé par `save('blindtest:mode', …)`, valeurs `'equipes'` | `'solo'`, défaut `'solo'`) ; en équipes → `TeamBuilder` avec `minPerTeam: 1` ; chacun pour soi → liste des joueurs, toucher un joueur bascule « Joue » / « Anime la partie » (un seul animateur possible, facultatif) ; « Continuer » désactivé tant qu'il n'y a pas 2 participants (ou 2 équipes valides).
- **Playlist** (`BtPlaylist`) : cartes de `playlists` (sélection par bordure rose), cartes « Bientôt » Années 80 / Rap FR en pointillés, `Pills` des deux réglages (mémorisés par `setSetting`), « C'est parti ! » → `drawTracks` + `createBlindtest` + `startBlindtest`, puis lecture du premier extrait **dans le même tap**.
- **Offline** (`BtHorsLigne`) : affiché à l'entrée de `/blindtest` si `online` est faux, et par-dessus la partie quand une lecture échoue alors que le réseau est coupé ; « Réessayer » relance (au besoin le même extrait).
- **Listen** (écran `Blindtest`) : en-tête pause / « Hits de toujours · Extrait n / N » / réécouter ; disque animé pendant la lecture ; barre et minutes `0:07 / 0:20` ; la musique s'arrête à `listenSeconds` (ou à la fin de l'extrait) ; une touche par équipe à sa couleur (grille 2 colonnes) + « Personne n'a trouvé » → `source.stop()` puis `award`. Sur erreur de lecture : réseau présent → toast « Extrait indisponible, on passe au suivant » puis `skipCurrent` et lecture du remplaçant ; réseau absent → Offline.
- **Reveal** (`BtRevelation`) : pastille « +1 pour {nom} » (ou « Personne n'a trouvé »), pochette (repli : dégradé + disque si l'image ne charge pas), `displayTitle`, artistes joints par « , », année, scores, lien « Erreur ? Changer qui a marqué » (rouvre la grille, appelle `changeWinner`), « Extrait suivant » → `nextTrack` + lecture **dans le même tap** ; `preload` de l'extrait suivant à l'affichage.
- **PauseSheet** : Reprendre, scores, Quitter la partie (confirmation).
- **Podium** : `PodiumView` avec `rankScores(scores(s))` ; « Rejouer » → `/blindtest?etape=playlist` avec les mêmes joueurs ; « Accueil » → `abandonBlindtest`.
- Écran allumé pendant toute la partie (`keepAwake` au montage de `Play`, `releaseAwake` au démontage), comme le Time Up.

- [ ] **Step 1 :** tests : `Players` en chacun pour soi avec 3 joueurs dont un animateur → « Continuer » actif ; avec 1 seul participant → désactivé. `Listen` avec une `MusicSource` factice : toucher deux fois l'équipe A → `award` appelé une fois ; une erreur de lecture avec `isOnline()` vrai → le message « Extrait indisponible » s'affiche et `onskip` est appelé ; avec `isOnline()` faux → l'écran « Connexion requise pour la musique » s'affiche et `onskip` n'est pas appelé.
- [ ] **Step 2 :** `npm test` → échec.
- [ ] **Step 3 :** implémenter les écrans et l'aiguillage.
- [ ] **Step 4 :** `npm test` → PASS ; `npm run check` → 0 erreur.
- [ ] **Step 5 :** vérif manuelle à 390 px (dev, réseau actif) : partie chacun pour soi de 10 extraits × 10 s jusqu'au podium ; recharger en pleine écoute → reprise au même extrait ; couper le réseau (DevTools) pendant une écoute → écran hors ligne, « Réessayer » une fois le réseau revenu → même extrait ; une URL d'extrait volontairement cassée dans la playlist en mémoire → message puis remplaçant.
- [ ] **Step 6 :** commit `feat: écrans du Blindtest`.

### Task 7 : finitions et mise en ligne

**Files :**
- Modify : `README.md` (section « Ajouter une playlist » : commande `npm run import-playlist`, puis ajouter l'import dans `playlists/index.ts`), `vite.config.ts` (vérifier que `globPatterns` n'inclut aucune URL externe ; `navigateFallback` inchangé)

- [ ] **Step 1 :** `npm run build` ; vérifier que le précache ne contient ni MP3 ni image `i.scdn.co` et que `hits-de-toujours` est dans le bundle.
- [ ] **Step 2 :** commit `docs: ajout de playlist et finitions du Blindtest`.
- [ ] **Step 3 :** **avec l'accord explicite du partenaire** : fusion dans `master` et push (le workflow republie le site) ; vérifier le déploiement et une partie sur un vrai téléphone (son iOS au premier tap).
