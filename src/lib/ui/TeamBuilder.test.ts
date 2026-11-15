import { render, screen } from '@testing-library/svelte';
import { writable } from 'svelte/store';
import { beforeEach, expect, test, vi } from 'vitest';
import { players } from '../players';
import type { TeamDraft } from '../teams';
import TeamBuilder from './TeamBuilder.svelte';

beforeEach(() =>
  players.set([
    { id: 'a', name: 'Léa' },
    { id: 'b', name: 'Hugo' },
    { id: 'c', name: 'Tom' },
  ]),
);

const solo = (): TeamDraft[] => [
  { id: 'A', name: 'Les Flamants', color: 'blindtest', playerIds: ['a'] },
  { id: 'B', name: 'Les Pingouins', color: 'hipster', playerIds: ['b'] },
];

test('avec minPerTeam 1, deux équipes d’un joueur sont valides', () => {
  render(TeamBuilder, { draft: writable(solo()), minPerTeam: 1, onconfigure: vi.fn() });
  expect(screen.getByText('Léa')).toBeInTheDocument();
  expect(screen.queryByText(/au moins/)).toBeNull();
});

test('avec minPerTeam 2, le message d’erreur nomme l’équipe', () => {
  render(TeamBuilder, { draft: writable(solo()), minPerTeam: 2, onconfigure: vi.fn() });
  expect(screen.getByText('Les Flamants : au moins 2 joueurs.')).toBeInTheDocument();
});
