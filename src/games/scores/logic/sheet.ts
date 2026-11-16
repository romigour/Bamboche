import { rankScores } from '../../../lib/ranking';
import { fmt, type ScoreGameDef, type ScoreGameId } from '../defs';

export interface Participant {
  id: string;
  name: string;
  members: string[]; // solo : [name] ; Belote : « Léa & Tom », ['Léa', 'Tom']
}

/** round 0-based ; round === rounds.length ⇒ manche entamée. */
export interface Cell {
  round: number;
  index: number;
}

export interface Sheet {
  version: 1;
  id: string;
  gameId: ScoreGameId;
  startedAt: number;
  endValue: number;
  participants: Participant[];
  rounds: number[][]; // manches complètes, rounds[r][i]
  pending: (number | null)[]; // manche entamée, une case par participant
  editing: Cell | null; // cellule touchée pour correction
}

export function createSheet(
  gameId: ScoreGameId,
  participants: Participant[],
  endValue: number,
  now: number,
  id: string,
): Sheet {
  return {
    version: 1,
    id,
    gameId,
    startedAt: now,
    endValue,
    participants,
    rounds: [],
    pending: participants.map(() => null),
    editing: null,
  };
}

function naturalCursor(s: Sheet): Cell {
  return { round: s.rounds.length, index: Math.max(0, s.pending.indexOf(null)) };
}

export function cursor(s: Sheet): Cell {
  return s.editing ?? naturalCursor(s);
}

export function enter(s: Sheet, value: number): Sheet {
  const cell = cursor(s);
  if (cell.round < s.rounds.length) {
    const rounds = s.rounds.map((r, i) => (i === cell.round ? r.map((v, j) => (j === cell.index ? value : v)) : r));
    return { ...s, rounds, editing: null };
  }
  const pending = s.pending.map((v, i) => (i === cell.index ? value : v));
  if (pending.includes(null)) return { ...s, pending, editing: null };
  return {
    ...s,
    rounds: [...s.rounds, pending as number[]],
    pending: s.participants.map(() => null),
    editing: null,
  };
}

export function select(s: Sheet, cell: Cell): Sheet {
  const natural = naturalCursor(s);
  if (cell.round === natural.round && cell.index === natural.index) return { ...s, editing: null };
  return { ...s, editing: { ...cell } };
}

export function hasPending(s: Sheet): boolean {
  return s.pending.some((v) => v !== null);
}

export function removeLast(s: Sheet): Sheet {
  if (hasPending(s)) return { ...s, pending: s.pending.map(() => null), editing: null };
  return { ...s, rounds: s.rounds.slice(0, -1), editing: null };
}

export function totals(s: Pick<Sheet, 'rounds' | 'participants'>): number[] {
  return s.participants.map((_, i) => s.rounds.reduce((sum, r) => sum + (r[i] ?? 0), 0));
}

/** Rangs 1-based dans l'ordre d'origine ; ex æquo = même rang. */
export function ranks(def: ScoreGameDef, tot: number[]): number[] {
  const sign = def.winner === 'bas' ? -1 : 1;
  const ranked = rankScores(tot.map((t, i) => ({ id: String(i), total: sign * t })));
  const out: number[] = tot.map(() => 0);
  for (const r of ranked) out[Number(r.id)] = r.rank;
  return out;
}

export function endReached(
  def: ScoreGameDef,
  s: Pick<Sheet, 'rounds' | 'participants' | 'endValue'>,
): boolean {
  if (s.rounds.length === 0) return false;
  if (def.end.kind === 'manches') return s.rounds.length >= s.endValue;
  return totals(s).some((t) => t >= s.endValue);
}

function joinNames(names: string[]): string {
  return names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]}`;
}

export function endMessage(def: ScoreGameDef, s: Sheet): string {
  if (def.end.kind === 'manches') return `Les ${s.endValue} manches sont jouées !`;
  const tot = totals(s);
  const names = s.participants
    .map((p, i) => ({ name: p.name, total: tot[i] }))
    .filter((e) => e.total >= s.endValue)
    .sort((a, b) => b.total - a.total)
    .map((e) => e.name);
  return `${joinNames(names)} ${names.length > 1 ? 'ont' : 'a'} atteint ${fmt(s.endValue)} !`;
}

export function progressLine(def: ScoreGameDef, s: Sheet): string {
  if (def.end.kind === 'manches') {
    const n = Math.min(s.rounds.length + 1, s.endValue);
    return `Manche ${n} / ${s.endValue}` + (def.roundLabel ? ` · ${def.roundLabel(n)}` : '');
  }
  if (s.rounds.length === 0) return `Fin à ${fmt(s.endValue)} points`;
  const tot = totals(s);
  let best = 0;
  tot.forEach((t, i) => {
    if (t > tot[best]) best = i;
  });
  return `${s.participants[best].name} est à ${fmt(tot[best])} / ${fmt(s.endValue)}`;
}

export function suggestion(def: ScoreGameDef, s: Sheet): number | null {
  if (def.complement === undefined) return null;
  const c = cursor(s);
  const first = s.pending[0];
  if (c.round !== s.rounds.length || c.index !== 1 || first === null) return null;
  if (first < 0 || first > def.complement) return null;
  return def.complement - first;
}
