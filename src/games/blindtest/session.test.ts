import { beforeEach, expect, test } from 'vitest';
import { get } from 'svelte/store';
import { getActiveGame } from '../../lib/activeGame';
import { load, save } from '../../lib/storage';
import { award, createBlindtest, type BlindtestState } from './logic/game';
import { abandonBlindtest, btGame, loadSavedBlindtest, readHistory, startBlindtest } from './session';

const base = (): BlindtestState =>
  createBlindtest(
    [
      { id: 'A', name: 'Léa', color: 'blindtest', playerIds: ['a'] },
      { id: 'B', name: 'Hugo', color: 'hipster', playerIds: ['b'] },
    ],
    [
      { id: 'a', name: 'Léa' },
      { id: 'b', name: 'Hugo' },
    ],
    ['t0', 't1', 't2', 's0'],
    'hits-de-toujours',
    { tracks: 3, listenSeconds: 20 },
  );

beforeEach(() => btGame.set(null));

test('startBlindtest enregistre, marque actif, navigue et met à jour l’historique', () => {
  save('blindtest:history:hits-de-toujours', ['vieux']);
  startBlindtest(base());
  expect(getActiveGame()).toEqual({ gameId: 'blindtest' });
  expect(location.hash).toBe('#/blindtest/partie');
  expect(readHistory('hits-de-toujours')).toEqual(['vieux', 't0', 't1', 't2']);
});

test('une partie en écoute est rechargée au même extrait', () => {
  startBlindtest(base());
  btGame.set(null);
  const s = loadSavedBlindtest()!;
  expect(s.phase).toBe('listen');
  expect(s.current).toBe(0);
});

test('une partie en révélation garde ses scores', () => {
  startBlindtest(award(base(), 'A'));
  expect(loadSavedBlindtest()!.winners).toEqual(['A']);
});

test('sauvegarde corrompue : pas de partie', () => {
  save('blindtest:game', { ...base(), current: 99 });
  expect(loadSavedBlindtest()).toBeNull();
  save('blindtest:game', { version: 1, phase: 'nimporte' });
  expect(loadSavedBlindtest()).toBeNull();
});

test('abandonBlindtest efface la partie et la partie active', () => {
  startBlindtest(base());
  abandonBlindtest();
  expect(get(btGame)).toBeNull();
  expect(getActiveGame()).toBeNull();
  expect(load('blindtest:game', null)).toBeNull();
});

test('startBlindtest enregistre l’historique fourni par le tirage (remise à zéro comprise)', () => {
  save('blindtest:history:hits-de-toujours', ['a', 'b', 'c']);
  startBlindtest(base(), ['t0', 't1', 't2']);
  expect(readHistory('hits-de-toujours')).toEqual(['t0', 't1', 't2']);
});
