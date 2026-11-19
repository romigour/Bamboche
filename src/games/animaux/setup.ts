import { writable } from 'svelte/store';
import { load, save } from '../../lib/storage';
import type { GameLevel } from './types';

const LEVELS: GameLevel[] = ['facile', 'melange', 'expert'];
const stored = load<unknown>('animaux:level', 'melange');

/** Niveau de la partie, mémorisé (Mélangé par défaut ou si la valeur est invalide). */
export const animauxLevel = writable<GameLevel>(LEVELS.includes(stored as GameLevel) ? (stored as GameLevel) : 'melange');
animauxLevel.subscribe((v) => save('animaux:level', v));

export function validateSetup(playerCount: number): { ok: boolean; error: string | null } {
  if (playerCount < 2) return { ok: false, error: 'Il faut au moins 2 joueurs.' };
  if (playerCount > 20) return { ok: false, error: '20 joueurs maximum.' };
  return { ok: true, error: null };
}
