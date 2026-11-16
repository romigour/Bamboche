# Bamboche — Feuille de score : plan de mise en œuvre

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** ajouter sur l'accueil une carte « Feuille de score » qui ouvre un sous-menu de 5 jeux de société (Mille Sabords, Les Cinq Rois, Skyjo, Flip 7, Belote). Chaque jeu a une feuille de score à saisie rapide, un classement de fin et un historique avec des bilans par joueur.

**Architecture :** une seule feuille générique, réglée par une **fiche** par jeu (`defs.ts`, données pures). Les règles de la feuille sont des fonctions pures sur un état `Sheet` (`logic/sheet.ts`) ; les bilans sont des fonctions pures sur l'historique (`logic/stats.ts`). `session.ts` tient la feuille en cours et l'historique dans deux stores sauvegardés à chaque changement. Les écrans ne font que lire l'état et appeler les fonctions pures. La feuille **n'utilise pas** `activeGame` / `ResumeSheet`.

**Tech Stack :** l'existant (Svelte 5, Vite, TypeScript, Vitest + jsdom + @testing-library/svelte). Aucune dépendance nouvelle.

**Spec :** `docs/superpowers/specs/2026-11-16-feuille-de-score-design.md` (et `2026-11-15-bamboche-design.md` §3 pour les contraintes générales).

## Global Constraints

- Textes en français ; cibles tactiles ≥ 56 px (touches du pavé comprises) ; **un seul bouton jaune (`pop`) par écran** ; clés de stockage via `lib/storage` (préfixe `bamboche:v1:`) ; routage par hash (`lib/router`) ; icônes de `lib/ui/icons` ; aucune erreur si vibration / Wake Lock absents.
- Nom du menu : **« Feuille de score »**. Couleur de la carte : `hipster`. Icône : `edit`.
- Les vrais noms des jeux sont affichés : « Mille Sabords », « Les Cinq Rois », « Skyjo », « Flip 7 », « Belote ».
- Jamais le clavier système pour saisir un score : pavé intégré uniquement.
- Une cellule validée vide vaut **0**. Seules les manches **complètes** comptent (totaux, fin, classement, historique).
- Une seule feuille en cours à la fois (clé `scores:current`). Historique : `scores:history`. Dernières valeurs de fin : `scores:settings`.
- Les prénoms sont **copiés** dans la feuille (jamais relus depuis `players` après le lancement).
- Reconnaissance d'un joueur dans les bilans : `normalizeWord(prénom)` (`src/lib/normalize.ts`).
- Reporté (autorisé par la spec §6.3) : changer l’ordre des joueurs à la préparation. L’ordre de la feuille est celui de la liste des joueurs de la soirée.

## Review Focus

1. **Correction d'une ancienne cellule qui fait repasser sous le seuil** → la fin n'est plus considérée comme atteinte, et l'écran de fin ne se rouvre pas. *(Test : Task 2 `endReached` après `enter` sur une cellule éditée.)*
2. **« Terminer » au milieu d'une manche, ou sans aucune manche complète** → la manche entamée n'est pas enregistrée ; avec 0 manche complète, « Terminer » est désactivé. *(Tests : Task 4 `finishSheet` ; Task 6 menu.)*
3. **Joueur renommé ou supprimé de la soirée pendant une feuille** → la feuille et l'historique gardent les prénoms d'origine. *(Test : Task 4.)*
4. **Données sauvegardées corrompues ou d'une autre version** → pas de plantage : feuille ignorée, entrées d'historique invalides écartées. *(Test : Task 4 `loadSavedSheet` / `loadHistory`.)*
5. **Saisie extrême : taper 12 chiffres, « ± » seul, « ⌫ » sur vide** → le nombre est plafonné à 5 chiffres, « - » seul vaut 0, « ⌫ » sur vide ne fait rien. *(Test : Task 5 `applyKey`.)*

---

## Structure des fichiers

```
src/games/scores/
  defs.ts              fiches des 5 jeux + utilitaires de libellé
  defs.test.ts
  logic/sheet.ts       état Sheet et règles (saisie, totaux, fin, classement)
  logic/sheet.test.ts
  logic/stats.ts       bilans par joueur, conflit de prénoms
  logic/stats.test.ts
  logic/keypad.ts      tampon de saisie du pavé (fonction pure)
  logic/keypad.test.ts
  session.ts           stores persistés (feuille en cours, historique, réglages)
  session.test.ts
  module.ts            entrée du registre (carte de l'accueil)
  ui/Keypad.svelte     pavé numérique
  ui/ScoreTable.svelte tableau manches × participants
  screens/Menu.svelte       /scores
  screens/Setup.svelte      /scores/nouvelle?jeu=<id>
  screens/SheetScreen.svelte /scores/partie
  screens/Result.svelte     /scores/resultat?id=<id>
  screens/History.svelte    /scores/historique?jeu=<id>
  screens/GameDetail.svelte /scores/historique/partie?id=<id>
  (un *.test.ts à côté de chaque écran testé)
Modifiés : src/lib/ui/Stepper.svelte (prop step), src/games/registry.ts (+test),
           src/screens/Home.svelte (note de la carte), src/App.svelte (routes), src/App.test.ts
```

---

### Task 1: Fiches des jeux

**Files:**
- Create: `src/games/scores/defs.ts`, `src/games/scores/defs.test.ts`

**Interfaces:**
- Produces :
```ts
export type ScoreGameId = 'mille-sabords' | 'cinq-rois' | 'skyjo' | 'flip7' | 'belote';
export interface ScoreGameDef {
  id: ScoreGameId;
  name: string;        // nom affiché
  short: string;       // libellé de pastille
  color: GameColor;
  winner: 'haut' | 'bas';
  end: { kind: 'seuil' | 'manches'; default: number; min: number; max: number; step: number };
  teams: boolean;
  minPlayers: number;
  maxPlayers?: number;
  complement?: number;              // Belote : 162
  roundLabel?: (round: number) => string; // round 1-based
}
export const scoreGames: ScoreGameDef[];   // ordre d'affichage ci-dessous
export function scoreGameById(id: string): ScoreGameDef | undefined;
export function fmt(n: number): string;    // 6000 → "6 000" (espace normale), -5 → "-5"
export function endLabel(def: ScoreGameDef, value: number): string;
```

Valeurs (copiées de la spec §5, pas et bornes = choix du plan) :

| id | name | short | color | winner | end | teams | min / max joueurs | extra |
|---|---|---|---|---|---|---|---|---|
| mille-sabords | Mille Sabords | Sabords | timeup | haut | seuil 6000 (1000–20000, pas 500) | non | 2 / – | |
| cinq-rois | Les Cinq Rois | 5 Rois | undercover | bas | manches 11 (1–11, pas 1) | non | 2 / – | `roundLabel: n => \`${n + 2} cartes\`` |
| skyjo | Skyjo | Skyjo | hipster | bas | seuil 100 (50–500, pas 10) | non | 2 / – | |
| flip7 | Flip 7 | Flip 7 | blindtest | haut | seuil 200 (50–1000, pas 10) | non | 2 / – | |
| belote | Belote | Belote | ok | haut | seuil 1000 (500–3000, pas 50) | oui | 4 / 4 | `complement: 162` |

- [ ] **Step 1: Write the failing tests** (`defs.test.ts`)
  - `ordre : mille-sabords, cinq-rois, skyjo, flip7, belote`
  - `les valeurs de fin de la spec` : `scoreGameById('skyjo')!.end` ⊇ `{ kind: 'seuil', default: 100 }`, mille-sabords 6000 haut, cinq-rois manches 11 bas, flip7 200 haut, belote 1000 haut + `teams: true`, `minPlayers: 4`, `maxPlayers: 4`, `complement: 162`.
  - `chaque défaut est dans ses bornes et sur un pas` : `min ≤ default ≤ max` et `(default - min) % step === 0`.
  - `Cinq Rois : manche 1 = 3 cartes, manche 11 = 13 cartes`.
  - `fmt(6000) === '6 000'`, `fmt(-5) === '-5'`, `fmt(0) === '0'`.
  - `endLabel(skyjo, 100) === 'Fin à 100 points'`, `endLabel(mille, 6000) === 'Fin à 6 000 points'`, `endLabel(cinqRois, 11) === '11 manches'`.
- [ ] **Step 2: Run** `npx vitest run src/games/scores/defs.test.ts` → FAIL (module absent).
- [ ] **Step 3: Implement** `defs.ts`. `fmt` : `n.toLocaleString('fr-FR').replace(/\s/g, ' ')`.
- [ ] **Step 4: Run** the same command → PASS.
- [ ] **Step 5: Commit** `feat(scores): fiches des cinq jeux`

---

### Task 2: Règles de la feuille

**Files:**
- Create: `src/games/scores/logic/sheet.ts`, `src/games/scores/logic/sheet.test.ts`

**Interfaces:**
- Consumes : `ScoreGameDef`, `scoreGameById`, `fmt` (Task 1) ; `rankScores` (`src/lib/ranking.ts`).
- Produces :
```ts
export interface Participant { id: string; name: string; members: string[] } // solo : members = [name] ; Belote : "Léa & Tom", ['Léa','Tom']
export interface Cell { round: number; index: number } // round 0-based ; round === rounds.length ⇒ manche entamée
export interface Sheet {
  version: 1; id: string; gameId: ScoreGameId; startedAt: number; endValue: number;
  participants: Participant[];
  rounds: number[][];            // manches complètes, rounds[r][i]
  pending: (number | null)[];    // manche entamée, une case par participant
  editing: Cell | null;          // cellule touchée pour correction
}
export function createSheet(gameId: ScoreGameId, participants: Participant[], endValue: number, now: number, id: string): Sheet;
export function cursor(s: Sheet): Cell;              // editing ?? { round: rounds.length, index: première case null de pending }
export function enter(s: Sheet, value: number): Sheet;
export function select(s: Sheet, cell: Cell): Sheet; // la cellule du curseur naturel ⇒ editing = null
export function removeLast(s: Sheet): Sheet;
export function hasPending(s: Sheet): boolean;       // au moins une case non null dans pending
export function totals(s: Pick<Sheet, 'rounds' | 'participants'>): number[];
export function ranks(def: ScoreGameDef, totals: number[]): number[]; // 1-based, ex æquo même rang ; 'bas' ⇒ plus petit total = 1
export function endReached(def: ScoreGameDef, s: Pick<Sheet, 'rounds' | 'participants' | 'endValue'>): boolean;
export function endMessage(def: ScoreGameDef, s: Sheet): string;
export function progressLine(def: ScoreGameDef, s: Sheet): string;
export function suggestion(def: ScoreGameDef, s: Sheet): number | null;
```

Comportements fixés :
- `enter` écrit `value` dans `cursor(s)`. Si la cellule est dans `rounds`, la valeur la remplace. Si c'est une case de `pending`, elle la remplit. Ensuite `editing = null`. Quand `pending` n'a plus de `null`, on l'ajoute à `rounds` et `pending` repart sur des `null`.
- `removeLast` : si `hasPending`, on remet `pending` à `null` ; sinon on retire la dernière manche de `rounds` (rien à faire s'il n'y en a pas). `editing = null`.
- `endReached` : seuil ⇒ un total ≥ `endValue` ; manches ⇒ `rounds.length ≥ endValue`. Faux si `rounds` est vide.
- `endMessage` : seuil ⇒ `"Inès a atteint 100 !"`, ou `"Léa et Inès ont atteint 100 !"` (participants ≥ seuil, triés par total décroissant, valeur via `fmt`) ; manches ⇒ `"Les 11 manches sont jouées !"`.
- `progressLine` : seuil sans manche ⇒ `"Fin à 100 points"` ; seuil ⇒ `"<plus haut total> est à 58 / 100"` (`fmt` sur les deux nombres, premier participant en cas d'égalité) ; manches ⇒ `"Manche 4 / 11"` (numéro = `min(rounds.length + 1, endValue)`) suivi de `" · 6 cartes"` si `roundLabel`.
- `suggestion` : `def.complement` défini, curseur = `{ round: rounds.length, index: 1 }` et `pending[0]` entre 0 et `complement` ⇒ `complement - pending[0]` ; sinon `null`.

- [ ] **Step 1: Write the failing tests** (`sheet.test.ts`), avec 3 participants Léa / Tom / Inès sur Skyjo sauf mention contraire :
  - `la saisie avance joueur par joueur puis ouvre la manche suivante` : trois `enter` ⇒ `rounds` = `[[12, 5, 20]]`, `pending` = `[null, null, null]`, `cursor` = `{ round: 1, index: 0 }`.
  - `corriger une ancienne cellule revient ensuite au curseur` : après 1 manche et `enter(9)` pour Léa, `select({round:0,index:1})` puis `enter(7)` ⇒ `rounds[0][1] === 7`, `cursor` = `{ round: 1, index: 1 }`, `pending[0] === 9`.
  - `corriger une case de la manche entamée` : `select({round:1,index:0})` puis `enter(3)` ⇒ `pending[0] === 3`.
  - `les totaux ignorent la manche entamée`.
  - `ranks Skyjo : le plus bas est premier, ex æquo partagés` : `ranks(skyjo, [47, 31, 31]) == [3, 1, 1]` ; `ranks(flip7, [47, 31, 31]) == [1, 2, 2]`.
  - `endReached seuil puis correction qui repasse dessous` *(Review Focus 1)* : manche `[100, 5, 20]` ⇒ vrai ; `select({0,0})` + `enter(90)` ⇒ faux.
  - `endReached manches : faux à 10, vrai à 11` (Cinq Rois, `endValue` 11).
  - `endMessage` singulier, pluriel, manches (chaînes exactes ci-dessus).
  - `progressLine` : `"Fin à 100 points"` à vide ; `"Inès est à 58 / 100"` ; Cinq Rois après 3 manches ⇒ `"Manche 4 / 11 · 6 cartes"` ; Mille Sabords ⇒ `"Léa est à 1 500 / 6 000"`.
  - `removeLast efface d'abord la manche entamée, puis la dernière complète`.
  - `suggestion Belote` : 2 équipes, `enter(100)` ⇒ `suggestion === 62` ; `enter(200)` (hors bornes) ⇒ `null` ; Skyjo ⇒ toujours `null`.
  - `les scores négatifs comptent` : `enter(-10)` dans les totaux.
- [ ] **Step 2: Run** `npx vitest run src/games/scores/logic/sheet.test.ts` → FAIL.
- [ ] **Step 3: Implement** `sheet.ts`. `ranks` : pour `'bas'`, passer `-total` à `rankScores` et réordonner selon l'index d'origine. Les fonctions renvoient un nouvel objet et ne modifient jamais `s`.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(scores): règles de la feuille de score`

---

### Task 3: Bilans et prénoms en double

**Files:**
- Create: `src/games/scores/logic/stats.ts`, `src/games/scores/logic/stats.test.ts`

**Interfaces:**
- Consumes : `Participant`, `totals`, `ranks` (Task 2) ; `scoreGameById` (Task 1) ; `normalizeWord`.
- Produces :
```ts
export interface FinishedGame {
  version: 1; id: string; gameId: ScoreGameId; startedAt: number; finishedAt: number;
  endValue: number; participants: Participant[]; rounds: number[][];
}
export function winners(g: FinishedGame): string[]; // ids des participants de rang 1
export interface PlayerStat { key: string; name: string; played: number; wins: number; pct: number } // pct entier arrondi
export function playerStats(history: FinishedGame[], gameId: ScoreGameId): PlayerStat[];
export function nameConflict(names: string[]): string | null; // premier prénom dont la forme normalisée apparaît deux fois (renvoie l'orthographe de la 2e occurrence)
```
- `playerStats` : une ligne par `normalizeWord(member)` sur tous les `members` des parties de ce jeu ; une victoire d'équipe compte pour chaque membre ; `name` = orthographe dans la partie au `finishedAt` le plus récent ; tri par `wins` décroissant, puis `pct` décroissant, puis `name`.

- [ ] **Step 1: Write the failing tests**
  - `Léa et léa sont la même personne` : deux parties, avec « Léa » puis « léa » ⇒ une seule ligne, `played: 2`, `name: 'léa'` (la plus récente).
  - `accents et espaces ignorés` : « Inès » et « ines  » ⇒ même clé.
  - `ex æquo en tête : victoire pour chacun`.
  - `Belote : la victoire de l'équipe compte pour ses deux joueurs`.
  - `tri et pourcentage` : 8/12 ⇒ `pct 67`, avant 3/9 ⇒ `33`.
  - `seules les parties du jeu demandé comptent`.
  - `nameConflict(['Léa', 'Tom', 'lea']) === 'lea'` ; `nameConflict(['Léa', 'Tom']) === null`.
- [ ] **Step 2: Run** `npx vitest run src/games/scores/logic/stats.test.ts` → FAIL.
- [ ] **Step 3: Implement** `stats.ts`.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(scores): bilans par joueur`

---

### Task 4: Session (feuille en cours, historique, réglages)

**Files:**
- Create: `src/games/scores/session.ts`, `src/games/scores/session.test.ts`

**Interfaces:**
- Consumes : `Sheet`, `createSheet` (Task 2) ; `FinishedGame` (Task 3) ; `scoreGameById` ; `load` / `save` / `remove` ; `navigate` ; `uid`.
- Produces :
```ts
export const currentSheet: Writable<Sheet | null>;      // sauvegardé sous 'scores:current' à chaque changement (supprimé si null)
export const scoreHistory: Writable<FinishedGame[]>;     // 'scores:history', initialisé par loadHistory()
export function loadSavedSheet(): Sheet | null;
export function loadHistory(): FinishedGame[];
export function endValueFor(gameId: ScoreGameId): number;            // 'scores:settings'[gameId] si valide (bornes de la fiche), sinon défaut
export function startSheet(s: Sheet): void;   // currentSheet.set, mémorise endValue, navigate('/scores/partie')
export function finishSheet(now: number): FinishedGame | null; // null si 0 manche complète ; sinon ajoute à l'historique (sans pending), vide la feuille, navigate('/scores/resultat', { id })
export function abandonSheet(): void;          // vide la feuille, rien dans l'historique
export function rememberEndValue(gameId: ScoreGameId, v: number): void;
export function deleteFinished(id: string): void;
export function replay(g: FinishedGame, now: number): void; // startSheet(createSheet(même jeu, mêmes participants avec nouveaux ids, même endValue))
```
- Au chargement du module, `currentSheet` part de `loadSavedSheet()`.
- `loadSavedSheet` : `null` sauf si `version === 1`, `gameId` connu, `participants` non vide, `rounds` = tableaux de nombres de la bonne longueur, `pending` de la bonne longueur. `loadHistory` : écarte chaque entrée qui ne vérifie pas les mêmes règles (sans `pending`).
- `startSheet` met aussi à jour `endValueFor`. `SheetScreen` appelle `currentSheet.update` pour toute modification de valeur de fin, et la mémorise par la même fonction interne `rememberEndValue(gameId, v)` (exportée).

- [ ] **Step 1: Write the failing tests**
  - `startSheet enregistre et navigue` : `location.hash === '#/scores/partie'`, `loadSavedSheet()` égal à la feuille.
  - `finishSheet enregistre les manches complètes seulement` *(Review Focus 2)* : 2 manches + `pending` partiel ⇒ l'entrée a 2 manches et aucun `pending` ; `get(currentSheet) === null` ; le hash commence par `#/scores/resultat?id=`.
  - `finishSheet sans manche complète ne fait rien et renvoie null`.
  - `abandonSheet n'écrit rien dans l'historique`.
  - `les prénoms restent ceux du lancement` *(Review Focus 3)* : après `startSheet`, `players.set([])` puis `finishSheet` ⇒ l'historique contient « Léa ».
  - `données corrompues ignorées` *(Review Focus 4)* : `save('scores:current', { version: 2 })` ⇒ `loadSavedSheet() === null` ; `save('scores:history', [valide, { foo: 1 }, null])` ⇒ `loadHistory()` de longueur 1.
  - `endValueFor` : défaut 100 pour Skyjo ; après `startSheet` avec 150 ⇒ 150 ; valeur hors bornes sauvegardée ⇒ défaut.
  - `deleteFinished` retire l'entrée et sauvegarde.
  - `replay` démarre une feuille vide du même jeu, mêmes noms, même `endValue`.
- [ ] **Step 2: Run** `npx vitest run src/games/scores/session.test.ts` → FAIL.
- [ ] **Step 3: Implement** `session.ts` (même schéma que `src/games/undercover/session.ts`).
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(scores): feuille en cours et historique persistés`

---

### Task 5: Pavé, tampon de saisie, tableau, pas du Stepper

**Files:**
- Create: `src/games/scores/logic/keypad.ts` (+ test), `src/games/scores/ui/Keypad.svelte`, `src/games/scores/ui/ScoreTable.svelte`, `src/games/scores/ui/ScoreTable.test.ts`
- Modify: `src/lib/ui/Stepper.svelte` (prop `step = 1`)

**Interfaces:**
- Produces :
```ts
// logic/keypad.ts
export type Key = '0'|'1'|'2'|'3'|'4'|'5'|'6'|'7'|'8'|'9'|'±'|'⌫';
export interface Buffer { text: string; replace: boolean } // replace : la prochaine touche chiffre remplace le texte (suggestion Belote)
export function applyKey(b: Buffer, k: Key): Buffer;
export function bufferValue(b: Buffer): number; // '' ou '-' ⇒ 0
```
```svelte
<!-- Keypad.svelte -->
props: { onkey: (k: Key) => void; onnext: () => void }
<!-- ScoreTable.svelte -->
props: { participants: Participant[]; rounds: number[][]; pending?: (number | null)[];
         cursor?: Cell | null; draft?: string; onselect?: (c: Cell) => void }
```
- `applyKey` : un chiffre ajoute (ou remplace si `replace`) ; 5 chiffres au plus ; les zéros de tête sont retirés (« 07 » ⇒ « 7 ») ; `±` bascule le signe `-` en tête (y compris sur vide ⇒ `-`) ; `⌫` retire le dernier caractère, ou vide le texte si `replace`. Toute touche remet `replace` à `false`.
- `Keypad` : grille 3 × 4 `1 2 3 / 4 5 6 / 7 8 9 / ± 0 ⌫`, puis un bouton pleine largeur « Suivant » (`BigButton variant="pop"`) ; `tap()` à chaque touche ; libellés accessibles `'Changer le signe'` pour ±, `'Effacer'` pour ⌫.
- `ScoreTable` : en-têtes `M1 … Mn` (+ la colonne de la manche entamée si `pending` est fourni), colonne « Total » des manches complètes. La cellule `cursor` affiche `draft` (ou « · » si vide) et porte `aria-current="true"`. Une cellule dans `rounds` ou `pending` non nulle est un bouton qui appelle `onselect` (rien si `onselect` absent ⇒ lecture seule). Noms et total restent visibles quand les manches défilent horizontalement (`position: sticky`). La colonne du curseur défile pour rester visible (`scrollIntoView({ inline: 'nearest' })` après mise à jour).
- `Stepper` : `step(d)` utilise `d * step` ; aucun changement de rendu pour les usages existants.

- [ ] **Step 1: Write the failing tests**
  - `keypad.test.ts` *(Review Focus 5)* : « 1,2 » ⇒ `'12'` ; 12 chiffres ⇒ 5 chiffres ; `±` puis « 5 » ⇒ `'-5'`, valeur -5 ; `'-'` ⇒ valeur 0 ; `⌫` sur vide ⇒ vide ; `{ text: '62', replace: true }` + « 8 » ⇒ `'8'` ; `{ text: '62', replace: true }` + `⌫` ⇒ `''` ; « 0, 7 » ⇒ `'7'`.
  - `ScoreTable.test.ts` : affiche les totaux des manches complètes seulement ; un clic sur une cellule remplie appelle `onselect({ round: 0, index: 1 })` ; la cellule du curseur affiche le brouillon et a `aria-current` ; sans `onselect`, aucune cellule n'est un bouton.
- [ ] **Step 2: Run** `npx vitest run src/games/scores` → FAIL sur les nouveaux tests.
- [ ] **Step 3: Implement** `keypad.ts`, `Keypad.svelte`, `ScoreTable.svelte`, la prop `step` du `Stepper`.
- [ ] **Step 4: Run** `npx vitest run src/games/scores src/lib/ui` → PASS.
- [ ] **Step 5: Commit** `feat(scores): pavé numérique et tableau de scores`

---

### Task 6: Écran de la feuille et classement

**Files:**
- Create: `src/games/scores/screens/SheetScreen.svelte` (+ `SheetScreen.test.ts`), `src/games/scores/screens/Result.svelte` (+ `Result.test.ts`)

**Interfaces:**
- Consumes : tout ce qui précède ; `PodiumView`, `TEAM_COLORS`, `keepAwake` / `releaseAwake`, `Stepper`, `BigButton`.
- Produces : `SheetScreen` (sans props : lit `currentSheet` ; s'il est `null`, `navigate('/scores')`). `Result` props `{ id: string }`.

Comportement de `SheetScreen` :
- En-tête : surtitre = nom du jeu, titre = `Manche ${rounds.length + 1}`, couleur du jeu, retour vers `/scores` (la feuille reste en cours), bouton « ⋯ » (`IconButton`, libellé `'Options'`).
- `ScoreTable` avec `pending`, `cursor(s)` et le brouillon ; `onselect` ⇒ `select`. Sous le tableau : `progressLine`. Puis le `Keypad`.
- Tampon local `Buffer`. À chaque changement de curseur, le tampon prend `{ text: String(suggestion), replace: true }` si `suggestion` n'est pas `null`, sinon `{ text: '', replace: false }`. Quand on sélectionne une cellule déjà remplie, le tampon est vide. « Suivant » ⇒ `enter(bufferValue)`.
- Après un `enter` qui complète une manche : si `endReached`, afficher la feuille de fin (titre `endMessage`, `BigButton pop` « Voir le classement » ⇒ `finishSheet(Date.now())`, `BigButton secondary` « Continuer la feuille » ⇒ fermer). Elle revient à chaque nouvelle manche complète tant que la condition tient (aucun état stocké).
- Menu « ⋯ » (feuille du bas, même style que les `PauseSheet` existantes) :
  - « Modifier la fin de partie » : `Stepper` (bornes et pas de la fiche, format `endLabel`), qui met à jour `endValue` et appelle `rememberEndValue`.
  - « Supprimer la dernière manche » ⇒ `removeLast` (désactivé sans manche entamée ni complète).
  - « Terminer la partie » (désactivé si `rounds.length === 0`) ⇒ confirmation « Terminer la partie ? Elle sera enregistrée dans l'historique. », complétée par « La manche en cours ne sera pas comptée. » si `hasPending`, puis « Oui, terminer » ⇒ `finishSheet`.
  - « Abandonner la partie » ⇒ confirmation « Abandonner la partie ? Rien ne sera enregistré. », puis « Oui, abandonner » ⇒ `abandonSheet()` et `navigate('/scores')`.
- `keepAwake()` au montage, `releaseAwake()` au démontage.

`Result` : lit l'entrée `id` dans `scoreHistory` (absente ⇒ `navigate('/scores')`) ; `PodiumView` avec `ranking` = participants triés par rang (`ranks(def, totals)`), `color = TEAM_COLORS[i % TEAM_COLORS.length]` dans l'ordre des participants ; `onreplay` ⇒ `replay(entry, Date.now())` ; `onhome` ⇒ `navigate('/')`.

- [ ] **Step 1: Write the failing tests**
  - `SheetScreen.test.ts` (feuille Skyjo Léa / Tom / Inès posée dans `currentSheet`) :
    - `taper 1, 2, Suivant remplit Léa et passe à Tom` : `get(currentSheet)!.pending[0] === 12`.
    - `Suivant sur vide vaut 0`.
    - `toucher une cellule passée puis taper corrige la valeur`.
    - `la fin atteinte propose le classement` : manche à 100 pour Inès ⇒ texte « Inès a atteint 100 ! » ; « Continuer la feuille » ferme la feuille de fin ; la manche suivante complétée la rouvre.
    - `Belote : 162 − x est proposé et accepté par Suivant` : 100 pour l'équipe 1, puis Suivant ⇒ `rounds[0] == [100, 62]`.
    - `Belote : taper un chiffre remplace la proposition`.
    - `Terminer est désactivé sans manche complète` *(Review Focus 2)*.
    - `Abandonner vide la feuille et revient au sous-menu`.
  - `Result.test.ts` : `Skyjo : le plus petit total est en tête` (titre « Tom ! ») ; « Rejouer » démarre une nouvelle feuille vide avec les mêmes noms.
- [ ] **Step 2: Run** `npx vitest run src/games/scores/screens` → FAIL.
- [ ] **Step 3: Implement** `SheetScreen.svelte` et `Result.svelte`.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(scores): saisie de la feuille et classement`

---

### Task 7: Sous-menu et préparation

**Files:**
- Create: `src/games/scores/screens/Menu.svelte` (+ test), `src/games/scores/screens/Setup.svelte` (+ test)

**Interfaces:**
- Consumes : `scoreGames`, `currentSheet`, `abandonSheet`, `startSheet`, `endValueFor`, `createSheet`, `nameConflict`, `players`, `addPlayer`, `uid`, `Stepper`, `Pills`.
- Produces : `Menu` (sans props) ; `Setup` props `{ gameId: string }` (inconnu ⇒ `navigate('/scores')`).

`Menu` (`Screen` couleur `hipster`, titre « Feuille de score », retour vers `/`) :
- Si une feuille est en cours : carte « Reprendre : <jeu> », avec en dessous `Manche N · <prénom total – prénom total…>` (totaux des manches complètes, `fmt`) ⇒ `navigate('/scores/partie')`.
- Les 5 jeux en lignes (pastille de couleur, nom, chevron). Toucher un jeu :
  - sans feuille en cours ⇒ `navigate('/scores/nouvelle', { jeu: id })` ;
  - avec une feuille en cours ⇒ confirmation « La partie de <jeu> en cours sera abandonnée. », avec « Abandonner et commencer » (⇒ `abandonSheet()` puis navigation) et « Annuler ».
- En bas : `BigButton secondary` « Historique et bilans » ⇒ `navigate('/scores/historique')`.

`Setup` (`Screen` couleur du jeu, surtitre « Feuille de score », titre = nom du jeu, retour vers `/scores`) :
- Liste des joueurs de la soirée, chacun avec une case à cocher (`role="checkbox"`, libellé = prénom), **tous cochés à l'ouverture**. Champ « Ajouter un joueur » avec bouton « Ajouter » ⇒ `addPlayer` et case cochée.
- Belote : sous chaque joueur coché, des `Pills` « Équipe 1 / Équipe 2 » (répartition par défaut en alternance dans l'ordre de la liste).
- `Stepper` de fin (`endValueFor`, bornes et pas de la fiche, format `endLabel`).
- Message d'erreur (le premier qui s'applique) et bouton « C'est parti » (`BigButton pop`, désactivé tant qu'il y a une erreur) :
  - `nameConflict` ⇒ « Deux joueurs s'appellent <prénom> : ajoute une initiale. »
  - Belote, cochés ≠ 4 ⇒ « La belote se joue à 4 joueurs. »
  - Belote, équipes ≠ 2 + 2 ⇒ « Chaque équipe doit avoir 2 joueurs. »
  - cochés < `minPlayers` ⇒ « Il faut au moins 2 joueurs. »
- « C'est parti » ⇒ `startSheet(createSheet(...))`. Participants : un par joueur coché (`members: [name]`), ou pour la Belote deux équipes `name: 'Léa & Tom'`, `members: ['Léa','Tom']`. Ids via `uid('s')`.

- [ ] **Step 1: Write the failing tests**
  - `Menu.test.ts` : liste les 5 noms ; sans feuille, toucher « Skyjo » ⇒ hash `#/scores/nouvelle?jeu=skyjo` ; avec une feuille Flip 7, la carte « Reprendre : Flip 7 » est affichée et toucher « Skyjo » montre « La partie de Flip 7 en cours sera abandonnée. ».
  - `Setup.test.ts` : 3 joueurs tous cochés ⇒ « C'est parti » actif et lance une feuille à 3 participants avec `endValue` 100 ; décocher deux joueurs ⇒ « Il faut au moins 2 joueurs. » ; joueurs « Léa » et « lea » ⇒ message de conflit ; Belote avec 4 joueurs ⇒ participants `'Joueur1 & Joueur3'` et `'Joueur2 & Joueur4'` ; Belote avec 5 cochés ⇒ « La belote se joue à 4 joueurs. ».
- [ ] **Step 2: Run** `npx vitest run src/games/scores/screens` → FAIL sur les nouveaux tests.
- [ ] **Step 3: Implement** `Menu.svelte` et `Setup.svelte`.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(scores): sous-menu et préparation de partie`

---

### Task 8: Historique, bilans et détail d'une partie

**Files:**
- Create: `src/games/scores/screens/History.svelte` (+ test), `src/games/scores/screens/GameDetail.svelte` (+ test)

**Interfaces:**
- Consumes : `scoreHistory`, `deleteFinished`, `playerStats`, `winners`, `totals`, `scoreGames`, `Pills`, `ScoreTable` (lecture seule).
- Produces : `History` props `{ gameId?: string }` ; `GameDetail` props `{ id: string }`.

`History` (titre « Historique et bilans », retour vers `/scores`) :
- `Pills` des 5 jeux (`short`, valeur = index dans `scoreGames`). Jeu par défaut : `gameId` s'il est fourni, sinon le jeu de la partie terminée la plus récente, sinon Mille Sabords. Changer de pastille met à jour `?jeu=` dans l'URL.
- « Bilans · N parties » (« 1 partie » au singulier), puis une ligne par joueur : `rang. prénom   W victoire(s) / P   pct %`.
- « Parties » : de la plus récente à la plus ancienne. Chaque ligne affiche la date (`toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })`), `prénom total – …` dans l'ordre des participants et « 🏆 <gagnant(s)> » ; un toucher ⇒ `navigate('/scores/historique/partie', { id })`.
- Aucune partie : « Aucune partie de <nom> terminée pour l'instant. »

`GameDetail` : titre = nom du jeu, surtitre = date ; `ScoreTable` en lecture seule ; gagnant(s) ; bouton « Supprimer cette partie » ⇒ confirmation « Supprimer cette partie de l'historique ? » / « Oui, supprimer » ⇒ `deleteFinished` puis `navigate('/scores/historique', { jeu })`. Id inconnu ⇒ `navigate('/scores/historique')`.

- [ ] **Step 1: Write the failing tests**
  - `History.test.ts` : avec 2 Skyjo et 1 Flip 7 ⇒ par défaut le jeu le plus récent ; « Bilans · 2 parties » ; Léa et léa forment une seule ligne ; changer de pastille vers Belote ⇒ « Aucune partie de Belote terminée pour l'instant. ».
  - `GameDetail.test.ts` : affiche les manches et les totaux ; supprimer + confirmer retire l'entrée de `scoreHistory`.
- [ ] **Step 2: Run** `npx vitest run src/games/scores/screens` → FAIL sur les nouveaux tests.
- [ ] **Step 3: Implement** `History.svelte` et `GameDetail.svelte`.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(scores): historique et bilans`

---

### Task 9: Carte sur l'accueil et routes

**Files:**
- Create: `src/games/scores/module.ts`
- Modify: `src/games/registry.ts`, `src/games/registry.test.ts`, `src/screens/Home.svelte`, `src/App.svelte`, `src/App.test.ts`

**Interfaces:**
- Produces : `scores: GameModule = { id: 'scores', name: 'Feuille de score', color: 'hipster', icon: 'edit', players: { min: 2, max: 20 }, status: 'disponible', settings: [], route: '/scores' }`. Le registre devient `[timeup, blindtest, undercover, scores]`.
- `Home.svelte` : note de la carte `scores` = « Partie en cours » si `$currentSheet`, sinon « 5 jeux » (la note Blindtest hors ligne reste inchangée).
- `App.svelte` : routes `/scores` → `Menu`, `/scores/nouvelle` → `Setup gameId={query.jeu}`, `/scores/partie` → `SheetScreen`, `/scores/resultat` → `Result id={query.id}`, `/scores/historique` → `History gameId={query.jeu}`, `/scores/historique/partie` → `GameDetail id={query.id}`. `resumeOffer` n'est pas modifié.

- [ ] **Step 1: Write the failing tests**
  - `registry.test.ts` : l'ordre devient `['timeup', 'blindtest', 'undercover', 'scores']` ; `gameById('scores')` a la route `/scores` et le nom « Feuille de score ».
  - `App.test.ts` : `la carte Feuille de score ouvre le sous-menu` (clic ⇒ « Mille Sabords » visible) ; `une feuille en cours n'ouvre pas la reprise de l'accueil` : feuille posée dans `currentSheet`, accueil ⇒ « Partie en cours » visible et « Une partie est en cours » absent.
- [ ] **Step 2: Run** `npx vitest run src/games/registry.test.ts src/App.test.ts` → FAIL.
- [ ] **Step 3: Implement** `module.ts`, le registre, la note de `Home`, les routes de `App`.
- [ ] **Step 4: Run the whole suite and checks**
  - `npx vitest run` → tous les tests passent.
  - `npm run check` → 0 erreur.
  - `npm run build` → build OK.
- [ ] **Step 5: Verify in the preview** (`preview_start` sur la config de `.claude/launch.json`, viewport mobile) : accueil avec 4 cartes ; une partie de Skyjo à 3 joueurs sur 2 manches, avec une correction ; rechargement de la page ⇒ feuille identique ; fin à 100 ⇒ podium ; historique et bilans à jour ; Belote avec le complément à 162. Capture d'écran de la feuille et de l'historique.
- [ ] **Step 6: Commit** `feat(scores): carte Feuille de score sur l'accueil`
