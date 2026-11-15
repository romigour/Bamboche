import { load, remove, save } from './storage';

/** Jeu dont une partie est en cours (pour la proposer au retour sur l'accueil). */
export function getActiveGame(): { gameId: string } | null {
  const v = load<{ gameId?: unknown } | null>('activeGame', null);
  return v && typeof v.gameId === 'string' ? { gameId: v.gameId } : null;
}

export function setActiveGame(gameId: string | null): void {
  if (gameId) save('activeGame', { gameId });
  else remove('activeGame');
}
