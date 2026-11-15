import type { GameModule, SettingDef } from '../games/types';
import { load, save } from './storage';

function isValid(def: SettingDef, v: unknown): v is number {
  if (typeof v !== 'number' || !Number.isFinite(v)) return false;
  return def.type === 'choice' ? def.options.includes(v) : Number.isInteger(v) && v >= def.min && v <= def.max;
}

/** Défauts du jeu, remplacés par les valeurs mémorisées valides. */
export function getSettings(game: GameModule): Record<string, number> {
  const stored = load<Record<string, unknown>>(`settings:${game.id}`, {});
  const out: Record<string, number> = {};
  for (const def of game.settings) out[def.key] = isValid(def, stored[def.key]) ? (stored[def.key] as number) : def.default;
  return out;
}

export function setSetting(gameId: string, key: string, value: number): void {
  const stored = load<Record<string, unknown>>(`settings:${gameId}`, {});
  save(`settings:${gameId}`, { ...stored, [key]: value });
}
