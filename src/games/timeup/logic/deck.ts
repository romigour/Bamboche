import { shuffle, type Rng } from '../../../lib/random';
import type { Card, WordEntry } from '../../../lib/teams';

const key = (s: string) => s.trim().toLocaleLowerCase('fr').normalize('NFD').replace(/\p{M}/gu, '');

/** Tire n cartes aux textes uniques (insensible à la casse et aux accents). */
export function drawQuickCards(words: WordEntry[], n: number, rng?: Rng): Card[] {
  const seen = new Set<string>();
  const out: Card[] = [];
  for (const w of shuffle(words, rng)) {
    if (out.length >= n) break;
    const k = key(w.text);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push({ id: `c${out.length}`, text: w.text.trim(), category: w.category });
  }
  return out;
}
