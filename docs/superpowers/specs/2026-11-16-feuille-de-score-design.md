# Feuille de score — document de conception

Date : 2026-11-16 · Statut : validé le 2026-11-16

## 1. Intention

Pendant les soirées, on joue aussi à de vrais jeux de société (Mille Sabords, Les Cinq Rois, Skyjo, Flip 7, Belote) et on n'a jamais de papier ni de crayon pour compter les points. La **Feuille de score** remplace ce papier : une feuille où l'on note les points de chaque joueur à chaque manche, avec les totaux calculés et le gagnant annoncé.

Elle n'aide pas à calculer les points selon les règles du jeu : on tape le résultat de la manche, c'est tout. Ce qui compte avant tout, c'est que **la saisie soit très rapide**, pour ne pas ralentir la partie.

En plus, Bamboche garde un **historique des parties terminées** par jeu, et en tire des **bilans par joueur** (« Léa a gagné 8 Skyjo sur 12 »).

## 2. Objectifs, non-objectifs, anti-objectifs

**Objectifs**
- Une 4ᵉ carte « Feuille de score » sur l'accueil, au même niveau que les jeux, qui ouvre un écran listant les 5 jeux.
- Pour chaque jeu : choisir les joueurs, saisir les points manche par manche, voir les totaux, être prévenu quand la fin de partie est atteinte, voir le classement final.
- Historique des parties terminées, par jeu, consultable et supprimable partie par partie.
- Bilans par jeu et par joueur, en reconnaissant un joueur à son prénom d'une soirée à l'autre.

**Non-objectifs**
- Calculer les points d'une manche (dés de Mille Sabords, cartes de Skyjo, contrats de la Belote…). Seule exception : le complément à 162 de la Belote (section 6.4).
- Appliquer des règles fines (doublement des points au Skyjo, tour final à Mille Sabords…). On les applique à la main en tapant le bon nombre.
- Créer ses propres jeux dans l'app. Un nouveau jeu s'ajoute dans le code (une fiche de quelques lignes).
- Synchroniser l'historique entre téléphones, ou l'exporter.

**Anti-objectifs (échec même si « ça marche »)**
- Une saisie qui demande plus de gestes que d'écrire un nombre sur papier : ouvrir un clavier système, viser un petit champ, valider joueur par joueur avec une confirmation.
- Perdre la feuille en cours parce que l'app s'est fermée ou rechargée.
- Une faute de frappe impossible à corriger après coup.
- Des bilans qui comptent « Léa » et « léa » comme deux personnes.

## 3. Contraintes

- Toutes les contraintes du design général de Bamboche s'appliquent (`2026-11-15-bamboche-design.md`) : un seul téléphone, smartphone d'abord, portrait, une main, lisible de loin, PWA hors ligne, GitHub Pages sans serveur.
- **Stockage local uniquement** (`localStorage` via `src/lib/storage.ts`, préfixe `bamboche:v1:`). L'historique reste sur le téléphone : il disparaît si on efface les données du navigateur et ne suit pas un changement d'appareil. C'est accepté.
- **Noms des jeux** : on affiche les vrais noms (Mille Sabords, Les Cinq Rois, Skyjo, Flip 7, Belote). Ici on désigne le jeu auquel on joue, sans le reproduire, ce qui est différent des noms des jeux propres à Bamboche *(validé)*.

## 4. Approches considérées

| Approche | Pour | Contre |
|---|---|---|
| **A. Une seule feuille de score, réglée par une fiche par jeu (retenue)** | Peu de code ; même geste pour tous les jeux ; historique et bilans identiques partout ; un 6ᵉ jeu = une fiche | Une règle vraiment exotique demanderait d'élargir la fiche |
| B. Un module complet par jeu, comme Time Up / Blindtest / Undercover | Chaque outil peut diverger librement | ~5 fois plus de code pour des écrans quasi identiques, comportements qui divergent avec le temps |

Écartée : une feuille libre sans jeux prédéfinis (on règle tout à chaque partie). Plus lente à lancer et rend les bilans par jeu impossibles.

Choix de l'utilisateur : **A**, nom du menu **« Feuille de score »**.

## 5. Les fiches de jeu

Chaque jeu est décrit par une fiche (données, pas de code spécifique) :

| Jeu | Gagnant | Fin de partie (par défaut) | Joueurs | Particularité |
|---|---|---|---|---|
| Mille Sabords | plus haut total | un total ≥ 6 000 | 2 et + | scores négatifs possibles |
| Les Cinq Rois | plus bas total | 11 manches jouées | 2 et + | sous-titre de manche « 3 cartes » → « 13 cartes » |
| Skyjo | plus bas total | un total ≥ 100 | 2 et + | scores négatifs possibles |
| Flip 7 | plus haut total | un total ≥ 200 | 2 et + | — |
| Belote | équipe au plus haut total | un total ≥ 1 000 | 4, en 2 équipes de 2 | complément à 162 (6.4) |

Contenu d'une fiche : identifiant, nom, couleur (palette Bamboche), sens de la victoire (`haut` / `bas`), condition de fin (`seuil` de points ou nombre de `manches`) avec sa valeur par défaut, mode équipes (oui / non), nombre minimal de joueurs, aide « complément » optionnelle (valeur 162), sous-titre de manche optionnel.

La valeur de fin (seuil ou nombre de manches) est **réglable au lancement** de chaque partie ; l'app retient la dernière valeur utilisée pour chaque jeu *(mon choix : les variantes « Belote en 501 » ou « Skyjo en 150 » sont courantes)*.

## 6. Parcours et écrans

### 6.1 Accueil

Une 4ᵉ carte « Feuille de score » complète la grille 2×2, après Undercover. Couleur `hipster` (turquoise, libre depuis le retrait du placeholder Hipster) *(mon choix)*. Icône : un crayon (l'icône `edit` existe) ou une nouvelle icône « feuille » *(laissé au constructeur)*. Sous le nom, à la place de « N joueurs et + » : « 5 jeux », ou « Partie en cours » quand une feuille est en cours.

La feuille de score **n'utilise pas** la proposition de reprise de l'accueil (`activeGame` / `ResumeSheet`) : elle a sa propre feuille en cours (6.2). Ainsi, une partie de Skyjo notée sur la feuille n'écrase pas une partie de Time Up en pause, et inversement *(mon choix)*.

### 6.2 Écran « Feuille de score » (sous-menu)

```
 ←  Feuille de score
 ┌──────────────────────────────┐
 │ ▶ Reprendre : Skyjo          │  ← seulement si une feuille est en cours
 │   Manche 5 · Léa 47 – Tom 31 │
 └──────────────────────────────┘
 ┌──────────────────────────────┐
 │ ■ Mille Sabords            › │
 ├──────────────────────────────┤
 │ ■ Les Cinq Rois            › │
 ├──────────────────────────────┤
 │ ■ Skyjo                    › │
 ├──────────────────────────────┤
 │ ■ Flip 7                   › │
 ├──────────────────────────────┤
 │ ■ Belote                   › │
 └──────────────────────────────┘
        [ Historique et bilans ]
```

- Toucher un jeu lance directement la préparation d'une nouvelle partie (6.3), sans écran intermédiaire.
- **Une seule feuille en cours à la fois.** Lancer un autre jeu alors qu'une feuille est en cours demande confirmation (« La partie de Skyjo en cours sera abandonnée »). Une partie abandonnée n'entre pas dans l'historique.

### 6.3 Préparation : qui joue ?

- La liste des « Joueurs de la soirée » (store `players`), chacun avec une case à cocher. Par défaut, tous sont cochés *(mon choix : c'est le cas le plus fréquent)*.
- Un champ pour ajouter un prénom à la volée, qui l'ajoute aussi aux joueurs de la soirée.
- L'ordre de la feuille est l'ordre de la liste ; on peut le changer *(mécanisme laissé au constructeur, peut être reporté)*.
- Réglage de fin de partie : un seul réglage (`Stepper` existant), libellé « Fin à 100 points » ou « 11 manches ».
- **Belote** : il faut exactement 4 joueurs cochés, répartis en 2 équipes de 2 (réutiliser `TeamBuilder` / `teams.ts` si ça colle, sinon une répartition simple « équipe 1 / équipe 2 »). L'équipe est nommée par ses deux prénoms, par exemple « Léa & Tom ».
- **Deux prénoms identiques** une fois normalisés (« Léa » et « lea ») ne peuvent pas jouer la même partie, sinon les bilans les confondraient. « C'est parti » reste grisé avec le message « Deux joueurs s'appellent Léa : ajoute une initiale » *(mon choix)*.
- Bouton « C'est parti » actif dès que le minimum de joueurs est atteint.

### 6.4 La feuille (saisie)

```
 ←  Skyjo · Manche 4            ⋯
 ┌──────────────────────────────────┐
 │           M1  M2  M3  M4 │ Total │
 │ Léa       12   9  19  [7_]│  47  │  ← cellule en cours
 │ Tom        5  14  12   · │  31  │
 │ Inès      20  18  20   · │  58  │
 └──────────────────────────────────┘
   Inès est à 58 / 100
  [ 1 ] [ 2 ] [ 3 ]
  [ 4 ] [ 5 ] [ 6 ]
  [ 7 ] [ 8 ] [ 9 ]
  [ ± ] [ 0 ] [ ⌫ ]
  [        Suivant ✓        ]
```

- **Pavé numérique intégré**, toujours affiché, avec de grosses touches. Jamais le clavier système.
- Une cellule est « en cours » à la fois. **Suivant** valide le nombre et passe au joueur suivant. Après le dernier joueur, la manche est validée et la manche suivante commence sur le premier joueur.
- Une cellule laissée vide puis validée vaut **0** *(mon choix : au Skyjo ou au Flip 7, 0 est courant, et ça évite une touche)*.
- **±** change le signe du nombre en cours (Mille Sabords, Skyjo).
- **Corriger** : toucher n'importe quelle cellule déjà remplie la rend « en cours ». On tape la nouvelle valeur, Suivant la remplace et revient là où on en était.
- Les colonnes défilent horizontalement quand il y a beaucoup de manches ; la colonne des noms et celle du total restent visibles, et la manche en cours est toujours à l'écran.
- Sous le tableau, une ligne d'information : le plus proche de la fin (« Inès est à 58 / 100 ») ou « Manche 4 / 11 · 6 cartes » aux Cinq Rois.
- Menu ⋯ : modifier le réglage de fin, supprimer la dernière manche, **Terminer la partie** (enregistre et affiche le classement), **Abandonner** (rien n'est enregistré), avec confirmation pour les deux derniers.
- **Belote** : 2 lignes (une par équipe). Quand on valide les points de la première équipe, la cellule de la seconde est pré-remplie avec `162 − x` (si 0 ≤ x ≤ 162), déjà sélectionnée : Suivant l'accepte, taper un autre nombre la remplace (belote-rebelote, capot, litige…).
- **Manche incomplète** : seules les manches complètes comptent. Les totaux affichés, la fin de partie, le classement et l'historique ignorent une manche entamée. « Terminer la partie » reste possible au milieu d'une manche : la manche entamée est alors laissée de côté et n'est pas enregistrée. « Supprimer la dernière manche » efface la manche entamée s'il y en a une, sinon la dernière manche complète *(mon choix)*.
- L'écran reste allumé (`keepAwake`) tant que la feuille est affichée.
- La feuille est enregistrée après chaque saisie : fermer l'app et revenir la retrouve à l'identique.

### 6.5 Fin de partie

- Dès qu'une **manche complète** est validée et que la condition de fin est atteinte (un total atteint le seuil, ou le nombre de manches est joué), un écran le propose : « Inès a atteint 100 ! » avec **Voir le classement** et **Continuer la feuille** *(on continue si le jeu demande de finir le tour, ou si on s'est trompé)*.
- Après « Continuer », l'écran de fin **revient à chaque manche complète** tant que la condition est remplie. Aucun état « déjà proposé » n'est stocké : c'est simple, et ça couvre le tour final de Mille Sabords ou de Skyjo *(mon choix)*.
- Le classement réutilise `PodiumView` : rangs calculés selon le sens de la victoire (le plus bas premier au Skyjo et aux Cinq Rois), ex æquo au même rang. Les totaux sont affichés tels quels.
- La partie entre dans l'historique au moment où on affiche le classement (fin atteinte ou « Terminer la partie »). La feuille en cours est alors vidée.
- Boutons du podium : **Rejouer** (même jeu, mêmes joueurs, même réglage, nouvelle feuille) et **Accueil**.

### 6.6 Historique et bilans

```
 ←  Historique et bilans
   [Mille S.] [5 Rois] [Skyjo] [Flip 7] [Belote]   ← Pills, un jeu à la fois

   Bilans · 12 parties
   1. Léa      8 victoires / 12   67 %
   2. Tom      3 victoires /  9   33 %
   3. Inès     1 victoire  / 11    9 %

   Parties
   16 nov. · Léa 87 – Tom 102 – Inès 131     🏆 Léa
   14 nov. · …
```

- Un jeu affiché à la fois, choisi par des pastilles (`Pills`). Par défaut, le dernier jeu joué.
- **Bilans** par joueur pour ce jeu : parties jouées, victoires, pourcentage ; tri par victoires puis pourcentage. Un ex æquo à la 1ʳᵉ place compte comme une victoire pour chacun. À la Belote, la victoire d'une équipe compte pour ses deux joueurs.
- **Reconnaissance d'un joueur** : par prénom, en ignorant majuscules, accents et espaces en trop (`normalizeWord` de `src/lib/normalize.ts`). Le nom affiché est l'orthographe la plus récente.
- **Parties** : de la plus récente à la plus ancienne, avec la date, les totaux et le gagnant. Toucher une partie ouvre sa feuille complète en lecture seule, avec **Supprimer cette partie** (confirmation).
- Rien à afficher : un message simple (« Aucune partie de Skyjo terminée pour l'instant »).

## 7. Données (indicatif)

- `scores:current` : la feuille en cours ou rien. Contient l'identifiant du jeu, la date de début, le réglage de fin, les participants (joueurs, ou équipes avec leurs prénoms), les manches (pour chaque manche, un score par participant, `null` tant que non saisi) et la position de la cellule en cours.
- `scores:history` : la liste des parties terminées, avec les mêmes informations plus la date de fin. Le classement et les bilans sont **recalculés** à partir des manches, pas stockés *(mon choix : une seule source de vérité, et supprimer une partie met les bilans à jour sans effort)*.
- `scores:settings` : la dernière valeur de fin utilisée par jeu.
- Volume : une partie pèse environ 1 Ko ; pas de limite à l'historique en v1.

Les prénoms sont **copiés** dans la partie, pas référencés par identifiant : renommer ou retirer un joueur de la soirée ne modifie pas l'historique.

## 8. Laissé au constructeur

- Les routes (par exemple `/scores`, `/scores/partie`, `/scores/historique`), en suivant `src/lib/router.ts`.
- Comment la carte de l'accueil s'insère dans la grille : une entrée du registre `games` ou une carte à part. `GameModule` impose `players` et `settings`, qui ne vont pas tout à fait ici.
- Le détail visuel du tableau et du pavé, dans le respect de la charte (gros boutons qui s'enfoncent, `--radius-btn`, polices Fredoka / Nunito).
- La structure des fichiers : un dossier `src/games/scores/` (ou `src/scores/`) avec les fiches, la logique pure testée (totaux, fin de partie, classement, bilans) et les écrans.
- Le retour sonore et haptique des touches du pavé (`tap()`).
- Le pas du réglage de fin (le `Stepper` actuel avance de 1 ; il faut un pas adapté, par exemple 500 pour Mille Sabords, 50 pour la Belote, 10 pour Skyjo et Flip 7, 1 pour les manches).
