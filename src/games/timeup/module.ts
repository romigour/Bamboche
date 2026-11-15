import type { GameModule } from '../types';

export const timeup: GameModule = {
  id: 'timeup',
  name: 'Time Up',
  color: 'timeup',
  icon: 'timer',
  players: { min: 4, max: 40 },
  status: 'disponible',
  route: '/timeup',
  settings: [
    { key: 'turnSeconds', label: 'Temps par tour', type: 'choice', options: [30, 45, 60, 90], unit: 's', default: 60 },
    { key: 'rounds', label: 'Nombre de manches', type: 'int', min: 1, max: 3, default: 3 },
    { key: 'quickCards', label: 'Cartes en partie rapide', type: 'choice', options: [20, 30, 40, 50], default: 40 },
    { key: 'wordsPerTeam', label: 'Mots par équipe (perso)', type: 'int', min: 3, max: 10, default: 5 },
  ],
};
