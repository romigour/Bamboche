import type { GameColor } from '../games/types';
import { uid } from './id';
import { shuffle, type Rng } from './random';

export interface TeamDraft {
  id: string;
  name: string;
  color: GameColor;
  playerIds: string[];
}

export interface WordEntry {
  text: string;
  category: string;
}

export interface Card {
  id: string;
  text: string;
  category?: string;
  byTeamId?: string;
}

export const TEAM_NAMES = [
  'Les Flamants', 'Les Pingouins', 'Les Loutres', 'Les Koalas',
  'Les Lamas', 'Les Hiboux', 'Les Pandas', 'Les Ratons',
];

/** Le jaune (pop) arrive tard : il est réservé au bouton principal. */
export const TEAM_COLORS: GameColor[] = ['blindtest', 'hipster', 'undercover', 'ok', 'timeup', 'pop'];

export function newTeam(index: number): TeamDraft {
  return {
    id: uid('t'),
    name: TEAM_NAMES[index] ?? `Équipe ${index + 1}`,
    color: TEAM_COLORS[index % TEAM_COLORS.length],
    playerIds: [],
  };
}

/** Répartition équilibrée (écart de taille ≤ 1) d'une liste mélangée. */
export function randomAssign(playerIds: string[], teamCount: number, rng?: Rng): string[][] {
  const groups: string[][] = Array.from({ length: Math.max(1, teamCount) }, () => []);
  shuffle(playerIds, rng).forEach((id, i) => groups[i % groups.length].push(id));
  return groups;
}

export function validateTeams(
  teams: TeamDraft[],
  minTeams: number,
  minPlayersPerTeam: number,
  names: Record<string, string> = {},
): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  if (teams.length < minTeams) errors.push(`Il faut au moins ${minTeams} équipes.`);
  for (const t of teams)
    if (t.playerIds.length < minPlayersPerTeam) errors.push(`${t.name} : au moins ${minPlayersPerTeam} joueurs.`);
  const seen = new Set<string>();
  const reported = new Set<string>();
  for (const t of teams)
    for (const id of t.playerIds) {
      if (seen.has(id) && !reported.has(id)) {
        errors.push(`${names[id] ?? id} est dans deux équipes.`);
        reported.add(id);
      }
      seen.add(id);
    }
  return { ok: errors.length === 0, errors };
}

/** « Les Flamants » → « Flamants » (titres courts). */
export function shortName(name: string): string {
  return name.replace(/^Les\s+/i, '');
}

/** Chacun pour soi : une équipe par joueur, à son nom, couleurs dans l'ordre de la palette. */
export function soloTeams(players: { id: string; name: string }[]): TeamDraft[] {
  return players.map((p, i) => ({ id: `solo-${p.id}`, name: p.name, color: TEAM_COLORS[i % TEAM_COLORS.length], playerIds: [p.id] }));
}
