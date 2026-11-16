import { writable } from 'svelte/store';
import { uid } from '../../lib/id';
import { navigate } from '../../lib/router';
import { load, remove, save } from '../../lib/storage';
import { scoreGameById, type ScoreGameId } from './defs';
import { createSheet, type Sheet } from './logic/sheet';
import type { FinishedGame } from './logic/stats';

const KEY_CURRENT = 'scores:current';
const KEY_HISTORY = 'scores:history';
const KEY_SETTINGS = 'scores:settings';

function validParticipants(v: unknown): boolean {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    v.every(
      (p) =>
        p &&
        typeof p.id === 'string' &&
        typeof p.name === 'string' &&
        Array.isArray(p.members) &&
        p.members.every((m: unknown) => typeof m === 'string'),
    )
  );
}

/** Contrôles communs à la feuille en cours et à une partie terminée. */
function validBase(g: Partial<Sheet> | null | undefined): boolean {
  if (!g || g.version !== 1 || typeof g.id !== 'string' || typeof g.endValue !== 'number') return false;
  if (typeof g.gameId !== 'string' || !scoreGameById(g.gameId)) return false;
  if (!validParticipants(g.participants)) return false;
  const n = g.participants!.length;
  return (
    Array.isArray(g.rounds) &&
    g.rounds.every((r) => Array.isArray(r) && r.length === n && r.every((v) => typeof v === 'number'))
  );
}

export function loadSavedSheet(): Sheet | null {
  const s = load<Partial<Sheet> | null>(KEY_CURRENT, null);
  if (!validBase(s)) return null;
  if (!Array.isArray(s!.pending) || s!.pending.length !== s!.participants!.length) return null;
  return s as Sheet;
}

export function loadHistory(): FinishedGame[] {
  const h = load<unknown>(KEY_HISTORY, []);
  if (!Array.isArray(h)) return [];
  return h.filter((g) => validBase(g) && typeof g.startedAt === 'number' && typeof g.finishedAt === 'number');
}

/** Feuille en cours, enregistrée à chaque changement (supprimée si null). */
export const currentSheet = writable<Sheet | null>(loadSavedSheet());
currentSheet.subscribe((s) => {
  if (s) save(KEY_CURRENT, s);
  else remove(KEY_CURRENT);
});

/** Parties terminées, enregistrées à chaque changement. */
export const scoreHistory = writable<FinishedGame[]>(loadHistory());
scoreHistory.subscribe((h) => save(KEY_HISTORY, h));

export function endValueFor(gameId: ScoreGameId): number {
  const def = scoreGameById(gameId);
  if (!def) return 0;
  const v = load<Record<string, unknown>>(KEY_SETTINGS, {})[gameId];
  const { min, max } = def.end;
  return typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : def.end.default;
}

export function rememberEndValue(gameId: ScoreGameId, v: number): void {
  save(KEY_SETTINGS, { ...load<Record<string, unknown>>(KEY_SETTINGS, {}), [gameId]: v });
}

export function startSheet(s: Sheet): void {
  currentSheet.set(s);
  rememberEndValue(s.gameId, s.endValue);
  navigate('/scores/partie');
}

let current: Sheet | null = null;
currentSheet.subscribe((s) => (current = s));

export function finishSheet(now: number): FinishedGame | null {
  const s = current;
  if (!s || s.rounds.length === 0) return null;
  const g: FinishedGame = {
    version: 1,
    id: s.id,
    gameId: s.gameId,
    startedAt: s.startedAt,
    finishedAt: now,
    endValue: s.endValue,
    participants: s.participants,
    rounds: s.rounds,
  };
  scoreHistory.update((h) => [...h, g]);
  currentSheet.set(null);
  navigate('/scores/resultat', { id: g.id });
  return g;
}

export function abandonSheet(): void {
  currentSheet.set(null);
}

export function deleteFinished(id: string): void {
  scoreHistory.update((h) => h.filter((g) => g.id !== id));
}

export function replay(g: FinishedGame, now: number): void {
  const participants = g.participants.map((p) => ({ ...p, id: uid('p') }));
  startSheet(createSheet(g.gameId, participants, g.endValue, now, uid('s')));
}
