# Supprimer « tirer pour recharger » et ajouter « Rechercher une mise à jour »

Taille : petit changement.

## Pourquoi

Sur mobile, recharger en tirant l'écran vers le bas laisse la page plus haute que la fenêtre, et une barre de défilement apparaît. La cause probable : les écrans sont dimensionnés en `100dvh`, une hauteur mesurée pendant que la barre d'adresse se cache puis réapparaît. Le geste était déjà censé être bloqué (`overscroll-behavior: none`), mais la règle est sur `body`, alors que Chrome ne la lit que sur `html`.

Ce geste servait aussi, en pratique, à récupérer la nouvelle version de l'appli installée. Une fois supprimé, il faut un autre moyen de mettre à jour.

## Objectifs

- Plus de rechargement par glissement, donc plus de page agrandie ni de barre de défilement.
- Un bouton « Rechercher une mise à jour » dans Réglages › Préférences, qui installe la nouvelle version s'il y en a une.
- Voir quelle version tourne.

## Non-objectifs et anti-objectifs

- Pas de bandeau automatique « nouvelle version » (approche C, écartée pour l'instant).
- Anti-objectif : l'appli ne doit **jamais** redémarrer toute seule en pleine partie.
- On ne touche pas aux `100dvh` des écrans : une fois le geste supprimé, ils ne posent plus de problème.

## Approches

- **A. Bouton qui vérifie et installe** — **retenue.** Un seul geste, avec une réponse claire.
- B. Bouton « Recharger » (`location.reload()`) : il faut souvent appuyer deux fois avant de voir la nouvelle version. Déroutant, donc écartée.
- C. A + bandeau automatique sur l'accueil : plus confortable, mais un écran de plus. Remise à plus tard.

## Design

1. **Geste supprimé** : dans `src/lib/theme/global.css`, `overscroll-behavior: none` passe de `body` à `html`.
2. **Mise à jour contrôlée** : `vite.config.ts` passe de `registerType: 'autoUpdate'` à `'prompt'`. Une nouvelle version téléchargée attend donc qu'on l'installe, et rien ne redémarre seul. L'enregistrement du service worker passe par `virtual:pwa-register`, dans un nouveau module `src/lib/update.ts` qui expose :
   - un store d'état : `idle | checking | upToDate | available | offline | error` ;
   - `checkForUpdate()` : demande au serveur s'il y a une nouvelle version (`registration.update()`). Si une version arrive, ou attend déjà, l'appli l'installe et redémarre (`updateSW(true)`). Sinon, l'état passe à `upToDate`.
   - Si une version a été téléchargée en arrière-plan (`onNeedRefresh`), l'état passe à `available` et le bouton devient « Installer la mise à jour ».
3. **Réglages › Préférences** (`src/screens/Players.svelte`) : une ligne sous « Sons et vibrations », avec le même style `.pref`. Elle contient le bouton et un court message d'état : « Recherche… », « Bamboche est à jour », « Pas de connexion », « Impossible de vérifier ».
   ```
   [↻]  Rechercher une mise à jour
        Version 0.1.0 · 15/11/2026 · a1b2c3d
   ```
4. **Version affichée** : la version de `package.json`, la date de build et le hash git court, injectés au build avec `define` dans Vite (hash « dev » si git n'est pas disponible).
5. **Partie en cours** : après le redémarrage, la partie est reprise grâce à la sauvegarde et à la proposition de reprise qui existent déjà. Rien à ajouter.

## Laissé au builder

- L'icône du bouton (il existe peut-être déjà une icône adaptée dans `Icon.svelte`, sinon en ajouter une simple).
- Le délai au bout duquel on abandonne la vérification (suggestion : 10 s → « Impossible de vérifier »).
- En dev, ou si le navigateur ne gère pas les service workers : bouton désactivé ou message « Indisponible ».
- Tests : logique de `update.ts` avec un `virtual:pwa-register` simulé, et rendu de la ligne dans Réglages.
