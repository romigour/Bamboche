# Blindtest — bouton « Voir la réponse » sur l'écran d'écoute

## Intention

Pendant l'écoute, quelqu'un crie une réponse. Avant de toucher le bouton de son équipe, l'animateur veut vérifier le titre, pour donner le point à la bonne personne du premier coup au lieu de le corriger ensuite avec « Erreur ? Changer qui a marqué » sur l'écran de révélation.

## Objectifs

- Un simple bouton afficher/masquer sur l'écran d'écoute (`src/games/blindtest/screens/Listen.svelte`) qui montre le titre, l'artiste et l'année de l'extrait en cours.
- La réponse est masquée par défaut à chaque nouvel extrait.

## Hors périmètre

- Pas de pochette (on reste compact). Aucun changement sur l'écran de révélation, le score ou la logique de jeu.

## Ce qu'il faut éviter

- Masquer ou déplacer les boutons d'équipes, ou couper la musique quand on affiche la réponse.

## Approches envisagées

1. **Bouton afficher/masquer sur place (retenue).** Le disque animé laisse la place aux informations du titre. Simple, et les boutons d'équipes restent visibles.
2. Une fenêtre par-dessus l'écran : elle cacherait les boutons d'équipes, et il faudrait la fermer avant de choisir.
3. Un appui long sur le disque : difficile à découvrir.

## Design retenu

- Bouton « Voir la réponse » (icône œil) sous « Qui chante ? ». Il n'apparaît qu'une fois l'extrait lancé, donc pas quand le bouton « Lancer l'extrait » est affiché.
- Un appui remplace le disque animé par le titre (`track.displayTitle`), l'artiste (`track.artists.join(', ')`) et l'année (`track.annee_corrigee ?? track.year`, si présente), avec le même style que l'écran de révélation. Le libellé devient « Masquer la réponse » (icône œil barré, `eyeoff`).
- La lecture continue. Rien d'autre ne change : la pause, la réécoute et les boutons d'équipes marchent comme avant.
- L'état est local à l'écran et repart masqué à chaque extrait (l'écran est déjà recréé à chaque extrait par le `{#key s.current}` de `Play.svelte`).
- Ajouter une icône `eye` dans `src/lib/ui/icons.ts`, puisque seule `eyeoff` existe aujourd'hui.

## Laissé au développeur

- Le style exact du bouton (choix proposé : discret, dans l'esprit du lien « Erreur ? » de la révélation).
- Les tests dans `Listen.test.ts` : masqué par défaut, affiché après un appui, masqué de nouveau après un second appui.
