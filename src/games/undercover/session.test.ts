import { beforeEach, expect, test } from 'vitest';
import { get } from 'svelte/store';
import { getActiveGame } from '../../lib/activeGame';
import { players } from '../../lib/players';
import { load, save } from '../../lib/storage';
import { createSeries, type UndercoverState } from './logic/game';
import { abandonUndercover, loadSavedUndercover, resumeLines, startUndercover, ucGame } from './session';
import words from './words.json';

const base = (): UndercoverState =>
  createSeries(
    ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, name: id.toUpperCase() })),
    false,
    words,
  );

beforeEach(() => ucGame.set(null));

test('startUndercover enregistre, marque actif et navigue', () => {
  const s = base();
  startUndercover(s);
  expect(get(ucGame)).toEqual(s);
  expect(getActiveGame()).toEqual({ gameId: 'undercover' });
  expect(location.hash).toBe('#/undercover/partie');
  expect(loadSavedUndercover()).toEqual(s);
});

test('relit l’état sauvegardé, y compris en distribution', () => {
  const s = { ...base(), phase: 'deal' as const, dealIndex: 2 };
  ucGame.set(s);
  expect(loadSavedUndercover()).toEqual(s);
});

test('refuse les états invalides', () => {
  const s = base();
  for (const bad of [
    { ...s, version: 2 },
    { ...s, phase: 'zzz' },
    { ...s, players: 'x' },
    { ...s, phase: 'deal', dealIndex: 5 },
    { ...s, phase: 'deal', dealIndex: -1 },
  ]) {
    save('undercover:game', bad);
    expect(loadSavedUndercover()).toBeNull();
  }
});

test('la reprise ne dépend pas de la liste globale', () => {
  ucGame.set(base());
  players.set([]);
  const r = loadSavedUndercover()!;
  expect(r.players.map((p) => p.name)).toEqual(['A', 'B', 'C', 'D', 'E']);
});

test('abandonUndercover', () => {
  startUndercover(base());
  abandonUndercover();
  expect(get(ucGame)).toBeNull();
  expect(load('undercover:game', null)).toBeNull();
  expect(getActiveGame()).toBeNull();
});

test('resumeLines', () => {
  const s = base();
  expect(resumeLines({ ...s, phase: 'talk', eliminated: ['a'] })).toEqual(['Undercover · Partie 1', '4 joueurs en jeu']);
  expect(resumeLines({ ...s, phase: 'scores' })).toEqual(['Undercover · Partie 1', 'Scores de la série']);
});
