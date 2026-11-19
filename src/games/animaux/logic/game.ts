import type { Player } from '../../../lib/players';
import type { Rng } from '../../../lib/random';
import { TEAM_COLORS } from '../../../lib/teams';
import type { GameColor } from '../../types';
import type { Animal, GameLevel } from '../types';
import { drawOptions, drawSounds, trapFor } from './draw';

export interface AnimauxPlayer {
  id: string;
  name: string;
  color: GameColor;
}

export interface Round {
  animalId: string;
  /** Propositions, dans l'ordre affiché (réponse incluse). */
  options: string[];
  /** Réponse de chaque joueur (id d'animal). */
  answers: Record<string, string>;
  revealed: boolean;
  skipped: boolean;
}

export interface AnimauxState {
  version: 1;
  phase: 'sound' | 'reveal' | 'podium';
  level: GameLevel;
  /** Copie des joueurs au lancement : la partie ne dépend plus de la liste globale. */
  players: AnimauxPlayer[];
  rounds: Round[];
  current: number;
}

export function createAnimaux(
  players: Player[],
  all: Animal[],
  settings: { sounds: number; choices: number },
  level: GameLevel,
  history: string[],
  rng?: Rng,
): { state: AnimauxState; history: string[] } {
  const drawn = drawSounds(all, level, settings.sounds, history, rng);
  const rounds: Round[] = drawn.picked.map((id) => {
    const animal = all.find((a) => a.id === id)!;
    return {
      animalId: id,
      options: drawOptions(animal, all, settings.choices, trapFor(level, animal), rng),
      answers: {},
      revealed: false,
      skipped: false,
    };
  });
  const state: AnimauxState = {
    version: 1,
    phase: rounds.length ? 'sound' : 'podium',
    level,
    players: players.map((p, i) => ({ id: p.id, name: p.name, color: TEAM_COLORS[i % TEAM_COLORS.length] })),
    rounds,
    current: 0,
  };
  return { state, history: drawn.history };
}

function updateRound(s: AnimauxState, f: (r: Round) => Round): AnimauxState {
  return { ...s, rounds: s.rounds.map((r, i) => (i === s.current ? f(r) : r)) };
}

export function setAnswer(s: AnimauxState, playerId: string, animalId: string): AnimauxState {
  const r = s.rounds[s.current];
  if (s.phase !== 'sound' || !r || !r.options.includes(animalId) || !s.players.some((p) => p.id === playerId)) return s;
  return updateRound(s, (x) => ({ ...x, answers: { ...x.answers, [playerId]: animalId } }));
}

export function allAnswered(s: AnimauxState): boolean {
  const r = s.rounds[s.current];
  return !!r && s.players.every((p) => r.answers[p.id] !== undefined);
}

export function reveal(s: AnimauxState): AnimauxState {
  if (s.phase !== 'sound' || !allAnswered(s)) return s;
  return { ...updateRound(s, (x) => ({ ...x, revealed: true })), phase: 'reveal' };
}

function advance(s: AnimauxState): AnimauxState {
  return s.current + 1 < s.rounds.length ? { ...s, current: s.current + 1, phase: 'sound' } : { ...s, phase: 'podium' };
}

export function nextSound(s: AnimauxState): AnimauxState {
  return s.phase === 'reveal' ? advance(s) : s;
}

/** Son introuvable : on passe sans compter de points. */
export function skipSound(s: AnimauxState): AnimauxState {
  if (s.phase !== 'sound') return s;
  return advance(updateRound(s, (x) => ({ ...x, skipped: true })));
}

export function correctPlayers(s: AnimauxState, roundIndex: number): string[] {
  const r = s.rounds[roundIndex];
  if (!r || !r.revealed || r.skipped) return [];
  return s.players.filter((p) => r.answers[p.id] === r.animalId).map((p) => p.id);
}

export function scores(s: AnimauxState): Record<string, number> {
  const out: Record<string, number> = Object.fromEntries(s.players.map((p) => [p.id, 0]));
  s.rounds.forEach((_, i) => {
    for (const id of correctPlayers(s, i)) out[id]++;
  });
  return out;
}
