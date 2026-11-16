import { expect, test } from 'vitest';
import { endLabel, fmt, scoreGameById, scoreGames } from './defs';

test('ordre : mille-sabords, cinq-rois, skyjo, flip7, belote', () => {
  expect(scoreGames.map((g) => g.id)).toEqual(['mille-sabords', 'cinq-rois', 'skyjo', 'flip7', 'belote']);
});

test('les valeurs de fin de la spec', () => {
  expect(scoreGameById('skyjo')!.end).toMatchObject({ kind: 'seuil', default: 100 });
  expect(scoreGameById('mille-sabords')).toMatchObject({ winner: 'haut', end: { kind: 'seuil', default: 6000 } });
  expect(scoreGameById('cinq-rois')).toMatchObject({ winner: 'bas', end: { kind: 'manches', default: 11 } });
  expect(scoreGameById('flip7')).toMatchObject({ winner: 'haut', end: { default: 200 } });
  expect(scoreGameById('belote')).toMatchObject({
    winner: 'haut',
    end: { default: 1000 },
    teams: true,
    minPlayers: 4,
    maxPlayers: 4,
    complement: 162,
  });
  expect(scoreGameById('inconnu')).toBeUndefined();
});

test('chaque défaut est dans ses bornes et sur un pas', () => {
  for (const g of scoreGames) {
    const { min, max, step, default: d } = g.end;
    expect(min <= d && d <= max).toBe(true);
    expect((d - min) % step).toBe(0);
  }
});

test('Cinq Rois : manche 1 = 3 cartes, manche 11 = 13 cartes', () => {
  const g = scoreGameById('cinq-rois')!;
  expect(g.roundLabel!(1)).toBe('3 cartes');
  expect(g.roundLabel!(11)).toBe('13 cartes');
});

test('fmt met une espace comme séparateur de milliers', () => {
  expect(fmt(6000)).toBe('6 000');
  expect(fmt(-5)).toBe('-5');
  expect(fmt(0)).toBe('0');
});

test('endLabel', () => {
  expect(endLabel(scoreGameById('skyjo')!, 100)).toBe('Fin à 100 points');
  expect(endLabel(scoreGameById('mille-sabords')!, 6000)).toBe('Fin à 6 000 points');
  expect(endLabel(scoreGameById('cinq-rois')!, 11)).toBe('11 manches');
});
