import { fireEvent, render, screen } from '@testing-library/svelte';
import { expect, test, vi } from 'vitest';
import { beginRound, createGame, startTurn } from '../logic/game';
import Turn from './Turn.svelte';

function state() {
  const s = createGame(
    [
      { id: 'A', name: 'Les Flamants', color: 'blindtest', playerIds: ['a', 'b'] },
      { id: 'B', name: 'Les Pingouins', color: 'hipster', playerIds: ['c', 'd'] },
    ],
    ['a', 'b', 'c', 'd'].map((id) => ({ id, name: id })),
    [{ id: 'c0', text: 'Chat' }, { id: 'c1', text: 'Chien' }, { id: 'c2', text: 'Loup' }],
    { turnSeconds: 30, rounds: 1 },
  );
  return startTurn(beginRound(s), Date.now());
}

test('un double tap rapide sur Trouvé ne compte qu’une fois', async () => {
  const onfound = vi.fn();
  render(Turn, { s: state(), onfound, onpass: vi.fn(), onexpire: vi.fn(), onpause: vi.fn() });
  const btn = screen.getByRole('button', { name: /Trouvé/ });
  await fireEvent.click(btn);
  await fireEvent.click(btn);
  expect(onfound).toHaveBeenCalledOnce();
});

test('Trouvé puis Passer immédiatement : seule la première action compte', async () => {
  const onfound = vi.fn();
  const onpass = vi.fn();
  render(Turn, { s: state(), onfound, onpass, onexpire: vi.fn(), onpause: vi.fn() });
  await fireEvent.click(screen.getByRole('button', { name: /Trouvé/ }));
  await fireEvent.click(screen.getByRole('button', { name: /Passer/ }));
  expect(onfound).toHaveBeenCalledOnce();
  expect(onpass).not.toHaveBeenCalled();
});

test('après le temps mort, une nouvelle action est acceptée', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  const onfound = vi.fn();
  render(Turn, { s: state(), onfound, onpass: vi.fn(), onexpire: vi.fn(), onpause: vi.fn() });
  const btn = screen.getByRole('button', { name: /Trouvé/ });
  await fireEvent.click(btn);
  vi.setSystemTime(Date.now() + 500);
  await fireEvent.click(btn);
  expect(onfound).toHaveBeenCalledTimes(2);
  vi.useRealTimers();
});

test('à la fin du chrono, onexpire est appelé et le chrono affiche 0:00', async () => {
  vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
  const onexpire = vi.fn();
  render(Turn, { s: state(), onfound: vi.fn(), onpass: vi.fn(), onexpire, onpause: vi.fn() });
  await vi.advanceTimersByTimeAsync(10_000);
  expect(screen.getByText('0:20')).toBeInTheDocument();
  await vi.advanceTimersByTimeAsync(21_000);
  expect(onexpire).toHaveBeenCalled();
  vi.useRealTimers();
});

test('fermer l’écran du tour appelle onleave', () => {
  const onleave = vi.fn();
  const { unmount } = render(Turn, { s: state(), onfound: vi.fn(), onpass: vi.fn(), onexpire: vi.fn(), onpause: vi.fn(), onleave });
  unmount();
  expect(onleave).toHaveBeenCalledOnce();
});
