import { writable } from 'svelte/store';
import { setActiveGame } from '../../lib/activeGame';
import { navigate } from '../../lib/router';
import { load, remove, save } from '../../lib/storage';
import type { BlindtestState } from './logic/game';

const KEY = 'blindtest:game';
const historyKey = (playlistId: string) => `blindtest:history:${playlistId}`;

/** Partie de Blindtest en cours, enregistrée à chaque changement. */
export const btGame = writable<BlindtestState | null>(null);
btGame.subscribe((s) => {
  if (s) save(KEY, s);
});

export function readHistory(playlistId: string): string[] {
  const h = load<unknown>(historyKey(playlistId), []);
  return Array.isArray(h) ? h.filter((x): x is string => typeof x === 'string') : [];
}

export function writeHistory(playlistId: string, history: string[]): void {
  save(historyKey(playlistId), history);
}

/**
 * Démarre la partie. `history` : l'historique renvoyé par drawTracks (qui gère sa remise à zéro) ;
 * sans lui, les extraits de la partie sont ajoutés à l'historique existant.
 */
export function startBlindtest(s: BlindtestState, history?: string[]): void {
  const old = readHistory(s.playlistId);
  const known = new Set(old);
  writeHistory(s.playlistId, history ?? [...old, ...s.queue.filter((id) => !known.has(id))]);
  btGame.set(s);
  setActiveGame('blindtest');
  navigate('/blindtest/partie');
}

const PHASES = ['listen', 'reveal', 'podium'];

export function loadSavedBlindtest(): BlindtestState | null {
  const s = load<Partial<BlindtestState> | null>(KEY, null);
  if (!s || s.version !== 1 || !PHASES.includes(s.phase as string)) return null;
  if (!Array.isArray(s.queue) || !Array.isArray(s.teams) || !Array.isArray(s.winners) || !Array.isArray(s.spares)) return null;
  if (typeof s.current !== 'number' || s.current < 0 || s.current >= s.queue.length) return null;
  if (!s.settings || !s.playlistId) return null;
  return { skipped: [], ...s } as BlindtestState;
}

export function abandonBlindtest(): void {
  btGame.set(null);
  remove(KEY);
  setActiveGame(null);
}
