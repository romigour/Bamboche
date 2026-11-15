import { expect, test } from 'vitest';
import type { TeamDraft } from '../../lib/teams';
import { cyclePlayer, pruneTeams, resizeTeams, shuffleTeams } from './setup';

const T = (): TeamDraft[] => [
  { id: 'A', name: 'Les Flamants', color: 'blindtest', playerIds: ['a', 'b'] },
  { id: 'B', name: 'Les Pingouins', color: 'hipster', playerIds: ['c'] },
];

test('cyclePlayer : équipe suivante, puis sans équipe, puis première', () => {
  let t = cyclePlayer(T(), 'a');
  expect(t[1].playerIds).toEqual(['c', 'a']);
  t = cyclePlayer(t, 'a');
  expect(t.flatMap((x) => x.playerIds)).not.toContain('a');
  t = cyclePlayer(t, 'a');
  expect(t[0].playerIds).toEqual(['b', 'a']);
});

test('resizeTeams ajoute des équipes nommées et ne descend pas sous 2', () => {
  const up = resizeTeams(T(), 3);
  expect(up.map((t) => t.name)).toEqual(['Les Flamants', 'Les Pingouins', 'Les Loutres']);
  expect(resizeTeams(up, 1)).toHaveLength(2);
});

test('pruneTeams retire les joueurs disparus', () => {
  expect(pruneTeams(T(), [{ id: 'a', name: 'Léa' }])[0].playerIds).toEqual(['a']);
});

test('shuffleTeams répartit tout le monde en gardant au moins 2 équipes', () => {
  const ps = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id, name: id }));
  const t = shuffleTeams(ps, 1);
  expect(t).toHaveLength(2);
  expect(t.flatMap((x) => x.playerIds).sort()).toEqual(['a', 'b', 'c', 'd', 'e']);
});

test('draftsFromGame reconstruit les équipes depuis une partie', async () => {
  const { draftsFromGame } = await import('./setup');
  const { createGame } = await import('./logic/game');
  const s = createGame(T().map((t) => ({ ...t, playerIds: [...t.playerIds, 'z'] })), ['a', 'b', 'c'].map((id) => ({ id, name: id })), [], { turnSeconds: 60, rounds: 1 });
  expect(draftsFromGame(s)).toEqual([
    { id: 'A', name: 'Les Flamants', color: 'blindtest', playerIds: ['a', 'b'] },
    { id: 'B', name: 'Les Pingouins', color: 'hipster', playerIds: ['c'] },
  ]);
});
