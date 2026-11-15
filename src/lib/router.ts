import { readable, writable } from 'svelte/store';

export interface Route {
  path: string;
  query: Record<string, string>;
}

export function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '');
  const [p, q = ''] = raw.split('?');
  const path = p && p.startsWith('/') ? p : '/';
  const query: Record<string, string> = {};
  for (const [k, v] of new URLSearchParams(q)) query[k] = v;
  return { path, query };
}

const current = writable<Route>(parseHash(typeof location === 'undefined' ? '' : location.hash));

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', () => current.set(parseHash(location.hash)));
}

/** Route courante, suit `hashchange`. */
export const route = readable<Route>(parseHash(''), (set) => current.subscribe(set));

export function navigate(path: string, query: Record<string, string> = {}): void {
  const qs = new URLSearchParams(query).toString();
  const hash = '#' + path + (qs ? '?' + qs : '');
  if (location.hash !== hash) location.hash = hash;
  current.set(parseHash(hash));
}
