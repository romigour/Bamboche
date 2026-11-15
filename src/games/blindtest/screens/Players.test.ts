import { fireEvent, render, screen } from '@testing-library/svelte';
import { beforeEach, expect, test } from 'vitest';
import { players } from '../../../lib/players';
import { animatorId, btMode, btTeamsDraft } from '../setup';
import Players from './Players.svelte';

beforeEach(() => {
  btMode.set('solo');
  animatorId.set(null);
  btTeamsDraft.set([]);
});

const continuer = () => screen.getByRole('button', { name: /Continuer/ });

test('chacun pour soi : 3 joueurs dont un animateur, on peut continuer', async () => {
  players.set([
    { id: 'a', name: 'Léa' },
    { id: 'b', name: 'Hugo' },
    { id: 'c', name: 'Sarah' },
  ]);
  render(Players, { onnext: () => {}, onback: () => {} });
  await fireEvent.click(screen.getByRole('button', { name: /Sarah/ }));
  expect(screen.getByText('Anime la partie')).toBeInTheDocument();
  expect(continuer()).toBeEnabled();
});

test('chacun pour soi : un seul participant, on ne peut pas continuer', async () => {
  players.set([
    { id: 'a', name: 'Léa' },
    { id: 'b', name: 'Hugo' },
  ]);
  render(Players, { onnext: () => {}, onback: () => {} });
  await fireEvent.click(screen.getByRole('button', { name: /Hugo/ }));
  expect(continuer()).toBeDisabled();
  expect(screen.getByText('Il faut au moins 2 joueurs.')).toBeInTheDocument();
});

test('en équipes : des équipes d’un joueur sont acceptées', async () => {
  players.set([
    { id: 'a', name: 'Léa' },
    { id: 'b', name: 'Hugo' },
  ]);
  btMode.set('equipes');
  btTeamsDraft.set([
    { id: 'A', name: 'Les Flamants', color: 'blindtest', playerIds: ['a'] },
    { id: 'B', name: 'Les Pingouins', color: 'hipster', playerIds: ['b'] },
  ]);
  render(Players, { onnext: () => {}, onback: () => {} });
  expect(continuer()).toBeEnabled();
});
