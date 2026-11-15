import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import Vote from './Vote.svelte';

beforeEach(() => vi.useFakeTimers({ toFake: ['Date'] }));
afterEach(() => vi.useRealTimers());

const candidates = [
  { id: 'a', name: 'Inès' },
  { id: 'b', name: 'Tom' },
];

function setup() {
  const onconfirm = vi.fn();
  render(Vote, { candidates, onconfirm, onback: () => {}, onpause: () => {} });
  return onconfirm;
}

test('un tap ouvre la confirmation, Annuler revient à la grille', async () => {
  const onconfirm = setup();
  vi.advanceTimersByTime(1000);
  await fireEvent.click(screen.getByRole('button', { name: 'Tom' }));
  expect(screen.getByText('Éliminer Tom ?')).toBeInTheDocument();
  vi.advanceTimersByTime(1000);
  await fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
  expect(screen.getByRole('button', { name: 'Inès' })).toBeInTheDocument();
  expect(onconfirm).not.toHaveBeenCalled();
});

test("un double clic sur « Oui, éliminer » ne confirme qu'une fois", async () => {
  const onconfirm = setup();
  vi.advanceTimersByTime(1000);
  await fireEvent.click(screen.getByRole('button', { name: 'Tom' }));
  vi.advanceTimersByTime(1000);
  const oui = screen.getByRole('button', { name: 'Oui, éliminer' });
  await fireEvent.click(oui);
  await fireEvent.click(oui);
  expect(onconfirm).toHaveBeenCalledOnce();
  expect(onconfirm).toHaveBeenCalledWith('b');
});

test("un tap juste après l'ouverture est ignoré", async () => {
  setup();
  await fireEvent.click(screen.getByRole('button', { name: 'Tom' }));
  expect(screen.queryByText('Éliminer Tom ?')).toBeNull();
});

test("« Oui, éliminer » ignoré juste après l'ouverture de la confirmation", async () => {
  const onconfirm = setup();
  vi.advanceTimersByTime(1000);
  await fireEvent.click(screen.getByRole('button', { name: 'Tom' }));
  await fireEvent.click(screen.getByRole('button', { name: 'Oui, éliminer' }));
  expect(onconfirm).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1000);
  await fireEvent.click(screen.getByRole('button', { name: 'Oui, éliminer' }));
  expect(onconfirm).toHaveBeenCalledOnce();
  expect(onconfirm).toHaveBeenCalledWith('b');
});

test("après Annuler, la grille a un nouveau temps mort", async () => {
  setup();
  vi.advanceTimersByTime(1000);
  await fireEvent.click(screen.getByRole('button', { name: 'Tom' }));
  vi.advanceTimersByTime(1000);
  await fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
  await fireEvent.click(screen.getByRole('button', { name: 'Inès' }));
  expect(screen.queryByText('Éliminer Inès ?')).toBeNull();
});
