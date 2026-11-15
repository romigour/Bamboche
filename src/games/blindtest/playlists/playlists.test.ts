import { expect, test } from 'vitest';
import { blindtest } from '../module';
import { playlistById, playlists } from './index';

const maxTracks = Math.max(
  ...(blindtest.settings.find((s) => s.key === 'tracks') as { options: number[] }).options,
);

test('la playlist « Hits de toujours » est intégrée et complète', () => {
  const p = playlistById('hits-de-toujours')!;
  expect(p.name).toBe('Hits de toujours');
  expect(p.tracks.length).toBeGreaterThanOrEqual(300);
});

test('les playlists intégrées sont dans l’ordre d’affichage prévu', () => {
  expect(playlists.map((p) => p.id)).toEqual(['hits-de-toujours', 'hitster-francais', 'annees-2000-fr', 'rap-fr']);
});

test.each([
  ['hitster-francais', '100 % français', 'Les tubes français de toutes les époques'],
  ['annees-2000-fr', 'Années 2000 FR', 'La variété française des années 2000'],
  ['rap-fr', 'Rap FR', 'Le rap français des années 90-2000'],
])('la playlist « %s » porte le bon nom et la bonne description', (id, name, description) => {
  const p = playlistById(id)!;
  expect(p.name).toBe(name);
  expect(p.description).toBe(description);
});

test.each(playlists.map((p) => [p.id, p] as const))('la playlist « %s » est jouable', (_id, p) => {
  expect(p.tracks.length).toBeGreaterThanOrEqual(maxTracks);
  expect(new Set(p.tracks.map((t) => t.id)).size).toBe(p.tracks.length);
  for (const t of p.tracks) {
    expect(t.preview.startsWith('https://')).toBe(true);
    expect(t.displayTitle.trim()).not.toBe('');
  }
});

test('les ids de playlists sont uniques', () => {
  expect(new Set(playlists.map((p) => p.id)).size).toBe(playlists.length);
});
