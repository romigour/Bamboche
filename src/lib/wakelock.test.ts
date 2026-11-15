import { afterEach, expect, test, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

test('sans navigator.wakeLock, keepAwake se résout', async () => {
  const { keepAwake, releaseAwake } = await import('./wakelock');
  await expect(keepAwake()).resolves.toBeUndefined();
  await expect(releaseAwake()).resolves.toBeUndefined();
});

test('avec wakeLock, demande puis libère le verrou', async () => {
  const release = vi.fn(async () => {});
  const request = vi.fn(async () => ({ release, addEventListener() {} }));
  vi.stubGlobal('navigator', { ...navigator, wakeLock: { request } });
  const { keepAwake, releaseAwake } = await import('./wakelock');
  await keepAwake();
  expect(request).toHaveBeenCalledWith('screen');
  await releaseAwake();
  expect(release).toHaveBeenCalled();
});

test('une demande refusée ne lève pas', async () => {
  vi.stubGlobal('navigator', { ...navigator, wakeLock: { request: vi.fn(async () => { throw new Error('NotAllowed'); }) } });
  const { keepAwake } = await import('./wakelock');
  await expect(keepAwake()).resolves.toBeUndefined();
});
