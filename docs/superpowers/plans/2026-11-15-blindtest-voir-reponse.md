# Blindtest « Voir la réponse » — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** ajouter sur l'écran d'écoute du Blindtest un bouton afficher/masquer qui montre le titre, l'artiste et l'année de l'extrait en cours.

**Architecture :** un état local `$state` dans `Listen.svelte`. Quand il est actif, le disque animé laisse la place à un bloc de réponse. L'écran est recréé à chaque extrait (`{#key s.current}` dans `Play.svelte`), donc l'état repart masqué sans code supplémentaire. Il faut aussi une nouvelle icône `eye`.

**Tech Stack :** Svelte 5 (runes), TypeScript, Vitest et @testing-library/svelte.

**Spec :** `docs/superpowers/specs/2026-11-15-blindtest-voir-reponse-design.md`

## Global Constraints

- Libellés exacts : « Voir la réponse » (icône `eye`) et « Masquer la réponse » (icône `eyeoff`).
- Contenu affiché : `track.displayTitle`, `track.artists.join(', ')`, et `track.annee_corrigee ?? track.year`, seulement si `track.year` est renseigné (même règle que `Reveal.svelte`).
- Pas de pochette. La lecture n'est ni coupée ni mise en pause. Les boutons d'équipes et « Personne n'a trouvé » restent visibles et en place.
- Le bouton n'apparaît que lorsque le bouton « Lancer l'extrait » n'est pas affiché (la branche `{:else}` de `{#if !playing && pos === 0}`).

## Review Focus

1. Un appui sur une équipe pendant que la réponse est affichée attribue toujours le point normalement (`onaward('A')`) : le test est ajouté à la tâche 1.
2. Afficher la réponse n'appelle ni `source.pause` ni `source.stop` : le test est ajouté à la tâche 1.
3. Titre très long : le texte passe à la ligne (`overflow-wrap: anywhere`, comme `.title` de Reveal) au lieu de déborder. C'est un point de style à vérifier visuellement, sans test.
4. Morceau sans année : pas de pastille d'année vide. C'est couvert par la condition `{#if track.year}`, sans test dédié.
5. La pause ou l'écran hors ligne s'ouvrent par-dessus sans perdre l'état affiché : rien à faire, ce sont des surcouches.

---

### Task 1 : icône œil et bouton afficher/masquer

**Files :**
- Modify : `src/lib/ui/icons.ts` (ajouter `'eye'` au type `IconName` et une entrée `eye` dans `ICONS`)
- Modify : `src/games/blindtest/screens/Listen.svelte`
- Test : `src/games/blindtest/screens/Listen.test.ts`

**Interfaces :**
- Consumes : `Icon` (`name: IconName`), le prop `track: Track` déjà présent.
- Produces : rien pour d'autres tâches.

- [ ] **Step 1 : écrire les tests qui échouent** dans `Listen.test.ts`, en réutilisant `setup()` et `later()`. Le bouton n'apparaît qu'après le premier passage de l'intervalle à 150 ms (qui met `playing` à vrai via `fakeSource`), donc il faut utiliser `findByRole`.

```ts
test('la réponse est masquée par défaut, puis s’affiche et se masque au bouton', async () => {
  const { source } = setup();
  const show = await screen.findByRole('button', { name: 'Voir la réponse' });
  expect(screen.queryByText('Poker Face')).toBeNull();
  await fireEvent.click(show);
  expect(screen.getByText('Poker Face')).toBeTruthy();
  expect(screen.getByText('Lady Gaga')).toBeTruthy();
  expect(screen.getByText('2008')).toBeTruthy();
  expect(source.pause).not.toHaveBeenCalled();
  expect(source.stop).not.toHaveBeenCalled();
  await fireEvent.click(screen.getByRole('button', { name: 'Masquer la réponse' }));
  expect(screen.queryByText('Poker Face')).toBeNull();
});

test('réponse affichée : choisir une équipe attribue toujours le point', async () => {
  const { onaward } = setup();
  await fireEvent.click(await screen.findByRole('button', { name: 'Voir la réponse' }));
  later();
  await fireEvent.click(screen.getByRole('button', { name: 'Léa' }));
  expect(onaward).toHaveBeenCalledWith('A');
});
```

- [ ] **Step 2 : lancer les tests et vérifier qu'ils échouent**

Run : `npx vitest run src/games/blindtest/screens/Listen.test.ts`
Expected : les deux nouveaux tests échouent (le bouton « Voir la réponse » est introuvable), les tests existants passent.

- [ ] **Step 3 : implémenter**
  - `icons.ts` : `eye: { d: 'M3 12s4-6 9-6 9 6 9 6-4 6-9 6-9-6-9-6', circles: [[12, 12, 3]] }`. Vérifier que le type de l'entrée accepte `circles` (Icon.svelte le lit déjà).
  - `Listen.svelte` : `let showAnswer = $state(false);`. Dans `.mid`, afficher `{#if showAnswer}` un bloc réponse (titre, artistes, année) à la place de `.disc`, sinon le disque. Le style reprend `.title`, `.artist` et `.year` de `Reveal.svelte`, en un peu plus petit pour tenir à côté de la progression. Dans la branche `{:else}` (sous `.ask`), ajouter un bouton discret `type="button"` qui inverse `showAnswer`, avec l'icône et le libellé selon l'état (style proche de `.fix` dans Reveal : `min-height: 44px`, couleur `--texte-doux`).

- [ ] **Step 4 : lancer toute la suite et le typage**

Run : `npm test` puis `npx svelte-check` (ou le script `check` de `package.json` s'il existe)
Expected : tous les tests passent et aucune erreur de type.

- [ ] **Step 5 : vérifier visuellement** dans l'aperçu (écran d'écoute, largeur mobile) : le bloc réponse ne pousse pas les boutons d'équipes hors de l'écran, et un titre long passe à la ligne.

- [ ] **Step 6 : commit**

```bash
git add src/lib/ui/icons.ts src/games/blindtest/screens/Listen.svelte src/games/blindtest/screens/Listen.test.ts
git commit -m "feat(blindtest): bouton « Voir la réponse » sur l'écran d'écoute"
```
