import { get, writable } from 'svelte/store';
import type { Player } from '../../lib/players';
import { newTeam, randomAssign, type TeamDraft } from '../../lib/teams';
import type { Rng } from '../../lib/random';
import type { TimeUpState } from './logic/game';

/**
 * Équipes en préparation. Gardées en mémoire de session (pas en localStorage) :
 * elles survivent au détour par l'écran Joueurs et au « Rejouer » du podium.
 */
export const teamsDraft = writable<TeamDraft[]>([]);

/** Retire des équipes les joueurs qui n'existent plus dans la liste globale. */
export function pruneTeams(teams: TeamDraft[], players: Player[]): TeamDraft[] {
  const ids = new Set(players.map((p) => p.id));
  return teams.map((t) => ({ ...t, playerIds: t.playerIds.filter((id) => ids.has(id)) }));
}

/** Répartit au hasard tous les joueurs dans `count` équipes (au moins 2). */
export function shuffleTeams(players: Player[], count: number, rng?: Rng): TeamDraft[] {
  const n = Math.max(2, count);
  const current = get(teamsDraft);
  const groups = randomAssign(
    players.map((p) => p.id),
    n,
    rng,
  );
  return groups.map((playerIds, i) => ({ ...(current[i] ?? newTeam(i)), playerIds }));
}

/** Change le nombre d'équipes ; les joueurs d'une équipe retirée deviennent « sans équipe ». */
export function resizeTeams(teams: TeamDraft[], count: number): TeamDraft[] {
  const n = Math.max(2, count);
  if (n <= teams.length) return teams.slice(0, n);
  return [...teams, ...Array.from({ length: n - teams.length }, (_, i) => newTeam(teams.length + i))];
}

/**
 * Toucher un joueur le fait passer à l'équipe suivante ; après la dernière,
 * il devient « sans équipe » ; un joueur sans équipe rejoint la première.
 */
export function cyclePlayer(teams: TeamDraft[], playerId: string): TeamDraft[] {
  const from = teams.findIndex((t) => t.playerIds.includes(playerId));
  const to = from === -1 ? 0 : from + 1 < teams.length ? from + 1 : -1;
  return teams.map((t, i) => {
    let ids = t.playerIds.filter((id) => id !== playerId);
    if (i === to) ids = [...ids, playerId];
    return { ...t, playerIds: ids };
  });
}

/** Équipes d'une partie (pour « Rejouer », même après un rechargement de la page). */
export function draftsFromGame(s: TimeUpState): TeamDraft[] {
  return s.teams.map((t) => ({ id: t.id, name: t.name, color: t.color, playerIds: t.players.map((p) => p.id) }));
}
