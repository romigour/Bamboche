import { get, writable } from 'svelte/store';
import type { Player } from '../../lib/players';
import { shuffleInto } from '../../lib/teamDraft';
import type { TeamDraft } from '../../lib/teams';
import type { Rng } from '../../lib/random';
import type { TimeUpState } from './logic/game';

/**
 * Équipes en préparation. Gardées en mémoire de session (pas en localStorage) :
 * elles survivent au détour par l'écran Joueurs et au « Rejouer » du podium.
 */
export const teamsDraft = writable<TeamDraft[]>([]);

export { cyclePlayer, pruneTeams, resizeTeams } from '../../lib/teamDraft';

/** Répartit au hasard tous les joueurs dans `count` équipes (au moins 2). */
export function shuffleTeams(players: Player[], count: number, rng?: Rng): TeamDraft[] {
  return shuffleInto(get(teamsDraft), players, count, rng);
}

/** Équipes d'une partie (pour « Rejouer », même après un rechargement de la page). */
export function draftsFromGame(s: TimeUpState): TeamDraft[] {
  return s.teams.map((t) => ({ id: t.id, name: t.name, color: t.color, playerIds: t.players.map((p) => p.id) }));
}
