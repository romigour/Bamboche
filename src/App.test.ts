import { render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { expect, test } from 'vitest';
import { createGame } from './games/timeup/logic/game';
import { startGame } from './games/timeup/session';
import { navigate } from './lib/router';
import App from './App.svelte';

test('revenir à l’accueil pendant une partie propose de la reprendre, sans recharger', async () => {
  navigate('/');
  render(App);
  expect(screen.queryByText('Une partie est en cours')).toBeNull();
  startGame(
    createGame(
      [
        { id: 'A', name: 'Les Flamants', color: 'blindtest', playerIds: ['a', 'b'] },
        { id: 'B', name: 'Les Pingouins', color: 'hipster', playerIds: ['c', 'd'] },
      ],
      ['a', 'b', 'c', 'd'].map((id) => ({ id, name: id })),
      [{ id: 'c0', text: 'Chat' }],
      { turnSeconds: 30, rounds: 1 },
    ),
  );
  await tick();
  navigate('/'); // bouton retour du téléphone
  await tick();
  expect(screen.getByText('Une partie est en cours')).toBeInTheDocument();
});
