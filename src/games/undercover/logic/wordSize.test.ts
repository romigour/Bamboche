import { expect, test } from 'vitest';
import words from '../words.json';
import { wordFontSize } from './wordSize';

test('mot court : taille maximale', () => {
  expect(wordFontSize('Chat')).toBe(96);
});

test('mot très long : plancher', () => {
  expect(wordFontSize('Anticonstitutionnellement')).toBe(36);
});

test('les espaces permettent de réduire moins : on se base sur le plus long segment', () => {
  expect(wordFontSize('Brosse à dents')).toBe(wordFontSize('Brosse'));
});

test('chaque mot de words.json tient dans le budget de largeur (sauf plancher)', () => {
  for (const p of words) {
    for (const w of [p.a, p.b]) {
      const longest = Math.max(...w.split(/\s+/).map((s) => s.length));
      const size = wordFontSize(w);
      if (size > 36) expect(longest * size * 0.62).toBeLessThanOrEqual(320);
    }
  }
});

test('aucun segment sans espace de words.json ne dépasse 14 caractères (jamais le plancher de 36 px)', () => {
  for (const p of words) {
    for (const w of [p.a, p.b]) {
      const longest = Math.max(...w.split(/\s+/).map((s) => s.length));
      expect(longest, w).toBeLessThanOrEqual(14);
    }
  }
});
