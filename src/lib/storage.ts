/** Persistance locale typée. Toutes les clés sont préfixées ; aucun accès ne lève. */
export const KEY_PREFIX = 'bamboche:v1:';

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(KEY_PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(KEY_PREFIX + key, JSON.stringify(value));
  } catch {
    // stockage plein ou indisponible (navigation privée) : on continue sans persister
  }
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(KEY_PREFIX + key);
  } catch {
    // ignoré
  }
}
