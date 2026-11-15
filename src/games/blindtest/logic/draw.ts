import { shuffle, type Rng } from '../../../lib/random';

/** Extraits de réserve tirés en plus, pour remplacer ceux qui ne chargent pas. */
export const SPARES = 5;

/**
 * Tire n extraits + SPARES remplaçants, en évitant les titres déjà joués sur ce téléphone.
 * Si l'historique ne laisse pas assez de titres, il est remis à zéro.
 */
export function drawTracks(
  trackIds: string[],
  n: number,
  history: string[],
  rng?: Rng,
): { picked: string[]; history: string[] } {
  const want = Math.min(trackIds.length, n + SPARES);
  const played = new Set(history);
  const fresh = trackIds.filter((id) => !played.has(id));
  const reset = fresh.length < want;
  const pool = reset ? trackIds : fresh;
  const picked = shuffle(pool, rng).slice(0, want);
  const base = reset ? [] : history;
  return { picked, history: [...base, ...picked.slice(0, Math.min(n, picked.length))] };
}
