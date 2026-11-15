# Playlists françaises du Blindtest — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** intégrer trois playlists Exportify (100 % français, Années 2000 FR, Rap FR) au Blindtest.

**Architecture :** le script existant `npm run import-playlist` produit un JSON par playlist dans `src/games/blindtest/playlists/` ; on l'importe dans `index.ts`. Aucun code applicatif nouveau.

**Tech Stack :** Svelte 5, TypeScript, Vitest.

**Spec :** `docs/superpowers/specs/2026-11-15-playlists-francaises-design.md`

## Global Constraints
- ids : `hitster-francais`, `annees-2000-fr`, `rap-fr` ; noms et descriptions exactement ceux de la spec.
- Ordre du tableau `playlists` : hits-de-toujours, hitster-francais, annees-2000-fr, rap-fr.
- Le mot « Hitster » n'apparaît dans aucun texte affiché.

## Review Focus
- Une playlist dont beaucoup de titres n'ont pas d'extrait : vérifier le nombre de titres gardés (il en faut assez pour une partie au nombre d'extraits maximum).
- Un titre présent dans plusieurs playlists : chaque playlist est indépendante, aucun conflit attendu (les recherches passent par l'id de playlist).
- Les titres à plusieurs artistes (« 113, Rim'K ») : déjà gérés par `parseExportifyCsv`, couverts par `csv.test.ts`.

---

### Task 1 : importer et brancher les trois playlists

**Files :**
- Create : `src/games/blindtest/playlists/hitster-francais.json`, `annees-2000-fr.json`, `rap-fr.json` (générés)
- Modify : `src/games/blindtest/playlists/index.ts`, `src/games/blindtest/screens/Playlist.svelte:14`
- Test : `src/games/blindtest/playlists/playlists.test.ts`

- [ ] **Étape 1 : écrire le test qui échoue** : `test.each` sur les quatre ids : la playlist existe, `tracks.length >= <max des options de « Nombre d'extraits »>`, ids de titres uniques, `preview` commence par `https://`, `displayTitle` non vide ; plus un test sur l'ordre : `playlists.map(p => p.id)` vaut `['hits-de-toujours','hitster-francais','annees-2000-fr','rap-fr']`.
- [ ] **Étape 2 : lancer** `npx vitest run src/games/blindtest/playlists` → échec (playlists absentes).
- [ ] **Étape 3 : importer** avec `npm run import-playlist -- "<csv>" <id> "<nom>" "<description>"` pour les trois CSV ; noter les titres gardés et rejetés.
- [ ] **Étape 4 : brancher** les trois JSON dans `index.ts` dans l'ordre ; retirer `'Rap FR'` de `SOON`.
- [ ] **Étape 5 : lancer** `npx vitest run` et `npm run check` (ou équivalent du projet) → tout passe.
- [ ] **Étape 6 : vérifier dans l'app** que l'écran Playlist affiche les quatre playlists et seulement « Années 80 » en Bientôt.
- [ ] **Étape 7 : committer** spec, plan, JSON, index, écran et test.
