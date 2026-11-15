import type { Player } from '../../../lib/players';
import type { TeamDraft } from '../../../lib/teams';
import type { GameColor } from '../../types';

export type BtPhase = 'listen' | 'reveal' | 'podium';

export interface BtTeam {
  id: string;
  name: string;
  color: GameColor;
  players: Player[];
}

export interface BtSettings {
  tracks: number;
  listenSeconds: number;
}

export interface BlindtestState {
  version: 1;
  playlistId: string;
  settings: BtSettings;
  teams: BtTeam[];
  /** ids à jouer ; queue[current] = extrait courant */
  queue: string[];
  /** remplaçants des extraits qui ne chargent pas */
  spares: string[];
  current: number;
  /** par extrait joué : id d'équipe gagnante ou null (personne) */
  winners: (string | null)[];
  /** extraits indisponibles, pour le message à l'écran */
  skipped: string[];
  phase: BtPhase;
}

export function createBlindtest(
  teams: TeamDraft[],
  players: Player[],
  picked: string[],
  playlistId: string,
  settings: BtSettings,
): BlindtestState {
  const byId = new Map(players.map((p) => [p.id, p]));
  return {
    version: 1,
    playlistId,
    settings: { ...settings },
    teams: teams.map((t) => ({
      id: t.id,
      name: t.name,
      color: t.color,
      players: t.playerIds.flatMap((id) => {
        const p = byId.get(id);
        return p ? [{ id: p.id, name: p.name }] : [];
      }),
    })),
    queue: picked.slice(0, settings.tracks),
    spares: picked.slice(settings.tracks),
    current: 0,
    winners: [],
    skipped: [],
    phase: 'listen',
  };
}

export function currentTrackId(s: BlindtestState): string {
  return s.queue[s.current];
}

export function award(s: BlindtestState, teamId: string | null): BlindtestState {
  if (s.phase !== 'listen') return s;
  const winners = [...s.winners];
  winners[s.current] = teamId;
  return { ...s, winners, phase: 'reveal' };
}

export function changeWinner(s: BlindtestState, teamId: string | null): BlindtestState {
  if (s.phase !== 'reveal') return s;
  const winners = [...s.winners];
  winners[s.current] = teamId;
  return { ...s, winners };
}

export function nextTrack(s: BlindtestState): BlindtestState {
  if (s.phase !== 'reveal') return s;
  if (s.current + 1 >= s.queue.length) return { ...s, phase: 'podium' };
  return { ...s, current: s.current + 1, phase: 'listen' };
}

export function skipCurrent(s: BlindtestState): BlindtestState {
  if (s.phase !== 'listen') return s;
  const dead = s.queue[s.current];
  const skipped = [...s.skipped, dead];
  if (s.spares.length > 0) {
    const [spare, ...spares] = s.spares;
    const queue = s.queue.map((id, i) => (i === s.current ? spare : id));
    return { ...s, queue, spares, skipped };
  }
  const queue = s.queue.filter((_, i) => i !== s.current);
  if (s.current >= queue.length) return { ...s, queue, skipped, phase: 'podium' };
  return { ...s, queue, skipped };
}

export function scores(s: BlindtestState): Record<string, number> {
  const out: Record<string, number> = Object.fromEntries(s.teams.map((t) => [t.id, 0]));
  for (const w of s.winners) if (w && w in out) out[w] += 1;
  return out;
}
