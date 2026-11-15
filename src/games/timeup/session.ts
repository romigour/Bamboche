import { writable } from 'svelte/store';
import { setActiveGame } from '../../lib/activeGame';
import { navigate } from '../../lib/router';
import { load, remove, save } from '../../lib/storage';
import { pauseTurn, type TimeUpState } from './logic/game';

const KEY = 'timeup:game';
type Saved = { state: TimeUpState; savedAt: number };

/** Partie en cours ; chaque changement est enregistré avec son heure. */
export const game = writable<TimeUpState | null>(null);
game.subscribe((s) => {
  if (s) save<Saved>(KEY, { state: s, savedAt: Date.now() });
});

export function startGame(state: TimeUpState): void {
  game.set(state);
  setActiveGame('timeup');
  navigate('/timeup/partie');
}

/**
 * Relit la partie sauvegardée. Un tour qui tournait est remis en pause
 * à l'heure de la sauvegarde : le temps passé app fermée n'est pas décompté.
 */
export function loadSavedGame(_now: number): TimeUpState | null {
  const saved = load<Saved | null>(KEY, null);
  if (!saved || !saved.state || saved.state.version !== 1 || !Array.isArray(saved.state.teams)) return null;
  const s = saved.state;
  if (s.phase === 'turn' && s.turn && s.turn.endsAt !== null) return pauseTurn(s, saved.savedAt);
  return s;
}

export function abandonGame(): void {
  game.set(null);
  remove(KEY);
  setActiveGame(null);
}
