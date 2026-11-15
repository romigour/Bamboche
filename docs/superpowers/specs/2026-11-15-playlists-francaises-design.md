# Trois playlists françaises pour le Blindtest — design

## Intention
Ajouter au Blindtest les playlists Spotify exportées par Romain (Exportify), pour varier les parties au-delà de « Hits de toujours ».

## Objectifs / non-objectifs
- Objectif : trois nouvelles playlists jouables, choisies depuis l'écran Playlist.
- Non-objectif : changer le format des playlists, le script d'import ou l'écran.
- Anti-objectif : reprendre le nom « Hitster » (jeu existant).

## Approches
- **Script existant `npm run import-playlist` (retenu)** : déjà testé, filtre les titres sans extrait et les doublons.
- Conversion à la main ou nouveau script : aucun gain, plus de risques.

## Décisions
Les deux CSV « années 2000 variété française » sont identiques : un seul import.

| id | Nom | Description |
|---|---|---|
| `hitster-francais` | 100 % français | Les tubes français de toutes les époques |
| `annees-2000-fr` | Années 2000 FR | La variété française des années 2000 |
| `rap-fr` | Rap FR | Le rap français des années 90-2000 |

- Ordre : Hits de toujours, 100 % français, Années 2000 FR, Rap FR.
- Couleur `blindtest` (valeur posée par le script).
- « Rap FR » retiré de la liste `SOON` de `screens/Playlist.svelte` ; « Années 80 » reste.
- Test : chaque playlist intégrée a des titres, ids uniques, extrait en `https://`, titre affiché non vide.
