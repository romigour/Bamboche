import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import MrWhiteGuess from './MrWhiteGuess.svelte';

beforeEach(() => vi.useFakeTimers({ toFake: ['Date'] }));
afterEach(() => vi.useRealTimers());

test('affiche la consigne', () => {
  render(MrWhiteGuess, { name: 'Max', onfound: () => {}, onmissed: () => {} });
  expect(screen.getByText('Max tente le mot des civils')).toBeInTheDocument();
  expect(screen.getByText('Il le dit à voix haute. Vous jugez.')).toBeInTheDocument();
});

test("Trouvé / Raté : ignorés juste après l'ouverture, acceptés ensuite", async () => {
  const onfound = vi.fn();
  const onmissed = vi.fn();
  render(MrWhiteGuess, { name: 'Max', onfound, onmissed });
  await fireEvent.click(screen.getByRole('button', { name: 'Trouvé' }));
  await fireEvent.click(screen.getByRole('button', { name: 'Raté' }));
  expect(onfound).not.toHaveBeenCalled();
  expect(onmissed).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1000);
  await fireEvent.click(screen.getByRole('button', { name: 'Trouvé' }));
  await fireEvent.click(screen.getByRole('button', { name: 'Raté' }));
  expect(onfound).toHaveBeenCalledOnce();
  expect(onmissed).toHaveBeenCalledOnce();
});
