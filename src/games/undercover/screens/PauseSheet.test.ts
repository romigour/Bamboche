import { fireEvent, render, screen } from '@testing-library/svelte';
import { expect, test, vi } from 'vitest';
import { createSeries } from '../logic/game';
import words from '../words.json';
import PauseSheet from './PauseSheet.svelte';

function setup() {
  const base = createSeries(
    [
      { id: 'p1', name: 'Tom' },
      { id: 'p2', name: 'Léa' },
      { id: 'p3', name: 'Inès' },
      { id: 'p4', name: 'Max' },
    ],
    false,
    words,
  );
  const s = { ...base, eliminated: ['p1'], totals: { p1: 3, p2: 5, p3: 0, p4: 1 } };
  const fns = { onresume: vi.fn(), onreveal: vi.fn(), onquit: vi.fn() };
  render(PauseSheet, { s, ...fns });
  return fns;
}

test('« Revoir mon mot » ne liste pas un joueur éliminé et renvoie le joueur tapé', async () => {
  const { onreveal } = setup();
  await fireEvent.click(screen.getByRole('button', { name: 'Revoir mon mot' }));
  expect(screen.queryByRole('button', { name: 'Tom' })).not.toBeInTheDocument();
  await fireEvent.click(screen.getByRole('button', { name: 'Léa' }));
  expect(onreveal).toHaveBeenCalledWith('p2');
});

test('« Reprendre » appelle onresume', async () => {
  const { onresume } = setup();
  await fireEvent.click(screen.getByRole('button', { name: /Reprendre/ }));
  expect(onresume).toHaveBeenCalledOnce();
});

test('Quitter la série demande confirmation', async () => {
  const { onquit } = setup();
  await fireEvent.click(screen.getByRole('button', { name: 'Quitter la série' }));
  expect(screen.getByText('Quitter la série ? Les scores seront perdus.')).toBeInTheDocument();
  expect(onquit).not.toHaveBeenCalled();
  await fireEvent.click(screen.getByRole('button', { name: 'Oui, quitter' }));
  expect(onquit).toHaveBeenCalledOnce();
});
