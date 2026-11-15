import { expect, test } from 'vitest';
import { timeup } from '../games/timeup/module';
import { getSettings, setSetting } from './settings';
import { save } from './storage';

test('sans rien de stocké, les défauts du jeu', () => {
  expect(getSettings(timeup)).toEqual({ turnSeconds: 60, rounds: 3, quickCards: 40, wordsPerTeam: 5 });
});

test('setSetting est relu par getSettings', () => {
  setSetting('timeup', 'turnSeconds', 45);
  expect(getSettings(timeup).turnSeconds).toBe(45);
});

test('une valeur stockée invalide revient au défaut', () => {
  save('settings:timeup', { turnSeconds: 7, rounds: 9, wordsPerTeam: 4 });
  const s = getSettings(timeup);
  expect(s.turnSeconds).toBe(60);
  expect(s.rounds).toBe(3);
  expect(s.wordsPerTeam).toBe(4);
});
