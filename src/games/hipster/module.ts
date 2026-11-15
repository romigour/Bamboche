import type { GameModule } from '../types';

export const hipster: GameModule = {
  id: 'hipster',
  name: 'Hipster',
  color: 'hipster',
  icon: 'disc',
  players: { min: 2, max: 10 },
  status: 'bientot',
  route: '/hipster',
  settings: [],
};
