import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { expect, test } from 'vitest';
import { createGame } from './games/timeup/logic/game';
import { createSheet } from './games/scores/logic/sheet';
import { currentSheet, finishSheet, scoreHistory } from './games/scores/session';
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

test('une partie de Blindtest sauvegardée est proposée sur l’accueil', async () => {
  const { createBlindtest } = await import('./games/blindtest/logic/game');
  const { startBlindtest } = await import('./games/blindtest/session');
  navigate('/');
  render(App);
  startBlindtest(
    createBlindtest(
      [
        { id: 'A', name: 'Léa', color: 'blindtest', playerIds: ['a'] },
        { id: 'B', name: 'Hugo', color: 'hipster', playerIds: ['b'] },
      ],
      [
        { id: 'a', name: 'Léa' },
        { id: 'b', name: 'Hugo' },
      ],
      ['t0', 't1'],
      'hits-de-toujours',
      { tracks: 2, listenSeconds: 20 },
    ),
  );
  await tick();
  navigate('/');
  await tick();
  expect(screen.getByText('Une partie est en cours')).toBeInTheDocument();
  expect(screen.getByText(/Blindtest · Extrait 1 \/ 2/)).toBeInTheDocument();
});

test('la carte Feuille de score ouvre le sous-menu', async () => {
  currentSheet.set(null);
  navigate('/');
  render(App);
  await fireEvent.click(screen.getByRole('button', { name: /Feuille de score/ }));
  expect(screen.getByText('Mille Sabords')).toBeInTheDocument();
});

test("une feuille en cours n'ouvre pas la reprise de l'accueil", async () => {
  currentSheet.set(createSheet('skyjo', [solo('a', 'Léa'), solo('b', 'Tom')], 100, 1000, 's1'));
  navigate('/');
  render(App);
  await tick();
  expect(screen.getByText('Partie en cours')).toBeInTheDocument();
  expect(screen.queryByText('Une partie est en cours')).toBeNull();
  currentSheet.set(null);
});

test('terminer la feuille mène au podium, sans retour au sous-menu', async () => {
  scoreHistory.set([]);
  currentSheet.set({
    ...createSheet('skyjo', [solo('a', 'Léa'), solo('b', 'Tom')], 100, 1000, 's9'),
    rounds: [[10, 20]],
  });
  navigate('/scores/partie');
  render(App);
  await tick();
  finishSheet(Date.now());
  await tick();
  await tick();
  expect(location.hash.startsWith('#/scores/resultat?id=')).toBe(true);
  expect(screen.getByText('Léa')).toBeInTheDocument();
  expect(screen.getByText('Tom')).toBeInTheDocument();
  scoreHistory.set([]);
});

function solo(id: string, name: string) {
  return { id, name, members: [name] };
}
