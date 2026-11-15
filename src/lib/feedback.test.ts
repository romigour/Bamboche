import { afterEach, beforeEach, expect, test, vi } from 'vitest';

let oscillators = 0;
class FakeAudioContext {
  state = 'running';
  currentTime = 0;
  destination = {};
  resume = vi.fn(async () => {});
  createOscillator() {
    oscillators++;
    return { type: '', frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: () => ({ connect() {} }), start() {}, stop() {} };
  }
  createGain() {
    return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} }, connect() {} };
  }
}

beforeEach(() => {
  oscillators = 0;
  vi.resetModules();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

test('sans navigator.vibrate, vibrate ne lève pas', async () => {
  const { vibrate } = await import('./feedback');
  expect('vibrate' in navigator).toBe(false);
  expect(() => vibrate(10)).not.toThrow();
});

test('vibrate appelle navigator.vibrate quand il existe', async () => {
  const spy = vi.fn(() => true);
  vi.stubGlobal('navigator', { ...navigator, vibrate: spy });
  const { vibrate } = await import('./feedback');
  vibrate([200, 100, 200]);
  expect(spy).toHaveBeenCalledWith([200, 100, 200]);
});

test('sans AudioContext, play ne lève pas', async () => {
  const { play, unlockAudio } = await import('./feedback');
  expect(() => unlockAudio()).not.toThrow();
  expect(() => play('found')).not.toThrow();
});

test('avec AudioContext, play crée des oscillateurs', async () => {
  vi.stubGlobal('AudioContext', FakeAudioContext);
  const { play, unlockAudio } = await import('./feedback');
  unlockAudio();
  play('found');
  expect(oscillators).toBeGreaterThan(0);
});

test('avec soundOn à faux, aucun oscillateur', async () => {
  vi.stubGlobal('AudioContext', FakeAudioContext);
  const { play, soundOn, unlockAudio } = await import('./feedback');
  soundOn.set(false);
  unlockAudio();
  play('found');
  play('tap');
  expect(oscillators).toBe(0);
});

test('soundOn est persisté et vaut vrai par défaut', async () => {
  const { soundOn } = await import('./feedback');
  const { get } = await import('svelte/store');
  expect(get(soundOn)).toBe(true);
  soundOn.set(false);
  expect(localStorage.getItem('bamboche:v1:soundOn')).toBe('false');
});
