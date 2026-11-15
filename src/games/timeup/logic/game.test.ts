import { describe, expect, test } from 'vitest';
import type { Player } from '../../../lib/players';
import type { Card, TeamDraft } from '../../../lib/teams';
import {
  beginRound,
  confirmTurn,
  createGame,
  currentCard,
  currentGuesser,
  endTurnIfExpired,
  markFound,
  markPassed,
  nextRound,
  pauseTurn,
  resumeTurn,
  startTurn,
  timeLeft,
  totals,
  undoFound,
  type TimeUpState,
} from './game';

const players: Player[] = [
  { id: 'p1', name: 'Léa' },
  { id: 'p2', name: 'Hugo' },
  { id: 'p3', name: 'Tom' },
  { id: 'p4', name: 'Sarah' },
];
const teams: TeamDraft[] = [
  { id: 'A', name: 'Les Flamants', color: 'blindtest', playerIds: ['p1', 'p2'] },
  { id: 'B', name: 'Les Pingouins', color: 'hipster', playerIds: ['p3', 'p4'] },
];
const cards: Card[] = [
  { id: 'c0', text: 'Astérix' },
  { id: 'c1', text: 'Tour Eiffel' },
  { id: 'c2', text: 'Zidane' },
];
const noShuffle = () => 0.999999; // Fisher-Yates avec j = i : ordre conservé

function game(rounds = 3): TimeUpState {
  return createGame(teams, players, cards, { turnSeconds: 60, rounds }, noShuffle);
}
const inTurn = (s = game(), now = 0) => startTurn(beginRound(s), now);

describe('createGame', () => {
  test('commence en annonce de manche 1 avec tout le paquet', () => {
    const s = game();
    expect(s.phase).toBe('roundIntro');
    expect(s.round).toBe(1);
    expect(s.deck).toHaveLength(3);
    expect(s.scores).toEqual({ A: [0, 0, 0], B: [0, 0, 0] });
    expect(s.turn).toBeNull();
  });

  test('copie les noms des joueurs (instantané)', () => {
    const local = players.map((p) => ({ ...p }));
    const s = createGame(teams, local, cards, { turnSeconds: 60, rounds: 3 });
    local[0].name = 'Renommée';
    expect(s.teams[0].players[0].name).toBe('Léa');
  });
});

test('beginRound passe au lancement du tour', () => {
  expect(beginRound(game()).phase).toBe('turnStart');
});

test('startTurn démarre le chrono', () => {
  const s = inTurn();
  expect(s.phase).toBe('turn');
  expect(timeLeft(s, 15000)).toBe(45000);
  expect(timeLeft(s, 90000)).toBe(0);
});

test('markFound retire la carte affichée et la compte', () => {
  const s = markFound(inTurn(), 1000);
  expect(s.turn!.foundIds).toEqual(['c0']);
  expect(s.deck).toHaveLength(2);
  expect(currentCard(s)!.id).toBe('c1');
});

test('markPassed envoie la carte en fin de paquet', () => {
  const s = markPassed(inTurn(), 1000);
  expect(s.deck).toEqual(['c1', 'c2', 'c0']);
});

test("markPassed avec une seule carte garde la même carte", () => {
  let s = inTurn();
  s = markFound(s, 1);
  s = markFound(s, 2);
  const before = currentCard(s);
  s = markPassed(s, 3);
  expect(currentCard(s)).toEqual(before);
  expect(s.phase).toBe('turn');
});

describe('actions hors tour ignorées', () => {
  test('après la fin du chrono, Trouvé ne compte rien et termine le tour', () => {
    const s = markFound(inTurn(), 61000);
    expect(s.phase).toBe('turnRecap');
    expect(s.turn!.over).toBe(true);
    expect(s.turn!.foundIds).toEqual([]);
    expect(s.deck).toHaveLength(3);
  });

  test('en récap, Trouvé et Passer renvoient la même référence', () => {
    const s = markFound(inTurn(), 61000);
    expect(markFound(s, 62000)).toBe(s);
    expect(markPassed(s, 62000)).toBe(s);
  });

  test('startTurn hors phase renvoie la même référence', () => {
    const s = game();
    expect(startTurn(s, 0)).toBe(s);
    expect(confirmTurn(s)).toBe(s);
    expect(nextRound(s)).toBe(s);
  });

  test('pendant la pause, Trouvé est ignoré', () => {
    const s = pauseTurn(inTurn(), 1000);
    expect(markFound(s, 2000)).toBe(s);
  });
});

describe('pause et reprise', () => {
  test('le temps ne s’écoule pas pendant la pause', () => {
    let s = inTurn(undefined, 0);
    s = pauseTurn(s, 20000);
    expect(s.turn!.endsAt).toBeNull();
    s = JSON.parse(JSON.stringify(s));
    s = resumeTurn(s, 500000);
    expect(timeLeft(s, 500000)).toBe(40000);
  });

  test('en pause, timeLeft renvoie le temps figé', () => {
    const s = pauseTurn(inTurn(), 20000);
    expect(timeLeft(s, 999999)).toBe(40000);
  });

  test('endTurnIfExpired ne termine pas un tour en pause', () => {
    const s = pauseTurn(inTurn(), 20000);
    expect(endTurnIfExpired(s, 999999)).toBe(s);
  });
});

test('paquet vidé en plein tour : récap puis fin de manche avec 3 points', () => {
  let s = inTurn();
  s = markFound(s, 1);
  s = markFound(s, 2);
  s = markFound(s, 3);
  expect(s.phase).toBe('turnRecap');
  expect(s.turn!.over).toBe(true);
  s = confirmTurn(s);
  expect(s.phase).toBe('roundEnd');
  expect(s.scores.A).toEqual([3, 0, 0]);
});

test('undoFound en récap remet la carte en jeu', () => {
  let s = inTurn();
  s = markFound(s, 1);
  s = markFound(s, 2);
  s = endTurnIfExpired(s, 61000);
  s = undoFound(s, 'c0');
  expect(s.turn!.foundIds).toEqual(['c1']);
  expect(s.deck).toContain('c0');
  s = confirmTurn(s);
  expect(s.scores.A[0]).toBe(1);
  expect(s.deck).toHaveLength(2);
});

test('undoFound hors récap ne fait rien', () => {
  const s = markFound(inTurn(), 1);
  expect(undoFound(s, 'c0')).toBe(s);
});

test('undo sur une manche vidée : la manche continue', () => {
  let s = inTurn();
  s = markFound(s, 1);
  s = markFound(s, 2);
  s = markFound(s, 3);
  s = undoFound(s, 'c2');
  s = confirmTurn(s);
  expect(s.phase).toBe('turnStart');
  expect(s.deck).toEqual(['c2']);
});

test('rotation des équipes puis des joueurs', () => {
  let s = beginRound(game());
  expect(currentGuesser(s).name).toBe('Léa');
  s = confirmTurn(endTurnIfExpired(startTurn(s, 0), 61000));
  expect(s.currentTeam).toBe(1);
  expect(currentGuesser(s).name).toBe('Tom');
  s = confirmTurn(endTurnIfExpired(startTurn(s, 0), 61000));
  expect(s.currentTeam).toBe(0);
  expect(currentGuesser(s).name).toBe('Hugo');
});

describe('nextRound', () => {
  function endRound(s: TimeUpState) {
    s = startTurn(s.phase === 'roundIntro' ? beginRound(s) : s, 0);
    while (s.phase === 'turn') s = markFound(s, 1);
    return confirmTurn(s);
  }

  test('manche suivante : paquet complet, équipe suivante', () => {
    let s = endRound(game());
    s = nextRound(s, noShuffle);
    expect(s.phase).toBe('roundIntro');
    expect(s.round).toBe(2);
    expect(s.deck).toHaveLength(3);
    expect(s.currentTeam).toBe(1);
  });

  test('après la dernière manche : podium', () => {
    const s = nextRound(endRound(game(1)));
    expect(s.phase).toBe('podium');
  });

  test('après la manche 3 : podium', () => {
    let s = game(3);
    for (let r = 0; r < 3; r++) {
      s = endRound(s);
      s = nextRound(s);
    }
    expect(s.phase).toBe('podium');
    expect(s.round).toBe(3);
  });
});

test('totals : classement décroissant, égalité au même rang', () => {
  const s: TimeUpState = { ...game(), scores: { A: [3, 2, 0], B: [1, 4, 0] } };
  expect(totals(s)).toEqual([
    { teamId: 'A', total: 5, rank: 1 },
    { teamId: 'B', total: 5, rank: 1 },
  ]);
  const t: TimeUpState = { ...game(), scores: { A: [1, 0, 0], B: [4, 0, 0] } };
  expect(totals(t).map((x) => [x.teamId, x.rank])).toEqual([
    ['B', 1],
    ['A', 2],
  ]);
});
