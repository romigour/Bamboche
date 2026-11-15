import { expect, test } from 'vitest';
import { getActiveGame, setActiveGame } from './activeGame';

test('aucune partie active par défaut', () => expect(getActiveGame()).toBeNull());

test('setActiveGame puis getActiveGame, puis effacement', () => {
  setActiveGame('timeup');
  expect(getActiveGame()).toEqual({ gameId: 'timeup' });
  expect(localStorage.getItem('bamboche:v1:activeGame')).not.toBeNull();
  setActiveGame(null);
  expect(getActiveGame()).toBeNull();
});
