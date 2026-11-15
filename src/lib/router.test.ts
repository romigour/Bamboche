import { expect, test } from 'vitest';
import { get } from 'svelte/store';
import { navigate, parseHash, route } from './router';

test('parseHash lit le chemin et décode la query', () => {
  expect(parseHash('#/joueurs?retour=%2Ftimeup')).toEqual({ path: '/joueurs', query: { retour: '/timeup' } });
});

test('parseHash vide donne la racine', () => {
  expect(parseHash('')).toEqual({ path: '/', query: {} });
  expect(parseHash('#')).toEqual({ path: '/', query: {} });
});

test('navigate met à jour le hash et le store route', () => {
  navigate('/reglages/timeup', { retour: '/' });
  expect(location.hash).toBe('#/reglages/timeup?retour=%2F');
  expect(get(route)).toEqual({ path: '/reglages/timeup', query: { retour: '/' } });
});
