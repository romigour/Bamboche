import { beforeEach, expect, test } from 'vitest';
import { get } from 'svelte/store';
import { addPlayer, players, removePlayer, renamePlayer } from './players';
import { load } from './storage';

beforeEach(() => players.set([]));

test('addPlayer rogne le nom', () => {
  expect(addPlayer('  Léa ')!.name).toBe('Léa');
  expect(get(players).map((p) => p.name)).toEqual(['Léa']);
});

test('addPlayer refuse un nom vide', () => {
  expect(addPlayer('   ')).toBeNull();
  expect(get(players)).toEqual([]);
});

test('deux joueurs de même nom sont acceptés avec des ids distincts', () => {
  const a = addPlayer('Tom')!;
  const b = addPlayer('Tom')!;
  expect(a.id).not.toBe(b.id);
  expect(get(players)).toHaveLength(2);
});

test('renamePlayer refuse un nom vide et accepte un nom valide', () => {
  const a = addPlayer('Hugo')!;
  expect(renamePlayer(a.id, '  ')).toBe(false);
  expect(renamePlayer(a.id, ' Hugues ')).toBe(true);
  expect(get(players)[0].name).toBe('Hugues');
});

test('removePlayer retire le joueur', () => {
  const a = addPlayer('Inès')!;
  addPlayer('Sarah');
  removePlayer(a.id);
  expect(get(players).map((p) => p.name)).toEqual(['Sarah']);
});

test('la liste est persistée', () => {
  addPlayer('Malik');
  expect(load<{ name: string }[]>('players', []).map((p) => p.name)).toEqual(['Malik']);
});
