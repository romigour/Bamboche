# Bamboche — Undercover (design)

Date : 2026-11-15. Complète le spec général `2026-11-15-bamboche-design.md` (charte, architecture, contraintes), qui reste la référence pour tout ce qui n'est pas précisé ici.

## 1. Intention

Ajouter Undercover comme troisième jeu jouable de Bamboche, pour les soirées entre amis : un seul téléphone qu'on se passe, sans réseau. Chacun découvre en secret un mot ; tous ont le même sauf l'undercover (mot proche) et, en option, Mr White (aucun mot). On décrit son mot à voix haute, on débat, on élimine quelqu'un par un vote **à voix haute**. Les parties s'enchaînent dans la soirée avec des **points cumulés et un classement final**.

L'app ne remplace pas la discussion : elle distribue les mots en secret, dit qui parle, enregistre l'éliminé, révèle son rôle, détecte la fin et tient les scores.

## 2. Objectifs, non-objectifs, anti-objectifs

**Objectifs**
- Partie complète : distribution secrète des mots, manches de parole, vote, révélation, Mr White qui tente le mot, fin de partie.
- Série de parties avec scores cumulés, tableau des scores entre les parties, podium final.
- Mr White facultatif ; un seul undercover.
- Reprise après fermeture de l'app, sans jamais réafficher un mot sans geste du joueur.
- Une liste d'environ 150 paires de mots intégrée.

**Non-objectifs**
- Vote secret sur le téléphone (écarté par le partenaire : vote à voix haute).
- Plusieurs undercovers, plusieurs Mr White.
- Ajouter ou retirer un joueur en cours de série.
- Saisie de paires de mots personnalisées dans l'app.
- Réglages de barème dans l'app.

**Anti-objectifs (échec même si « ça marche »)**
- Qu'un joueur voie le mot d'un autre : mot affiché sans geste explicite, mot resté à l'écran au moment de passer le téléphone, mot réaffiché à la reprise.
- Révéler aux joueurs encore en jeu une information qui tranche la partie (ex. afficher le mot des civils quand Mr White est éliminé, alors que l'undercover est encore en jeu).
- Perdre les scores de la soirée parce que l'app s'est fermée.
- Petits textes ou petits boutons en plein jeu.

## 3. Contraintes

Celles du spec général (PWA hors ligne, GitHub Pages, smartphone portrait une main, iOS sans vibration, écran allumé, charte « touche de jeu », un seul bouton jaune par écran, couleur Undercover `#A98BFF` / ombre `#6E4FD6`). Le nom « Undercover » est conservé pour l'instant (décision du partenaire, spec général §9).

## 4. Approches considérées

| Approche | Pour | Contre |
|---|---|---|
| **Module calqué sur Time Up / Blindtest (retenue)** : `logic/` pur et testé, `session.ts` sauvegardé, écrans Svelte, réutilisation de `lib/` | Cohérent avec le reste, peu de code nouveau partagé, testable | — |
| Extraire d'abord un moteur générique « rôles secrets / passe le téléphone » dans `lib/` | Réutilisable plus tard | Aucun autre jeu n'en a besoin : abstraction prématurée. On extraira si un futur jeu le demande |
| Vote secret, téléphone passé à chacun | Vote non influencé | Un passage de téléphone par joueur et par manche, casse le débat. Écarté par le partenaire |

Le partenaire a validé l'approche retenue et le vote à voix haute.

## 5. Règles (décidées avec le partenaire)

### 5.1 Composition
- Joueurs : **tous les joueurs de la liste de la soirée** (`lib/players`). *(Choix du rédacteur, comme le Blindtest en chacun pour soi.)*
- **1 undercover**, **Mr White en option** (0 ou 1). Les autres sont civils.
- Minimum : **3 joueurs sans Mr White, 4 avec** (il faut au moins 2 civils au départ). Maximum 20 (module existant).

### 5.2 Mots
- L'app tire une **paire de mots proches** non encore jouée dans la série, puis tire au hasard lequel des deux va aux civils ; l'autre va à l'undercover. Quand toutes les paires ont été jouées dans la série, on repart de la liste complète. *(Choix du rédacteur.)*
- Les rôles sont tirés au sort parmi les joueurs.
- Un joueur voit **son mot seulement**, pas son rôle : civils et undercover ne savent pas qui ils sont. Mr White voit qu'il est Mr White (« Tu n'as pas de mot. Écoute et bluffe ! »).

### 5.3 Manche
1. L'app annonce qui parle en premier, puis affiche l'ordre du tour de table (joueurs encore en jeu, dans l'ordre de la liste, en partant du premier). Chacun dit un mot ou une phrase à voix haute.
   - Premier orateur de la manche 1 : tiré au hasard parmi les joueurs en jeu, **jamais Mr White**.
   - Manches suivantes : le joueur en jeu qui suit, dans l'ordre de la liste, le premier orateur de la manche précédente (même si celui-ci a été éliminé), toujours en sautant Mr White. *(Choix du rédacteur.)*
2. Débat, puis vote à voix haute (tout le monde pointe en même temps). Le groupe règle les égalités de vive voix ; l'app n'enregistre que le résultat.
3. On touche le nom de l'éliminé, on confirme (« Éliminer Tom ? »), l'app révèle **son rôle seulement** (Civil, Undercover ou Mr White), jamais son mot.
4. Si l'éliminé est **Mr White** : il dit à voix haute le mot qu'il devine ; le groupe juge et touche **Trouvé** ou **Raté**. L'app n'affiche pas le mot des civils à ce moment. *(Choix du rédacteur : pas de saisie clavier, pas de problème de fautes.)*
5. Pas d'annulation après une élimination : l'étape de confirmation sert de garde-fou ; Trouvé / Raté n'ont pas de confirmation supplémentaire. *(Choix du rédacteur.)*

### 5.4 Fin de partie (vérifiée après chaque élimination, ou après le Trouvé/Raté de Mr White)
- **Mr White trouve le mot** → Mr White gagne seul, la partie s'arrête.
- **Undercover et Mr White (s'il y en a un) éliminés** → victoire des civils.
- **Il ne reste qu'un civil en jeu** → victoire des imposteurs encore en jeu (undercover et/ou Mr White).
- Sinon : manche suivante.

### 5.5 Barème (validé par le partenaire)
- Victoire des civils : **+2** pour chaque civil, éliminé ou non.
- Victoire de l'undercover (en jeu à la fin) : **+10**.
- Victoire de Mr White (en jeu à la fin, ou mot trouvé) : **+6**.
- Si l'undercover et Mr White sont tous deux en jeu quand il ne reste qu'un civil, chacun marque ses points. Un imposteur éliminé ne marque rien.

### 5.6 Série
- Une série = plusieurs parties avec les mêmes joueurs ; les scores s'additionnent.
- Fin de partie → écran de fin (rôles, mots, points gagnés) → tableau des scores de la série → **« Partie suivante »** (mêmes joueurs, nouvelle paire, nouveaux rôles) ou **« Terminer »** → podium.
- La liste des joueurs est figée pendant la série (instantané des noms au lancement). Pour changer de joueurs, on termine et on relance. *(Choix du rédacteur, accepté par le partenaire.)*

## 6. Parcours et écrans

Routes : `#/undercover` (préparation) et `#/undercover/partie` (partie, série, podium). Tous les écrans prennent la couleur Undercover.

1. **Préparation « Qui joue ? »** : liste des joueurs de la soirée, bouton « Configurer les joueurs » (→ `/joueurs` puis retour, comme le Blindtest), choix **Mr White : Non / Oui** (`Pills`, mémorisé), rappel de la composition (« 1 undercover · 1 Mr White · 4 civils »), bouton **Lancer** désactivé avec message si trop peu de joueurs.
   - Mr White n'est pas un `SettingDef` (qui ne connaît que des nombres) : c'est un choix de l'écran, mémorisé dans le stockage local, défaut **Non**. *(Choix du rédacteur.)* `settings: []` reste vide.
2. **Distribution** (pour chaque joueur, dans l'ordre de la liste) :
   - **Passe le téléphone à Léa** (`TransitionScreen`) → « C'est moi, voir mon mot ».
   - **Mot secret** : le mot en très grand, bouton « J'ai retenu ». Variante Mr White. Après le bouton, le mot disparaît avant que l'écran suivant ne s'affiche (pas d'animation de sortie qui le laisse visible).
3. **Manche** : « Manche 2 · Léa commence », ordre du tour de table (éliminés retirés), bouton **« Passer au vote »**.
4. **Vote** : « Qui est éliminé ? », une grosse touche par joueur en jeu, puis confirmation.
5. **Révélation** : « Tom était… » puis le rôle en grand. Mr White : écran « Mr White tente le mot des civils » avec **Trouvé** (vert) / **Raté** (rouge).
6. **Fin de partie** : camp gagnant, les deux mots (civils / undercover), le rôle de chaque joueur, les points gagnés (« +2 », « +10 »).
7. **Scores de la série** : classement cumulé (`rankScores`), points de la dernière partie en regard, boutons « Partie suivante » (jaune) et « Terminer ».
8. **Podium** : `PodiumView` partagé, une entrée par joueur (couleurs prises dans `TEAM_COLORS` en tournant). « Rejouer » = nouvelle série avec les joueurs actuels de la soirée ; « Accueil ».
9. **Menu pause** (pendant la partie) : reprendre ; **revoir son mot** (choisir son nom parmi les joueurs en jeu → « Passe le téléphone à… » → mot → retour) ; scores de la série ; quitter la série (avec confirmation, abandonne la série).

## 7. Sauvegarde et reprise

- État sauvegardé à chaque action (`session.ts`, clé `undercover:…`), `setActiveGame('undercover')` pendant toute la série, retiré à la fin ou à l'abandon.
- L'état contient la série (joueurs figés, totaux, paires déjà jouées, n° de partie) et la partie en cours (paire, mot des civils, rôles, éliminés, phase, avancement de la distribution, premier orateur).
- **Reprise sans fuite** : si l'app se rouvre pendant la distribution, on revient à « Passe le téléphone à <joueur dont c'est le tour> », jamais sur l'écran du mot. Idem pour « revoir son mot ». Une révélation de rôle peut être réaffichée (elle est publique).
- Carte de reprise sur l'accueil (`ResumeSheet` dans `App.svelte`) : par ex. « Partie 3 · 5 joueurs en jeu ».
- État illisible ou d'une autre version → ignoré, comme Time Up.
- Lancer Undercover alors qu'une partie d'un autre jeu est sauvegardée la remplace, comme Time Up et Blindtest le font déjà. *(Choix du rédacteur.)*

## 8. Paires de mots

- `src/games/undercover/words.json` : environ 150 paires `{ "civil": …, "undercover": … }` ou équivalent (l'ordre n'a pas d'importance, il est tiré au sort), proches mais distinctes, tous publics, français. Ex. plage / piscine, café / thé, chat / chien.
- Test : pas deux paires identiques (accents, majuscules et ordre ignorés, via `lib/normalize`), pas de paire dont les deux mots sont identiques.

## 9. Ce qui est réutilisé

`lib/players`, `lib/storage`, `lib/activeGame`, `lib/random` (tirages testables avec `test-rng`), `lib/ranking`, `lib/normalize`, `lib/feedback`, `lib/wakelock`, et l'UI : `Screen`, `BigButton`, `IconButton`, `Pills`, `TransitionScreen`, `PodiumView`.

## 10. Finitions

- `module.ts` : statut `disponible`, `players.min` reste 3.
- Routes branchées dans `App.svelte`, reprise ajoutée à la carte de reprise.
- README : Undercover dans les jeux disponibles, section « Paires de l'Undercover ».

## 11. Laissé au constructeur

- Contenu exact des ~150 paires.
- Découpage précis des fichiers et des écrans, forme de l'état, animations.
- Textes d'écran exacts (dans le ton des autres jeux).
- Tests : logique de jeu (tirages, ordre de parole, fins de partie, barème, série) couverte par Vitest ; tests d'écran sur les points sensibles (le mot n'apparaît qu'après le geste, préparation qui bloque sous le minimum).
