import { writable } from 'svelte/store';
import { uid } from './id';
import { load, save } from './storage';

export interface Player {
  id: string;
  name: string;
}

/** Joueurs de la soirée (réglages globaux), persistés sous `players`. */
export const players = writable<Player[]>(load<Player[]>('players', []));
players.subscribe((list) => save('players', list));

export function addPlayer(name: string): Player | null {
  const clean = name.trim();
  if (!clean) return null;
  const p: Player = { id: uid('p'), name: clean };
  players.update((list) => [...list, p]);
  return p;
}

export function renamePlayer(id: string, name: string): boolean {
  const clean = name.trim();
  if (!clean) return false;
  players.update((list) => list.map((p) => (p.id === id ? { ...p, name: clean } : p)));
  return true;
}

export function removePlayer(id: string): void {
  players.update((list) => list.filter((p) => p.id !== id));
}
