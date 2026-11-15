import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, expect, test, vi } from 'vitest';
import { createBlindtest } from '../logic/game';
import type { MusicSource } from '../music/source';
import type { Track } from '../types';
import Listen from './Listen.svelte';

function fakeSource() {
  const errors = new Set<() => void>();
  const src: MusicSource & { fail(): void } = {
    play: vi.fn(async () => {}),
    preload: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    positionMs: () => 0,
    playing: () => true,
    onEnded: () => () => {},
    onError: (cb) => {
      errors.add(cb);
      return () => errors.delete(cb);
    },
    fail: () => errors.forEach((cb) => cb()),
  };
  return src;
}

const s = createBlindtest(
  [
    { id: 'A', name: 'Léa', color: 'blindtest', playerIds: ['a'] },
    { id: 'B', name: 'Hugo', color: 'hipster', playerIds: ['b'] },
  ],
  [
    { id: 'a', name: 'Léa' },
    { id: 'b', name: 'Hugo' },
  ],
  ['t0', 't1', 's0'],
  'hits-de-toujours',
  { tracks: 2, listenSeconds: 20 },
);
const track: Track = {
  id: 't0', title: 'Poker Face', displayTitle: 'Poker Face', artists: ['Lady Gaga'], album: 'The Fame', year: 2008,
  cover: '', preview: 'https://p/0', durationMs: 30000, isrc: '', popularity: 0,
};

afterEach(() => window.dispatchEvent(new Event('online')));

function setup() {
  const source = fakeSource();
  const props = { s, track, playlistName: 'Hits de toujours', source, onaward: vi.fn(), onskip: vi.fn(), onquit: vi.fn() };
  render(Listen, props);
  return props;
}

test('double tap sur un joueur : un seul point attribué, et la musique s’arrête', async () => {
  const { onaward, source } = setup();
  const btn = screen.getByRole('button', { name: 'Léa' });
  await fireEvent.click(btn);
  await fireEvent.click(btn);
  expect(onaward).toHaveBeenCalledOnce();
  expect(onaward).toHaveBeenCalledWith('A');
  expect(source.stop).toHaveBeenCalled();
});

test('« Personne n’a trouvé » attribue à personne', async () => {
  const { onaward } = setup();
  await fireEvent.click(screen.getByRole('button', { name: /Personne/ }));
  expect(onaward).toHaveBeenCalledWith(null);
});

test('extrait indisponible avec réseau : message et passage au suivant', async () => {
  const { source, onskip } = setup();
  source.fail();
  await Promise.resolve();
  expect(await screen.findByText('Extrait indisponible, on passe au suivant')).toBeInTheDocument();
  expect(onskip).toHaveBeenCalledOnce();
});

test('échec sans réseau : écran « Connexion requise », pas de saut', async () => {
  const { source, onskip } = setup();
  window.dispatchEvent(new Event('offline'));
  source.fail();
  expect(await screen.findByText('Connexion requise pour la musique')).toBeInTheDocument();
  expect(onskip).not.toHaveBeenCalled();
});
