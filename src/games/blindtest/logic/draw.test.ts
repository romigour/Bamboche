import { expect, test } from 'vitest';
import { seq } from '../../../lib/test-rng';
import { drawTracks, SPARES } from './draw';

const ids = (n: number) => Array.from({ length: n }, (_, i) => `t${i}`);
const rng = () => seq(0.13, 0.71, 0.42, 0.95, 0.05);

test('tire n extraits plus des remplaçants, sans doublon', () => {
  const { picked, history } = drawTracks(ids(30), 15, [], rng());
  expect(SPARES).toBe(5);
  expect(picked).toHaveLength(20);
  expect(new Set(picked).size).toBe(20);
  expect(history).toEqual(picked.slice(0, 15));
});

test('évite d’abord les titres déjà joués', () => {
  const played = ids(10);
  const { picked } = drawTracks(ids(30), 15, played, rng());
  expect(picked.filter((id) => played.includes(id))).toEqual([]);
});

test('historique trop plein : remis à zéro, toujours assez d’extraits', () => {
  const { picked, history } = drawTracks(ids(30), 15, ids(25), rng());
  expect(picked).toHaveLength(20);
  expect(history).toEqual(picked.slice(0, 15));
});

test('demande plus grande que la playlist : bornée', () => {
  const { picked } = drawTracks(ids(8), 15, [], rng());
  expect(picked).toHaveLength(8);
  expect(picked.every((id) => ids(8).includes(id))).toBe(true);
});
