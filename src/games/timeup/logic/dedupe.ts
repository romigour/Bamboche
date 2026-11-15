import { normalizeWord } from '../../../lib/normalize';
import type { Card } from '../../../lib/teams';

export interface TeamWords {
  teamId: string;
  words: string[];
}

export interface Duplicate {
  teamId: string;
  index: number;
  word: string;
  sameAs: string;
}

export function validateEntry(words: string[], expected: number): { ok: boolean; error?: string } {
  if (words.length !== expected || words.some((w) => !normalizeWord(w))) return { ok: false, error: 'Il manque des mots.' };
  return { ok: true };
}

/** Chaque occurrence après la première, dans l'ordre des équipes puis des mots. */
export function findDuplicates(entries: TeamWords[]): Duplicate[] {
  const first = new Map<string, string>();
  const out: Duplicate[] = [];
  for (const e of entries)
    e.words.forEach((word, index) => {
      const k = normalizeWord(word);
      if (!k) return;
      const prev = first.get(k);
      if (prev === undefined) first.set(k, word.trim());
      else out.push({ teamId: e.teamId, index, word, sameAs: prev });
    });
  return out;
}

export function replaceWord(entries: TeamWords[], teamId: string, index: number, word: string): TeamWords[] {
  return entries.map((e) =>
    e.teamId === teamId ? { ...e, words: e.words.map((w, i) => (i === index ? word : w)) } : e,
  );
}

export function toCards(entries: TeamWords[]): Card[] {
  return entries.flatMap((e) => e.words.map((w) => ({ text: w.trim(), byTeamId: e.teamId }))).map((c, i) => ({ id: `c${i}`, ...c }));
}
