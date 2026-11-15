import { render, screen } from '@testing-library/svelte';
import { expect, test, vi } from 'vitest';
import { beginRound, createGame, markFound, startTurn, undoFound } from '../logic/game';
import TurnRecap from './TurnRecap.svelte';

test('après avoir vidé le paquet, annuler un mot garde le titre « Plus de cartes ! »', async () => {
  let s = createGame(
    [
      { id: 'A', name: 'Les Flamants', color: 'blindtest', playerIds: ['a', 'b'] },
      { id: 'B', name: 'Les Pingouins', color: 'hipster', playerIds: ['c', 'd'] },
    ],
    ['a', 'b', 'c', 'd'].map((id) => ({ id, name: id })),
    [{ id: 'c0', text: 'Chat' }],
    { turnSeconds: 30, rounds: 1 },
  );
  s = markFound(startTurn(beginRound(s), 0), 1);
  const props = { s, onundo: vi.fn(), onredo: vi.fn(), onnext: vi.fn() };
  const { rerender } = render(TurnRecap, props);
  expect(screen.getByText('Plus de cartes !')).toBeInTheDocument();
  await rerender({ ...props, s: undoFound(s, 'c0') });
  expect(screen.getByText('Plus de cartes !')).toBeInTheDocument();
  expect(screen.queryByText('Temps écoulé !')).toBeNull();
});
