# Bamboche — Undercover : plan de mise en œuvre

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** rendre Undercover jouable dans Bamboche : distribution secrète des mots, manches de parole, vote à voix haute, révélation, Mr White facultatif, série de parties avec scores cumulés et podium, reprise après fermeture.

**Architecture :** même schéma que Time Up et Blindtest. Les règles sont des fonctions pures sur un état unique `UndercoverState` (série + partie en cours), testées avec Vitest. `session.ts` tient l'état dans un store sauvegardé à chaque changement. `UndercoverApp.svelte` (préparation) et `Play.svelte` (partie) ne font que lire l'état et appeler les fonctions pures. L'affichage d'un mot secret n'est **jamais** dans l'état sauvegardé : c'est un état local d'écran, qui repart toujours sur « Passe le téléphone à… ».

**Tech Stack :** l'existant (Svelte 5, Vite, TypeScript, Vitest + jsdom + @testing-library/svelte). Aucune dépendance nouvelle.

**Spec :** `docs/superpowers/specs/2026-11-15-undercover-design.md` (et `2026-11-15-bamboche-design.md` §3 et §6 pour la charte et les contraintes générales).

## Global Constraints

- Toutes les contraintes globales des plans Time Up et Blindtest s'appliquent : textes en français, cibles ≥ 56 px, **un seul bouton jaune (`pop`) par écran**, bouton nuit sur les écrans pleine couleur, clés `bamboche:v1:` via `lib/storage`, routage par hash, icônes SVG de `lib/ui/icons`, aucune erreur si vibration / Wake Lock absents.
- Couleur du jeu : Undercover `#A98BFF` / ombre `#6E4FD6` (`undercover` dans les tokens). Tous les écrans du jeu prennent cette couleur.
- Composition : **1 undercover**, **Mr White 0 ou 1** (défaut : Non, mémorisé). Minimum **3 joueurs sans Mr White, 4 avec** ; maximum 20.
- Barème : civils gagnants **+2** chacun (éliminés compris) ; undercover gagnant **+10** ; Mr White gagnant **+6** ; un imposteur éliminé ne marque rien.
- Le mot d'un joueur ne s'affiche qu'après son geste « C'est moi, voir mon mot » ; le rôle n'est jamais affiché aux civils / à l'undercover pendant la distribution ; le mot des civils n'est jamais affiché avant l'écran de fin de partie.
- Pas d'annulation d'élimination ; confirmation « Éliminer <nom> ? » avant chaque élimination.

## Review Focus

1. **Fermeture ou rechargement pendant qu'un mot est affiché** → à la réouverture, l'écran « Passe le téléphone à <même joueur> », jamais le mot. *(Tests : Task 3 `loadSavedUndercover` sur un état `deal` ; Task 5 `Deal.test` « le mot n'est pas dans le DOM au premier rendu ».)*
2. **Double tap sur « Oui, éliminer » ou sur Trouvé / Raté** → une seule élimination, un seul calcul de points. *(Test : Task 2 `eliminate` et `mrWhiteGuess` ignorés hors de leur phase.)*
3. **Joueur renommé ou supprimé de la liste de la soirée pendant une série** → la série garde ses joueurs et leurs noms jusqu'au podium. *(Test : Task 2 `createSeries` copie les noms ; Task 3 la reprise ne relit pas `players`.)*
4. **Longue soirée qui épuise les paires** → on repart de la liste complète au lieu de planter ou de rejouer la même paire deux fois de suite. *(Test : Task 1 `drawPair`.)*
5. **Mr White éliminé avec un mot raté alors qu'il ne reste que 2 civils et l'undercover** → la partie continue (pas de fin prématurée) ; et Mr White qui trouve le mot l'emporte même si les civils auraient gagné par ailleurs. *(Test : Task 2 `mrWhiteGuess`.)*

---

## Structure des fichiers

```
src/games/undercover/words.json             ~150 paires { "a", "b" }
src/games/undercover/words.test.ts          pas de doublon, pas de paire a == b
src/games/undercover/logic/pairs.ts         tirage d'une paire non jouée
src/games/undercover/logic/game.ts          types, règles, barème, série (pur)
src/games/undercover/setup.ts               choix Mr White mémorisé, validation de la préparation
src/games/undercover/session.ts             store de la série, sauvegarde, reprise, abandon
src/games/undercover/UndercoverApp.svelte   préparation (écran « Qui joue ? »)
src/games/undercover/Play.svelte            partie → fin → scores → podium
src/games/undercover/screens/Setup.svelte
src/games/undercover/screens/Deal.svelte          passe le téléphone + mot secret (distribution et « revoir son mot »)
src/games/undercover/screens/Talk.svelte          manche : qui commence, ordre de parole
src/games/undercover/screens/Vote.svelte          qui est éliminé + confirmation
src/games/undercover/screens/Reveal.svelte        rôle de l'éliminé
src/games/undercover/screens/MrWhiteGuess.svelte  Trouvé / Raté
src/games/undercover/screens/GameEnd.svelte       camp gagnant, mots, rôles, points gagnés
src/games/undercover/screens/Scores.svelte        scores cumulés de la série
src/games/undercover/screens/PauseSheet.svelte    reprendre, revoir son mot, scores, quitter
Modifiés : src/games/undercover/module.ts, src/games/registry.test.ts, src/App.svelte, README.md
```

---

### Task 1 : paires de mots et tirage

**Files :**
- Create : `src/games/undercover/words.json`, `src/games/undercover/logic/pairs.ts`
- Test : `src/games/undercover/words.test.ts`, `src/games/undercover/logic/pairs.test.ts`

**Interfaces :**
- Produces :
  - `export interface WordPair { a: string; b: string }` (dans `pairs.ts`)
  - `export function drawPair(count: number, used: readonly number[], rng?: Rng): { index: number; used: number[] }` — `index` d'une paire absente de `used` ; `used` renvoyé = `used` + `index`. Si toutes les paires sont dans `used`, repart de zéro (`used` renvoyé = `[index]`) en évitant si possible la dernière paire jouée (`used.at(-1)`).

- [ ] **Step 1 : écrire `words.test.ts`**

```ts
import { normalizeWord } from '../../lib/normalize';
import words from './words.json';

test('au moins 120 paires', () => expect(words.length).toBeGreaterThanOrEqual(120));
test('chaque paire a deux mots non vides et différents', () => {
  for (const p of words) {
    expect(p.a.trim()).not.toBe('');
    expect(p.b.trim()).not.toBe('');
    expect(normalizeWord(p.a)).not.toBe(normalizeWord(p.b));
  }
});
test('aucune paire en double (accents, majuscules et ordre ignorés)', () => {
  const keys = words.map((p) => [normalizeWord(p.a), normalizeWord(p.b)].sort().join('|'));
  expect(new Set(keys).size).toBe(keys.length);
});
```

- [ ] **Step 2 : écrire `pairs.test.ts`** (RNG `seq` de `lib/test-rng`)

```ts
test('tire une paire non jouée et l’ajoute à used', () => {
  const r = drawPair(4, [0, 2], seq(0));
  expect([1, 3]).toContain(r.index);
  expect(r.used).toEqual([0, 2, r.index]);
});
test('toutes jouées : repart de zéro sans rejouer la dernière', () => {
  for (const v of [0, 0.3, 0.6, 0.99]) {
    const r = drawPair(3, [0, 1, 2], seq(v));
    expect(r.index).not.toBe(2);
    expect(r.used).toEqual([r.index]);
  }
});
test('une seule paire : elle revient', () => expect(drawPair(1, [0], seq(0)).index).toBe(0));
```

- [ ] **Step 3 : lancer** `npx vitest run src/games/undercover` → ÉCHEC (fichiers absents).

- [ ] **Step 4 : écrire `words.json`** : environ 150 paires `{ "a": "Plage", "b": "Piscine" }`, mots français courants, tous publics, proches mais distincts (même catégorie, assez de recouvrement pour bluffer : café / thé, chat / chien, guitare / violon, ski / snowboard…). Une majuscule initiale, pas d'article.

- [ ] **Step 5 : écrire `pairs.ts`** (`drawPair`, `WordPair`) avec `lib/random`.

- [ ] **Step 6 : lancer** `npx vitest run src/games/undercover` → OK.

- [ ] **Step 7 : commit** `feat(undercover): paires de mots et tirage`

---

### Task 2 : règles du jeu et série

**Files :**
- Create : `src/games/undercover/logic/game.ts`
- Test : `src/games/undercover/logic/game.test.ts`

**Interfaces :**
- Consumes : `drawPair`, `WordPair` (Task 1) ; `Rng`, `shuffle` (`lib/random`).
- Produces (tout exporté depuis `game.ts`) :

```ts
export type Role = 'civil' | 'undercover' | 'mrwhite';
export type Winner = 'civils' | 'imposteurs' | 'mrwhite';
export type Phase = 'deal' | 'talk' | 'vote' | 'reveal' | 'mrwhite' | 'end' | 'scores' | 'podium';
export const POINTS: { civil: 2; undercover: 10; mrwhite: 6 };

export interface UndercoverState {
  version: 1;
  players: { id: string; name: string }[]; // copie figée au lancement, ordre de la liste
  mrWhite: boolean;
  totals: Record<string, number>;          // cumul de la série, toutes les clés présentes dès le départ
  usedPairs: number[];
  gameNumber: number;                      // 1 pour la première partie
  pairIndex: number;
  civilWord: string;
  undercoverWord: string;
  roles: Record<string, Role>;
  eliminated: string[];                    // dans l'ordre d'élimination
  phase: Phase;
  dealIndex: number;                       // index dans players du prochain joueur à voir son mot
  round: number;                           // 1 pour la première manche
  firstSpeaker: string | null;
  winner: Winner | null;
  gained: Record<string, number>;          // points de la dernière partie terminée
}

export function composition(n: number, mrWhite: boolean): { civils: number; undercover: 1; mrWhite: 0 | 1 };
export function createSeries(players: { id: string; name: string }[], mrWhite: boolean, pairs: readonly WordPair[], rng?: Rng): UndercoverState;
export function wordOf(s: UndercoverState, playerId: string): string | null; // null pour Mr White
export function seeWord(s: UndercoverState): UndercoverState;          // deal : dealIndex+1 ; après le dernier → talk, round 1
export function alive(s: UndercoverState): string[];                    // ids en jeu, ordre de players
export function speakingOrder(s: UndercoverState): string[];            // alive tourné pour commencer à firstSpeaker
export function toVote(s: UndercoverState): UndercoverState;            // talk → vote
export function toTalk(s: UndercoverState): UndercoverState;            // vote → talk (retour)
export function eliminate(s: UndercoverState, id: string): UndercoverState; // vote → reveal ; ignoré sinon ou si id pas en jeu
export function lastEliminated(s: UndercoverState): string | null;
export function afterReveal(s: UndercoverState, rng?: Rng): UndercoverState; // reveal → mrwhite | end | talk (manche suivante)
export function mrWhiteGuess(s: UndercoverState, found: boolean, rng?: Rng): UndercoverState; // mrwhite → end | talk ; ignoré sinon
export function outcome(roles: Record<string, Role>, eliminated: readonly string[]): Winner | null;
export function points(roles: Record<string, Role>, eliminated: readonly string[], winner: Winner): Record<string, number>;
export function toScores(s: UndercoverState): UndercoverState;          // end → scores
export function nextGame(s: UndercoverState, pairs: readonly WordPair[], rng?: Rng): UndercoverState; // scores → deal, gameNumber+1
export function finishSeries(s: UndercoverState): UndercoverState;      // scores → podium
```

Toutes les fonctions de transition renvoient **le même objet** (`===`) quand elles sont appelées hors de leur phase : c'est ce qui rend le double tap inoffensif.

Règles à appliquer (spec §5) :
- `createSeries` / `nextGame` : `drawPair` sur `usedPairs`, puis pile ou face (`rng() < 0.5`) pour savoir si `a` ou `b` va aux civils ; rôles tirés par `shuffle` des ids : le premier est l'undercover, le second Mr White si `mrWhite`, les autres civils. `phase: 'deal'`, `dealIndex: 0`, `eliminated: []`, `round: 0`, `firstSpeaker: null`, `winner: null`, `gained: {}`. `nextGame` garde `players`, `mrWhite`, `totals`.
- Premier orateur : manche 1 → tiré au hasard (`rng`) parmi les joueurs en jeu qui ne sont pas Mr White. Manches suivantes → en partant du joueur qui suit l'ancien `firstSpeaker` dans `players` (ordre circulaire), le premier en jeu qui n'est pas Mr White.
- `outcome` : undercover et Mr White (s'il existe) tous éliminés → `'civils'` ; sinon s'il reste ≤ 1 civil en jeu → `'imposteurs'` ; sinon `null`.
- `points` : `'civils'` → +2 à chaque civil ; `'imposteurs'` → +10 à l'undercover s'il est en jeu, +6 à Mr White s'il est en jeu ; `'mrwhite'` → +6 à Mr White. Tous les autres à 0 (toutes les clés présentes).
- `afterReveal` : éliminé Mr White → `phase: 'mrwhite'` ; sinon `outcome` → fin (`winner`, `gained = points(...)`, `totals` additionnés, `phase: 'end'`) ou manche suivante (`round+1`, nouveau `firstSpeaker`, `phase: 'talk'`).
- `mrWhiteGuess(found=true)` → fin avec `winner: 'mrwhite'` ; `found=false` → même suite que `afterReveal` pour un non-Mr White (outcome ou manche suivante).

- [ ] **Step 1 : écrire `game.test.ts`** avec un helper qui crée une série à 5 joueurs `p1…p5` et force les rôles (`{ ...s, roles: {...} }`). Tests et assertions :
  - `composition(5, false)` → `{ civils: 4, undercover: 1, mrWhite: 0 }` ; `composition(5, true)` → `{ civils: 3, undercover: 1, mrWhite: 1 }`.
  - `createSeries` : exactement 1 undercover, 0 ou 1 Mr White selon l'option ; `civilWord` et `undercoverWord` sont les deux mots de `pairs[pairIndex]` ; `totals` vaut 0 pour chacun ; `players` est une **copie** (modifier le tableau d'entrée ne change pas l'état).
  - `wordOf` : civil → `civilWord`, undercover → `undercoverWord`, Mr White → `null`.
  - `seeWord` × 5 → `phase: 'talk'`, `round: 1`, `firstSpeaker` non Mr White ; un 6e appel ne change rien (`===`).
  - Premier orateur jamais Mr White : avec Mr White en `p1` et `seq(0)`, `firstSpeaker !== 'p1'`.
  - Manche suivante (undercover `p5`, pas de Mr White) : premier orateur `p2`, `p3` éliminé (civil, pas de fin) → `afterReveal` donne `firstSpeaker: 'p4'` ; `speakingOrder` = `['p4','p5','p1','p2']`.
  - Ancien premier orateur éliminé : `firstSpeaker: 'p2'`, `p2` éliminé → la manche suivante commence à `p3`.
  - `eliminate` hors phase `vote`, ou sur un joueur déjà éliminé → `===` ; deux appels de suite → un seul ajout dans `eliminated`.
  - `outcome` : undercover éliminé, pas de Mr White → `'civils'` ; 5 joueurs, 3 civils éliminés → `'imposteurs'` ; undercover éliminé mais Mr White en jeu avec 2 civils → `null`.
  - `points` : victoire des civils → chaque civil 2 (éliminés compris), undercover 0 ; imposteurs avec undercover et Mr White en jeu → 10 et 6 ; imposteurs avec Mr White éliminé → undercover 10, Mr White 0.
  - Fin : `totals` additionnés, `gained` égal aux points, `phase: 'end'` ; `afterReveal` rappelé → `===`.
  - Mr White : élimination de Mr White → `afterReveal` → `phase: 'mrwhite'` ; `mrWhiteGuess(true)` → `winner: 'mrwhite'`, +6 pour lui seul ; `mrWhiteGuess(false)` avec 3 civils et l'undercover en jeu → `phase: 'talk'`, `round` +1 ; `mrWhiteGuess` rappelé → `===`.
  - Série : `toScores` puis `nextGame` → `gameNumber: 2`, `totals` conservés, `usedPairs` de longueur 2, nouveau `pairIndex` différent, `phase: 'deal'` ; `finishSeries` → `phase: 'podium'`.
- [ ] **Step 2 : lancer** `npx vitest run src/games/undercover/logic/game.test.ts` → ÉCHEC.
- [ ] **Step 3 : implémenter `game.ts`** (signatures ci-dessus).
- [ ] **Step 4 : lancer** → OK, puis `npm run check` → 0 erreur.
- [ ] **Step 5 : commit** `feat(undercover): règles, barème et série`

---

### Task 3 : préparation et session

**Files :**
- Create : `src/games/undercover/setup.ts`, `src/games/undercover/session.ts`
- Test : `src/games/undercover/setup.test.ts`, `src/games/undercover/session.test.ts`

**Interfaces :**
- Consumes : `UndercoverState`, `composition`, `alive` (Task 2) ; `load`, `save`, `remove` ; `setActiveGame` ; `navigate`.
- Produces :
  - `setup.ts` : `export const mrWhiteOn: Writable<boolean>` (clé `undercover:mrwhite`, défaut `false`, toute valeur non booléenne → `false`) ; `export function validateSetup(playerCount: number, mrWhite: boolean): { ok: boolean; error: string | null }`.
  - `session.ts` : `export const ucGame: Writable<UndercoverState | null>` (sauvegardé sous `undercover:game` à chaque valeur non nulle) ; `export function startUndercover(s: UndercoverState): void` (set, `setActiveGame('undercover')`, `navigate('/undercover/partie')`) ; `export function loadSavedUndercover(): UndercoverState | null` ; `export function abandonUndercover(): void` ; `export function resumeLines(s: UndercoverState): string[]`.

Messages exacts de `validateSetup` : moins de 3 joueurs → `"Il faut au moins 3 joueurs."` ; Mr White avec moins de 4 → `"Avec Mr White, il faut au moins 4 joueurs."` ; plus de 20 → `"20 joueurs maximum."`.

`resumeLines` : `["Undercover · Partie <gameNumber>", "<n> joueurs en jeu"]` pendant `deal`…`mrwhite` ; `["Undercover · Partie <gameNumber>", "Scores de la série"]` pendant `end`, `scores`, `podium`.

- [ ] **Step 1 : écrire les tests**
  - `validateSetup(2, false)` → erreur 3 joueurs ; `(3, false)` OK ; `(3, true)` → erreur Mr White ; `(4, true)` OK ; `(21, false)` → erreur 20.
  - `mrWhiteOn` relit `true` sauvegardé ; relit `false` si la valeur stockée vaut `"oui"`.
  - `loadSavedUndercover` : rend l'état sauvegardé par `ucGame.set(s)` ; `null` si `version !== 1`, si `phase` inconnue, si `players` n'est pas un tableau, si `dealIndex` hors bornes en phase `deal`.
  - **Reprise pendant la distribution** : état `phase: 'deal', dealIndex: 2` sauvegardé → relu identique (aucun champ « mot affiché » n'existe à sauvegarder).
  - La reprise ne relit pas la liste globale : `players.set([])` après la sauvegarde → l'état relu garde ses 5 joueurs et leurs noms.
  - `abandonUndercover` : `ucGame` null, clé supprimée, `getActiveGame()` null.
  - `resumeLines` pour un état en `talk` avec 1 éliminé sur 5 → `["Undercover · Partie 1", "4 joueurs en jeu"]`.
- [ ] **Step 2 : lancer** `npx vitest run src/games/undercover` → ÉCHEC.
- [ ] **Step 3 : implémenter** `setup.ts` et `session.ts` sur le modèle de `blindtest/setup.ts` et `blindtest/session.ts`.
- [ ] **Step 4 : lancer** → OK.
- [ ] **Step 5 : commit** `feat(undercover): préparation, sauvegarde et reprise`

---

### Task 4 : écran « Qui joue ? » et préparation

**Files :**
- Create : `src/games/undercover/screens/Setup.svelte`, `src/games/undercover/UndercoverApp.svelte`
- Test : `src/games/undercover/screens/Setup.test.ts`

**Interfaces :**
- Consumes : `players` ; `mrWhiteOn`, `validateSetup` ; `composition` ; `createSeries` ; `startUndercover` ; `words.json`.
- Produces : `Setup.svelte` props `{ onstart: () => void; onback: () => void }` ; `UndercoverApp.svelte` props `{ onhome: () => void }` (rend `Setup`, et `onstart` = `startUndercover(createSeries(get(players), get(mrWhiteOn), words))`).

Contenu de l'écran (`Screen color="undercover" eyebrow="Undercover" title="Qui joue ?"`, retour → `onback`) : liste des noms des joueurs de la soirée ; bouton secondaire « Configurer les joueurs » → `navigate('/joueurs', { retour: '/undercover' })` ; `Pills` libellé « Mr White » avec options Non (0) / Oui (1) liées à `mrWhiteOn` ; ligne de composition `"1 undercover · 1 Mr White · 3 civils"` (sans le segment Mr White quand il est désactivé) ; message d'erreur de `validateSetup` ; bouton jaune **Lancer** désactivé si `!ok`.

- [ ] **Step 1 : écrire `Setup.test.ts`**
  - 5 joueurs, Mr White Non → texte `"1 undercover · 4 civils"`, Lancer activé ; clic sur Lancer → `onstart` appelé.
  - 3 joueurs, clic sur « Oui » → texte `"Avec Mr White, il faut au moins 4 joueurs."`, Lancer désactivé, `get(mrWhiteOn) === true`.
  - 2 joueurs → `"Il faut au moins 3 joueurs."`, Lancer désactivé.
- [ ] **Step 2 : lancer** `npx vitest run src/games/undercover/screens` → ÉCHEC.
- [ ] **Step 3 : implémenter** `Setup.svelte` et `UndercoverApp.svelte`.
- [ ] **Step 4 : lancer** → OK.
- [ ] **Step 5 : commit** `feat(undercover): écran de préparation`

---

### Task 5 : distribution secrète

**Files :**
- Create : `src/games/undercover/screens/Deal.svelte`
- Test : `src/games/undercover/screens/Deal.test.ts`

**Interfaces :**
- Produces : `Deal.svelte` props `{ name: string; word: string | null; onseen: () => void; doneLabel?: string }` (défaut `doneLabel = "J'ai retenu"`). État local `shown = false`.
  - `shown === false` : `TransitionScreen` couleur `var(--undercover)`, eyebrow « Passe le téléphone à », titre = `name`, sous-titre « Les autres, on ne regarde pas ! », bouton « C'est moi, voir mon mot » → `shown = true`.
  - `shown === true`, `word !== null` : label « Ton mot », le mot en taille géante, bouton `doneLabel` → `onseen()`.
  - `shown === true`, `word === null` : titre « Mr White », texte « Tu n'as pas de mot. Écoute et bluffe ! », bouton « J'ai compris » → `onseen()`.
  - Aucune transition Svelte de sortie sur le mot (il doit disparaître à l'instant du tap). Le parent enveloppe `Deal` dans `{#key playerId}` pour que chaque joueur reparte de `shown = false`.

- [ ] **Step 1 : écrire `Deal.test.ts`**
  - Premier rendu `{ name: 'Léa', word: 'Plage' }` → `Léa` présent, `queryByText('Plage')` **null**.
  - Clic « C'est moi, voir mon mot » → `Plage` visible ; clic « J'ai retenu » → `onseen` appelé une fois.
  - `word: null` → après le clic, `Tu n'as pas de mot. Écoute et bluffe !` visible, aucun mot.
- [ ] **Step 2 : lancer** → ÉCHEC. **Step 3 : implémenter.** **Step 4 : lancer** → OK.
- [ ] **Step 5 : commit** `feat(undercover): distribution secrète des mots`

---

### Task 6 : écrans de manche (parole, vote, révélation, Mr White)

**Files :**
- Create : `src/games/undercover/screens/Talk.svelte`, `Vote.svelte`, `Reveal.svelte`, `MrWhiteGuess.svelte`
- Test : `src/games/undercover/screens/Vote.test.ts`, `src/games/undercover/screens/Talk.test.ts`

**Interfaces :**
- Produces :
  - `Talk.svelte` `{ round: number; order: { id: string; name: string }[]; onvote: () => void; onpause: () => void }` — titre `"Manche <round>"`, grand texte `"<premier nom> commence"`, liste numérotée de `order`, bouton jaune « Passer au vote », bouton icône Pause dans l'en-tête.
  - `Vote.svelte` `{ candidates: { id: string; name: string }[]; onconfirm: (id: string) => void; onback: () => void; onpause: () => void }` — titre « Qui est éliminé ? », une grosse touche par candidat (grille 2 colonnes) ; un tap ouvre la confirmation `"Éliminer <nom> ?"` avec « Oui, éliminer » (`ko`) et « Annuler » (`secondary`). « Oui, éliminer » appelle `onconfirm(id)` puis se désactive (pas de second appel).
  - `Reveal.svelte` `{ name: string; role: Role; oncontinue: () => void }` — `"<nom> était…"` puis `Civil` / `Undercover` / `Mr White` en géant ; bouton « Continuer ».
  - `MrWhiteGuess.svelte` `{ name: string; onfound: () => void; onmissed: () => void }` — `"<nom> tente le mot des civils"`, consigne « Il le dit à voix haute. Vous jugez. », boutons action `ok` « Trouvé » et `ko` « Raté ». N'affiche aucun mot.

- [ ] **Step 1 : écrire les tests**
  - `Talk` : `order` = Inès, Tom, Léa → texte `"Inès commence"` ; les trois noms dans l'ordre.
  - `Vote` : clic sur Tom → `"Éliminer Tom ?"` ; « Annuler » → retour à la grille sans appel ; Tom puis double clic sur « Oui, éliminer » → `onconfirm` appelé **une fois** avec l'id de Tom.
- [ ] **Step 2 : lancer** → ÉCHEC. **Step 3 : implémenter les quatre écrans.** **Step 4 : lancer** → OK.
- [ ] **Step 5 : commit** `feat(undercover): écrans de manche`

---

### Task 7 : fin de partie, scores de la série, pause

**Files :**
- Create : `src/games/undercover/screens/GameEnd.svelte`, `Scores.svelte`, `PauseSheet.svelte`
- Test : `src/games/undercover/screens/GameEnd.test.ts`, `src/games/undercover/screens/PauseSheet.test.ts`

**Interfaces :**
- Consumes : `UndercoverState`, `Role`, `Winner`, `alive` ; `rankScores` (`lib/ranking`).
- Produces :
  - `GameEnd.svelte` `{ s: UndercoverState; oncontinue: () => void }` — titre selon `winner` : `'civils'` → « Les civils gagnent ! », `'imposteurs'` → « Les imposteurs gagnent ! » (ou « L'undercover gagne ! » / « Mr White gagne ! » s'il n'en reste qu'un en jeu), `'mrwhite'` → « Mr White a trouvé le mot ! » ; les deux mots (« Mot des civils », « Mot de l'undercover ») ; une ligne par joueur : nom, rôle, `+<gained>` ; bouton jaune « Voir les scores ».
  - `Scores.svelte` `{ s: UndercoverState; onnext: () => void; onfinish: () => void }` — titre `"Scores après <gameNumber> partie(s)"`, classement `rankScores` sur `totals` (rang, nom, total, `+<gained>` en regard), bouton jaune « Partie suivante », bouton secondaire « Terminer ».
  - `PauseSheet.svelte` `{ s: UndercoverState; onresume: () => void; onreveal: (id: string) => void; onquit: () => void }` — sur le modèle de `blindtest/screens/PauseSheet.svelte` : « Reprendre » (jaune), « Revoir mon mot » qui déplie la liste des joueurs **en jeu** (tap → `onreveal(id)`), scores de la série, « Quitter la série » avec confirmation « Quitter la série ? Les scores seront perdus. ».

- [ ] **Step 1 : écrire les tests**
  - `GameEnd` : victoire des civils, mots Plage / Piscine → « Les civils gagnent ! », `Plage`, `Piscine`, `+2` pour un civil, `+0` pour l'undercover.
  - `PauseSheet` : « Revoir mon mot » ne liste pas un joueur éliminé ; tap sur Léa → `onreveal('p2')` ; « Quitter la série » puis « Oui, quitter » → `onquit` appelé.
- [ ] **Step 2 : lancer** → ÉCHEC. **Step 3 : implémenter.** **Step 4 : lancer** → OK.
- [ ] **Step 5 : commit** `feat(undercover): fin de partie, scores et pause`

---

### Task 8 : partie complète, routes et mise en service

**Files :**
- Create : `src/games/undercover/Play.svelte`
- Modify : `src/games/undercover/module.ts` (`status: 'disponible'`), `src/games/registry.test.ts` (Undercover disponible, Hipster seul « bientôt »), `src/App.svelte` (routes + reprise), `README.md`
- Test : `src/games/undercover/Play.test.ts`

**Interfaces :**
- Consumes : tout ce qui précède ; `PodiumView` ; `TEAM_COLORS` ; `keepAwake` / `releaseAwake`.
- Produces : routes `#/undercover` → `<UndercoverApp onhome={() => navigate('/')} />`, `#/undercover/partie` → `<Play />`.

`Play.svelte` (modèle : `blindtest/Play.svelte`) :
- Au montage : si `$ucGame` est null, `loadSavedUndercover()` sinon `navigate('/')`. Wake Lock pendant la partie.
- `apply(f)` comme le Blindtest (set seulement si l'objet change).
- Phases : `deal` → `{#key s.players[s.dealIndex].id}<Deal …onseen={() => apply(seeWord)} />` ; `talk` → `Talk` (`order` = `speakingOrder` mappé en noms) ; `vote` → `Vote` (`candidates` = `alive`, `onback` = `toTalk`) ; `reveal` → `Reveal` (`lastEliminated`) ; `mrwhite` → `MrWhiteGuess` ; `end` → `GameEnd` (`oncontinue` = `toScores`) ; `scores` → `Scores` (`onnext` = `nextGame(s, words)`, `onfinish` = `finishSeries`) ; `podium` → `PodiumView` (une entrée par joueur, `color = TEAM_COLORS[i % TEAM_COLORS.length]` selon l'index dans `s.players`, `onreplay` = abandon puis `navigate('/undercover')`, `onhome` = abandon puis `navigate('/')`).
- Pause (depuis `Talk` et `Vote`) : `PauseSheet` par-dessus ; « Revoir mon mot » remplace la pause par `{#key id}<Deal name word doneLabel="C'est bon" onseen={retour à la manche} />` (état local, jamais sauvegardé) ; « Quitter » → `abandonUndercover()` puis `navigate('/')`.

`App.svelte` : dans `resumeOffer()`, branche `active?.gameId === 'undercover'` → `loadSavedUndercover()`, `lines = resumeLines(s)`, `route: '/undercover/partie'`, `abandon: abandonUndercover`.

README : Undercover dans « Jeux disponibles » (Bientôt : Hipster) ; section « Paires de l'Undercover » : `src/games/undercover/words.json`, liste de `{ "a", "b" }`, le test refuse les doublons (accents, majuscules et ordre ignorés).

- [ ] **Step 1 : écrire `Play.test.ts`** (état créé avec `createSeries` puis rôles forcés, posé dans `ucGame`) :
  - Phase `deal` : le nom du premier joueur est affiché, aucun mot de la paire n'est dans le DOM.
  - Parcours court à 3 joueurs `p1` Léa, `p2` Hugo, `p3` Tom (undercover `p3`, sans Mr White) : distribution des trois (clics « C'est moi… » / « J'ai retenu »), « Passer au vote », Tom (`p3`), « Oui, éliminer » → `"Undercover"` affiché ; « Continuer » → « Les civils gagnent ! » ; « Voir les scores » → `get(ucGame).totals` = `{ p1: 2, p2: 2, p3: 0 }`.
- [ ] **Step 2 : mettre à jour `registry.test.ts`** : `Undercover est disponible, route /undercover, 3 joueurs minimum` ; `Hipster est « bientôt »`.
- [ ] **Step 3 : lancer** `npm test` → ÉCHEC sur les nouveaux tests.
- [ ] **Step 4 : implémenter** `Play.svelte`, modifier `module.ts`, `App.svelte`, `README.md`.
- [ ] **Step 5 : lancer** `npm test` → tout passe ; `npm run check` → 0 erreur ; `npm run build` → OK.
- [ ] **Step 6 : vérifier dans le navigateur** (`preview_start` avec la configuration de `.claude/launch.json`, vue mobile 375×812) : accueil → carte Undercover active → partie à 4 joueurs avec Mr White jusqu'au podium ; recharger la page sur un écran de mot → retour sur « Passe le téléphone à <même joueur> » ; recharger en manche → carte de reprise sur l'accueil puis même manche. Aucune erreur console.
- [ ] **Step 7 : commit** `feat(undercover): partie complète et mise en service`
