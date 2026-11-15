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

const fb = vi.hoisted(() => ({ play: vi.fn(), vibrate: vi.fn(), tap: vi.fn() }));
vi.mock('../../lib/feedback', () => fb);

test('un tap juste après la fin du chrono joue quand même le signal de fin', async () => {
  const { fireEvent, screen } = await import('@testing-library/svelte');
  const { beginRound, startTurn } = await import('./logic/game');
  const base = createGame(
    [
      { id: 'A', name: 'Les Flamants', color: 'blindtest', playerIds: ['a', 'b'] },
      { id: 'B', name: 'Les Pingouins', color: 'hipster', playerIds: ['c', 'd'] },
    ],
    ['a', 'b', 'c', 'd'].map((id) => ({ id, name: id })),
    [{ id: 'c0', text: 'Chat' }, { id: 'c1', text: 'Chien' }],
    { turnSeconds: 30, rounds: 1 },
  );
  // chrono terminé il y a 50 ms : l'intervalle de l'écran n'a pas encore vu la fin
  game.set(startTurn(beginRound(base), Date.now() - 30_050));
  fb.play.mockClear();
  render(Play);
  await fireEvent.click(screen.getByRole('button', { name: /Trouvé/ }));
  expect(fb.play).toHaveBeenCalledWith('end');
  expect(fb.play).not.toHaveBeenCalledWith('found');
  game.set(null);
});
