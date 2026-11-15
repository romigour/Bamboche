import { get, writable, type Readable } from 'svelte/store';

const state = writable<boolean>(typeof navigator === 'undefined' ? true : navigator.onLine !== false);

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => state.set(true));
  window.addEventListener('offline', () => state.set(false));
}

/** État du réseau (navigator.onLine + événements online/offline). */
export const online: Readable<boolean> = { subscribe: state.subscribe };

export function isOnline(): boolean {
  return get(state);
}
