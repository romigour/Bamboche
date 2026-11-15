# Suppression du pull-to-refresh et bouton de mise à jour — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bloquer le rechargement par glissement et ajouter dans Réglages › Préférences un bouton « Rechercher une mise à jour » qui installe la nouvelle version de la PWA, avec la version affichée.

**Architecture:** `overscroll-behavior` passe sur `html`. La PWA passe en `registerType: 'prompt'`. Un module `src/lib/update.ts` (store + `initUpdater(register)` + `checkForUpdate()`) ne dépend pas de `virtual:pwa-register` : c'est `main.ts` qui lui injecte `registerSW`. Ainsi, les tests et `App.test.ts` n'ont jamais à résoudre le module virtuel. La version est injectée au build par `define`.

**Tech Stack:** Svelte 5, Vite 6, vite-plugin-pwa 1.x (Workbox), Vitest + Testing Library (jsdom).

**Spec:** `docs/superpowers/specs/2026-11-15-pull-refresh-mise-a-jour-design.md`

## Global Constraints

- Textes de l'interface en français, exactement : « Rechercher une mise à jour », « Installer la mise à jour », « Recherche… », « Bamboche est à jour », « Pas de connexion », « Impossible de vérifier ».
- Ligne de version : `Version <package.json version> · <JJ/MM/AAAA> · <hash git court 7 car.>`, hash `dev` si git est indisponible.
- L'appli ne redémarre **jamais** sans un appui sur le bouton.
- Abandon de la vérification au bout de 10 000 ms → « Impossible de vérifier ».
- Pas de nouvelle dépendance npm.
- Le worktree n'a pas de `node_modules` : lancer `npm ci` avant la tâche 1.

## Review Focus

- Appui sur le bouton hors ligne → « Pas de connexion », sans appel réseau ni blocage (tâche 2 : test `hors ligne`).
- Double appui rapide pendant « Recherche… » → une seule vérification, bouton désactivé (tâche 2 : test `ignore un second appel` ; tâche 3 : `disabled`).
- Nouvelle version déjà téléchargée en arrière-plan → le bouton affiche « Installer la mise à jour » et l'installe sans revérifier (tâche 2 : test `available`).
- Serveur qui ne répond pas, ou `registration.update()` qui rejette → « Impossible de vérifier » au bout de 10 s, puis le bouton est de nouveau utilisable (tâche 2 : tests `timeout` et `erreur`).
- Dev ou navigateur sans service worker (aucun `onRegisteredSW`) → bouton désactivé, message « Indisponible » (tâche 2 : test `unsupported` ; tâche 3 : rendu sans `initUpdater`).

---

### Task 1: Geste bloqué, PWA en mode prompt, version injectée

**Files:**
- Modify: `src/lib/theme/global.css:10-18` (déplacer `overscroll-behavior: none` de `body` vers `html`)
- Modify: `vite.config.ts` (`registerType: 'prompt'`, `define`)
- Modify: `vitest.config.ts` (`define` avec des valeurs de test fixes)
- Create: `src/build-info.d.ts`
- Create: `src/lib/version.ts`
- Test: `src/lib/version.test.ts`

**Interfaces:**
- Produces: globales `__APP_VERSION__: string`, `__BUILD_DATE__: string` (ISO 8601), `__GIT_HASH__: string` ; `versionLabel(): string` dans `src/lib/version.ts`.

- [ ] **Step 1: Write the failing test** (`src/lib/version.test.ts`)

```ts
import { expect, test } from 'vitest';
import { versionLabel } from './version';

test('versionLabel formate version, date et hash', () => {
  expect(versionLabel()).toBe('Version 0.0.0-test · 15/11/2026 · abc1234');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/version.test.ts`
Expected: FAIL (module `./version` introuvable)

- [ ] **Step 3: Implement**
  - `vitest.config.ts` : `define: { __APP_VERSION__: JSON.stringify('0.0.0-test'), __BUILD_DATE__: JSON.stringify('2026-11-15T12:00:00Z'), __GIT_HASH__: JSON.stringify('abc1234') }`.
  - `vite.config.ts` : `define` avec la version lue dans `package.json`, `new Date().toISOString()` et `git rev-parse --short=7 HEAD` (`execSync` dans un try/catch, `'dev'` en cas d'échec) ; `registerType: 'prompt'`.
  - `src/build-info.d.ts` : `declare const __APP_VERSION__: string;` (et les deux autres).
  - `versionLabel()` : date formatée en `JJ/MM/AAAA` à partir des composants **UTC** (le résultat ne doit pas dépendre du fuseau de la machine de test).
  - `global.css` : `html { overscroll-behavior: none; }` ; retirer la ligne de `body`.

- [ ] **Step 4: Run tests and type-check**

Run: `npx vitest run src/lib/version.test.ts && npm run check`
Expected: PASS, 0 erreur svelte-check

- [ ] **Step 5: Commit**

```bash
git add src/lib/theme/global.css vite.config.ts vitest.config.ts src/build-info.d.ts src/lib/version.ts src/lib/version.test.ts
git commit -m "fix: bloque le pull-to-refresh, PWA en mode prompt et version injectée"
```

### Task 2: Module de mise à jour

**Files:**
- Create: `src/lib/update.ts`
- Test: `src/lib/update.test.ts`

**Interfaces:**
- Consumes: type `RegisterSWOptions` de `virtual:pwa-register` (type uniquement, `import type`), ou une signature locale équivalente si l'import de type pose problème sous Vitest.
- Produces:
  - `type UpdateStatus = 'unsupported' | 'idle' | 'checking' | 'upToDate' | 'available' | 'offline' | 'error'`
  - `updateStatus: Readable<UpdateStatus>` (valeur initiale `'unsupported'`)
  - `type RegisterFn = (opts: { onNeedRefresh?: () => void; onRegisteredSW?: (url: string, reg: ServiceWorkerRegistration | undefined) => void; onRegisterError?: (e: unknown) => void }) => (reload?: boolean) => Promise<void>`
  - `initUpdater(register: RegisterFn): void`
  - `checkForUpdate(): Promise<void>`
  - `resetUpdaterForTests(): void` (remet l'état du singleton à zéro)

Comportement :
- `onRegisteredSW` avec une registration → `idle`. Sans aucun appel → reste `unsupported`.
- `onNeedRefresh` → `available`.
- `checkForUpdate()` :
  - `unsupported` ou `checking` → ne fait rien ;
  - `available` → `updateSW(true)` ;
  - `navigator.onLine === false` → `offline` ;
  - sinon `checking`, puis `registration.update()`. Ensuite :
    - si `registration.installing` ou `registration.waiting`, attendre `onNeedRefresh` puis `updateSW(true)` (si `waiting` est déjà là, appliquer tout de suite) ;
    - sinon `upToDate`.
  - Le tout est limité à 10 000 ms → `error`. Un rejet de `update()` → `error`.

- [ ] **Step 1: Write the failing tests** (`src/lib/update.test.ts`)

Fausse registration : `{ update: vi.fn(), installing: null, waiting: null }` passée par cast. Le faux `register` capture les options et renvoie `updateSW = vi.fn(async () => {})`. Chaque test appelle `resetUpdaterForTests()` dans un `beforeEach` et rétablit `navigator.onLine` (`vi.spyOn(navigator, 'onLine', 'get')`).

```ts
test('unsupported : sans onRegisteredSW, checkForUpdate ne fait rien', ...)
  // expect(get(updateStatus)).toBe('unsupported'); après checkForUpdate, update non appelé
test('à jour : update() sans nouveau worker → upToDate', ...)
  // expect(reg.update).toHaveBeenCalledOnce(); expect(get(updateStatus)).toBe('upToDate'); expect(updateSW).not.toHaveBeenCalled()
test('nouvelle version : installing puis onNeedRefresh → updateSW(true)', ...)
  // reg.update installe reg.installing = {}; puis options.onNeedRefresh(); expect(updateSW).toHaveBeenCalledWith(true)
test('available : version déjà téléchargée → installe sans revérifier', ...)
  // options.onNeedRefresh(); expect(get(updateStatus)).toBe('available'); checkForUpdate → updateSW(true), reg.update non appelé
test('hors ligne → offline sans appel réseau', ...)
  // onLine false → 'offline', reg.update non appelé
test('ignore un second appel pendant la vérification', ...)
  // deux checkForUpdate() sans await, update en attente → reg.update appelé une seule fois
test('timeout : pas de réponse en 10 s → error, puis réessayable', ...)
  // vi.useFakeTimers(); update ne se résout jamais; advanceTimersByTimeAsync(10_000) → 'error'; un nouvel appel relance update
test('erreur : update() rejette → error', ...)
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/lib/update.test.ts`
Expected: FAIL (module `./update` introuvable)

- [ ] **Step 3: Implement `src/lib/update.ts`** selon les interfaces et le comportement ci-dessus (store `writable` exposé en lecture seule, comme `src/lib/online.ts`).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/update.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/update.ts src/lib/update.test.ts
git commit -m "feat: module de recherche et d'installation des mises à jour"
```

### Task 3: Branchement et ligne dans Réglages

**Files:**
- Modify: `src/main.ts` (`import { registerSW } from 'virtual:pwa-register'; initUpdater(registerSW);`)
- Modify: `src/lib/ui/icons.ts` (nouvelle icône `refresh`, deux flèches en cercle, au même style de trait)
- Modify: `src/screens/Players.svelte` (nouvelle ligne `.pref` sous « Sons et vibrations »)
- Test: `src/screens/Players.test.ts` (nouveau fichier)

**Interfaces:**
- Consumes: `updateStatus`, `checkForUpdate`, `initUpdater`, `resetUpdaterForTests` (tâche 2) ; `versionLabel()` (tâche 1).

Rendu de la ligne : icône `refresh`, puis un bouton occupant la largeur, libellé « Rechercher une mise à jour » (ou « Installer la mise à jour » si `available`). Dessous, en `--texte-doux`, `font-size: 14px` : le message d'état s'il y en a un, sinon `versionLabel()`. Messages : `checking` → « Recherche… », `upToDate` → « Bamboche est à jour », `offline` → « Pas de connexion », `error` → « Impossible de vérifier », `unsupported` → « Indisponible ». Bouton `disabled` si `checking` ou `unsupported`. `tap()` au clic, comme les autres boutons.

- [ ] **Step 1: Write the failing tests** (`src/screens/Players.test.ts`)

```ts
test('sans service worker : bouton désactivé et « Indisponible »', ...)
  // render(Players, { onback: () => {} }); getByRole('button', { name: 'Rechercher une mise à jour' }) toBeDisabled(); getByText('Indisponible')
test('affiche la version quand aucun message', ...)
  // initUpdater(fakeRegister) + onRegisteredSW(reg) ; getByText('Version 0.0.0-test · 15/11/2026 · abc1234')
test('appui → « Bamboche est à jour »', ...)
  // fireEvent.click(bouton) ; await findByText('Bamboche est à jour')
test('version téléchargée → libellé « Installer la mise à jour »', ...)
  // options.onNeedRefresh() ; getByRole('button', { name: 'Installer la mise à jour' })
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/screens/Players.test.ts`
Expected: FAIL (bouton introuvable)

- [ ] **Step 3: Implement** l'icône, la ligne dans `Players.svelte` et le branchement dans `main.ts`.

- [ ] **Step 4: Run the full suite, type-check and build**

Run: `npm test && npm run check && npm run build`
Expected: tous les tests PASS, 0 erreur, build OK (`dist/sw.js` généré)

- [ ] **Step 5: Check in the browser preview**

Lancer la config de `.claude/launch.json`, ouvrir Réglages. Attendu : la ligne est visible sous « Sons et vibrations », avec « Indisponible » en dev, et aucune erreur dans la console.

- [ ] **Step 6: Commit**

```bash
git add src/main.ts src/lib/ui/icons.ts src/screens/Players.svelte src/screens/Players.test.ts
git commit -m "feat: bouton « Rechercher une mise à jour » dans les réglages"
```
