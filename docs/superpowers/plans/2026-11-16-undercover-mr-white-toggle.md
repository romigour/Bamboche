# Interrupteur Mr White Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer les Pills « Non | Oui » de Mr White par une ligne libellée avec interrupteur, partagée avec « Sons et vibrations ».

**Architecture:** Un composant `Switch.svelte` rend toute la ligne comme un unique `<button role="switch">` (icône optionnelle, libellé, description optionnelle, piste à droite) : la ligne entière est cliquable et accessible. `Players.svelte` et `Setup.svelte` l'utilisent.

**Tech Stack:** Svelte 5 (runes), TypeScript, Vitest + @testing-library/svelte.

**Spec:** `docs/superpowers/specs/2026-11-16-undercover-mr-white-toggle-design.md`

## Global Constraints

- Libellé : `Mr White` ; description : `Un joueur sans mot, qui doit bluffer`.
- Aucune modification de `setup.ts` (store `mrWhiteOn`, persistance, `validateSetup`) ni de `composition`.
- Rendu de l'interrupteur identique à l'actuel de `Players.svelte` (60×36, fond `--surface-plus`, `--ok` quand actif, pastille 28px `--nuit`) ; ligne au style `.pref` (fond `--surface`, rayon 18px, padding 12px 14px, gap 12px).
- Chaque bascule appelle `tap()` (`src/lib/feedback`).

## Review Focus

- Nom accessible du switch = libellé visible seul (« Mr White »), la description passe en `aria-describedby` — sinon `getByRole('switch', { name: 'Mr White' })` échoue.
- Clic sur la description (pas seulement sur la piste) bascule l'option — testé en Task 1.
- Plusieurs `Switch` sur une page : ids de description uniques (`$props.id()`).
- Erreur « Avec Mr White, il faut au moins 4 joueurs. » toujours affichée après bascule — test existant adapté en Task 2.
- Texte long sur téléphone étroit : le libellé/description passent à la ligne, la piste ne rétrécit pas (`flex-shrink: 0`).

---

### Task 1: Composant `Switch` et usage dans Players

**Files:**
- Create: `src/lib/ui/Switch.svelte`
- Create: `src/lib/ui/Switch.test.ts`
- Modify: `src/screens/Players.svelte:109-124` (ligne « Sons et vibrations ») et styles `.pref label`, `.switch*` (l. 237, 244-255)

**Interfaces:**
- Produces: `Switch.svelte` avec props `{ checked: boolean; label: string; description?: string; icon?: Snippet; onchange: (v: boolean) => void }`. Rend `<button type="button" role="switch" aria-checked={checked} aria-describedby={description ? id : undefined}>` contenant `{@render icon?.()}`, `<span>` libellé, `<span id>` description, piste `<span class="track" aria-hidden="true"><span></span></span>`. Clic → `tap()` puis `onchange(!checked)`.

- [ ] **Step 1: Écrire les tests** dans `Switch.test.ts` :
  - `'nom accessible = libellé, description reliée'` : render `{ checked: false, label: 'Mr White', description: 'Un joueur sans mot, qui doit bluffer', onchange }` → `getByRole('switch', { name: 'Mr White' })` a `aria-checked="false"` et `toHaveAccessibleDescription('Un joueur sans mot, qui doit bluffer')`.
  - `'un clic sur la description bascule'` : `fireEvent.click(getByText('Un joueur sans mot, qui doit bluffer'))` → `onchange` appelé une fois avec `true`.
  - `'actif : aria-checked true, clic envoie false'` : `checked: true` → `aria-checked="true"`, clic → `onchange(false)`.
- [ ] **Step 2:** `npx vitest run src/lib/ui/Switch.test.ts` → FAIL (module introuvable).
- [ ] **Step 3: Implémenter `Switch.svelte`** selon l'interface ; id via `$props.id()` ; styles repris de `.pref` / `.switch` de Players (bouton pleine largeur, `text-align: left`, libellé en `--font-display` 600 18px, description 14px `--texte-doux`, bloc texte `flex-grow: 1`, piste `flex-shrink: 0`).
- [ ] **Step 4:** Remplacer dans `Players.svelte` le bloc `<div class="pref">…</div>` du son par `<Switch checked={$soundOn} label="Sons et vibrations" onchange={(v) => soundOn.set(v)}>` avec snippet `icon` = `<span class="pref-icon"><Icon …/></span>` ; supprimer les styles `.switch*` et `.pref label` devenus inutiles (garder `.pref`/`.pref-icon` s'ils servent encore à la ligne mise à jour ; déplacer `.pref-icon` dans Switch si besoin — l'icône du snippet garde sa couleur `--pop`).
- [ ] **Step 5:** `npm test` → tout PASS (dont `Players.test.ts`).
- [ ] **Step 6: Commit** `feat(ui): composant Switch, ligne entière cliquable, utilisé pour les sons`

### Task 2: Mr White en interrupteur dans Setup

**Files:**
- Modify: `src/games/undercover/screens/Setup.svelte:35-43`
- Modify: `src/games/undercover/screens/Setup.test.ts`

**Interfaces:**
- Consumes: `Switch` (Task 1).

- [ ] **Step 1: Adapter les tests** :
  - Dans `'3 joueurs avec Mr White…'`, remplacer le clic sur `'Oui'` par `fireEvent.click(screen.getByRole('switch', { name: 'Mr White' }))`.
  - Nouveau `'libellé et explication de Mr White visibles'` : 5 joueurs → `getByText('Mr White')` et `getByText('Un joueur sans mot, qui doit bluffer')` présents, switch `aria-checked="false"`, `queryByRole('button', { name: 'Oui' })` absent ; après clic sur le switch → `get(mrWhiteOn)` vaut `true` et `getByText('1 undercover · 1 Mr White · 3 civils')` présent.
- [ ] **Step 2:** `npx vitest run src/games/undercover/screens/Setup.test.ts` → FAIL.
- [ ] **Step 3:** Remplacer `<Pills …/>` par `<Switch checked={$mrWhiteOn} label="Mr White" description="Un joueur sans mot, qui doit bluffer" onchange={(v) => mrWhiteOn.set(v)} />` ; retirer l'import `Pills`.
- [ ] **Step 4:** `npm test` puis `npx svelte-check` (ou le script de vérif du projet) → PASS, 0 erreur.
- [ ] **Step 5: Commit** `feat(undercover): Mr White en interrupteur libellé avec explication`
