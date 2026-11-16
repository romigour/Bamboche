# Blindtest : écran « Quelle musique ? » simplifié

## Intention

L'écran « Quelle musique ? » (étape 2 sur 2) affiche, sous les playlists, les réglages « Nombre d'extraits » et « Durée d'écoute ». Ils sont jugés inutiles à cet endroit : l'écran doit seulement servir à choisir la playlist, pour être plus simple.

## Objectifs / non-objectifs

- Objectif : retirer les deux réglages de l'écran ; il ne reste que le choix de la playlist et le bouton « C'est parti ! ».
- Non-objectif : supprimer les réglages du jeu. Ils restent déclarés dans `src/games/blindtest/module.ts` et modifiables depuis l'écran de réglages général (`src/screens/GameSettings.svelte`). La partie continue d'utiliser la valeur enregistrée (défaut : 15 extraits, 20 s).
- Anti-objectif : changer le comportement de la partie ou les valeurs par défaut.

## Approches

Une seule approche sensée : supprimer les blocs du composant. Masquer les réglages (CSS, drapeau) garderait du code mort sans bénéfice.

## Conception

Dans `src/games/blindtest/screens/Playlist.svelte` :
- supprimer les deux `<div class="field">` ;
- supprimer ce qui ne sert qu'à eux : `values`, `opts`, `change`, les imports `Pills`, `getSettings`/`setSetting` et `blindtest`, les styles `.field` et `.label` ;
- mettre à jour le commentaire du composant (« playlist seulement »).

Vérification : lint/typecheck, tests existants, et contrôle visuel de l'écran à largeur téléphone.
