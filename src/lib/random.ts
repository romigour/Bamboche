export type Rng = () => number;

/** Nouvelle liste mélangée (Fisher-Yates) ; l'entrée n'est pas modifiée. */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function sample<T>(items: readonly T[], n: number, rng: Rng = Math.random): T[] {
  return shuffle(items, rng).slice(0, Math.max(0, Math.min(n, items.length)));
}
