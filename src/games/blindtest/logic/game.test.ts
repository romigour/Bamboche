import { describe, expect, test } from 'vitest';
import type { Player } from '../../../lib/players';
import type { TeamDraft } from '../../../lib/teams';
import {
  award,
  changeWinner,
  createBlindtest,
  currentTrackId,
  nextTrack,
  scores,
  skipCurrent,
  type BlindtestState,
} from './game';

const players: Player[] = [
  { id: 'p1', name: 'Léa' },
  { id: 'p2', name: 'Hugo' },
];
const teams: TeamDraft[] = [
  { id: 'A', name: 'Léa', color: 'blindtest', playerIds: ['p1'] },
  { id: 'B', name: 'Hugo', color: 'hipster', playerIds: ['p2'] },
];
const make = (picked = ['t0', 't1', 't2', 's0', 's1'], tracks = 3): BlindtestState =>
  createBlindtest(teams, players, picked, 'hits-de-toujours', { tracks, listenSeconds: 20 });

test('createBlindtest : file, remplaçants, écoute du premier extrait', () => {
  const s = make();
  expect(s.queue).toEqual(['t0', 't1', 't2']);
  expect(s.spares).toEqual(['s0', 's1']);
  expect(s.phase).toBe('listen');
  expect(currentTrackId(s)).toBe('t0');
  expect(scores(s)).toEqual({ A: 0, B: 0 });
});

test('createBlindtest copie les noms des joueurs', () => {
  const local = players.map((p) => ({ ...p }));
  const s = createBlindtest(teams, local, ['t0'], 'x', { tracks: 1, listenSeconds: 10 });
  local[0].name = 'Autre';
  expect(s.teams[0].players[0].name).toBe('Léa');
});

describe('award', () => {
  test('donne le point et passe à la révélation', () => {
    const s = award(make(), 'A');
    expect(s.phase).toBe('reveal');
    expect(scores(s)).toEqual({ A: 1, B: 0 });
  });
  test('double tap : un seul point', () => {
    const once = award(make(), 'A');
    expect(award(once, 'A')).toBe(once);
  });
  test('personne : aucun point', () => {
    expect(scores(award(make(), null))).toEqual({ A: 0, B: 0 });
  });
});

test('changeWinner en révélation corrige le point', () => {
  let s = award(make(), 'A');
  s = changeWinner(s, 'B');
  expect(scores(s)).toEqual({ A: 0, B: 1 });
  expect(scores(changeWinner(s, null))).toEqual({ A: 0, B: 0 });
  const listening = make();
  expect(changeWinner(listening, 'A')).toBe(listening);
});

test('nextTrack : extrait suivant puis podium', () => {
  let s = nextTrack(award(make(), 'A'));
  expect(s.phase).toBe('listen');
  expect(currentTrackId(s)).toBe('t1');
  s = nextTrack(award(nextTrack(award(s, null)), 'B'));
  expect(s.phase).toBe('podium');
  expect(scores(s)).toEqual({ A: 1, B: 1 });
  expect(nextTrack(make())).toEqual(make()); // hors révélation : rien
});

describe('skipCurrent', () => {
  test('avec remplaçant : même nombre d’extraits', () => {
    const s = skipCurrent(make());
    expect(s.queue).toHaveLength(3);
    expect(currentTrackId(s)).toBe('s0');
    expect(s.spares).toEqual(['s1']);
    expect(s.skipped).toEqual(['t0']);
    expect(s.phase).toBe('listen');
  });
  test('sans remplaçant : la file raccourcit', () => {
    const s = skipCurrent(make(['t0', 't1', 't2'], 3));
    expect(s.queue).toEqual(['t1', 't2']);
    expect(currentTrackId(s)).toBe('t1');
  });
  test('sans remplaçant sur le dernier extrait : podium', () => {
    let s = make(['t0', 't1'], 2);
    s = nextTrack(award(s, 'A'));
    s = skipCurrent(s);
    expect(s.phase).toBe('podium');
    expect(scores(s)).toEqual({ A: 1, B: 0 });
  });
  test('hors écoute : rien', () => {
    const s = award(make(), 'A');
    expect(skipCurrent(s)).toBe(s);
  });
});
