import { sample, type Rng } from '../../../lib/random';

/** Deux mots proches : l'un pour les civils, l'autre pour l'undercover. */
export interface WordPair {
  a: string;
  b: string;
}

/**
 * Tire l'index d'une paire absente de `used` parmi `count` paires.
 * Si toutes ont été jouées, on repart de zéro en évitant, si possible, la dernière jouée.
 */
export function drawPair(
  count: number,
  used: readonly number[],
  rng: Rng = Math.random,
): { index: number; used: number[] } {
  const all = Array.from({ length: count }, (_, i) => i);
  const seen = new Set(used);
  const free = all.filter((i) => !seen.has(i));
  if (free.length > 0) {
    const [index] = sample(free, 1, rng);
    return { index, used: [...used, index] };
  }
  const last = used.at(-1);
  const others = all.filter((i) => i !== last);
  const [index] = sample(others.length > 0 ? others : all, 1, rng);
  return { index, used: [index] };
}
