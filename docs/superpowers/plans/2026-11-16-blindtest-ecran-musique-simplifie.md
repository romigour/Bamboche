# Écran « Quelle musique ? » simplifié — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** L'écran « Quelle musique ? » du Blindtest ne propose plus que le choix de la playlist.

**Architecture:** Suppression des deux champs de réglage (et du code qui ne sert qu'à eux) dans `Playlist.svelte`. Les réglages restent déclarés dans `module.ts` et modifiables depuis l'écran de réglages général.

**Tech Stack:** Svelte 5, TypeScript, Vitest + @testing-library/svelte.

**Spec:** `docs/superpowers/specs/2026-11-16-blindtest-ecran-musique-simplifie-design.md`

## Global Constraints

- Ne pas modifier `src/games/blindtest/module.ts` ni `src/screens/GameSettings.svelte`.
- Aucun changement de comportement de la partie ni des valeurs par défaut (15 extraits, 20 s).

## Review Focus

- Le bouton « C'est parti ! » appelle toujours `onstart` avec l'id de la playlist sélectionnée (y compris après avoir changé de sélection).
- Le bouton retour appelle toujours `onback`.
- Aucun import ni style orphelin ne reste (`svelte-check` sans avertissement sur ce fichier).

---

### Task 1: Retirer les réglages de l'écran Playlist

**Files:**
- Modify: `src/games/blindtest/screens/Playlist.svelte`
- Create: `src/games/blindtest/screens/Playlist.test.ts`

**Interfaces:**
- Props inchangées : `{ onback: () => void; onstart: (playlistId: string) => void }`.

- [ ] **Step 1: Écrire le test (sur le modèle de `Listen.test.ts`)**

```ts
import { fireEvent, render, screen } from '@testing-library/svelte';
import { expect, test, vi } from 'vitest';
import { playlists } from '../playlists';
import Playlist from './Playlist.svelte';

test("n'affiche plus les réglages d'extraits ni de durée", () => {
  render(Playlist, { onback: vi.fn(), onstart: vi.fn() });
  expect(screen.queryByText("Nombre d'extraits")).toBeNull();
  expect(screen.queryByText("Durée d'écoute")).toBeNull();
});

test('« C\'est parti ! » lance la playlist sélectionnée', async () => {
  const onstart = vi.fn();
  render(Playlist, { onback: vi.fn(), onstart });
  const last = playlists[playlists.length - 1];
  await fireEvent.click(screen.getByText(last.name));
  await fireEvent.click(screen.getByText("C'est parti !"));
  expect(onstart).toHaveBeenCalledWith(last.id);
});
```

- [ ] **Step 2: Lancer le test, vérifier que le premier échoue**

Run: `npx vitest run src/games/blindtest/screens/Playlist.test.ts`
Expected: le test « n'affiche plus les réglages » échoue ; le second passe.

- [ ] **Step 3: Simplifier `Playlist.svelte`**

Supprimer les deux `<div class="field">`, les variables `values`, `opts`, `change`, les imports `Pills`, `getSettings`/`setSetting`, `blindtest`, et les styles `.field` / `.label`. Commentaire du composant : `/** « Quelle musique ? » : choix de la playlist. */`.

- [ ] **Step 4: Vérifier**

Run: `npx vitest run` puis `npm run check`
Expected: tous les tests passent ; `svelte-check` sans erreur ni avertissement sur `Playlist.svelte`.

- [ ] **Step 5: Contrôle visuel**

Ouvrir l'écran dans l'aperçu (préréglage mobile) : seulement les playlists, « Bientôt », l'astuce et « C'est parti ! ».

- [ ] **Step 6: Commit**

```bash
git add src/games/blindtest/screens/Playlist.svelte src/games/blindtest/screens/Playlist.test.ts
git commit -m "feat(blindtest): l'écran « Quelle musique ? » ne propose plus que la playlist"
```
