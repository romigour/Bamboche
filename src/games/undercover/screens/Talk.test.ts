import { render, screen } from '@testing-library/svelte';
import { expect, test } from 'vitest';
import Talk from './Talk.svelte';

const order = [
  { id: 'a', name: 'Inès' },
  { id: 'b', name: 'Tom' },
  { id: 'c', name: 'Léa' },
];

test('annonce qui commence', () => {
  render(Talk, { round: 2, order, onvote: () => {}, onpause: () => {} });
  expect(screen.getByText('Inès commence')).toBeInTheDocument();
  expect(screen.getByText('Manche 2')).toBeInTheDocument();
});

test("liste les joueurs dans l'ordre", () => {
  render(Talk, { round: 1, order, onvote: () => {}, onpause: () => {} });
  expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Inès', 'Tom', 'Léa']);
});
