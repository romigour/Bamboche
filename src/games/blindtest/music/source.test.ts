import { afterEach, expect, test, vi } from 'vitest';
import { LOAD_TIMEOUT_MS, PreviewSource } from './source';

class FakeAudio {
  src = '';
  currentTime = 0;
  preload = '';
  listeners: Record<string, (() => void)[]> = {};
  play = vi.fn(() => Promise.resolve());
  pause = vi.fn();
  load = vi.fn();
  addEventListener(t: string, cb: () => void) {
    (this.listeners[t] ??= []).push(cb);
  }
  removeEventListener(t: string, cb: () => void) {
    this.listeners[t] = (this.listeners[t] ?? []).filter((x) => x !== cb);
  }
  dispatch(t: string) {
    for (const cb of this.listeners[t] ?? []) cb();
  }
}

function setup() {
  const made: FakeAudio[] = [];
  const src = new PreviewSource(() => {
    const a = new FakeAudio();
    made.push(a);
    return a as unknown as HTMLAudioElement;
  });
  return { src, made };
}

afterEach(() => vi.useRealTimers());

test('play lance la lecture dans le même appel synchrone (exigence iOS)', () => {
  const { src, made } = setup();
  void src.play('https://p/1', 5000);
  expect(made[0].src).toBe('https://p/1');
  expect(made[0].currentTime).toBe(5);
  expect(made[0].play).toHaveBeenCalledOnce();
});

test('un événement error déclenche onError', () => {
  const { src, made } = setup();
  const onError = vi.fn();
  src.onError(onError);
  void src.play('https://p/1');
  made[0].dispatch('error');
  expect(onError).toHaveBeenCalledOnce();
});

test('un play() refusé fait rejeter play(url)', async () => {
  const { src, made } = setup();
  made.length || src.positionMs(); // crée l'élément
  made[0].play.mockReturnValueOnce(Promise.reject(new Error('NotAllowedError')));
  await expect(src.play('https://p/1')).rejects.toThrow('NotAllowedError');
});

test('sans démarrage dans le délai : onError', () => {
  vi.useFakeTimers();
  const { src } = setup();
  const onError = vi.fn();
  src.onError(onError);
  void src.play('https://p/1');
  vi.advanceTimersByTime(LOAD_TIMEOUT_MS + 1);
  expect(onError).toHaveBeenCalledOnce();
});

test('un démarrage à temps annule le délai', () => {
  vi.useFakeTimers();
  const { src, made } = setup();
  const onError = vi.fn();
  src.onError(onError);
  void src.play('https://p/1');
  made[0].dispatch('playing');
  vi.advanceTimersByTime(LOAD_TIMEOUT_MS + 1);
  expect(onError).not.toHaveBeenCalled();
});

test('stop met en pause et revient au début', () => {
  const { src, made } = setup();
  void src.play('https://p/1', 3000);
  src.stop();
  expect(made[0].pause).toHaveBeenCalled();
  expect(made[0].currentTime).toBe(0);
});

test('onEnded se désabonne', () => {
  const { src, made } = setup();
  const cb = vi.fn();
  const off = src.onEnded(cb);
  void src.play('https://p/1');
  made[0].dispatch('ended');
  off();
  made[0].dispatch('ended');
  expect(cb).toHaveBeenCalledOnce();
});

test('play utilise toujours le même élément (celui que iOS a débloqué), même après preload', () => {
  const { src, made } = setup();
  void src.play('https://p/1');
  src.preload('https://p/2');
  void src.play('https://p/2');
  expect(made[0].src).toBe('https://p/2');
  expect(made[0].play).toHaveBeenCalledTimes(2);
  expect(made[1].src).toBe('https://p/2'); // préchargé pour le cache
  expect(made[1].play).not.toHaveBeenCalled();
});

test('playing() reflète la lecture', () => {
  const { src, made } = setup();
  (made[0] as unknown as { paused: boolean }).paused = true;
  expect(src.playing()).toBe(false);
  (made[0] as unknown as { paused: boolean }).paused = false;
  expect(src.playing()).toBe(true);
});
