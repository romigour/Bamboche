import type { GameModule } from '../types';

export const animaux: GameModule = {
  id: 'animaux',
  name: "Cris d'animaux",
  color: 'animaux',
  icon: 'paw',
  players: { min: 2, max: 20 },
  status: 'disponible',
  route: '/animaux',
  settings: [
    { key: 'sounds', label: 'Nombre de sons', type: 'choice', options: [10, 15, 20], default: 10 },
    { key: 'choices', label: 'Nombre de propositions', type: 'choice', options: [3, 4, 6], default: 4 },
  ],
};
