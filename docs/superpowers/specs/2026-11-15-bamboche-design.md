# Bamboche — document de conception

Date : 2026-11-15 · Statut : validé le 2026-11-15

## 1. Intention

Bamboche est une PWA de jeux de soirée (Time Up, Blindtest, puis Hipster, Undercover…), jouée **sur un seul téléphone** qu'on se passe ou qu'un animateur tient. Elle doit être très intuitive, utilisable d'une main et lisible de loin, avec un côté fun, coloré et « app de jeu » (gros boutons qui s'enfoncent).

Le projet commence par le design (charte graphique + écrans), puis Time Up, puis Blindtest. L'architecture doit rendre l'ajout d'un jeu simple.

Charte et maquettes de référence : canvas « Bamboche — Charte graphique » (https://claude.ai/artifact/Xi2FYxsuJQ4rXjPX5ccdEk).

## 2. Objectifs, non-objectifs, anti-objectifs

**Objectifs (v1)**
- Coquille d'app : accueil avec la grille des jeux, réglages globaux (liste de joueurs), installation en PWA, fonctionnement hors ligne (sauf Blindtest).
- Time Up complet, conforme au parcours de la section 6.
- Blindtest (phase 2) avec des playlists intégrées à l'app (section 7).
- Une architecture « un module par jeu » : ajouter un jeu = ajouter un dossier.

**Non-objectifs (v1)**
- Hipster et Undercover (affichés « Bientôt » sur l'accueil).
- Multi-téléphones, comptes, serveur, synchronisation.
- Création/édition de paquets de mots ou de playlists dans l'app (playlists définies par l'app ; mots perso saisis seulement pendant la préparation d'une partie).
- Autres langues que le français.
- Spotify Connect (prévu plus tard, voir 7.4).

**Anti-objectifs (échec même si « ça marche »)**
- Devoir lire du petit texte ou viser de petits boutons en plein jeu.
- Perdre une partie en cours parce que l'app s'est fermée ou rechargée.
- Que le joueur suivant voie les mots avant son tour.
- Un écran qui plante ou reste muet (Blindtest sans réseau, son bloqué…).

## 3. Contraintes

- **Hébergement GitHub Pages** : fichiers statiques uniquement, pas de serveur, servi sous un sous-chemin `/<repo>/`.
- **Smartphone d'abord** (iOS Safari et Android Chrome), portrait, une main.
- **iOS Safari** : pas de vibration (`navigator.vibrate` absent) → le retour au toucher passe aussi par le son et l'animation. Le son ne peut démarrer qu'après un geste utilisateur.
- **Écran allumé** pendant une partie via l'API Wake Lock (quand disponible).
- **Diffusion** : dépôt GitHub public, site GitHub Pages public, adresse partagée seulement entre amis (pas de promotion).
- **Noms de jeux** : aucun nom de marque déposée. « Time's Up », « Hitster » et « Undercover » sont à remplacer à terme par des noms propres à Bamboche ; les noms initiaux sont conservés pour l'instant (section 9). « Blindtest » est un terme générique et reste.
- **Extraits Spotify** : les liens `p.scdn.co/mp3-preview/...` fonctionnent aujourd'hui mais Spotify les a retirés de son API fin 2024 ; ils peuvent disparaître. Les conditions développeur de Spotify encadrent les usages « jeu / quiz ». Risque accepté pour un usage entre amis ; à revoir si l'app devait être diffusée largement.

## 4. Approches considérées

| Approche | Pour | Contre |
|---|---|---|
| **Svelte + Vite + PWA, un module par jeu (retenue)** | Léger et rapide sur mobile, animations/transitions intégrées, code court, ajout de jeu trivial | Communauté plus petite que React |
| React + Vite, même architecture | Écosystème énorme | Plus lourd, animations via une lib en plus |
| HTML/CSS/JS sans outil | Zéro installation | Devient vite emmêlé avec ~30 écrans et plusieurs jeux |

Écartés : Flutter / Ionic (lourds, lents à charger en web, sans gain pour une PWA sur GitHub Pages).

**Source musicale du Blindtest**

| Option | Pour | Contre |
|---|---|---|
| Deezer (extraits 30 s via API, JSONP) | Gratuit, sans compte | Abandonné au profit des exports Spotify déjà disponibles |
| **Extraits 30 s issus des exports Exportify (retenue, v1)** | Aucun compte, marche sur tout téléphone, données déjà prêtes | Liens susceptibles de disparaître ; 30 s, début imposé |
| Spotify Connect via Web API (plus tard) | Titres complets, départ à une position choisie, durable | App Spotify ouverte, Premium, notification qui montre le titre, quota développeur limité à quelques comptes |
| Spotify Web Playback SDK | Titres complets dans la page | **Non supporté sur navigateur mobile** → écarté |
| Spotify Embed | Simple | Affiche titre/pochette, souvent limité à 30 s sur iOS → écarté |

Le partenaire a choisi : Svelte (option 1) ; extraits issus d'Exportify en v1, Spotify Connect plus tard si besoin.

## 5. Architecture (décidée)

- **Svelte 5 + Vite + TypeScript**, `vite-plugin-pwa` (manifest, service worker, cache hors ligne de l'app et des paquets de mots).
- **Routage par hash** (`#/timeup/equipes`) pour éviter les 404 de GitHub Pages sur rechargement. *(Choix du rédacteur.)*
- **Déploiement** : GitHub Actions → GitHub Pages à chaque push sur `main`.
- **Stockage local** (`localStorage`, ou IndexedDB si besoin) : joueurs, réglages par jeu, **partie en cours** (sauvegardée à chaque action pour reprise après fermeture). *(Choix du rédacteur.)*
- **Module de jeu** : chaque jeu est un dossier `src/games/<id>/` qui exporte une description :
  - `id`, `nom`, `couleur` (+ ombre), `icône`, `joueurs min/max`, `statut` (`disponible` | `bientot`) ;
  - `réglages` : schéma des réglages par jeu (type, défaut, bornes) affichés automatiquement dans l'écran de réglages du jeu ;
  - ses écrans et sa logique.
  L'accueil se construit à partir de la liste des modules.
- **Logique de jeu séparée de l'affichage** (fonctions pures / machine à états testables avec Vitest), notamment : rotation des équipes et des joueurs, paquet de cartes, passage de manche, scores, déduplication.
- **Bibliothèque de composants partagés** reprenant la charte : `BigButton` (variantes pop/jeu/secondaire/fantôme/icône/action), `GameCard`, `Stepper`, `Pills`, `TimerBar`, `TeamRow`, `TransitionScreen` (« Passe le téléphone à… »).

## 6. Charte graphique (décidée, voir canvas)

- **Fonds** : Nuit `#1A1033`, Surface `#2A1D52`, Surface+ `#3A2A6B`, ligne `#4B3A80`. Texte `#FFFFFF`, texte doux `#C9BFEA`.
- **Couleurs** (texte nuit dessus), avec ombre pleine : Pop/action `#FFD23F`/`#C99A00`, Time Up `#FF8A3D`/`#C85A14`, Blindtest `#FF5C9A`/`#C42E6A`, Hipster `#3DD6D0`/`#1A9A95`, Undercover `#A98BFF`/`#6E4FD6`, Trouvé `#4ADE80`/`#1E9E50`, Raté/passer `#FF6B6B`/`#C02E2E`.
- **Typo** : Fredoka (titres, boutons, chiffres ; 500–700), Nunito (texte ; 400–800). Échelle : géant 96, titre 32, sous-titre 22, texte 17, label 13 (majuscules, espacé).
- **Boutons « touche de jeu »** : ombre pleine de 6 px sous le bouton ; à l'appui, le bouton descend de 4 px. Hauteurs 64 (principal), 56 (secondaire/icône), ~100 (actions de jeu). Rayon 22. **Un seul bouton jaune par écran.** Cibles ≥ 56 px.
- **Une couleur = un jeu** : l'en-tête et les accents de chaque écran de jeu prennent la couleur du jeu.
- **Toujours un retour** : chaque tap s'enfonce, et selon le contexte vibre (Android) et/ou sonne.
- Icônes : SVG au trait arrondi (pas d'emoji).

## 7. Parcours

### 7.1 Coquille
- **Accueil** : logo, « On joue à quoi ? », grille 2 colonnes de cartes de jeu (les jeux « bientôt » en pointillés), bouton Réglages en haut, raccourci « Joueurs de la soirée ».
- **Réglages globaux** : liste des joueurs (ajouter, renommer, supprimer). D'autres réglages pourront s'ajouter (ex. son on/off).
- **Réglages par jeu** : accessibles depuis l'écran de préparation du jeu ; valeurs mémorisées.
- **Reprise** : si une partie est en cours au lancement, proposer « Reprendre la partie » ou « Abandonner ».

### 7.2 Time Up

**Règles** : 3 manches avec les mêmes cartes — 1) décrire librement sans dire le mot, 2) un seul mot comme indice, 3) mimer sans parler. 1 point par carte trouvée ; on additionne sur les manches ; le plus de points gagne.

**Réglages du jeu** (mémorisés) : durée d'un tour (défaut **60 s**), nombre de manches (1 à 3, défaut 3, on joue les N premières), nombre de cartes en partie rapide (défaut 40 *(choix du rédacteur)*), nombre de mots par équipe en partie personnalisée (défaut 5).

**Parcours**
1. **Équipes** : par défaut 2 équipes ; pas de limite d'équipes ; **au moins 2 joueurs par équipe** (le bouton Continuer reste désactivé sinon, avec un message). Les joueurs viennent de la liste globale ; bouton **« Configurer les joueurs »** qui mène à l'écran de gestion des joueurs puis revient. Bouton **« Tirage au sort »** pour répartir au hasard. Noms d'équipe générés et modifiables, couleur d'équipe tirée de la palette. Réglage de la durée du tour visible ici.
2. **Mode** : *Partie rapide* (cartes tirées d'un fichier de mots intégré) ou *Partie personnalisée* (demande le nombre de mots par équipe).
3. **Saisie personnalisée** (si choisie) : pour chaque équipe à tour de rôle, écran de transition « Passe le téléphone à l'équipe X », puis saisie des X mots (les mots déjà saisis par les autres équipes sont invisibles).
4. **Tri des doublons** : comparaison sans tenir compte des majuscules, accents, espaces superflus et ponctuation. Pour chaque doublon, l'équipe qui l'a saisi en second est invitée à proposer un autre mot (avec écran de transition). *(Choix du rédacteur.)*
5. **Annonce de manche** : « Manche 1 : Décrire » avec le rappel de la règle.
6. **Lancement d'un tour** : écran aux couleurs de l'équipe, « Au tour des Flamants — Tom fait deviner », bouton **Lancer**. Les joueurs tournent au sein de chaque équipe d'un tour à l'autre. *(Choix du rédacteur.)*
7. **Tour** : le chrono défile, une carte s'affiche ; boutons **Passer** (croix rouge) et **Trouvé** (check vert), énormes, en bas. Balayage de la carte (droite = trouvé, gauche = passer) en complément. *(Choix du rédacteur.)* Passer remet la carte au fond du paquet, sans pénalité. Son de tic-tac les 5 dernières secondes, signal à la fin. À zéro, la carte affichée retourne dans le paquet.
8. **Récap du tour** : mots trouvés ce tour (liste, avec possibilité d'annuler une erreur de tap *(choix du rédacteur)*), total de l'équipe sur la manche, nom de l'équipe suivante, bouton **« Équipe suivante »** → retour à l'étape 6.
9. **Fin de manche** : quand toutes les cartes ont été trouvées, le tour s'arrête ; écran de scores de la manche, puis annonce de la manche suivante (étape 5). La manche suivante commence avec l'équipe suivante dans la rotation. *(Choix du rédacteur.)*
10. **Fin de partie** : podium avec les totaux (ex æquo gérés), boutons « Rejouer » (mêmes équipes) et « Accueil ».

Un menu pause pendant la partie : reprendre, voir les scores, quitter la partie.

### 7.3 Blindtest (phase 2)

**Rôle** : l'animateur tient le téléphone. Il lance l'extrait, les joueurs crient la réponse, il attribue le point à l'équipe qui a trouvé (ou personne), puis révèle la réponse.

**Réglages du jeu** : nombre d'extraits (10/15/20), durée d'écoute (10/20/30 s).

**Tirage des extraits** : au hasard dans la playlist, en évitant les titres déjà joués récemment sur ce téléphone (historique local, réinitialisé quand la playlist est épuisée). *(Choix du rédacteur.)*

**Playlists** : la v1 sort avec **une seule playlist** (issue de l'export « Hitster original – France », renommée, ex. « Hits de toujours »). D'autres (Années 80, Années 90, Française, Rap FR, Rap US…) seront ajoutées plus tard via le script d'import. L'écran de choix de playlist existe dès la v1 (avec une seule carte) pour que l'ajout ne demande aucun travail d'interface.

**Parcours** : équipes (même composant que Time Up, mais configuré par jeu : le Blindtest accepte des équipes d'un seul joueur, donc du chacun pour soi *(choix du rédacteur)*) → choix d'une playlist → pour chaque extrait : lecture avec animation et barre de progression → « Qui a trouvé ? » (une touche par équipe, + « Personne ») → **révélation** (pochette en grand, titre, artiste, année, équipe qui marque) → « Extrait suivant » → podium final.

**Réseau** : requis. Sans réseau, message clair « Connexion requise pour la musique » sur la carte du jeu et à l'entrée du jeu ; extrait qui ne charge pas → passer automatiquement au suivant en le signalant.

### 7.4 Source musicale et playlists

- Interface `MusicSource` (charger, jouer depuis une position, pause, arrêt, événements fin/erreur). Implémentation v1 : `PreviewSource` (élément `<audio>` sur l'URL d'extrait). Plus tard : `SpotifyConnectSource` (OAuth PKCE côté client + Web API « start playback » avec `position_ms`), sans changer les écrans.
- **Playlists intégrées** : générées à partir des CSV Exportify par un script `scripts/import-playlist` (exécuté par le développeur, pas dans l'app) → un JSON par playlist dans le dépôt, avec métadonnées (id, nom, couleur, description).
- **Champs conservés** par titre : URI Spotify, titre, artiste(s), album, date de sortie (→ année), URL de la pochette, URL de l'extrait, durée (ms), ISRC, popularité. Champs supprimés : URI d'artistes/d'album, artistes de l'album, n° de disque, n° de piste, explicite, ajouté par, ajouté le. Les titres sans URL d'extrait sont écartés et signalés par le script.
- Pour le futur jeu type Hitster : l'année vient de l'album (compilations/remasters faussés) → prévoir un champ `annee_corrigee` optionnel.
- Exemple de CSV disponible : export « Hitster original – France », 308 titres, tous avec extrait.

## 8. Écrans à dessiner sur le canvas avant le code

Ordre de travail : **design d'abord** (souhait du partenaire). Les écrans ci-dessous sont dessinés sur le canvas avec la charte, puis validés par le partenaire avant de coder Time Up. Les écrans Blindtest peuvent être dessinés et validés juste avant la phase 2.

Déjà dessinés : accueil, préparation Time Up, tour Time Up, Blindtest en écoute. À ajouter : réglages globaux / joueurs, création des équipes (avec tirage au sort), choix du mode, saisie personnalisée, transition « Passe le téléphone », doublons, annonce de manche, lancement de tour, récap de tour, fin de manche, podium, pause, reprise de partie ; Blindtest : choix de playlist, « Qui a trouvé ? », révélation, hors ligne.

## 9. Noms des jeux

**Décision du partenaire : on garde pour l'instant les noms initiaux (Time Up, Blindtest, Hipster, Undercover) ; on les changera plus tard si besoin.** Propositions de remplacement, pour mémoire :

| Jeu | Propositions |
|---|---|
| Time Up | Chrono Mots · Mimes & Mots · Trois Manches |
| Blindtest | Blindtest (générique, conservé) |
| Hipster (frise musicale) | Frise Musicale · Remonte le Temps · Rétro Hits |
| Undercover | L'Intrus · Le Traître · Taupe |

Le nom retenu est une simple donnée du module de jeu : il peut changer à tout moment sans impact sur le reste.

## 10. Laissé au constructeur

- Contenu du fichier de mots de la partie rapide (environ 200 mots français variés : célébrités, personnages, objets, lieux ; tous publics).
- Sons (tic-tac, fin de tour, trouvé, passer) : courts, libres de droits, embarqués.
- Icônes PWA, écran de démarrage, nom de dépôt / sous-chemin.
- Structure exacte des dossiers, gestion d'état (stores Svelte), animations précises.
- Tests : logique de jeu couverte par Vitest ; tests d'interface au choix.
