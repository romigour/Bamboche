import { writable } from 'svelte/store';
import { load, save } from '../../lib/storage';

/** Mr White dans la partie, mémorisé (toute valeur non booléenne vaut « non »). */
export const mrWhiteOn = writable<boolean>(load<unknown>('undercover:mrwhite', false) === true);
mrWhiteOn.subscribe((v) => save('undercover:mrwhite', v));

export function validateSetup(playerCount: number, mrWhite: boolean): { ok: boolean; error: string | null } {
  if (playerCount < 3) return { ok: false, error: 'Il faut au moins 3 joueurs.' };
  if (mrWhite && playerCount < 4) return { ok: false, error: 'Avec Mr White, il faut au moins 4 joueurs.' };
  if (playerCount > 20) return { ok: false, error: '20 joueurs maximum.' };
  return { ok: true, error: null };
}
