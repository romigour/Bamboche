import { expect, test } from 'vitest';
import { seq } from '../../../lib/test-rng';
import type { Animal, AnimalLevel } from '../types';
import { allAnswered, correctPlayers, createAnimaux, nextSound, reveal, scores, setAnswer, skipSound, type AnimauxState } from './game';

const credit = { author: 'x', license: 'CC0', url: 'u' };
const a = (id: string, level: AnimalLevel, family: string): Animal => ({
  id, name: id, level, family, sound: `animaux/${id}.mp3`, photo: `animaux/${id}.webp`, credits: { sound: credit, photo: credit },
});
const ALL = [
  a('vache', 'facile', 'ferme'), a('coq', 'facile', 'ferme'), a('chat', 'facile', 'maison'),
  a('loup', 'facile', 'canides'), a('lion', 'facile', 'felins'), a('hulotte', 'difficile', 'nuit'),
];
const PLAYERS = [
  { id: 'a', name: 'Léa' },
  { id: 'b', name: 'Tom' },
  { id: 'c', name: 'Max' },
];
const make = (sounds = 3) => createAnimaux(PLAYERS, ALL, { sounds, choices: 4 }, 'facile', [], seq(0.3, 0.7)).state;
const answerAll = (s: AnimauxState, pick: (round: AnimauxState['rounds'][number], playerId: string) => string) =>
  s.players.reduce((x, p) => setAnswer(x, p.id, pick(x.rounds[x.current], p.id)), s);
const wrong = (r: AnimauxState['rounds'][number]) => r.options.find((o) => o !== r.animalId)!;

test('createAnimaux prépare les sons, les propositions et les joueurs', () => {
  const { state: s, history } = createAnimaux(PLAYERS, ALL, { sounds: 3, choices: 4 }, 'facile', [], seq(0.3, 0.7));
  expect(s.version).toBe(1);
  expect(s.phase).toBe('sound');
  expect(s.current).toBe(0);
  expect(s.level).toBe('facile');
  expect(s.rounds).toHaveLength(3);
  for (const r of s.rounds) {
    expect(r.options).toHaveLength(4);
    expect(r.options).toContain(r.animalId);
    expect(r.answers).toEqual({});
    expect(r.revealed).toBe(false);
    expect(r.skipped).toBe(false);
  }
  expect(s.players.map((p) => [p.id, p.name])).toEqual([['a', 'Léa'], ['b', 'Tom'], ['c', 'Max']]);
  expect(s.players.every((p) => typeof p.color === 'string')).toBe(true);
  expect(history).toEqual(s.rounds.map((r) => r.animalId));
});

test('setAnswer change une réponse, refuse un id hors propositions', () => {
  let s = make();
  const [o1, o2] = s.rounds[0].options;
  s = setAnswer(s, 'a', o1);
  s = setAnswer(s, 'a', o2);
  expect(s.rounds[0].answers).toEqual({ a: o2 });
  expect(setAnswer(s, 'a', 'girafe')).toBe(s);
  expect(setAnswer(s, 'inconnu', o1)).toBe(s);
});

test('reveal attend toutes les réponses', () => {
  let s = make();
  s = setAnswer(s, 'a', s.rounds[0].options[0]);
  expect(allAnswered(s)).toBe(false);
  expect(reveal(s)).toBe(s);
  s = answerAll(s, (r) => r.options[0]);
  expect(allAnswered(s)).toBe(true);
  const r = reveal(s);
  expect(r.phase).toBe('reveal');
  expect(r.rounds[0].revealed).toBe(true);
  expect(setAnswer(r, 'a', r.rounds[0].options[1])).toBe(r);
});

test('scores : 1 point par bonne réponse sur les sons révélés', () => {
  let s = make();
  s = reveal(answerAll(s, (r, p) => (p === 'b' ? wrong(r) : r.animalId)));
  expect(correctPlayers(s, 0)).toEqual(['a', 'c']);
  s = nextSound(s);
  s = answerAll(s, (r, p) => (p === 'a' ? r.animalId : wrong(r)));
  expect(scores(s)).toEqual({ a: 1, b: 0, c: 1 });
  s = reveal(s);
  expect(scores(s)).toEqual({ a: 2, b: 0, c: 1 });
});

test('nextSound après le dernier son mène au podium', () => {
  let s = make(2);
  s = nextSound(reveal(answerAll(s, (r) => r.animalId)));
  expect(s.phase).toBe('sound');
  expect(s.current).toBe(1);
  s = nextSound(reveal(answerAll(s, (r) => r.animalId)));
  expect(s.phase).toBe('podium');
  expect(scores(s)).toEqual({ a: 2, b: 2, c: 2 });
});

test('skipSound passe le son sans point, jusqu’au podium sur le dernier', () => {
  let s = make(2);
  s = skipSound(answerAll(s, (r) => r.animalId));
  expect(s.current).toBe(1);
  expect(s.rounds[0].skipped).toBe(true);
  s = skipSound(s);
  expect(s.phase).toBe('podium');
  expect(scores(s)).toEqual({ a: 0, b: 0, c: 0 });
});
