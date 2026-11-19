# Bamboche

Jeux de soirée sur un seul téléphone, qu'on se passe de main en main. Application web installable (PWA), qui fonctionne hors ligne, sans compte ni serveur.

Jeux disponibles : **Time Up**, **Blindtest** (qui a besoin d'Internet pour la musique), **Undercover** et **Cris d'animaux** (sons téléchargés à la première partie, puis hors ligne).

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

## Playlists du Blindtest

Une playlist intégrée vient d'un export CSV d'[Exportify](https://exportify.app/). On ne garde que les titres qui ont un extrait de 30 s.

1. Exporter la playlist Spotify avec Exportify (fichier `.csv`).
2. La convertir :

```bash
npm run import-playlist -- "chemin/vers/export.csv" annees-80 "Années 80" "Les tubes des années 80"
```

3. Le script écrit `src/games/blindtest/playlists/annees-80.json` et liste les titres écartés.
4. Ajouter l'import de ce JSON dans `src/games/blindtest/playlists/index.ts` (tableau `playlists`), puis retirer son nom de la liste « Bientôt » de `screens/Playlist.svelte`.

Les extraits et les pochettes sont lus depuis les serveurs de Spotify : ils ne sont jamais mis en cache par l'app.

## Paires de l'Undercover

Les paires de mots sont dans `src/games/undercover/words.json` : une liste d'objets `{ "a": "…", "b": "…" }`. Le test refuse les doublons (accents, majuscules et ordre des deux mots ignorés).

## Banque de sons des Cris d'animaux

Les cris et les photos viennent de [Wikimedia Commons](https://commons.wikimedia.org/) (licences CC0, domaine public, CC BY ou CC BY-SA seulement ; les crédits sont affichés dans le jeu). Ils sont rangés dans `public/animaux/` sous des noms neutres et décrits par `src/games/animaux/animals.json`. L'app ne les met pas dans le précache : ils sont téléchargés à la première partie.

1. Décrire les animaux dans `scripts/animals.source.json` : `id`, `name`, `level` (`facile` ou `difficile`), `family`, titres Commons du son et de la photo (`File:…`), et au besoin `start` / `end` (en secondes) pour la découpe.
2. Préparer les candidats (ffmpeg est fourni par la dépendance `ffmpeg-static`). Wikimedia ralentit fortement les scripts sans contact : en donner un est recommandé.

```bash
WIKIMEDIA_CONTACT="adresse ou URL" npm run import-animals -- candidats
```

3. Ouvrir `scripts/.animaux-candidats/ecoute.html`, écouter, cocher Garder ou Jeter, puis « Exporter la sélection ».
4. Construire la banque (sans fichier de sélection : tous les candidats) :

```bash
npm run import-animals -- banque chemin/vers/selection.json
```

Le script affiche la taille de la banque (objectif : moins de 10 Mo) et prévient quand une famille a moins de 4 animaux (niveau Expert) ou quand il y a moins de 30 animaux faciles.
