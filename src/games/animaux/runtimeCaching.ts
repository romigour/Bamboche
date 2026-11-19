import { BANK_CACHE } from './bank';

/**
 * Règle du service worker pour les sons et photos des Cris d'animaux : hors précache, lus depuis le cache
 * rempli à la première partie. Safari demande les médias par morceaux (Range) : sans `rangeRequests`,
 * un son servi depuis le cache ne joue pas sur iPhone.
 */
export const animauxRuntimeCaching = {
  urlPattern: /\/animaux\/[^/]+\.(?:mp3|webp)$/,
  handler: 'CacheFirst' as const,
  options: {
    cacheName: BANK_CACHE,
    rangeRequests: true,
    cacheableResponse: { statuses: [200] },
  },
};
