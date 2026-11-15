import { expect, test } from 'vitest';
import { versionLabel } from './version';

test('versionLabel formate version, date et hash', () => {
  expect(versionLabel()).toBe('Version 0.0.0-test · 15/11/2026 · abc1234');
});
