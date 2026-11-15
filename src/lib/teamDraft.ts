import type { Player } from './players';
import type { Rng } from './random';
import { newTeam, randomAssign, type TeamDraft } from './teams';

/** Retire des équipes les joueurs qui n'existent plus dans la liste globale. */
export function pruneTeams(teams: TeamDraft[], players: Player[]): TeamDraft[] {
  const ids = new Set(players.map((p) => p.id));
  return teams.map((t) => ({ ...t, playerIds: t.playerIds.filter((id) => ids.has(id)) }));
}

/** Répartit au hasard tous les joueurs dans `count` équipes (au moins 2), en gardant noms et couleurs existants. */
export function shuffleInto(current: TeamDraft[], players: Player[], count: number, rng?: Rng): TeamDraft[] {
  const n = Math.max(2, count);
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

/** Toucher un joueur : équipe suivante → sans équipe → première équipe. */
export function cyclePlayer(teams: TeamDraft[], playerId: string): TeamDraft[] {
  const from = teams.findIndex((t) => t.playerIds.includes(playerId));
  const to = from === -1 ? 0 : from + 1 < teams.length ? from + 1 : -1;
  return teams.map((t, i) => {
    let ids = t.playerIds.filter((id) => id !== playerId);
    if (i === to) ids = [...ids, playerId];
    return { ...t, playerIds: ids };
  });
}
