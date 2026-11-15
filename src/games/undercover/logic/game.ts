import { shuffle, type Rng } from '../../../lib/random';
import { drawPair, type WordPair } from './pairs';

export type Role = 'civil' | 'undercover' | 'mrwhite';
export type Winner = 'civils' | 'imposteurs' | 'mrwhite';
export type Phase = 'deal' | 'talk' | 'vote' | 'reveal' | 'mrwhite' | 'end' | 'scores' | 'podium';

/** Points marqués par le camp gagnant. */
export const POINTS = { civil: 2, undercover: 10, mrwhite: 6 } as const;

export interface UndercoverState {
  version: 1;
  players: { id: string; name: string }[]; // copie figée au lancement, ordre de la liste
  mrWhite: boolean;
  totals: Record<string, number>; // cumul de la série, toutes les clés présentes dès le départ
  usedPairs: number[];
  gameNumber: number; // 1 pour la première partie
  pairIndex: number;
  civilWord: string;
  undercoverWord: string;
  roles: Record<string, Role>;
  eliminated: string[]; // dans l'ordre d'élimination
  phase: Phase;
  dealIndex: number; // index dans players du prochain joueur à voir son mot
  round: number; // 1 pour la première manche
  firstSpeaker: string | null;
  winner: Winner | null;
  gained: Record<string, number>; // points de la dernière partie terminée
}

/** Répartition des rôles : 1 undercover, Mr White en option, le reste en civils. */
export function composition(n: number, mrWhite: boolean) {
  return { civils: n - 1 - (mrWhite ? 1 : 0), undercover: 1 as const, mrWhite: (mrWhite ? 1 : 0) as 0 | 1 };
}

/** Tire une paire, les rôles et remet la partie à la distribution. */
function deal(
  base: Pick<UndercoverState, 'players' | 'mrWhite' | 'totals' | 'usedPairs' | 'gameNumber'>,
  pairs: readonly WordPair[],
  rng: Rng,
): UndercoverState {
  const { index, used } = drawPair(pairs.length, base.usedPairs, rng);
  const pair = pairs[index];
  const civilGetsA = rng() < 0.5;
  const ids = shuffle(
    base.players.map((p) => p.id),
    rng,
  );
  const roles: Record<string, Role> = {};
  ids.forEach((id, i) => {
    roles[id] = i === 0 ? 'undercover' : i === 1 && base.mrWhite ? 'mrwhite' : 'civil';
  });
  return {
    version: 1,
    players: base.players,
    mrWhite: base.mrWhite,
    totals: base.totals,
    usedPairs: used,
    gameNumber: base.gameNumber,
    pairIndex: index,
    civilWord: civilGetsA ? pair.a : pair.b,
    undercoverWord: civilGetsA ? pair.b : pair.a,
    roles,
    eliminated: [],
    phase: 'deal',
    dealIndex: 0,
    round: 0,
    firstSpeaker: null,
    winner: null,
    gained: {},
  };
}

export function createSeries(
  players: { id: string; name: string }[],
  mrWhite: boolean,
  pairs: readonly WordPair[],
  rng: Rng = Math.random,
): UndercoverState {
  const copy = players.map((p) => ({ ...p }));
  const totals: Record<string, number> = {};
  for (const p of copy) totals[p.id] = 0;
  return deal({ players: copy, mrWhite, totals, usedPairs: [], gameNumber: 1 }, pairs, rng);
}

/** Mot à montrer au joueur ; `null` pour Mr White. */
export function wordOf(s: UndercoverState, playerId: string): string | null {
  const role = s.roles[playerId];
  if (role === 'civil') return s.civilWord;
  if (role === 'undercover') return s.undercoverWord;
  return null;
}

export function alive(s: UndercoverState): string[] {
  return s.players.map((p) => p.id).filter((id) => !s.eliminated.includes(id));
}

/** Premier orateur : au hasard à la manche 1, sinon le suivant de l'ancien, sans Mr White. */
function pickFirstSpeaker(s: UndercoverState, rng: Rng): string | null {
  const inPlay = alive(s);
  const eligible = (id: string) => inPlay.includes(id) && s.roles[id] !== 'mrwhite';
  if (s.firstSpeaker === null) {
    const candidates = inPlay.filter(eligible);
    const pool = candidates.length > 0 ? candidates : inPlay;
    return pool.length > 0 ? pool[Math.floor(rng() * pool.length)] : null;
  }
  const ids = s.players.map((p) => p.id);
  const start = ids.indexOf(s.firstSpeaker);
  for (let k = 1; k <= ids.length; k++) {
    const id = ids[(start + k) % ids.length];
    if (eligible(id)) return id;
  }
  return inPlay[0] ?? null;
}

export function seeWord(s: UndercoverState, rng: Rng = Math.random): UndercoverState {
  if (s.phase !== 'deal') return s;
  const dealIndex = s.dealIndex + 1;
  if (dealIndex < s.players.length) return { ...s, dealIndex };
  const next: UndercoverState = { ...s, dealIndex, phase: 'talk', round: 1, firstSpeaker: null };
  return { ...next, firstSpeaker: pickFirstSpeaker(next, rng) };
}

/** Joueurs en jeu, en commençant par le premier orateur. */
export function speakingOrder(s: UndercoverState): string[] {
  const inPlay = alive(s);
  const i = s.firstSpeaker === null ? -1 : inPlay.indexOf(s.firstSpeaker);
  if (i <= 0) return inPlay;
  return [...inPlay.slice(i), ...inPlay.slice(0, i)];
}

export function toVote(s: UndercoverState): UndercoverState {
  return s.phase === 'talk' ? { ...s, phase: 'vote' } : s;
}

export function toTalk(s: UndercoverState): UndercoverState {
  return s.phase === 'vote' ? { ...s, phase: 'talk' } : s;
}

export function eliminate(s: UndercoverState, id: string): UndercoverState {
  if (s.phase !== 'vote' || !alive(s).includes(id)) return s;
  return { ...s, eliminated: [...s.eliminated, id], phase: 'reveal' };
}

export function lastEliminated(s: UndercoverState): string | null {
  return s.eliminated.at(-1) ?? null;
}

export function outcome(roles: Record<string, Role>, eliminated: readonly string[]): Winner | null {
  const out = new Set(eliminated);
  const ids = Object.keys(roles);
  const impostorsLeft = ids.some((id) => roles[id] !== 'civil' && !out.has(id));
  if (!impostorsLeft) return 'civils';
  const civilsLeft = ids.filter((id) => roles[id] === 'civil' && !out.has(id)).length;
  return civilsLeft <= 1 ? 'imposteurs' : null;
}

export function points(
  roles: Record<string, Role>,
  eliminated: readonly string[],
  winner: Winner,
): Record<string, number> {
  const out = new Set(eliminated);
  const result: Record<string, number> = {};
  for (const [id, role] of Object.entries(roles)) {
    let gain = 0;
    if (winner === 'civils' && role === 'civil') gain = POINTS.civil;
    else if (winner === 'imposteurs' && !out.has(id)) {
      if (role === 'undercover') gain = POINTS.undercover;
      else if (role === 'mrwhite') gain = POINTS.mrwhite;
    } else if (winner === 'mrwhite' && role === 'mrwhite') gain = POINTS.mrwhite;
    result[id] = gain;
  }
  return result;
}

/** Termine la partie : gagnant, points de la partie et cumul de la série. */
function finish(s: UndercoverState, winner: Winner): UndercoverState {
  const gained = points(s.roles, s.eliminated, winner);
  const totals: Record<string, number> = { ...s.totals };
  for (const [id, g] of Object.entries(gained)) totals[id] = (totals[id] ?? 0) + g;
  return { ...s, winner, gained, totals, phase: 'end' };
}

/** Fin de partie si les conditions sont remplies, sinon manche suivante. */
function proceed(s: UndercoverState, rng: Rng): UndercoverState {
  const winner = outcome(s.roles, s.eliminated);
  if (winner !== null) return finish(s, winner);
  const next: UndercoverState = { ...s, round: s.round + 1, phase: 'talk' };
  return { ...next, firstSpeaker: pickFirstSpeaker(next, rng) };
}

export function afterReveal(s: UndercoverState, rng: Rng = Math.random): UndercoverState {
  if (s.phase !== 'reveal') return s;
  const last = lastEliminated(s);
  if (last !== null && s.roles[last] === 'mrwhite') return { ...s, phase: 'mrwhite' };
  return proceed(s, rng);
}

export function mrWhiteGuess(s: UndercoverState, found: boolean, rng: Rng = Math.random): UndercoverState {
  if (s.phase !== 'mrwhite') return s;
  return found ? finish(s, 'mrwhite') : proceed(s, rng);
}

export function toScores(s: UndercoverState): UndercoverState {
  return s.phase === 'end' ? { ...s, phase: 'scores' } : s;
}

export function nextGame(s: UndercoverState, pairs: readonly WordPair[], rng: Rng = Math.random): UndercoverState {
  if (s.phase !== 'scores') return s;
  return deal({ ...s, gameNumber: s.gameNumber + 1 }, pairs, rng);
}

export function finishSeries(s: UndercoverState): UndercoverState {
  return s.phase === 'scores' ? { ...s, phase: 'podium' } : s;
}
