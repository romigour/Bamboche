# Cris d'animaux — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** ajouter à Bamboche le jeu « Cris d'animaux » : l'app joue un cri, l'animateur note la réponse de chaque joueur parmi des propositions, révèle, compte 1 point par bonne réponse, podium.

**Architecture :** nouveau module `src/games/animaux/` calqué sur Blindtest/Undercover : logique pure testée (`logic/`), partie sauvegardée (`session.ts`), écrans Svelte. Les sons et photos sont produits par un script d'import (`scripts/import-animals.ts`) depuis Wikimedia Commons, rangés dans `public/animaux/`, décrits par `src/games/animaux/animals.json`, téléchargés dans un cache dédié à la première partie.

**Tech Stack :** Svelte 5, TypeScript, Vite, vite-plugin-pwa (Workbox), Vitest + Testing Library, vite-node, ffmpeg-static (dev).

**Spec :** `docs/superpowers/specs/2026-11-19-cris-animaux-design.md` (et `2026-11-15-bamboche-design.md` pour la charte et l'architecture générale).

## Global Constraints

- Textes de l'interface en français, avec accents.
- Nom du jeu : « Cris d'animaux » ; id `animaux` ; route `/animaux` ; joueurs min 2, max 20.
- 1 point par bonne réponse ; la vitesse ne compte pas.
- Niveaux : `facile` | `melange` | `expert` ; défaut `melange` ; un seul niveau par partie.
- Réglages : nombre de sons 10 / 15 / 20 (défaut 10) ; nombre de propositions 3 / 4 / 6 (défaut 4).
- La bonne réponse n'est jamais visible (texte, photo, crédit, nom de fichier, position fixe) avant la révélation.
- Sons : MP3 mono 48 kbit/s, 8 s au plus ; photos WebP ~480 px ; banque visée < 10 Mo (avertissement, pas blocage).
- Licences acceptées : CC0, domaine public, CC BY, CC BY-SA (toutes versions). Refus : NC, ND, autres.
- Fichiers de la banque aux noms neutres (pas le nom de l'animal).
- Sons et photos hors du précache du service worker ; cache dédié `bamboche-animaux`.
- Charte : `docs/superpowers/specs/2026-11-15-bamboche-design.md` §6 ; gros boutons, un seul bouton jaune (`pop`) par écran.
- Couleur du jeu : `--animaux: #A3D94B; --animaux-ombre: #6E9E1E` (ajustable à l'étape maquettes) ; icône `paw`.

## Review Focus

1. **Banque plus petite que la demande** (banque provisoire de 10 animaux, 20 sons demandés, 6 propositions, peu d'animaux faciles) : la partie démarre avec ce qui existe, sans doublon de proposition ni crash. → tests Task 2.
2. **Partie sauvegardée qui cite un animal absent de la banque** (banque remplacée après la curation) : la reprise est abandonnée proprement au lieu de planter. → test Task 4.
3. **Lecture refusée par le navigateur** (iOS, premier son, fichier manquant) : l'écran reste utilisable, le bouton lecture invite à toucher, un son introuvable propose « Passer ce son ». → tests Task 7.
4. **Réponse trahie avant la révélation** : la bonne réponse n'est pas toujours à la même position et rien dans l'écran Son (texte, `alt`, `src`) ne la désigne. → tests Task 2 et Task 7.
5. **Joueurs modifiés pendant une partie** (joueur supprimé ou renommé dans les réglages globaux) : la partie garde ses joueurs à elle. → test Task 4.

---

### Task 1 : Maquettes des écrans (point d'arrêt partenaire)

Pas de code. Les tâches 6 et 7 attendent la validation de cette tâche ; les tâches 2 à 5 peuvent avancer en parallèle.

**Files :** canvas « Bamboche — Charte graphique » (https://claude.ai/artifact/Xi2FYxsuJQ4rXjPX5ccdEk), lu avec l'outil Artifact puis mis à jour (même URL).

- [ ] **Step 1 :** lire le canvas et la charte (spec général §6).
- [ ] **Step 2 :** ajouter une section « Cris d'animaux » avec : carte du jeu sur l'accueil (couleur et icône patte), Préparation (joueurs, niveau en `Pills`, état de téléchargement, lien Crédits), **Son avec 3 joueurs et avec 10 joueurs** (propositions en haut, lecture/réécoute, une ligne par joueur, Révéler fixe en bas), Révélation (photo, nom, qui a trouvé, scores), Crédits.
- [ ] **Step 3 :** publier et demander au partenaire de valider. Reporter dans ce plan (Tasks 6 et 7) tout changement décidé (couleur, forme d'une ligne joueur, textes).

---

### Task 2 : Catalogue, tirage des sons et des propositions

**Files :**
- Create : `src/games/animaux/types.ts`, `src/games/animaux/logic/draw.ts`, `src/games/animaux/logic/draw.test.ts`, `src/games/animaux/animals.json` (temporairement `[]`, rempli en Task 5)
- Create : `src/games/animaux/catalog.ts`

**Interfaces :**
- Produces :
  ```ts
  // types.ts
  export type AnimalLevel = 'facile' | 'difficile';
  export type GameLevel = 'facile' | 'melange' | 'expert';
  export interface Credit { author: string; license: string; url: string } // url = page Commons du fichier
  export interface Animal {
    id: string; name: string; level: AnimalLevel; family: string;
    sound: string; photo: string; // chemins relatifs à la racine du site, ex. 'animaux/3f9a1c2b7d.mp3'
    credits: { sound: Credit; photo: Credit };
  }
  // catalog.ts
  export const animals: Animal[];            // import de animals.json
  export function animalById(id: string): Animal | undefined;
  // logic/draw.ts
  export function drawSounds(all: Animal[], level: GameLevel, n: number, history: string[], rng?: Rng): { picked: string[]; history: string[] };
  export function drawOptions(answer: Animal, all: Animal[], count: number, trap: AnimalLevel, rng?: Rng): string[];
  export function trapFor(level: GameLevel, animal: Animal): AnimalLevel; // facile→'facile', expert→'difficile', melange→animal.level
  ```

- [ ] **Step 1 : tests (`draw.test.ts`, RNG `seq` de `lib/test-rng`, petit catalogue fabriqué dans le test : 6 faciles sur 4 familles, 6 difficiles dont 4 « nuit »)**
  - `drawSounds` facile : uniquement des animaux `facile`, n distincts.
  - `drawSounds` expert : les `difficile` d'abord, complétés par des `facile` si n dépasse.
  - `drawSounds` melange, n = 4 : 2 faciles et 2 difficiles ; n impair → la moitié arrondie au supérieur en faciles ; si un niveau manque, complété par l'autre.
  - `drawSounds` évite l'historique ; remet l'historique à zéro quand les animaux frais ne suffisent pas (même contrat que `blindtest/logic/draw.ts`) ; l'historique renvoyé = ancien + tirés.
  - `drawSounds` avec n > taille du catalogue : renvoie tout le catalogue, sans doublon (Review Focus 1).
  - `drawOptions` piège `facile` : contient la réponse, `count` ids distincts, les autres sont `facile` et de familles différentes de la réponse et entre elles tant que possible.
  - `drawOptions` piège `difficile` : les autres viennent d'abord de la famille de la réponse (tous niveaux), puis d'ailleurs.
  - `drawOptions` avec `count` > catalogue : renvoie tout le catalogue, réponse incluse, sans doublon.
  - Position de la réponse : sur deux RNG différents, la réponse n'est pas au même index (Review Focus 4).
- [ ] **Step 2 :** `npx vitest run src/games/animaux/logic/draw.test.ts` → FAIL (module absent).
- [ ] **Step 3 :** implémenter `types.ts`, `catalog.ts`, `draw.ts` avec `shuffle` de `lib/random`. `drawOptions` : choisir les leurres selon la priorité, puis mélanger réponse + leurres.
- [ ] **Step 4 :** relancer → PASS.
- [ ] **Step 5 :** commit `feat(animaux): catalogue et tirage des sons et propositions`.

---

### Task 3 : État de partie et scores

**Files :** Create `src/games/animaux/logic/game.ts`, `src/games/animaux/logic/game.test.ts`

**Interfaces :**
- Consumes : Task 2 (`drawSounds`, `drawOptions`, `trapFor`, `Animal`, `GameLevel`).
- Produces :
  ```ts
  export interface AnimauxPlayer { id: string; name: string; color: GameColor }
  export interface Round { animalId: string; options: string[]; answers: Record<string, string>; revealed: boolean; skipped: boolean }
  export interface AnimauxState {
    version: 1; phase: 'sound' | 'reveal' | 'podium'; level: GameLevel;
    players: AnimauxPlayer[]; rounds: Round[]; current: number;
  }
  export function createAnimaux(players: Player[], all: Animal[], settings: { sounds: number; choices: number }, level: GameLevel, history: string[], rng?: Rng): { state: AnimauxState; history: string[] };
  export function setAnswer(s: AnimauxState, playerId: string, animalId: string): AnimauxState; // seulement en phase 'sound', animalId parmi les options, sinon renvoie s
  export function allAnswered(s: AnimauxState): boolean;
  export function reveal(s: AnimauxState): AnimauxState;      // si allAnswered : revealed=true, phase 'reveal'
  export function nextSound(s: AnimauxState): AnimauxState;   // depuis 'reveal' : current+1 en 'sound', ou 'podium' après le dernier
  export function skipSound(s: AnimauxState): AnimauxState;   // depuis 'sound' : skipped=true puis comme nextSound
  export function scores(s: AnimauxState): Record<string, number>; // +1 par round révélé où answers[p] === animalId
  export function correctPlayers(s: AnimauxState, roundIndex: number): string[];
  ```
  Couleurs des joueurs : `TEAM_COLORS[i % TEAM_COLORS.length]` (`lib/teams`).

- [ ] **Step 1 : tests (`game.test.ts`)**
  - `createAnimaux` : `rounds.length` = sons tirés, chaque round a `choices` options contenant `animalId`, phase `sound`, `current` 0, réponses vides ; les joueurs sont copiés (id, nom) avec une couleur.
  - `setAnswer` change une réponse ; refuse un id hors options ; ne fait rien en phase `reveal`.
  - `reveal` sans toutes les réponses → état inchangé ; avec → `phase 'reveal'`, `revealed true`.
  - `scores` : 3 joueurs, 2 rounds révélés → points attendus ; un round non révélé ne compte pas ; un round `skipped` ne compte pas.
  - `nextSound` après le dernier round → `podium`.
  - `skipSound` sur le dernier round → `podium`, sans point.
- [ ] **Step 2 :** lancer → FAIL.
- [ ] **Step 3 :** implémenter (fonctions pures, jamais de mutation de l'entrée).
- [ ] **Step 4 :** lancer → PASS.
- [ ] **Step 5 :** commit `feat(animaux): état de partie et scores`.

---

### Task 4 : Module, couleur, icône, session et reprise

**Files :**
- Create : `src/games/animaux/module.ts`, `src/games/animaux/setup.ts`, `src/games/animaux/session.ts`, `src/games/animaux/session.test.ts`
- Modify : `src/games/types.ts` (ajouter `'animaux'` à `GameColor`), `src/lib/theme/tokens.css` (`--animaux`, `--animaux-ombre`), `src/lib/ui/BigButton.svelte` (`.v-animaux`), `src/lib/ui/icons.ts` (icône `paw`, tracé 24×24 : coussinet + 4 doigts en `circles`, `fill: true`), `src/games/registry.ts` et `registry.test.ts`, `src/App.svelte` (offre de reprise)

**Interfaces :**
- Consumes : Task 3.
- Produces :
  ```ts
  // module.ts
  export const animaux: GameModule; // id 'animaux', name "Cris d'animaux", color 'animaux', icon 'paw', players {min 2, max 20}, route '/animaux',
  // settings: [{ key: 'sounds', label: 'Nombre de sons', type: 'choice', options: [10, 15, 20], default: 10 },
  //            { key: 'choices', label: 'Nombre de propositions', type: 'choice', options: [3, 4, 6], default: 4 }]
  // setup.ts
  export const animauxLevel: Writable<GameLevel>; // persisté sous 'animaux:level', défaut 'melange', valeur invalide → 'melange'
  export function validateSetup(playerCount: number): { ok: boolean; error?: string }; // < 2 → "Il faut au moins 2 joueurs."
  // session.ts
  export const animauxGame: Writable<AnimauxState | null>; // sauvegardé sous 'animaux:game' à chaque changement non nul
  export function readHistory(): string[]; export function writeHistory(h: string[]): void; // 'animaux:history'
  export function startAnimaux(s: AnimauxState, history: string[]): void; // écrit l'historique, setActiveGame('animaux'), navigate('/animaux/partie')
  export function loadSavedAnimaux(all?: Animal[]): AnimauxState | null;
  export function abandonAnimaux(): void;
  export function resumeLines(s: AnimauxState): string[]; // ["Cris d'animaux · Son 3 / 10", "Léa 2 – Tom 1"]
  ```

- [ ] **Step 1 : tests**
  - `registry.test.ts` : l'ordre devient `['timeup', 'blindtest', 'undercover', 'animaux', 'scores']` ; `animaux` disponible, route `/animaux`, min 2, réglages `sounds` et `choices` aux valeurs ci-dessus.
  - `session.test.ts` : `startAnimaux` enregistre, marque actif, navigue vers `#/animaux/partie`, écrit l'historique ; une partie rechargée revient au même son et aux mêmes réponses ; `version` ≠ 1, phase inconnue ou `current` hors bornes → `null` ; **un round qui cite un id absent du catalogue passé → `null`** (Review Focus 2) ; **la partie rechargée garde ses joueurs même si `players` a changé** (Review Focus 5) ; `abandonAnimaux` efface et désactive ; `resumeLines` au format ci-dessus.
- [ ] **Step 2 :** `npx vitest run src/games/registry.test.ts src/games/animaux/session.test.ts` → FAIL.
- [ ] **Step 3 :** implémenter (modèle : `blindtest/session.ts`) ; ajouter le jeu au registre ; dans `App.svelte`, branche `active?.gameId === 'animaux'` de `resumeOffer` → `{ game, lines: resumeLines(s), route: '/animaux/partie', abandon: abandonAnimaux }`.
- [ ] **Step 4 :** `npm test` et `npm run check` → PASS, 0 erreur.
- [ ] **Step 5 :** commit `feat(animaux): module, couleur, session et reprise`.

---

### Task 5 : Script d'import, page d'écoute et banque provisoire

**Files :**
- Create : `scripts/animals/commons.ts`, `scripts/animals/commons.test.ts`, `scripts/animals/listen-page.ts`, `scripts/import-animals.ts`, `scripts/animals.source.json`
- Modify : `package.json` (devDependency `ffmpeg-static` ; script `"import-animals": "vite-node scripts/import-animals.ts"`), `vitest.config.ts` (`include` + `'scripts/**/*.test.ts'`), `.gitignore` (`scripts/.animaux-candidats/`), `README.md` (section « Banque de sons des Cris d'animaux »)
- Produces : `public/animaux/*.mp3|*.webp`, `src/games/animaux/animals.json`

**Interfaces :**
- Consumes : `Animal`, `Credit` (Task 2).
- Produces :
  ```ts
  // animals.source.json : SourceEntry[]
  export interface SourceEntry { id: string; name: string; level: AnimalLevel; family: string; sound: string; photo: string; start?: number; end?: number } // sound/photo = 'File:…' Commons ; start/end en secondes
  // commons.ts (pur, testé)
  export function commonsQueryUrl(titles: string[], thumbWidth: number): string; // api.php?action=query&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=…&format=json&origin=*
  export function parseImageInfo(json: unknown): Record<string, { url: string; thumbUrl?: string; credit: Credit }>; // clé = titre 'File:…'
  export function isFreeLicense(shortName: string): boolean;
  export function stripHtml(s: string): string;
  export function neutralName(id: string): string; // 10 caractères hexa, sha1('bamboche-animaux:' + id), stable
  export function ffmpegSoundArgs(input: string, output: string, start?: number, end?: number): string[]; // -ss/-to si donnés, sinon -t 8 ; -ac 1 -b:a 48k ; loudnorm
  // listen-page.ts
  export function listenPageHtml(entries: { entry: SourceEntry; soundFile: string; photoFile: string; credit: { sound: Credit; photo: Credit } }[]): string;
  ```
- Commandes :
  - `npm run import-animals -- candidats` : pour chaque entrée de la source, interroge Commons (lots de 50 titres, User-Agent générique `Bamboche-import/1.0`), refuse les licences non libres (listées en sortie), télécharge, découpe et encode dans `scripts/.animaux-candidats/`, écrit `ecoute.html`.
  - `npm run import-animals -- banque [selection.json]` : copie les entrées gardées (toutes si pas de fichier) vers `public/animaux/<neutralName>.mp3|.webp`, supprime les fichiers orphelins de `public/animaux/`, écrit `src/games/animaux/animals.json`, affiche la taille totale et avertit au-delà de 10 Mo. Avertit aussi si une famille utilisée a moins de 4 animaux ou s'il y a moins de 30 faciles sur 5 familles.
- Page d'écoute : un bloc par candidat (photo, nom, niveau, famille, lecteur, crédits, cases Garder / Jeter, champ « note de découpe »), compteur, bouton « Exporter la sélection » qui télécharge `selection.json` = `{ keep: string[]; notes: Record<string, string> }`. Page autonome (CSS/JS inline), ouverte en local.

- [ ] **Step 1 : tests (`commons.test.ts`)** : `parseImageInfo` sur une réponse Commons d'exemple (copiée dans le test) → url, thumbUrl, auteur sans HTML, licence `CC BY-SA 4.0`, url de page ; `isFreeLicense` vrai pour `CC0`, `Public domain`, `CC BY 3.0`, `CC BY-SA 4.0`, faux pour `CC BY-NC 4.0`, `CC BY-ND 2.0`, `''` ; `neutralName('vache')` stable, 10 hexa, ne contient pas `vache` ; `ffmpegSoundArgs` avec et sans `start/end` (contient `-t 8` seulement sans `end`, `-ac 1`, `-b:a 48k`).
- [ ] **Step 2 :** `npx vitest run scripts/animals/commons.test.ts` → FAIL.
- [ ] **Step 3 :** implémenter `commons.ts`, `listen-page.ts`, `import-animals.ts` (ffmpeg via le chemin exporté par `ffmpeg-static`, photos converties en WebP par ffmpeg aussi).
- [ ] **Step 4 :** tests → PASS.
- [ ] **Step 5 :** écrire `animals.source.json` provisoire avec **10 animaux** vérifiés sur Commons (au moins 6 faciles sur 4 familles, 4 difficiles d'une même famille), lancer `npm run import-animals -- candidats` puis `npm run import-animals -- banque`. Attendu : 10 MP3 et 10 WebP dans `public/animaux/`, `animals.json` à 10 entrées, taille affichée.
- [ ] **Step 6 :** `npm test` → PASS ; commit `feat(animaux): script d'import Commons, page d'écoute et banque provisoire`.

---

### Task 6 : Lecteur, téléchargement de la banque, préparation et crédits

Attend Task 1 (maquettes validées).

**Files :**
- Create : `src/games/animaux/audio.ts`, `src/games/animaux/bank.ts`, `src/games/animaux/bank.test.ts`, `src/games/animaux/AnimauxApp.svelte`, `src/games/animaux/screens/Setup.svelte`, `Setup.test.ts`, `src/games/animaux/screens/Credits.svelte`, `Credits.test.ts`
- Modify : `vite.config.ts` (`workbox.runtimeCaching` : `urlPattern: /\/animaux\/[^/]+\.(mp3|webp)$/`, `handler: 'CacheFirst'`, `options.cacheName: 'bamboche-animaux'`), `src/App.svelte` (routes `/animaux`, `/animaux/credits`)

**Interfaces :**
- Consumes : Tasks 2 à 4.
- Produces :
  ```ts
  // audio.ts — un seul <audio> pour toute l'app (débloqué par iOS au premier tap)
  export interface AnimalPlayer { play(url: string): Promise<void>; stop(): void; onError(cb: () => void): () => void }
  export function animalPlayer(): AnimalPlayer; // erreur si pas de 'playing' en 8 s ou événement 'error'
  // bank.ts
  export const BANK_CACHE = 'bamboche-animaux';
  export function bankUrls(all: Animal[]): string[]; // sons + photos, dédoublonnés
  export function downloadBank(urls: string[], onProgress: (done: number, total: number) => void, cacheStorage?: CacheStorage): Promise<{ failed: string[] }>; // ne retélécharge pas ce qui est en cache
  export function bankReady(urls: string[], cacheStorage?: CacheStorage): Promise<boolean>; // sans API Cache (jsdom, vieux navigateur) → true
  ```
- Setup : liste des joueurs de la soirée + « Configurer les joueurs » (`navigate('/joueurs', { retour: '/animaux' })`), `Pills` Facile / Mélangé / Expert liées à `animauxLevel`, bouton réglages (`/reglages/animaux`), bouton « Crédits des sons », état de la banque (« Téléchargement des sons… 12 / 40 » ; hors ligne et banque incomplète : « Connexion requise pour télécharger les sons la première fois »), bouton **Jouer** (variante `pop`) désactivé si `validateSetup` échoue ou banque incomplète.
- `AnimauxApp` : au clic sur Jouer, `createAnimaux(get(players), animals, getSettings(animaux), get(animauxLevel), readHistory())` puis `startAnimaux`.
- Crédits : pour chaque animal (ordre alphabétique), nom, « Son : auteur · licence », « Photo : auteur · licence », lien vers la page Commons.

- [ ] **Step 1 : tests**
  - `bank.test.ts` (faux `CacheStorage` en mémoire, `fetch` simulé) : `downloadBank` met chaque URL en cache et appelle `onProgress` jusqu'à `(n, n)` ; ne refait pas `fetch` d'une URL déjà en cache ; une réponse 404 va dans `failed` sans bloquer les autres ; `bankReady` faux tant qu'il manque une URL.
  - `Setup.test.ts` : 1 joueur → « Il faut au moins 2 joueurs. » et Jouer désactivé ; 2 joueurs et banque prête → Jouer actif, clic → `onstart` ; choisir « Expert » met `animauxLevel` à `expert` ; banque incomplète hors ligne → message de connexion.
  - `Credits.test.ts` : affiche le nom, l'auteur et la licence de chaque animal du catalogue passé en prop.
- [ ] **Step 2 :** lancer → FAIL.
- [ ] **Step 3 :** implémenter selon les maquettes validées.
- [ ] **Step 4 :** `npm test` et `npm run check` → PASS.
- [ ] **Step 5 :** vérifier dans le navigateur (`preview_start` « dev ») : accueil → Cris d'animaux → préparation, téléchargement, crédits ; capture d'écran.
- [ ] **Step 6 :** commit `feat(animaux): préparation, téléchargement des sons et crédits`.

---

### Task 7 : Écrans de partie (Son, Révélation, Pause, Podium)

Attend Task 1 (maquettes validées).

**Files :**
- Create : `src/games/animaux/Play.svelte`, `Play.test.ts`, `src/games/animaux/screens/Sound.svelte`, `Sound.test.ts`, `screens/Reveal.svelte`, `Reveal.test.ts`, `screens/PauseSheet.svelte`
- Modify : `src/App.svelte` (route `/animaux/partie`)

**Interfaces :**
- Consumes : Tasks 3, 4, 6 (`animauxGame`, `setAnswer`, `allAnswered`, `reveal`, `nextSound`, `skipSound`, `scores`, `correctPlayers`, `animalPlayer`).
- Sound props : `{ s: AnimauxState; options: Animal[]; player: AnimalPlayer; soundUrl: string; onanswer(playerId, animalId); onreveal(); onskip(); onpause() }`. Les options n'affichent que le nom (pas de photo). Lecture : gros bouton lecture/réécoute ; `play()` appelé seulement dans le tap.
- Reveal props : `{ s: AnimauxState; animal: Animal; winners: string[]; points: Record<string, number>; player: AnimalPlayer; onnext() }` ; bouton « Son suivant » ou « Voir le podium » au dernier.
- Play : comme `blindtest/Play.svelte` (reprise depuis `loadSavedAnimaux(animals)`, `keepAwake`, `PodiumView` avec « Rejouer » = `abandonAnimaux()` puis `navigate('/animaux')`).

- [ ] **Step 1 : tests**
  - `Sound.test.ts` : affiche les noms des options et une ligne par joueur ; Révéler désactivé tant qu'un joueur n'a pas de réponse ; toucher une option d'un joueur appelle `onanswer(playerId, animalId)` ; **le DOM ne contient ni image, ni `src`, ni `alt` liés à la réponse** (Review Focus 4) ; **si `play` rejette, le bouton reste actif avec le libellé « Touche pour écouter »** ; **après `onError`, le message « Son introuvable » et un bouton « Passer ce son » appellent `onskip`** (Review Focus 3).
  - `Reveal.test.ts` : photo (`alt` = nom), nom de l'animal, « Léa et Tom ont trouvé » / « Personne n'a trouvé », scores ; dernier round → « Voir le podium ».
  - `Play.test.ts` : partie sauvegardée → reprend au même son ; répondre pour tous puis Révéler → phase reveal ; dernier « Son suivant » → podium.
- [ ] **Step 2 :** lancer → FAIL.
- [ ] **Step 3 :** implémenter selon les maquettes validées (Révéler fixe en bas, liste qui défile, `Screen fit`).
- [ ] **Step 4 :** `npm test` et `npm run check` → PASS.
- [ ] **Step 5 :** jouer une partie complète dans le navigateur en vue mobile (375×812) avec 3 joueurs puis 10 joueurs ; vérifier lecture, réécoute, révélation, pause, reprise après rechargement, podium ; capture d'écran.
- [ ] **Step 6 :** commit `feat(animaux): écrans de partie`.

---

### Task 8 : Banque finale (point d'arrêt partenaire)

**Files :** Modify `scripts/animals.source.json`, `public/animaux/`, `src/games/animaux/animals.json`, `README.md` (« Jeux disponibles » : ajouter Cris d'animaux).

- [ ] **Step 1 :** compléter `animals.source.json` à **environ 100 candidats** vérifiés sur Commons (licences libres, enregistrements d'une seule espèce), avec niveau et famille, en respectant : chaque famille utilisée en Expert ≥ 4 animaux ; ≥ 30 faciles sur ≥ 5 familles (en visant ~70 gardés).
- [ ] **Step 2 :** `npm run import-animals -- candidats` ; donner au partenaire le chemin complet de `ecoute.html`.
- [ ] **Step 3 (partenaire) :** écoute, coche, note les découpes à reprendre, exporte `selection.json`.
- [ ] **Step 4 :** reporter les découpes notées (`start`/`end`), relancer `candidats` pour ceux-là si besoin, puis `npm run import-animals -- banque <selection.json>`. Attendu : aucun avertissement de famille ; taille affichée (signaler si > 10 Mo).
- [ ] **Step 5 :** `npm test`, `npm run check`, `npm run build` → OK ; vérifier en `preview` qu'après un premier passage en ligne la partie se joue hors ligne (réseau coupé dans le navigateur).
- [ ] **Step 6 :** commit `feat(animaux): banque de sons finale`.
