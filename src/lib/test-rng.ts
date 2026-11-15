import type { Rng } from './random';

/** RNG déterministe pour les tests : rejoue la suite donnée en boucle. */
export function seq(...values: number[]): Rng {
  let i = 0;
  return () => values[i++ % values.length];
}
