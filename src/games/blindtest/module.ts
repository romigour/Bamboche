import type { GameModule } from '../types';

export const blindtest: GameModule = {
  id: 'blindtest',
  name: 'Blindtest',
  color: 'blindtest',
  icon: 'music',
  players: { min: 2, max: 20 },
  status: 'disponible',
  route: '/blindtest',
  settings: [
    { key: 'tracks', label: "Nombre d'extraits", type: 'choice', options: [10, 15, 20], default: 15 },
    { key: 'listenSeconds', label: "Durée d'écoute", type: 'choice', options: [10, 20, 30], unit: 's', default: 20 },
  ],
};
