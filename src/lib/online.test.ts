import { expect, test } from 'vitest';
import { get } from 'svelte/store';
import { isOnline, online } from './online';

test('suit les événements offline / online', () => {
  expect(get(online)).toBe(true);
  window.dispatchEvent(new Event('offline'));
  expect(get(online)).toBe(false);
  expect(isOnline()).toBe(false);
  window.dispatchEvent(new Event('online'));
  expect(isOnline()).toBe(true);
});
