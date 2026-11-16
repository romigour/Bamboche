# Undercover — interrupteur Mr White (design court)

## Intention
Sur l'écran « Qui joue ? », l'option Mr White s'affiche en deux boutons « Non | Oui » sans libellé visible (« Mr White » n'est qu'un `aria-label`). On ne sait pas à quoi servent ces boutons. But : rendre l'option lisible d'un coup d'œil.

## Objectifs / non-objectifs
- Objectif : une ligne « Mr White » + sous-titre explicatif + interrupteur, toute la ligne cliquable.
- Non-objectifs : aucune modification de la logique (store `mrWhiteOn`, persistance, règle « 4 joueurs minimum avec Mr White », composition).
- Anti-objectif : un interrupteur différent visuellement de celui de « Sons et vibrations ».

## Approches
1. **Interrupteur sur une ligne libellée (retenue).** Reprend le style de l'interrupteur des préférences ; libellé et explication visibles.
2. Garder les Pills Oui/Non et ajouter un titre au-dessus : plus lourd visuellement pour un simple oui/non.

## Design
```
┌──────────────────────────────────────────┐
│  Mr White                          [ ●] │
│  Un joueur sans mot, qui doit bluffer    │
└──────────────────────────────────────────┘
      1 undercover · 1 Mr White · 3 civils
```
- Nouveau composant `src/lib/ui/Switch.svelte` (bouton `role="switch"`, `aria-checked`, style repris de `Players.svelte`, retour haptique `tap()`).
- `Players.svelte` utilise ce composant pour « Sons et vibrations » (rendu inchangé).
- `Setup.svelte` remplace les `Pills` par une ligne : titre « Mr White », sous-titre « Un joueur sans mot, qui doit bluffer », `Switch` à droite ; un clic n'importe où sur la ligne bascule l'option.
- La ligne de composition reste dessous, inchangée.

## Laissé au constructeur
Structure exacte du composant (props, gestion du clic sur la ligne), mise à jour des tests existants de `Setup` et `Players`.
