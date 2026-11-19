import { expect, test } from 'vitest';
import { BANK_CACHE } from './bank';
import { animauxRuntimeCaching } from './runtimeCaching';

test('le service worker sert sons et photos depuis le cache de la banque', () => {
  expect(animauxRuntimeCaching.handler).toBe('CacheFirst');
  expect(animauxRuntimeCaching.options.cacheName).toBe(BANK_CACHE);
  expect(animauxRuntimeCaching.urlPattern.test('https://x.github.io/bamboche/animaux/3f9a1c2b7d.mp3')).toBe(true);
  expect(animauxRuntimeCaching.urlPattern.test('https://x.github.io/bamboche/animaux/3f9a1c2b7d.webp')).toBe(true);
  expect(animauxRuntimeCaching.urlPattern.test('https://x.github.io/bamboche/assets/index.js')).toBe(false);
});

test('les requêtes partielles (Range) de Safari sont gérées, seules les réponses 200 sont gardées', () => {
  expect(animauxRuntimeCaching.options.rangeRequests).toBe(true);
  expect(animauxRuntimeCaching.options.cacheableResponse).toEqual({ statuses: [200] });
});
