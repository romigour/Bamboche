import { describe, expect, test } from 'vitest';
import { seq } from '../../../lib/test-rng';
import {
  afterReveal,
  alive,
  composition,
  createSeries,
  eliminate,
  finishSeries,
  lastEliminated,
  mrWhiteGuess,
  nextGame,
  outcome,
  points,
  seeWord,
  speakingOrder,
  toScores,
  toTalk,
  toVote,
  wordOf,
  type Role,
  type UndercoverState,
} from './game';
import type { WordPair } from './pairs';

const pairs: WordPair[] = [
  { a: 'Chat', b: 'Chien' },
  { a: 'Thé', b: 'Café' },
  { a: 'Plage', b: 'Piscine' },
  { a: 'Pizza', b: 'Tarte' },
  { a: 'Vélo', b: 'Trottinette' },
  { a: 'Lune', b: 'Soleil' },
];
const players = ['p1', 'p2', 'p3', 'p4', 'p5'].map((id) => ({ id, name: id.toUpperCase() }));

function roles(under: string, white?: string): Record<string, Role> {
  const r: Record<string, Role> = {};
  for (const p of players) r[p.id] = p.id === under ? 'undercover' : p.id === white ? 'mrwhite' : 'civil';
  return r;
}

/** Série à 5 joueurs dont on force les rôles. */
function make(under = 'p5', white?: string, rng = seq(0.1, 0.3, 0.6)): UndercoverState {
  const s = createSeries(players, white !== undefined, pairs, rng);
  return { ...s, roles: roles(under, white) };
}

/** État en phase vote, manche 1. */
function inVote(first = 'p2', under = 'p5', white?: string): UndercoverState {
  return { ...make(under, white), phase: 'vote', round: 1, firstSpeaker: first };
}

describe('composition', () => {
  test('sans et avec Mr White', () => {
    expect(composition(5, false)).toEqual({ civils: 4, undercover: 1, mrWhite: 0 });
    expect(composition(5, true)).toEqual({ civils: 3, undercover: 1, mrWhite: 1 });
  });
});

describe('createSeries', () => {
  test('rôles, mots, totaux', () => {
    for (const mw of [false, true]) {
      const s = createSeries(players, mw, pairs);
      const rs = Object.values(s.roles);
      expect(rs.filter((r) => r === 'undercover')).toHaveLength(1);
      expect(rs.filter((r) => r === 'mrwhite')).toHaveLength(mw ? 1 : 0);
      const pair = pairs[s.pairIndex];
      expect([s.civilWord, s.undercoverWord].sort()).toEqual([pair.a, pair.b].sort());
      expect(Object.values(s.totals)).toEqual([0, 0, 0, 0, 0]);
      expect(s.phase).toBe('deal');
      expect(s.gameNumber).toBe(1);
    }
  });
  test('players est une copie', () => {
    const input = players.map((p) => ({ ...p }));
    const s = createSeries(input, false, pairs);
    input[0].name = 'Autre';
    input.pop();
    expect(s.players).toEqual(players);
  });
});

describe('wordOf', () => {
  test('mot selon le rôle', () => {
    const s = make('p5', 'p1');
    expect(wordOf(s, 'p2')).toBe(s.civilWord);
    expect(wordOf(s, 'p5')).toBe(s.undercoverWord);
    expect(wordOf(s, 'p1')).toBeNull();
  });
});

describe('distribution', () => {
  test('5 seeWord puis talk, le 6e est ignoré', () => {
    let s = make();
    for (let i = 0; i < 5; i++) {
      expect(s.phase).toBe('deal');
      s = seeWord(s);
    }
    expect(s.phase).toBe('talk');
    expect(s.round).toBe(1);
    expect(s.firstSpeaker).not.toBeNull();
    expect(s.roles[s.firstSpeaker!]).not.toBe('mrwhite');
    expect(seeWord(s)).toBe(s);
  });
  test('le premier orateur n’est jamais Mr White', () => {
    let s = make('p5', 'p1');
    for (let i = 0; i < 5; i++) s = seeWord(s, seq(0));
    expect(s.firstSpeaker).not.toBe('p1');
  });
});

describe('manche suivante', () => {
  test('commence après l’ancien premier orateur', () => {
    const s = eliminate(inVote('p2'), 'p3');
    expect(s.phase).toBe('reveal');
    expect(lastEliminated(s)).toBe('p3');
    const n = afterReveal(s);
    expect(n.phase).toBe('talk');
    expect(n.round).toBe(2);
    expect(n.firstSpeaker).toBe('p4');
    expect(speakingOrder(n)).toEqual(['p4', 'p5', 'p1', 'p2']);
  });
  test('ancien premier orateur éliminé', () => {
    const n = afterReveal(eliminate(inVote('p2'), 'p2'));
    expect(n.firstSpeaker).toBe('p3');
  });
  test('toVote / toTalk', () => {
    const t = { ...inVote(), phase: 'talk' as const };
    const v = toVote(t);
    expect(v.phase).toBe('vote');
    expect(toVote(v)).toBe(v);
    expect(toTalk(v).phase).toBe('talk');
    expect(toTalk(t)).toBe(t);
  });
});

describe('eliminate', () => {
  test('ignoré hors vote ou joueur éliminé', () => {
    const t = { ...inVote(), phase: 'talk' as const };
    expect(eliminate(t, 'p1')).toBe(t);
    const s = eliminate(inVote(), 'p3');
    expect(eliminate(s, 'p4')).toBe(s);
    const v = { ...inVote(), eliminated: ['p3'] };
    expect(eliminate(v, 'p3')).toBe(v);
    const u = inVote();
    expect(eliminate(u, 'zz')).toBe(u);
    expect(s.eliminated).toEqual(['p3']);
    expect(alive(s)).toEqual(['p1', 'p2', 'p4', 'p5']);
  });
});

describe('outcome', () => {
  test('conditions de fin', () => {
    expect(outcome(roles('p5'), ['p5'])).toBe('civils');
    expect(outcome(roles('p5'), ['p1', 'p2', 'p3'])).toBe('imposteurs');
    expect(outcome(roles('p5', 'p1'), ['p5'])).toBeNull();
    expect(outcome(roles('p5', 'p1'), ['p5', 'p1'])).toBe('civils');
    expect(outcome(roles('p5'), [])).toBeNull();
  });
});

describe('points', () => {
  test('barème', () => {
    expect(points(roles('p5'), ['p5'], 'civils')).toEqual({ p1: 2, p2: 2, p3: 2, p4: 2, p5: 0 });
    expect(points(roles('p5', 'p1'), ['p2', 'p3'], 'imposteurs')).toEqual({ p1: 6, p2: 0, p3: 0, p4: 0, p5: 10 });
    expect(points(roles('p5', 'p1'), ['p1', 'p2'], 'imposteurs')).toEqual({ p1: 0, p2: 0, p3: 0, p4: 0, p5: 10 });
  });
});

describe('fin de partie', () => {
  test('totaux, gained, phase end', () => {
    const s0 = { ...inVote(), totals: { p1: 1, p2: 0, p3: 0, p4: 0, p5: 0 } };
    const s = afterReveal(eliminate(s0, 'p5'));
    expect(s.phase).toBe('end');
    expect(s.winner).toBe('civils');
    expect(s.gained).toEqual({ p1: 2, p2: 2, p3: 2, p4: 2, p5: 0 });
    expect(s.totals).toEqual({ p1: 3, p2: 2, p3: 2, p4: 2, p5: 0 });
    expect(afterReveal(s)).toBe(s);
  });
});

describe('Mr White', () => {
  const white = () => eliminate(inVote('p2', 'p5', 'p1'), 'p1');
  test('élimination puis devinette', () => {
    const s = afterReveal(white());
    expect(s.phase).toBe('mrwhite');
    const win = mrWhiteGuess(s, true);
    expect(win.phase).toBe('end');
    expect(win.winner).toBe('mrwhite');
    expect(win.gained).toEqual({ p1: 6, p2: 0, p3: 0, p4: 0, p5: 0 });
    expect(mrWhiteGuess(win, true)).toBe(win);
  });
  test('raté : la partie continue', () => {
    const n = mrWhiteGuess(afterReveal(white()), false);
    expect(n.phase).toBe('talk');
    expect(n.round).toBe(2);
    expect(n.firstSpeaker).toBe('p3');
    expect(mrWhiteGuess(n, false)).toBe(n);
  });
});

describe('Mr White : cas combinés', () => {
  test('raté avec 2 civils + undercover en jeu : la partie continue', () => {
    // p3 et p4 éliminés avant (civils) : restent p1 (Mr White), p2 civil... on force l'état
    const s: UndercoverState = { ...inVote('p2', 'p5', 'p1'), eliminated: ['p4'] };
    const r = mrWhiteGuess(afterReveal(eliminate(s, 'p1')), false);
    expect(alive(r).sort()).toEqual(['p2', 'p3', 'p5']);
    expect(r.phase).toBe('talk');
    expect(r.round).toBe(2);
  });
  test("undercover éliminé d'abord, puis Mr White trouve le mot : Mr White gagne", () => {
    const a = afterReveal(eliminate(inVote('p2', 'p5', 'p1'), 'p5'));
    expect(a.phase).toBe('talk');
    const b = afterReveal(eliminate({ ...a, phase: 'vote' }, 'p1'));
    expect(b.phase).toBe('mrwhite');
    const w = mrWhiteGuess(b, true);
    expect(w.phase).toBe('end');
    expect(w.winner).toBe('mrwhite');
    expect(w.gained).toEqual({ p1: 6, p2: 0, p3: 0, p4: 0, p5: 0 });
  });
});

describe('série', () => {
  test('nextGame et finishSeries', () => {
    const e = afterReveal(eliminate(inVote(), 'p5'));
    const sc = toScores(e);
    expect(sc.phase).toBe('scores');
    expect(toScores(sc)).toBe(sc);
    const g = nextGame(sc, pairs);
    expect(g.gameNumber).toBe(2);
    expect(g.totals).toEqual(sc.totals);
    expect(g.usedPairs).toHaveLength(2);
    expect(g.pairIndex).not.toBe(sc.pairIndex);
    expect(g.phase).toBe('deal');
    expect(g.eliminated).toEqual([]);
    expect(nextGame(g, pairs)).toBe(g);
    expect(finishSeries(sc).phase).toBe('podium');
    expect(finishSeries(g)).toBe(g);
  });
});
