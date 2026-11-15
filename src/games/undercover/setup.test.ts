import { expect, test, vi } from 'vitest';
import { save } from '../../lib/storage';
import { validateSetup } from './setup';

test('validateSetup', () => {
  expect(validateSetup(2, false)).toEqual({ ok: false, error: 'Il faut au moins 3 joueurs.' });
  expect(validateSetup(3, false)).toEqual({ ok: true, error: null });
  expect(validateSetup(3, true)).toEqual({ ok: false, error: 'Avec Mr White, il faut au moins 4 joueurs.' });
  expect(validateSetup(4, true)).toEqual({ ok: true, error: null });
  expect(validateSetup(21, false)).toEqual({ ok: false, error: '20 joueurs maximum.' });
});

test('mrWhiteOn relit true sauvegardé, false si valeur non booléenne', async () => {
  save('undercover:mrwhite', true);
  vi.resetModules();
  let m = await import('./setup');
  let v = false;
  m.mrWhiteOn.subscribe((x: boolean) => (v = x))();
  expect(v).toBe(true);
  save('undercover:mrwhite', 'oui');
  vi.resetModules();
  m = await import('./setup');
  m.mrWhiteOn.subscribe((x: boolean) => (v = x))();
  expect(v).toBe(false);
});
