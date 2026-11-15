import { expect, test } from 'vitest';
import { normalizeWord } from '../../lib/normalize';
import words from './words.json';

const CATEGORIES = ['Célébrité', 'Personnage', 'Objet', 'Lieu', 'Animal', 'Film & série'];

test('au moins 200 mots', () => expect(words.length).toBeGreaterThanOrEqual(200));

test('aucun texte vide', () => {
  for (const w of words) expect(normalizeWord(w.text)).not.toBe('');
});

test('aucun doublon (accents et majuscules ignorés)', () => {
  const seen = new Map<string, string>();
  const dups: string[] = [];
  for (const w of words) {
    const k = normalizeWord(w.text);
    if (seen.has(k)) dups.push(`${w.text} = ${seen.get(k)}`);
    seen.set(k, w.text);
  }
  expect(dups).toEqual([]);
});

test('catégories connues', () => {
  for (const w of words) expect(CATEGORIES).toContain(w.category);
});
