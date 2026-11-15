import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import Talk from './Talk.svelte';

beforeEach(() => vi.useFakeTimers({ toFake: ['Date'] }));
afterEach(() => vi.useRealTimers());

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

test('Passer au vote : tap immédiat ignoré, accepté après le temps mort', async () => {
  const onvote = vi.fn();
  render(Talk, { round: 1, order, onvote, onpause: () => {} });
  await fireEvent.click(screen.getByRole('button', { name: 'Passer au vote' }));
  expect(onvote).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1000);
  await fireEvent.click(screen.getByRole('button', { name: 'Passer au vote' }));
  expect(onvote).toHaveBeenCalledOnce();
});
