import { expect, test } from 'vitest';
import { findDuplicates, replaceWord, toCards, validateEntry, type TeamWords } from './dedupe';

const entries: TeamWords[] = [
  { teamId: 'A', words: ['Astérix', 'Tour Eiffel'] },
  { teamId: 'B', words: ['asterix', 'Zidane'] },
];

test('validateEntry refuse un mot vide', () => {
  expect(validateEntry(['a', '  '], 2)).toEqual({ ok: false, error: 'Il manque des mots.' });
});

test('validateEntry refuse un nombre de mots différent', () => {
  expect(validateEntry(['a'], 2).ok).toBe(false);
  expect(validateEntry(['a', 'b'], 2)).toEqual({ ok: true });
});

test('findDuplicates signale la seconde occurrence entre équipes', () => {
  expect(findDuplicates(entries)).toEqual([{ teamId: 'B', index: 0, word: 'asterix', sameAs: 'Astérix' }]);
});

test('findDuplicates détecte un doublon dans une même équipe', () => {
  const d = findDuplicates([{ teamId: 'A', words: ['Chat', 'chat !', 'Chien'] }]);
  expect(d).toEqual([{ teamId: 'A', index: 1, word: 'chat !', sameAs: 'Chat' }]);
});

test('après replaceWord, plus de doublon', () => {
  const fixed = replaceWord(entries, 'B', 0, 'Obélix');
  expect(findDuplicates(fixed)).toEqual([]);
  expect(entries[1].words[0]).toBe('asterix');
});

test('toCards numérote et garde l’équipe auteure', () => {
  const cards = toCards([{ teamId: 'A', words: [' Astérix ', 'Tour Eiffel'] }, { teamId: 'B', words: ['Obélix', 'Zidane'] }]);
  expect(cards).toHaveLength(4);
  expect(cards[0]).toEqual({ id: 'c0', text: 'Astérix', byTeamId: 'A' });
  expect(cards[3]).toEqual({ id: 'c3', text: 'Zidane', byTeamId: 'B' });
});
