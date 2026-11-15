import { writable } from 'svelte/store';
import type { Player } from '../../lib/players';
import { load, save } from '../../lib/storage';
import { pruneTeams } from '../../lib/teamDraft';
import { soloTeams, validateTeams, type TeamDraft } from '../../lib/teams';

export type BtMode = 'solo' | 'equipes';

/** Mode de jeu, mémorisé. */
export const btMode = writable<BtMode>(load<BtMode>('blindtest:mode', 'solo') === 'equipes' ? 'equipes' : 'solo');
btMode.subscribe((m) => save('blindtest:mode', m));

/** Équipes en préparation (mode « En équipes »), en mémoire de session. */
export const btTeamsDraft = writable<TeamDraft[]>([]);

/** Joueur qui anime en chacun pour soi (il ne joue pas), en mémoire de session. */
export const animatorId = writable<string | null>(null);

/** Équipes de la partie selon le mode. */
export function buildTeams(mode: BtMode, players: Player[], draft: TeamDraft[], animator: string | null): TeamDraft[] {
  if (mode === 'solo') return soloTeams(players.filter((p) => p.id !== animator));
  return pruneTeams(draft, players);
}

export function validateSetup(
  mode: BtMode,
  players: Player[],
  draft: TeamDraft[],
  animator: string | null,
): { ok: boolean; errors: string[] } {
  if (mode === 'solo') {
    const n = players.filter((p) => p.id !== animator).length;
    return n >= 2 ? { ok: true, errors: [] } : { ok: false, errors: ['Il faut au moins 2 joueurs.'] };
  }
  const names = Object.fromEntries(players.map((p) => [p.id, p.name]));
  return validateTeams(pruneTeams(draft, players), 2, 1, names);
}
