import { expect, test } from 'vitest';
import { normalizeWord } from '../../lib/normalize';
import words from './words.json';

test('au moins 120 paires', () => expect(words.length).toBeGreaterThanOrEqual(120));
test('chaque paire a deux mots non vides et différents', () => {
  for (const p of words) {
    expect(p.a.trim()).not.toBe('');
    expect(p.b.trim()).not.toBe('');
    expect(normalizeWord(p.a)).not.toBe(normalizeWord(p.b));
  }
});
test('aucune paire en double (accents, majuscules et ordre ignorés)', () => {
  const keys = words.map((p) => [normalizeWord(p.a), normalizeWord(p.b)].sort().join('|'));
  expect(new Set(keys).size).toBe(keys.length);
});
