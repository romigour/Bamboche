import { writable } from 'svelte/store';
import { setActiveGame } from '../../lib/activeGame';
import { navigate } from '../../lib/router';
import { load, remove, save } from '../../lib/storage';
import { shortName } from '../../lib/teams';
import { animals } from './catalog';
import { scores, type AnimauxState } from './logic/game';
import type { Animal } from './types';

const KEY = 'animaux:game';
const HISTORY = 'animaux:history';

/** Partie en cours, enregistrée à chaque changement. */
export const animauxGame = writable<AnimauxState | null>(null);
animauxGame.subscribe((s) => {
  if (s) save(KEY, s);
});

export function readHistory(): string[] {
  const h = load<unknown>(HISTORY, []);
  return Array.isArray(h) ? h.filter((x): x is string => typeof x === 'string') : [];
}

export function writeHistory(history: string[]): void {
  save(HISTORY, history);
}

export function startAnimaux(s: AnimauxState, history: string[]): void {
  writeHistory(history);
  animauxGame.set(s);
  setActiveGame('animaux');
  navigate('/animaux/partie');
}

const PHASES = ['sound', 'reveal', 'podium'];

/** Partie sauvegardée, ou null si elle est invalide ou cite un animal absent de la banque. */
export function loadSavedAnimaux(all: Animal[] = animals): AnimauxState | null {
  const s = load<Partial<AnimauxState> | null>(KEY, null);
  if (!s || typeof s !== 'object' || s.version !== 1 || !PHASES.includes(s.phase as string)) return null;
  if (!Array.isArray(s.rounds) || !Array.isArray(s.players) || !s.level) return null;
  if (typeof s.current !== 'number' || s.current < 0 || s.current >= s.rounds.length) return null;
  const known = new Set(all.map((a) => a.id));
  if (!s.rounds.every((r) => r && known.has(r.animalId) && Array.isArray(r.options) && r.options.every((o) => known.has(o)))) return null;
  return s as AnimauxState;
}

export function abandonAnimaux(): void {
  animauxGame.set(null);
  remove(KEY);
  setActiveGame(null);
}

export function resumeLines(s: AnimauxState): string[] {
  const pts = scores(s);
  return [
    `Cris d'animaux · Son ${s.current + 1} / ${s.rounds.length}`,
    s.players.map((p) => `${shortName(p.name)} ${pts[p.id]}`).join(' – '),
  ];
}
