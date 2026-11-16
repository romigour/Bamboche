import { beforeEach, expect, test, vi } from 'vitest';
import { get } from 'svelte/store';
import { players } from '../../lib/players';
import { load, save } from '../../lib/storage';
import { createSheet, enter, type Participant } from './logic/sheet';
import {
  abandonSheet,
  currentSheet,
  deleteFinished,
  endValueFor,
  finishSheet,
  loadHistory,
  loadSavedSheet,
  replay,
  scoreHistory,
  startSheet,
} from './session';

const solo = (id: string, name: string): Participant => ({ id, name, members: [name] });
const sheet = (endValue = 100) =>
  createSheet('skyjo', [solo('a', 'Léa'), solo('b', 'Tom')], endValue, 1000, 's1');

beforeEach(() => {
  currentSheet.set(null);
  scoreHistory.set([]);
});

test('startSheet enregistre et navigue', () => {
  const s = sheet();
  startSheet(s);
  expect(location.hash).toBe('#/scores/partie');
  expect(loadSavedSheet()).toEqual(s);
});

test('finishSheet enregistre les manches complètes seulement', () => {
  let s = sheet();
  for (const v of [5, 7, 3, 9, 4]) s = enter(s, v); // 2 manches + 1 case entamée
  startSheet(s);
  const g = finishSheet(2000)!;
  expect(g.rounds).toEqual([
    [5, 7],
    [3, 9],
  ]);
  expect(g).not.toHaveProperty('pending');
  expect(g.finishedAt).toBe(2000);
  expect(get(currentSheet)).toBeNull();
  expect(get(scoreHistory)).toEqual([g]);
  expect(loadHistory()).toEqual([g]);
  expect(location.hash.startsWith('#/scores/resultat?id=')).toBe(true);
});

test('finishSheet sans manche complète ne fait rien et renvoie null', () => {
  startSheet(enter(sheet(), 5));
  expect(finishSheet(2000)).toBeNull();
  expect(get(currentSheet)).not.toBeNull();
  expect(get(scoreHistory)).toEqual([]);
});

test('abandonSheet n’écrit rien dans l’historique', () => {
  startSheet(enter(enter(sheet(), 5), 6));
  abandonSheet();
  expect(get(currentSheet)).toBeNull();
  expect(loadSavedSheet()).toBeNull();
  expect(get(scoreHistory)).toEqual([]);
});

test('les prénoms restent ceux du lancement', () => {
  startSheet(enter(enter(sheet(), 5), 6));
  players.set([]);
  finishSheet(2000);
  expect(get(scoreHistory)[0].participants.map((p) => p.name)).toContain('Léa');
});

test('données corrompues ignorées', () => {
  save('scores:current', { version: 2 });
  expect(loadSavedSheet()).toBeNull();
  save('scores:current', { ...sheet(), rounds: [[1]] });
  expect(loadSavedSheet()).toBeNull();
  save('scores:current', { ...sheet(), pending: [null] });
  expect(loadSavedSheet()).toBeNull();
  save('scores:current', { ...sheet(), gameId: 'zzz' });
  expect(loadSavedSheet()).toBeNull();
  save('scores:current', { ...sheet(), participants: [] });
  expect(loadSavedSheet()).toBeNull();

  startSheet(enter(enter(sheet(), 5), 6));
  const g = finishSheet(2000)!;
  save('scores:history', [g, { foo: 1 }, null]);
  expect(loadHistory()).toHaveLength(1);
});

test('endValueFor', () => {
  expect(endValueFor('skyjo')).toBe(100);
  startSheet(sheet(150));
  expect(endValueFor('skyjo')).toBe(150);
  save('scores:settings', { skyjo: 5 });
  expect(endValueFor('skyjo')).toBe(100);
  expect(load('scores:settings', {})).toEqual({ skyjo: 5 });
});

test('deleteFinished retire l’entrée et sauvegarde', () => {
  startSheet(enter(enter(sheet(), 5), 6));
  const g = finishSheet(2000)!;
  deleteFinished(g.id);
  expect(get(scoreHistory)).toEqual([]);
  expect(loadHistory()).toEqual([]);
});

test('replay démarre une feuille vide du même jeu, mêmes noms, même endValue', () => {
  startSheet(enter(enter(sheet(150), 5), 6));
  const g = finishSheet(2000)!;
  replay(g, 3000);
  const s = get(currentSheet)!;
  expect(s.gameId).toBe('skyjo');
  expect(s.endValue).toBe(150);
  expect(s.rounds).toEqual([]);
  expect(s.startedAt).toBe(3000);
  expect(s.id).not.toBe(g.id);
  expect(s.participants.map((p) => p.name)).toEqual(['Léa', 'Tom']);
  expect(s.participants.map((p) => p.id)).not.toEqual(g.participants.map((p) => p.id));
  expect(location.hash).toBe('#/scores/partie');
});

test('charger le module ne réécrit pas (et n’efface donc pas) les données d’une autre version', async () => {
  const futur = { version: 2, id: 'z', gameId: 'skyjo' };
  const ancien = { ...sheet(), version: 1 };
  save('scores:history', [futur]);
  save('scores:current', { ...ancien, version: 2 });
  vi.resetModules();
  const frais = await import('./session');
  expect(get(frais.scoreHistory)).toEqual([]);
  expect(get(frais.currentSheet)).toBeNull();
  expect(load('scores:history', [])).toEqual([futur]);
  expect(load('scores:current', null)).toEqual({ ...ancien, version: 2 });
  // un vrai changement sauvegarde bien
  frais.currentSheet.set(sheet());
  expect(load('scores:current', null)).toEqual(sheet());
});
