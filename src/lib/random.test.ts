import { expect, test } from 'vitest';
import { sample, shuffle } from './random';
import { seq } from './test-rng';

test('shuffle garde les mêmes éléments sans modifier l’entrée', () => {
  const input = [1, 2, 3, 4, 5];
  const out = shuffle(input, seq(0.1, 0.7, 0.3, 0.9));
  expect(input).toEqual([1, 2, 3, 4, 5]);
  expect([...out].sort()).toEqual([1, 2, 3, 4, 5]);
  expect(out).not.toBe(input);
});

test('shuffle avec un rng donné est déterministe', () => {
  expect(shuffle([1, 2, 3, 4], seq(0.1, 0.7, 0.3))).toEqual(shuffle([1, 2, 3, 4], seq(0.1, 0.7, 0.3)));
});

test('sample borne n à la taille de la liste', () => {
  expect(sample(['a', 'b', 'c'], 99)).toHaveLength(3);
  expect(sample(['a', 'b', 'c'], 2)).toHaveLength(2);
  expect(sample(['a', 'b'], 0)).toEqual([]);
});
