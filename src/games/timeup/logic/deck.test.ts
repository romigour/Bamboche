import { expect, test } from 'vitest';
import { seq } from '../../../lib/test-rng';
import { drawQuickCards } from './deck';
import type { WordEntry } from '../../../lib/teams';

const words: WordEntry[] = Array.from({ length: 60 }, (_, i) => ({ text: `Mot ${i}`, category: 'Objet' }));

test('drawQuickCards tire n cartes avec des ids c0…', () => {
  const cards = drawQuickCards(words, 40, seq(0.3, 0.6, 0.9));
  expect(cards).toHaveLength(40);
  expect(cards[0].id).toBe('c0');
  expect(cards[39].id).toBe('c39');
});

test('drawQuickCards : textes uniques même si la liste contient un doublon', () => {
  const dup = [{ text: 'Tour Eiffel', category: 'Lieu' }, { text: 'tour eiffel', category: 'Lieu' }, { text: 'Chat', category: 'Animal' }];
  const cards = drawQuickCards(dup, 3);
  expect(cards).toHaveLength(2);
  expect(new Set(cards.map((c) => c.text.toLowerCase())).size).toBe(2);
});

test('drawQuickCards garde la catégorie', () => {
  expect(drawQuickCards([{ text: 'Chat', category: 'Animal' }], 1)[0]).toEqual({ id: 'c0', text: 'Chat', category: 'Animal' });
});
