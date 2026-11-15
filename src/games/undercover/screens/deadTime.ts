/**
 * Temps mort à l'ouverture d'un écran : les taps reçus avant `ms` millisecondes
 * (double tap venu du bouton de l'écran précédent) sont ignorés.
 * À appeler à l'initialisation du composant : l'horloge démarre à cet instant.
 */
export function deadTime(ms = 400): (fn: () => void) => () => void {
  const since = Date.now();
  return (fn) => () => {
    if (Date.now() - since >= ms) fn();
  };
}
