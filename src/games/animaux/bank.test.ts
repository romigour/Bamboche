import { expect, test, vi } from 'vitest';
import { bankReady, bankUrls, downloadBank } from './bank';
import type { Animal } from './types';

function fakeCaches() {
  const store = new Map<string, Response>();
  const cache = {
    match: vi.fn(async (url: string) => store.get(url)),
    put: vi.fn(async (url: string, res: Response) => void store.set(url, res)),
  };
  return { caches: { open: vi.fn(async () => cache) } as unknown as CacheStorage, store, cache };
}

const credit = { author: 'x', license: 'CC0', url: 'u' };
const a = (id: string): Animal => ({
  id, name: id, level: 'facile', family: 'f', sound: `animaux/${id}.mp3`, photo: `animaux/${id}.webp`, credits: { sound: credit, photo: credit },
});

test('bankUrls liste sons et photos, sans doublon', () => {
  expect(bankUrls([a('x'), a('y'), a('x')])).toEqual(['animaux/x.mp3', 'animaux/x.webp', 'animaux/y.mp3', 'animaux/y.webp']);
});

test('downloadBank met chaque fichier en cache et signale la progression', async () => {
  const { caches, store } = fakeCaches();
  const fetcher = vi.fn(async () => new Response('ok', { status: 200 }));
  const progress: [number, number][] = [];
  const res = await downloadBank(['a.mp3', 'b.webp'], (d, t) => progress.push([d, t]), caches, fetcher);
  expect(res.failed).toEqual([]);
  expect([...store.keys()]).toEqual(['a.mp3', 'b.webp']);
  expect(progress.at(-1)).toEqual([2, 2]);
});

test('downloadBank ne retélécharge pas ce qui est déjà en cache', async () => {
  const { caches, store } = fakeCaches();
  store.set('a.mp3', new Response('ok'));
  const fetcher = vi.fn(async () => new Response('ok'));
  await downloadBank(['a.mp3', 'b.webp'], () => {}, caches, fetcher);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher).toHaveBeenCalledWith('b.webp');
});

test('un fichier en erreur est signalé sans bloquer les autres', async () => {
  const { caches, store } = fakeCaches();
  const fetcher = vi.fn(async (url: string) => (url === 'a.mp3' ? new Response('', { status: 404 }) : new Response('ok')));
  const res = await downloadBank(['a.mp3', 'b.webp'], () => {}, caches, fetcher);
  expect(res.failed).toEqual(['a.mp3']);
  expect(store.has('b.webp')).toBe(true);
});

test('un réseau coupé compte comme un échec', async () => {
  const { caches } = fakeCaches();
  const res = await downloadBank(['a.mp3'], () => {}, caches, async () => { throw new TypeError('offline'); });
  expect(res.failed).toEqual(['a.mp3']);
});

test('bankReady : faux tant qu’il manque un fichier, vrai sans API Cache', async () => {
  const { caches, store } = fakeCaches();
  store.set('a.mp3', new Response('ok'));
  expect(await bankReady(['a.mp3', 'b.webp'], caches)).toBe(false);
  store.set('b.webp', new Response('ok'));
  expect(await bankReady(['a.mp3', 'b.webp'], caches)).toBe(true);
  expect(await bankReady(['a.mp3'], undefined)).toBe(true);
});
