import { afterEach, expect, test, vi } from 'vitest';
import { createAnimalPlayer, LOAD_TIMEOUT_MS } from './audio';

function fakeAudio(play: () => Promise<void> = async () => {}) {
  const el = new EventTarget() as EventTarget & { src: string; currentTime: number; play: () => Promise<void>; pause: () => void; preload: string };
  el.src = '';
  el.currentTime = 0;
  el.preload = '';
  el.play = vi.fn(play);
  el.pause = vi.fn();
  return el;
}

afterEach(() => vi.useRealTimers());

test('play charge le son depuis le début et le lance', async () => {
  const el = fakeAudio();
  const p = createAnimalPlayer(() => el as unknown as HTMLAudioElement);
  el.currentTime = 5;
  await p.play('animaux/x.mp3');
  expect(el.src).toContain('animaux/x.mp3');
  expect(el.currentTime).toBe(0);
  expect(el.play).toHaveBeenCalled();
});

test('play rejette si le navigateur refuse la lecture', async () => {
  const el = fakeAudio(async () => { throw new Error('NotAllowedError'); });
  const p = createAnimalPlayer(() => el as unknown as HTMLAudioElement);
  await expect(p.play('a.mp3')).rejects.toThrow();
});

test('une erreur de chargement prévient les abonnés', async () => {
  const el = fakeAudio();
  const p = createAnimalPlayer(() => el as unknown as HTMLAudioElement);
  const cb = vi.fn();
  p.onError(cb);
  await p.play('a.mp3');
  el.dispatchEvent(new Event('error'));
  expect(cb).toHaveBeenCalledOnce();
});

test('sans démarrage dans le délai, le son est considéré introuvable', async () => {
  vi.useFakeTimers();
  const el = fakeAudio();
  const p = createAnimalPlayer(() => el as unknown as HTMLAudioElement);
  const cb = vi.fn();
  const off = p.onError(cb);
  await p.play('a.mp3');
  vi.advanceTimersByTime(LOAD_TIMEOUT_MS + 1);
  expect(cb).toHaveBeenCalledOnce();
  off();
});

test('réécouter pendant la lecture ne déclare pas le son introuvable', async () => {
  vi.useFakeTimers();
  const el = Object.assign(fakeAudio(), { paused: true, readyState: 0 });
  const p = createAnimalPlayer(() => el as unknown as HTMLAudioElement);
  const cb = vi.fn();
  p.onError(cb);
  await p.play('a.mp3');
  Object.assign(el, { paused: false, readyState: 4 });
  el.dispatchEvent(new Event('playing'));
  await p.play('a.mp3');
  vi.advanceTimersByTime(LOAD_TIMEOUT_MS + 1);
  expect(cb).not.toHaveBeenCalled();
});

test('le son qui démarre annule le délai ; stop met en pause', async () => {
  vi.useFakeTimers();
  const el = fakeAudio();
  const p = createAnimalPlayer(() => el as unknown as HTMLAudioElement);
  const cb = vi.fn();
  p.onError(cb);
  await p.play('a.mp3');
  el.dispatchEvent(new Event('playing'));
  vi.advanceTimersByTime(LOAD_TIMEOUT_MS + 1);
  expect(cb).not.toHaveBeenCalled();
  p.stop();
  expect(el.pause).toHaveBeenCalled();
});
