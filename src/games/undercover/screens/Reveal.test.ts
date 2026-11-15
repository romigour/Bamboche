import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { wordFontSize } from '../logic/wordSize';
import Reveal from './Reveal.svelte';

beforeEach(() => vi.useFakeTimers({ toFake: ['Date'] }));
afterEach(() => vi.useRealTimers());

test('affiche le nom et le rôle', () => {
  render(Reveal, { name: 'Tom', role: 'mrwhite', oncontinue: () => {} });
  expect(screen.getByText('Tom était…')).toBeInTheDocument();
  expect(screen.getByText('Mr White')).toBeInTheDocument();
});

test("Continuer : ignoré juste après l'ouverture, accepté ensuite", async () => {
  const oncontinue = vi.fn();
  render(Reveal, { name: 'Tom', role: 'civil', oncontinue });
  await fireEvent.click(screen.getByRole('button', { name: 'Continuer' }));
  expect(oncontinue).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1000);
  await fireEvent.click(screen.getByRole('button', { name: 'Continuer' }));
  expect(oncontinue).toHaveBeenCalledOnce();
});

test('le rôle « Undercover » est dimensionné sur le budget de largeur, jamais coupé', () => {
  render(Reveal, { name: 'Tom', role: 'undercover', oncontinue: () => {} });
  const el = screen.getByText('Undercover');
  const size = parseFloat(el.style.fontSize);
  expect(size).toBe(Math.min(64, wordFontSize('Undercover')));
  expect(size).toBeLessThan(64);
  expect(size * 10 * 0.62).toBeLessThanOrEqual(320);
});
