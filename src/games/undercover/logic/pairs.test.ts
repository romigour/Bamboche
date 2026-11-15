import { expect, test } from 'vitest';
import { seq } from '../../../lib/test-rng';
import { drawPair } from './pairs';

test('tire une paire non jouée et l’ajoute à used', () => {
  const r = drawPair(4, [0, 2], seq(0));
  expect([1, 3]).toContain(r.index);
  expect(r.used).toEqual([0, 2, r.index]);
});
test('toutes jouées : repart de zéro sans rejouer la dernière', () => {
  for (const v of [0, 0.3, 0.6, 0.99]) {
    const r = drawPair(3, [0, 1, 2], seq(v));
    expect(r.index).not.toBe(2);
    expect(r.used).toEqual([r.index]);
  }
});
test('une seule paire : elle revient', () => expect(drawPair(1, [0], seq(0)).index).toBe(0));
