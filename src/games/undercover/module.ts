import type { GameModule } from '../types';

export const undercover: GameModule = {
  id: 'undercover',
  name: 'Undercover',
  color: 'undercover',
  icon: 'eyeoff',
  players: { min: 3, max: 20 },
  status: 'bientot',
  route: '/undercover',
  settings: [],
};
