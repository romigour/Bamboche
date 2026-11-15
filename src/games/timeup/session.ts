import { writable } from 'svelte/store';
import { navigate } from '../../lib/router';
import type { TimeUpState } from './logic/game';

/** Partie en cours (persistance et reprise : Task 10). */
export const game = writable<TimeUpState | null>(null);

export function startGame(state: TimeUpState): void {
  game.set(state);
  navigate('/timeup/partie');
}
