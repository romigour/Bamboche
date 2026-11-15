import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { get } from 'svelte/store';
import { checkForUpdate, initUpdater, resetUpdaterForTests, updateStatus, type RegisterFn } from './update';

type Opts = Parameters<RegisterFn>[0];
type FakeReg = { update: ReturnType<typeof vi.fn>; installing: object | null; waiting: object | null };

let opts: Opts;
let updateSW: ReturnType<typeof vi.fn<(reload?: boolean) => Promise<void>>>;
let reg: FakeReg;
let reload: ReturnType<typeof vi.fn<() => void>>;

/** Simule `registerSW` : capture les callbacks, renvoie `updateSW`. */
function setup(registered = true) {
  updateSW = vi.fn<(reload?: boolean) => Promise<void>>(async () => {});
  reg = { update: vi.fn(async () => {}), installing: null, waiting: null };
  const register: RegisterFn = (o) => {
    opts = o;
    return updateSW;
  };
  reload = vi.fn<() => void>();
  initUpdater(register, { reload });
  if (registered) opts.onRegisteredSW?.('sw.js', reg as unknown as ServiceWorkerRegistration);
}

beforeEach(() => resetUpdaterForTests());
afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

test('unsupported : sans onRegisteredSW, checkForUpdate ne fait rien', async () => {
  setup(false);
  expect(get(updateStatus)).toBe('unsupported');
  await checkForUpdate();
  expect(reg.update).not.toHaveBeenCalled();
  expect(get(updateStatus)).toBe('unsupported');
});

test('à jour : update() sans nouveau worker → upToDate', async () => {
  setup();
  expect(get(updateStatus)).toBe('idle');
  await checkForUpdate();
  expect(reg.update).toHaveBeenCalledOnce();
  expect(get(updateStatus)).toBe('upToDate');
  expect(updateSW).not.toHaveBeenCalled();
});

test('nouvelle version : installing puis onNeedRefresh → updateSW(true)', async () => {
  setup();
  reg.update.mockImplementation(async () => {
    reg.installing = {};
  });
  const p = checkForUpdate();
  await vi.waitFor(() => expect(reg.update).toHaveBeenCalled());
  await Promise.resolve();
  expect(updateSW).not.toHaveBeenCalled();
  opts.onNeedRefresh?.();
  await p;
  expect(updateSW).toHaveBeenCalledWith(true);
});

test('nouvelle version déjà en attente après update() → updateSW(true) tout de suite', async () => {
  setup();
  reg.update.mockImplementation(async () => {
    reg.waiting = {};
  });
  await checkForUpdate();
  expect(updateSW).toHaveBeenCalledWith(true);
});

test('available : version déjà téléchargée → installe sans revérifier', async () => {
  setup();
  opts.onNeedRefresh?.();
  expect(get(updateStatus)).toBe('available');
  await checkForUpdate();
  expect(updateSW).toHaveBeenCalledWith(true);
  expect(reg.update).not.toHaveBeenCalled();
});

test('hors ligne → offline sans appel réseau', async () => {
  setup();
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
  await checkForUpdate();
  expect(get(updateStatus)).toBe('offline');
  expect(reg.update).not.toHaveBeenCalled();
});

test('ignore un second appel pendant la vérification', async () => {
  setup();
  let resolve!: () => void;
  reg.update.mockImplementation(() => new Promise<void>((r) => (resolve = r)));
  const p1 = checkForUpdate();
  const p2 = checkForUpdate();
  expect(get(updateStatus)).toBe('checking');
  resolve();
  await Promise.all([p1, p2]);
  expect(reg.update).toHaveBeenCalledOnce();
});

test('timeout : pas de réponse en 10 s → error, puis réessayable', async () => {
  vi.useFakeTimers();
  setup();
  reg.update.mockImplementation(() => new Promise<void>(() => {}));
  const p = checkForUpdate();
  await vi.advanceTimersByTimeAsync(9_999);
  expect(get(updateStatus)).toBe('checking');
  await vi.advanceTimersByTimeAsync(1);
  await p;
  expect(get(updateStatus)).toBe('error');
  reg.update.mockImplementation(async () => {});
  await checkForUpdate();
  expect(reg.update).toHaveBeenCalledTimes(2);
  expect(get(updateStatus)).toBe('upToDate');
});

test('erreur : update() rejette → error', async () => {
  setup();
  reg.update.mockRejectedValue(new Error('réseau'));
  await checkForUpdate();
  expect(get(updateStatus)).toBe('error');
});

test('installation demandée mais pas de redémarrage → rechargement forcé au bout de 3 s', async () => {
  vi.useFakeTimers();
  setup();
  opts.onNeedRefresh?.();
  await checkForUpdate();
  expect(updateSW).toHaveBeenCalledWith(true);
  await vi.advanceTimersByTimeAsync(2_999);
  expect(reload).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1);
  expect(reload).toHaveBeenCalledOnce();
});
