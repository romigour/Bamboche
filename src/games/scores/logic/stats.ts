import { normalizeWord } from '../../../lib/normalize';
import { scoreGameById, type ScoreGameId } from '../defs';
import { ranks, totals, type Participant } from './sheet';

export interface FinishedGame {
  version: 1;
  id: string;
  gameId: ScoreGameId;
  startedAt: number;
  finishedAt: number;
  endValue: number;
  participants: Participant[];
  rounds: number[][];
}

/** Ids des participants de rang 1 (plusieurs en cas d'ex æquo). */
export function winners(g: FinishedGame): string[] {
  const def = scoreGameById(g.gameId);
  if (!def) return [];
  const r = ranks(def, totals({ rounds: g.rounds, participants: g.participants }));
  return g.participants.filter((_, i) => r[i] === 1).map((p) => p.id);
}

export interface PlayerStat {
  key: string;
  name: string;
  played: number;
  wins: number;
  pct: number; // entier arrondi
}

export function playerStats(history: FinishedGame[], gameId: ScoreGameId): PlayerStat[] {
  const acc = new Map<string, PlayerStat & { last: number }>();
  for (const g of history) {
    if (g.gameId !== gameId) continue;
    const won = new Set(winners(g));
    for (const p of g.participants) {
      for (const member of p.members) {
        const key = normalizeWord(member);
        let s = acc.get(key);
        if (!s) {
          s = { key, name: member, played: 0, wins: 0, pct: 0, last: g.finishedAt };
          acc.set(key, s);
        }
        s.played += 1;
        if (won.has(p.id)) s.wins += 1;
        if (g.finishedAt >= s.last) {
          s.last = g.finishedAt;
          s.name = member;
        }
      }
    }
  }
  return [...acc.values()]
    .map(({ last: _last, ...s }) => ({ ...s, pct: Math.round((s.wins / s.played) * 100) }))
    .sort((a, b) => b.wins - a.wins || b.pct - a.pct || a.name.localeCompare(b.name, 'fr'));
}

/** Premier prénom dont la forme normalisée apparaît déjà plus tôt (orthographe de la 2e occurrence). */
export function nameConflict(names: string[]): string | null {
  const seen = new Set<string>();
  for (const n of names) {
    const k = normalizeWord(n);
    if (seen.has(k)) return n;
    seen.add(k);
  }
  return null;
}
