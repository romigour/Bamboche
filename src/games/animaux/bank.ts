import type { Animal } from './types';

/** Cache dédié aux sons et photos (le service worker y lit aussi, en CacheFirst). */
export const BANK_CACHE = 'bamboche-animaux';

const defaultCaches = (): CacheStorage | undefined => (typeof caches === 'undefined' ? undefined : caches);

export function bankUrls(all: Animal[]): string[] {
  return [...new Set(all.flatMap((a) => [a.sound, a.photo]))];
}

/** Télécharge dans le cache ce qui manque. Les fichiers en erreur sont renvoyés, sans bloquer les autres. */
export async function downloadBank(
  urls: string[],
  onProgress: (done: number, total: number) => void,
  cacheStorage: CacheStorage | undefined = defaultCaches(),
  fetcher: (url: string) => Promise<Response> = (url) => fetch(url),
): Promise<{ failed: string[] }> {
  if (!cacheStorage) return { failed: [] };
  const cache = await cacheStorage.open(BANK_CACHE);
  const failed: string[] = [];
  let done = 0;
  onProgress(done, urls.length);
  for (const url of urls) {
    if (!(await cache.match(url))) {
      try {
        const res = await fetcher(url);
        if (res.ok) await cache.put(url, res);
        else failed.push(url);
      } catch {
        failed.push(url);
      }
    }
    onProgress(++done, urls.length);
  }
  return { failed };
}

/** Banque complète en cache ? Sans API Cache (vieux navigateur, tests), on laisse jouer. */
export async function bankReady(urls: string[], cacheStorage: CacheStorage | undefined = defaultCaches()): Promise<boolean> {
  if (!cacheStorage) return true;
  const cache = await cacheStorage.open(BANK_CACHE);
  for (const url of urls) if (!(await cache.match(url))) return false;
  return true;
}
