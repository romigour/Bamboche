import type { GameColor } from '../../types';
import type { Player } from '../../../lib/players';
import { shuffle, type Rng } from '../../../lib/random';
import type { Card, TeamDraft } from '../../../lib/teams';

export type Phase = 'roundIntro' | 'turnStart' | 'turn' | 'turnRecap' | 'roundEnd' | 'podium';

export interface TeamState {
  id: string;
  name: string;
  color: GameColor;
  players: Player[];
  nextPlayer: number;
}

export interface TurnState {
  endsAt: number | null;
  remainingMs: number;
  foundIds: string[];
  over: boolean;
}

export interface TimeUpSettings {
  turnSeconds: number;
  rounds: number;
}

export interface TimeUpState {
  version: 1;
  settings: TimeUpSettings;
  teams: TeamState[];
  cards: Card[];
  round: number;
  deck: string[];
  currentTeam: number;
  scores: Record<string, number[]>;
  turn: TurnState | null;
  phase: Phase;
}

export const ROUND_RULES: Record<1 | 2 | 3, { title: string; rule: string }> = {
  1: { title: 'Décrire', rule: 'Fais deviner en parlant librement, sans dire le mot.' },
  2: { title: 'Un seul mot', rule: 'Un seul mot comme indice, pas plus !' },
  3: { title: 'Mimer', rule: 'Mime, sans un bruit !' },
};

export function createGame(
  teams: TeamDraft[],
  players: Player[],
  cards: Card[],
  settings: TimeUpSettings,
  rng?: Rng,
): TimeUpState {
  const byId = new Map(players.map((p) => [p.id, p]));
  return {
    version: 1,
    settings: { ...settings },
    teams: teams.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      players: t.playerIds.flatMap((id) => {
        const p = byId.get(id);
        return p ? [{ id: p.id, name: p.name }] : [];
      }),
      nextPlayer: 0,
    })),
    cards: cards.map((c) => ({ ...c })),
    round: 1,
    deck: shuffle(cards.map((c) => c.id), rng),
    currentTeam: 0,
    scores: Object.fromEntries(teams.map((t) => [t.id, Array(settings.rounds).fill(0)])),
    turn: null,
    phase: 'roundIntro',
  };
}

export function beginRound(s: TimeUpState): TimeUpState {
  return s.phase === 'roundIntro' ? { ...s, phase: 'turnStart' } : s;
}

export function currentGuesser(s: TimeUpState): Player {
  const team = s.teams[s.currentTeam];
  return team.players[team.nextPlayer % team.players.length];
}

export function startTurn(s: TimeUpState, now: number): TimeUpState {
  if (s.phase !== 'turnStart') return s;
  const ms = s.settings.turnSeconds * 1000;
  return { ...s, phase: 'turn', turn: { endsAt: now + ms, remainingMs: ms, foundIds: [], over: false } };
}

export function currentCard(s: TimeUpState): Card | null {
  const id = s.deck[0];
  return id === undefined ? null : (s.cards.find((c) => c.id === id) ?? null);
}

export function timeLeft(s: TimeUpState, now: number): number {
  if (!s.turn) return 0;
  if (s.turn.over) return 0;
  if (s.turn.endsAt === null) return s.turn.remainingMs;
  return Math.max(0, s.turn.endsAt - now);
}

const running = (s: TimeUpState) => s.phase === 'turn' && !!s.turn && !s.turn.over && s.turn.endsAt !== null;

function finishTurn(s: TimeUpState, deck: string[], foundIds: string[]): TimeUpState {
  return { ...s, deck, phase: 'turnRecap', turn: { endsAt: null, remainingMs: 0, foundIds, over: true } };
}

export function endTurnIfExpired(s: TimeUpState, now: number): TimeUpState {
  if (!running(s) || now < s.turn!.endsAt!) return s;
  // la carte qu'on était en train de faire deviner repart sous le paquet (pas d'avantage à l'équipe suivante)
  const deck = s.deck.length > 1 ? [...s.deck.slice(1), s.deck[0]] : s.deck;
  return finishTurn(s, deck, s.turn!.foundIds);
}

export function markFound(s: TimeUpState, now: number): TimeUpState {
  s = endTurnIfExpired(s, now);
  if (!running(s) || s.deck.length === 0) return s;
  const [found, ...rest] = s.deck;
  const foundIds = [...s.turn!.foundIds, found];
  if (rest.length === 0) return finishTurn(s, rest, foundIds);
  return { ...s, deck: rest, turn: { ...s.turn!, foundIds } };
}

export function markPassed(s: TimeUpState, now: number): TimeUpState {
  s = endTurnIfExpired(s, now);
  if (!running(s) || s.deck.length < 2) return s;
  const [first, ...rest] = s.deck;
  return { ...s, deck: [...rest, first] };
}

export function pauseTurn(s: TimeUpState, now: number): TimeUpState {
  s = endTurnIfExpired(s, now);
  if (!running(s)) return s;
  return { ...s, turn: { ...s.turn!, endsAt: null, remainingMs: Math.max(0, s.turn!.endsAt! - now) } };
}

export function resumeTurn(s: TimeUpState, now: number): TimeUpState {
  if (s.phase !== 'turn' || !s.turn || s.turn.over || s.turn.endsAt !== null) return s;
  return { ...s, turn: { ...s.turn, endsAt: now + s.turn.remainingMs } };
}

export function undoFound(s: TimeUpState, cardId: string): TimeUpState {
  if (s.phase !== 'turnRecap' || !s.turn || !s.turn.foundIds.includes(cardId)) return s;
  return {
    ...s,
    deck: [...s.deck, cardId],
    turn: { ...s.turn, foundIds: s.turn.foundIds.filter((id) => id !== cardId) },
  };
}

export function confirmTurn(s: TimeUpState): TimeUpState {
  if (s.phase !== 'turnRecap' || !s.turn) return s;
  const team = s.teams[s.currentTeam];
  const roundScores = [...s.scores[team.id]];
  roundScores[s.round - 1] += s.turn.foundIds.length;
  return {
    ...s,
    scores: { ...s.scores, [team.id]: roundScores },
    teams: s.teams.map((t, i) => (i === s.currentTeam ? { ...t, nextPlayer: t.nextPlayer + 1 } : t)),
    currentTeam: (s.currentTeam + 1) % s.teams.length,
    turn: null,
    phase: s.deck.length === 0 ? 'roundEnd' : 'turnStart',
  };
}

export function nextRound(s: TimeUpState, rng?: Rng): TimeUpState {
  if (s.phase !== 'roundEnd') return s;
  if (s.round >= s.settings.rounds) return { ...s, phase: 'podium' };
  return { ...s, round: s.round + 1, deck: shuffle(s.cards.map((c) => c.id), rng), phase: 'roundIntro' };
}

export function totals(s: TimeUpState): { teamId: string; total: number; rank: number }[] {
  const list = s.teams
    .map((t) => ({ teamId: t.id, total: (s.scores[t.id] ?? []).reduce((a, b) => a + b, 0) }))
    .sort((a, b) => b.total - a.total);
  return list.map((x) => ({ ...x, rank: list.findIndex((y) => y.total === x.total) + 1 }));
}

/** Annule une annulation en récap (le mot redevient trouvé). */
export function redoFound(s: TimeUpState, cardId: string): TimeUpState {
  if (s.phase !== 'turnRecap' || !s.turn || s.turn.foundIds.includes(cardId) || !s.deck.includes(cardId)) return s;
  return {
    ...s,
    deck: s.deck.filter((id) => id !== cardId),
    turn: { ...s.turn, foundIds: [...s.turn.foundIds, cardId] },
  };
}
