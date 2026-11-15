import { afterEach, expect, test, vi } from 'vitest';
import { KEY_PREFIX, load, remove, save } from './storage';

afterEach(() => vi.restoreAllMocks());

test('le préfixe des clés est bamboche:v1:', () => expect(KEY_PREFIX).toBe('bamboche:v1:'));

test('load renvoie le fallback si absent', () => expect(load('x', 42)).toBe(42));

test('save puis load fait l’aller-retour et préfixe la clé', () => {
  save('players', [{ id: 'a', name: 'Léa' }]);
  expect(localStorage.getItem('bamboche:v1:players')).not.toBeNull();
  expect(load('players', [])).toEqual([{ id: 'a', name: 'Léa' }]);
});

test('load renvoie le fallback si le JSON est corrompu', () => {
  localStorage.setItem('bamboche:v1:bad', '{oops');
  expect(load('bad', 'ok')).toBe('ok');
});

test('remove efface la clé préfixée', () => {
  save('k', 1);
  remove('k');
  expect(localStorage.getItem('bamboche:v1:k')).toBeNull();
});

test('save ne lève pas si localStorage est indisponible', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('QuotaExceeded');
  });
  expect(() => save('k', 1)).not.toThrow();
});

test('load renvoie le fallback si localStorage lève à la lecture', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('SecurityError');
  });
  expect(load('k', 'repli')).toBe('repli');
});
