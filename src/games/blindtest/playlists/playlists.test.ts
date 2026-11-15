import { expect, test } from 'vitest';
import { playlistById, playlists } from './index';

test('la playlist « Hits de toujours » est intégrée et complète', () => {
  const p = playlistById('hits-de-toujours')!;
  expect(p.name).toBe('Hits de toujours');
  expect(p.tracks.length).toBeGreaterThanOrEqual(300);
  expect(new Set(p.tracks.map((t) => t.id)).size).toBe(p.tracks.length);
  for (const t of p.tracks) {
    expect(t.preview.startsWith('https://')).toBe(true);
    expect(t.displayTitle.trim()).not.toBe('');
  }
});

test('les ids de playlists sont uniques', () => {
  expect(new Set(playlists.map((p) => p.id)).size).toBe(playlists.length);
});
