import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, expect, test, vi } from 'vitest';
import { award, createBlindtest } from '../logic/game';
import type { MusicSource } from '../music/source';
import type { Track } from '../types';
import Reveal from './Reveal.svelte';

afterEach(() => vi.useRealTimers());

const s = award(
  createBlindtest(
    [
      { id: 'A', name: 'Léa', color: 'blindtest', playerIds: ['a'] },
      { id: 'B', name: 'Hugo', color: 'hipster', playerIds: ['b'] },
    ],
    [
      { id: 'a', name: 'Léa' },
      { id: 'b', name: 'Hugo' },
    ],
    ['t0', 't1'],
    'hits-de-toujours',
    { tracks: 2, listenSeconds: 20 },
  ),
  null,
);
const track: Track = {
  id: 't0', title: 'Feel', displayTitle: 'Feel', artists: ['Robbie Williams'], album: 'Escapology', year: 2002,
  cover: '', preview: 'https://p/0', durationMs: 30000, isrc: '', popularity: 0,
};
const source = { preload: vi.fn() } as unknown as MusicSource;

test('« Extrait suivant » touché juste à l’ouverture (double tap) est ignoré, puis accepté', async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  const onnext = vi.fn();
  render(Reveal, { s, track, source, onnext, onchange: vi.fn() });
  const btn = screen.getByRole('button', { name: /Extrait suivant/ });
  await fireEvent.click(btn);
  expect(onnext).not.toHaveBeenCalled();
  vi.setSystemTime(Date.now() + 1000);
  await fireEvent.click(btn);
  expect(onnext).toHaveBeenCalledOnce();
});
