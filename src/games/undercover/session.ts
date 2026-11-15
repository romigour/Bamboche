import { writable } from 'svelte/store';
import { setActiveGame } from '../../lib/activeGame';
import { navigate } from '../../lib/router';
import { load, remove, save } from '../../lib/storage';
import { alive, type UndercoverState } from './logic/game';

const KEY = 'undercover:game';

/** Série d'Undercover en cours, enregistrée à chaque changement. */
export const ucGame = writable<UndercoverState | null>(null);
ucGame.subscribe((s) => {
  if (s) save(KEY, s);
});

export function startUndercover(s: UndercoverState): void {
  ucGame.set(s);
  setActiveGame('undercover');
  navigate('/undercover/partie');
}

const PHASES = ['deal', 'talk', 'vote', 'reveal', 'mrwhite', 'end', 'scores', 'podium'];

const ROLES = ['civil', 'undercover', 'mrwhite'];

export function loadSavedUndercover(): UndercoverState | null {
  const s = load<Partial<UndercoverState> | null>(KEY, null);
  if (!s || s.version !== 1 || !PHASES.includes(s.phase as string)) return null;
  if (!Array.isArray(s.players)) return null;
  if (!Array.isArray(s.eliminated) || !Array.isArray(s.usedPairs) || typeof s.gameNumber !== 'number') return null;
  if (!s.roles || typeof s.roles !== 'object' || !s.totals || typeof s.totals !== 'object') return null;
  for (const p of s.players) {
    if (!p || typeof p.id !== 'string' || typeof p.name !== 'string') return null;
    if (!ROLES.includes(s.roles[p.id])) return null;
  }
  if ((s.phase === 'reveal' || s.phase === 'mrwhite') && s.eliminated.length === 0) return null;
  if (s.phase === 'deal' && (typeof s.dealIndex !== 'number' || s.dealIndex < 0 || s.dealIndex >= s.players.length)) return null;
  return s as UndercoverState;
}

export function abandonUndercover(): void {
  ucGame.set(null);
  remove(KEY);
  setActiveGame(null);
}

/** Lignes du bandeau de reprise. */
export function resumeLines(s: UndercoverState): string[] {
  const head = `Undercover · Partie ${s.gameNumber}`;
  if (s.phase === 'end' || s.phase === 'scores' || s.phase === 'podium') return [head, 'Scores de la série'];
  return [head, `${alive(s).length} joueurs en jeu`];
}
