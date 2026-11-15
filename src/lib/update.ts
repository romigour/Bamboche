import { writable, type Readable } from 'svelte/store';

/**
 * Mise à jour de la PWA à la demande (Réglages › « Rechercher une mise à jour »).
 * La PWA est en `registerType: 'prompt'` : une nouvelle version n'est jamais installée sans appui.
 * `registerSW` (module virtuel de vite-plugin-pwa) est injecté par `main.ts`, pour que ce module
 * reste testable et importable sans le plugin.
 */
export type UpdateStatus = 'unsupported' | 'idle' | 'checking' | 'upToDate' | 'available' | 'offline' | 'error';

export type RegisterFn = (opts: {
  onNeedRefresh?: () => void;
  onRegisteredSW?: (url: string, reg: ServiceWorkerRegistration | undefined) => void;
  onRegisterError?: (e: unknown) => void;
}) => (reload?: boolean) => Promise<void>;

const TIMEOUT_MS = 10_000;
/** Filet de sécurité : si le redémarrage promis par workbox n'arrive pas, on recharge nous-mêmes. */
const RELOAD_FALLBACK_MS = 3_000;

const status = writable<UpdateStatus>('unsupported');
export const updateStatus: Readable<UpdateStatus> = { subscribe: status.subscribe };

let current: UpdateStatus = 'unsupported';
let registration: ServiceWorkerRegistration | undefined;
let updateSW: ((reload?: boolean) => Promise<void>) | undefined;
let needRefresh = false;
let onNeedRefreshWaiter: (() => void) | undefined;
let reloadPage: () => void = () => location.reload();

function set(s: UpdateStatus) {
  current = s;
  status.set(s);
}

export function initUpdater(register: RegisterFn, opts: { reload?: () => void } = {}): void {
  if (opts.reload) reloadPage = opts.reload;
  updateSW = register({
    onRegisteredSW(_url, reg) {
      if (!reg) return;
      registration = reg;
      if (current === 'unsupported') set(needRefresh ? 'available' : 'idle');
    },
    onNeedRefresh() {
      needRefresh = true;
      if (onNeedRefreshWaiter) onNeedRefreshWaiter();
      else if (current !== 'unsupported') set('available');
    },
  });
}

/** Active la version en attente ; workbox recharge la page, sinon on le fait après un délai. */
async function install(): Promise<void> {
  await updateSW?.(true);
  setTimeout(() => reloadPage(), RELOAD_FALLBACK_MS);
}

/** Cherche une nouvelle version ; si elle existe, l'installe et recharge l'appli. */
export async function checkForUpdate(): Promise<void> {
  if (current === 'unsupported' || current === 'checking' || !registration) return;
  if (needRefresh) {
    await install();
    return;
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    set('offline');
    return;
  }
  set('checking');
  const reg = registration;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<'timeout'>((resolve) => {
    timer = setTimeout(() => resolve('timeout'), TIMEOUT_MS);
  });
  const work = (async (): Promise<'found' | 'none'> => {
    await reg.update();
    if (needRefresh || reg.waiting) return 'found';
    if (!reg.installing) return 'none';
    await new Promise<void>((resolve) => (onNeedRefreshWaiter = resolve));
    return 'found';
  })();
  try {
    const result = await Promise.race([work, timeout]);
    if (result === 'timeout') set('error');
    else if (result === 'none') set('upToDate');
    else await install();
  } catch {
    set('error');
  } finally {
    clearTimeout(timer);
    onNeedRefreshWaiter = undefined;
    work.catch(() => {}); // une vérification abandonnée ne doit pas lever plus tard
  }
}

export function resetUpdaterForTests(): void {
  registration = undefined;
  updateSW = undefined;
  needRefresh = false;
  onNeedRefreshWaiter = undefined;
  reloadPage = () => location.reload();
  set('unsupported');
}
