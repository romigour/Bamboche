import { render } from '@testing-library/svelte';
import { expect, test, vi } from 'vitest';
import { createGame } from './logic/game';
import { game } from './session';

const wl = vi.hoisted(() => ({ keepAwake: vi.fn(async () => {}), releaseAwake: vi.fn(async () => {}) }));
vi.mock('../../lib/wakelock', () => wl);

import Play from './Play.svelte';

test('l’écran reste allumé pendant toute la partie, pas seulement pendant les tours', () => {
  game.set(
    createGame(
      [
        { id: 'A', name: 'Les Flamants', color: 'blindtest', playerIds: ['a', 'b'] },
        { id: 'B', name: 'Les Pingouins', color: 'hipster', playerIds: ['c', 'd'] },
      ],
      ['a', 'b', 'c', 'd'].map((id) => ({ id, name: id })),
      [{ id: 'c0', text: 'Chat' }],
      { turnSeconds: 30, rounds: 1 },
    ),
  );
  const { unmount } = render(Play);
  expect(wl.keepAwake).toHaveBeenCalled();
  unmount();
  expect(wl.releaseAwake).toHaveBeenCalled();
  game.set(null);
});
