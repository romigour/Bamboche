import { render, screen } from '@testing-library/svelte';
import { beforeEach, expect, test } from 'vitest';
import { players } from '../../../lib/players';
import { teamsDraft } from '../setup';
import Teams from './Teams.svelte';

const P = ['Léa', 'Hugo', 'Tom', 'Sarah', 'Malik'].map((name, i) => ({ id: `p${i}`, name }));

beforeEach(() => players.set(P));

test('une équipe à 1 joueur bloque « Continuer » avec un message', () => {
  teamsDraft.set([
    { id: 'A', name: 'Les Flamants', color: 'blindtest', playerIds: ['p0', 'p1', 'p2'] },
    { id: 'B', name: 'Les Pingouins', color: 'hipster', playerIds: ['p3'] },
  ]);
  render(Teams, { onnext: () => {}, onback: () => {} });
  expect(screen.getByRole('button', { name: /Continuer/ })).toBeDisabled();
  expect(screen.getByText('Les Pingouins : au moins 2 joueurs.')).toBeInTheDocument();
});

test('2 équipes de 2 : « Continuer » est actif', () => {
  teamsDraft.set([
    { id: 'A', name: 'Les Flamants', color: 'blindtest', playerIds: ['p0', 'p1'] },
    { id: 'B', name: 'Les Pingouins', color: 'hipster', playerIds: ['p2', 'p3'] },
  ]);
  render(Teams, { onnext: () => {}, onback: () => {} });
  expect(screen.getByRole('button', { name: /Continuer/ })).toBeEnabled();
  expect(screen.getByText('Malik')).toBeInTheDocument();
});

test('un joueur supprimé de la liste globale disparaît des équipes', () => {
  teamsDraft.set([
    { id: 'A', name: 'Les Flamants', color: 'blindtest', playerIds: ['p0', 'p1', 'zz'] },
    { id: 'B', name: 'Les Pingouins', color: 'hipster', playerIds: ['p2', 'p3'] },
  ]);
  render(Teams, { onnext: () => {}, onback: () => {} });
  expect(screen.getAllByText('2 joueurs')).toHaveLength(2);
});
