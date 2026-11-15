import type { GameModule } from '../types';

export const blindtest: GameModule = {
  id: 'blindtest',
  name: 'Blindtest',
  color: 'blindtest',
  icon: 'music',
  players: { min: 2, max: 10 },
  status: 'bientot',
  route: '/blindtest',
  settings: [],
};
