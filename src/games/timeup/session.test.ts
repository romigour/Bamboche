import { beforeEach, expect, test } from 'vitest';
import { get } from 'svelte/store';
import { getActiveGame } from '../../lib/activeGame';
import { save } from '../../lib/storage';
import { beginRound, createGame, startTurn, timeLeft, type TimeUpState } from './logic/game';
import { abandonGame, game, loadSavedGame, startGame } from './session';

const base = (): TimeUpState =>
  createGame(
    [
      { id: 'A', name: 'Les Flamants', color: 'blindtest', playerIds: ['a', 'b'] },
      { id: 'B', name: 'Les Pingouins', color: 'hipster', playerIds: ['c', 'd'] },
    ],
    ['a', 'b', 'c', 'd'].map((id) => ({ id, name: id })),
    [{ id: 'c0', text: 'Chat' }, { id: 'c1', text: 'Chien' }],
    { turnSeconds: 30, rounds: 2 },
  );

beforeEach(() => game.set(null));

test('startGame enregistre la partie et la marque active', () => {
  startGame(base());
  expect(getActiveGame()).toEqual({ gameId: 'timeup' });
  expect(get(game)?.phase).toBe('roundIntro');
  expect(location.hash).toBe('#/timeup/partie');
});

test('la partie est persistée et rechargée', () => {
  startGame(base());
  game.set(null);
  expect(loadSavedGame(0)?.phase).toBe('roundIntro');
});

test('un tour en cours est rechargé en pause, sans décompter la fermeture', () => {
  const s = startTurn(beginRound(base()), 10000); // endsAt = 40000
  save('timeup:game', { state: s, savedAt: 10000 });
  const loaded = loadSavedGame(999999)!;
  expect(loaded.turn!.endsAt).toBeNull();
  expect(loaded.turn!.remainingMs).toBe(30000);
  expect(timeLeft(loaded, 5_000_000)).toBe(30000);
});

test('un tour sauvegardé après la fin du chrono est rechargé en récap', () => {
  const s = startTurn(beginRound(base()), 0); // endsAt = 30000
  save('timeup:game', { state: s, savedAt: 45000 });
  expect(loadSavedGame(50000)!.phase).toBe('turnRecap');
});

test('sauvegarde illisible : pas de partie', () => {
  save('timeup:game', { state: { version: 99 }, savedAt: 1 });
  expect(loadSavedGame(0)).toBeNull();
});

test('abandonGame efface la partie et la partie active', () => {
  startGame(base());
  abandonGame();
  expect(get(game)).toBeNull();
  expect(getActiveGame()).toBeNull();
  expect(loadSavedGame(0)).toBeNull();
});
