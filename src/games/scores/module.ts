import type { GameModule } from '../types';

export const scores: GameModule = {
  id: 'scores',
  name: 'Feuille de score',
  color: 'hipster',
  icon: 'edit',
  players: { min: 2, max: 20 },
  status: 'disponible',
  settings: [],
  route: '/scores',
};
