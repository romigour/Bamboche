# Bamboche — Cris d'animaux (design)

Date : 2026-11-19. Complète le spec général `2026-11-15-bamboche-design.md` (charte, architecture, contraintes), qui reste la référence pour tout ce qui n'est pas précisé ici.

## 1. Intention

Ajouter un jeu de devinettes sonores pour les soirées où **enfants et adultes jouent ensemble** : l'app joue le cri d'un animal, chacun choisit parmi quelques propositions lequel c'est, puis on révèle la bonne réponse. L'app remplace le meneur de quiz : elle tire les sons et les propositions, cache la réponse à tout le monde (animateur compris), enregistre les réponses et compte les points.

## 2. Objectifs, non-objectifs, anti-objectifs

**Objectifs**
- Partie complète : tirage des sons, propositions, saisie des réponses de chaque joueur, révélation, scores, podium.
- Une banque d'environ 60 à 80 animaux choisis à la main, avec un niveau et une famille, une photo et l'auteur du son.
- Trois niveaux de partie (Facile / Mélangé / Expert) qui jouent sur le choix des sons et le piège des propositions.
- Jouable hors ligne une fois les sons téléchargés.
- Reprise après fermeture de l'app.

**Non-objectifs**
- Course de vitesse, buzzers, points selon l'ordre de réponse (décision du partenaire : la vitesse ne compte pas).
- Niveau différent par joueur (décision du partenaire : un seul niveau pour la partie).
- Équipes.
- Tirage d'animaux directement dans Wikimedia pendant la partie.
- Ajout de sons par l'utilisateur dans l'app.

**Anti-objectifs (échec même si « ça marche »)**
- Que l'animateur (ou n'importe qui) voie la bonne réponse avant la révélation : nom de fichier, ordre des propositions, photo ou crédit affichés trop tôt.
- Des cris inaudibles, couverts de bruit, mêlant plusieurs espèces ou trop longs : le jeu doit rester amusant pour un enfant.
- Des propositions qui rendent la réponse évidente en Expert, ou impossible en Facile.
- Petits textes ou petits boutons en plein jeu ; un écran muet si un son ne se charge pas.

## 3. Contraintes

- Celles du spec général : PWA hors ligne, GitHub Pages, smartphone portrait d'une main, iOS (son lancé seulement après un geste), écran allumé, charte « touche de jeu ».
- **Sons de Wikimedia Commons** (source choisie par le partenaire : catégorie *Audio files by species*). Licences CC-BY / CC-BY-SA / domaine public : **l'auteur et la licence de chaque son et de chaque photo doivent être crédités** dans l'app. Seuls les fichiers sous ces licences sont retenus (pas de licence NC ou ND).
- **Format** : MP3 (lisible sur iOS comme Android). Les originaux `.ogg`/`.oga`/`.wav` sont convertis.
- **Taille** : banque complète (sons + photos) visée sous 10 Mo.

## 4. Approches considérées

**Déroulé du jeu**

| Approche | Pour | Contre |
|---|---|---|
| Buzzers autour du téléphone posé au milieu | Vraie course | 4 joueurs au plus, les adultes raflent tout |
| **Animateur qui ne connaît pas la réponse, réponses notées dans l'app (retenue, proposée par le partenaire)** | Tout le monde joue, l'animateur aussi ; aucun arbitrage de vitesse ; pas de limite de joueurs | Un peu de saisie à chaque son |
| Chacun son tour contre le chrono | Juste, adaptable par joueur | Pas de jeu simultané |

**Origine des sons**

| Approche | Pour | Contre |
|---|---|---|
| **Sons embarqués dans l'app via un script d'import (retenue par le partenaire)** | Hors ligne, cris coupés à la bonne longueur, démarrage immédiat, indépendant de Wikimedia | +5 à 10 Mo, script plus long à écrire |
| Liens Wikimedia lus en direct | App légère | Réseau requis, liens fragiles, pas de découpe, latence |
| Tirage au hasard dans la catégorie pendant la partie | Aucune curation | Noms latins, qualité inégale, pas de niveau ni de photo → écarté |

## 5. Règles (décidées avec le partenaire)

- **Joueurs** : tous les joueurs de la liste de la soirée (`lib/players`), chacun pour soi. **L'animateur joue aussi** (il ne connaît pas la réponse). Minimum **2**, maximum 20. *(Animateur joueur : choix du rédacteur, non contesté.)*
- **Un son** :
  1. L'app affiche les propositions (4 par défaut) **sans indiquer la bonne**. L'animateur les lit à voix haute.
  2. Il lance le cri. Il peut le **réécouter autant qu'il veut**.
  3. Chacun annonce sa réponse ; l'animateur touche, pour chaque joueur, l'animal choisi. Une réponse se change tant qu'on n'a pas révélé.
  4. Quand tous les joueurs ont une réponse, **Révéler** s'active.
  5. Révélation : photo et nom de l'animal, liste des joueurs qui ont trouvé (+1 chacun), cri réécoutable.
- **Points** : **1 point par bonne réponse**, la vitesse ne compte pas.
- **Fin de partie** : après le nombre de sons choisi, podium (ex æquo gérés, composant `PodiumView`), boutons « Rejouer » et « Accueil ».

## 6. Niveaux et propositions

Chaque animal a un **niveau** (`facile` | `difficile`) et une **famille** (ex. ferme, oiseaux de nuit, oiseaux chanteurs, félins, canidés, primates, marins, amphibiens, insectes…).

- **Facile** : sons tirés parmi les animaux faciles ; les 3 autres propositions sont des animaux faciles **d'autres familles** (vache / chat / coq / loup).
- **Expert** : sons tirés parmi tous les animaux, de préférence difficiles ; les autres propositions viennent **d'abord de la même famille**, puis complétées ailleurs (hibou / chouette hulotte / effraie / pigeon).
- **Mélangé** : environ moitié faciles, moitié difficiles ; chaque son reçoit des propositions selon son propre niveau (règle Facile ou Expert). *(Choix du rédacteur.)*
- Un même animal n'apparaît pas deux fois comme réponse dans une partie. Comme au Blindtest, on évite les animaux joués récemment sur ce téléphone (historique local, remis à zéro quand la banque est épuisée). *(Choix du rédacteur.)*
- L'ordre des propositions est tiré au hasard.
- **Contrainte de contenu** : chaque famille utilisée en Expert compte au moins 4 animaux ; au moins 30 animaux faciles répartis sur au moins 5 familles.

## 7. Réglages du jeu (mémorisés, schéma `SettingDef`)

- Nombre de sons : 10 / 15 / 20 (défaut **10**).
- Nombre de propositions : 3 / 4 / 6 (défaut **4**). *(Choix du rédacteur.)*
- Niveau : Facile / Mélangé / Expert (défaut **Mélangé**). Choisi sur l'écran de préparation (`Pills`), pas dans les réglages génériques, car `SettingDef` n'accepte que des nombres. *(Choix du rédacteur.)*

## 8. Écrans

**Maquettes d'abord (décision du partenaire)** : les écrans Son, Révélation et Crédits sont dessinés sur le canvas de la charte et validés par le partenaire avant d'être codés. L'écran Son est dessiné avec 3 et avec 10 joueurs.

1. **Préparation** : joueurs de la soirée (+ bouton « Configurer les joueurs »), choix du niveau, bouton réglages, lien « Crédits des sons », bouton **Jouer**. Si les sons ne sont pas encore téléchargés et qu'il n'y a pas de réseau : message clair « Connexion requise pour télécharger les sons la première fois ».
2. **Son** (écran principal) :
   ```
   ┌───────────────────────┐
   │ Son 3 / 10       🔊 ↻ │
   │ Chouette · Loup ·     │
   │ Hibou · Chat          │
   │───────────────────────│
   │ Léa  [Ch][Lo][Hi][Ca] │
   │ Tom  [Ch][Lo][Hi][Ca] │
   │ Max  [Ch][Lo][Hi][Ca] │
   │      [ Révéler ]      │
   └───────────────────────┘
   ```
   Propositions en gros en haut, gros bouton lecture/réécoute, une ligne par joueur avec ses choix. Avec beaucoup de joueurs, la liste défile ; le bouton Révéler reste fixe en bas. La présentation exacte d'une ligne (boutons texte, initiales, emoji) est à dessiner.
3. **Révélation** : photo en grand, nom, qui a trouvé, scores du moment, « Son suivant ».
4. **Podium**.
5. **Crédits** : liste des animaux avec auteur et licence du son et de la photo, lien vers la page Wikimedia.
6. Menu pause : reprendre, voir les scores, quitter.

## 9. Banque de sons et script d'import

- **Liste source** dans le dépôt (ex. `scripts/animals.source.json`) écrite à la main : id, nom français, niveau, famille, nom du fichier son Commons, éventuellement début/fin de découpe, nom du fichier photo Commons.
- **Script** `scripts/import-animals` (lancé par le développeur, pas dans l'app) :
  - interroge l'API Commons pour l'URL du fichier, l'auteur et la licence ; refuse les licences non libres ;
  - télécharge le son, le découpe (≤ 10 s, sauf découpe donnée), normalise le volume, l'encode en MP3 mono ;
  - télécharge une photo réduite (WebP ou JPEG, ~600 px) ;
  - écrit les fichiers dans `public/animaux/` et un catalogue `animals.json` (id, nom, niveau, famille, chemins, crédits).
  - Écrit en TypeScript et lancé avec `vite-node`, comme `import-playlist`. Conversion avec ffmpeg fourni par la dépendance de développement `ffmpeg-static`, pour que le script tourne sur Windows sans rien installer à la main. *(Choix du rédacteur.)*
  - Réglages d'encodage pour tenir le budget : cris de 8 s au plus, MP3 mono 48 kbit/s, photos de 480 px environ en WebP. Le script affiche la taille totale de la banque et prévient au-delà de 10 Mo. Les 10 Mo sont un objectif, pas une limite stricte. *(Choix du rédacteur.)*
- **Noms de fichiers neutres** (l'id de l'animal haché ou un numéro), pour qu'un nom de fichier visible ne trahisse pas la réponse.
- **Curation (décidée avec le partenaire)** : le constructeur prépare environ 100 candidats (sons déjà découpés et photos). Le script génère une **page d'écoute** locale, hors de l'app : pour chaque animal, le cri, la photo, le nom, le niveau, la famille et une case garder / jeter. **Le partenaire écoute et coche lui-même** (critères : net, une seule espèce, reconnaissable, pas de bruit humain). La page exporte la sélection, que le script relit pour produire la banque finale. Les découpes à reprendre sont notées par le partenaire et corrigées dans la liste source.
- **Ordre de travail** : le jeu est codé en parallèle sur une **banque provisoire** d'une dizaine d'animaux. La curation ne bloque pas le code ; la banque finale remplace la provisoire quand elle est prête.

## 10. Hors ligne et cache

- Les sons et photos **ne sont pas dans le précache** du service worker (pour ne pas alourdir la première installation).
- À l'entrée dans le jeu, l'app télécharge en arrière-plan toute la banque dans un cache dédié, avec une indication de progression ; une fois complète, le jeu marche hors ligne.
- Un son qui ne se charge pas : message, et on passe au son suivant sans compter de points.

## 11. Architecture (comme les autres jeux)

- Dossier `src/games/animaux/` : `module.ts`, `logic/` (tirage, propositions, scores : fonctions pures testées avec Vitest), `session.ts` (partie en cours sauvegardée à chaque action, reprise), écrans Svelte, réutilisation de `lib/` (`players`, `random`, `ranking`, `ui/`).
- Lecture audio : un petit lecteur `<audio>` ; s'inspirer de `blindtest/music/player.ts` (déblocage iOS au premier tap) sans en dépendre.
- Nouvelle couleur de jeu à ajouter au type `GameColor` et aux tokens (ex. un vert « nature »), et une icône (patte). *(Choix du rédacteur.)*
- **Nom du jeu** : « Cris d'animaux » *(choix du rédacteur, modifiable comme les autres noms, spec général §9)*. Place sur l'accueil : après Undercover, avant la feuille de score.

## 12. Laissé au constructeur

- La liste des animaux, familles et découpes (dans les contraintes de la section 6).
- Les animations et les sons d'interface.
- La structure fine des fichiers, la clé de stockage, le nom du cache.
