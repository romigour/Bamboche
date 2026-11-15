# Bamboche

Jeux de soirée sur un seul téléphone, qu'on se passe de main en main. Application web installable (PWA), qui fonctionne hors ligne, sans compte ni serveur.

Jeu disponible : **Time Up**. Bientôt : Blindtest, Hipster, Undercover.

## Lancer en local

Il faut Node 20 ou plus.

```bash
npm install
npm run dev
```

Puis ouvrir l'adresse affichée (http://localhost:5173), de préférence en vue mobile.

## Tester

```bash
npm test
```

```bash
npm run check
```

`npm test` lance les tests Vitest (logique de jeu, stockage, écrans clés) ; `npm run check` vérifie les types et les composants Svelte.

## Construire et prévisualiser

```bash
npm run build
```

```bash
npm run preview
```

Le dossier `dist/` contient le site statique, service worker compris. Le site fonctionne sous n'importe quel sous-chemin (`base: './'`, routage par `#`).

## Déployer sur GitHub Pages

Le workflow `.github/workflows/deploy.yml` teste, construit et publie le site à chaque push sur `master`. Une seule fois, dans le dépôt GitHub : **Settings → Pages → Source : GitHub Actions**.

## Organisation

- `src/lib/` : briques partagées (stockage, routeur, joueurs, équipes, réglages, sons, écran allumé) et kit d'interface `ui/`.
- `src/games/registry.ts` : liste des jeux affichés sur l'accueil.
- `src/games/<id>/module.ts` : description d'un jeu (nom, couleur, icône, nombre de joueurs, réglages).
- `src/games/timeup/logic/` : règles du Time Up en fonctions pures, testées.
- `src/games/timeup/screens/` : écrans du jeu.
- Toutes les données (joueurs, réglages, partie en cours) restent dans le navigateur (`localStorage`, clés `bamboche:v1:…`).

## Ajouter un jeu

1. Créer `src/games/<id>/module.ts` avec un `GameModule` (statut `bientot` tant qu'il n'est pas prêt).
2. L'ajouter à `games` dans `src/games/registry.ts`.
3. Écrire sa logique en fonctions pures avec leurs tests, puis ses écrans.
4. Brancher sa route dans `src/App.svelte` et passer son statut à `disponible`.

La charte graphique (couleurs, polices, boutons) est dans `src/lib/theme/tokens.css` et dans le spec `docs/superpowers/specs/2026-11-15-bamboche-design.md`.

## Mots du Time Up

`src/games/timeup/words.json` : liste de `{ "text", "category" }`. Catégories autorisées : Célébrité, Personnage, Objet, Lieu, Animal, Film & série. Le test `words.test.ts` refuse les doublons (accents et majuscules ignorés).
