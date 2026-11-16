import { blindtest } from './blindtest/module';
import { timeup } from './timeup/module';
import type { GameModule } from './types';
import { undercover } from './undercover/module';

/** Ordre d'affichage sur l'accueil. */
export const games: GameModule[] = [timeup, blindtest, undercover];

export function gameById(id: string): GameModule | undefined {
  return games.find((g) => g.id === id);
}
