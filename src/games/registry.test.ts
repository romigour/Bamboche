import { expect, test } from 'vitest';
import { games, gameById } from './registry';

test('les ids des jeux sont uniques', () => {
  const ids = games.map((g) => g.id);
  expect(new Set(ids).size).toBe(ids.length);
});

test("l'ordre d'affichage est timeup, blindtest, hipster, undercover", () => {
  expect(games.map((g) => g.id)).toEqual(['timeup', 'blindtest', 'hipster', 'undercover']);
});

test('Time Up est disponible pour 4 joueurs minimum (2 équipes de 2)', () => {
  const t = gameById('timeup')!;
  expect(t.status).toBe('disponible');
  expect(t.players.min).toBe(4);
  expect(t.name).toBe('Time Up');
  expect(t.route).toBe('/timeup');
});

test('Hipster et Undercover sont « bientôt »', () => {
  for (const id of ['hipster', 'undercover']) expect(gameById(id)!.status).toBe('bientot');
});

test('le Blindtest est disponible avec ses réglages', () => {
  const b = gameById('blindtest')!;
  expect(b.status).toBe('disponible');
  expect(b.route).toBe('/blindtest');
  const byKey = Object.fromEntries(b.settings.map((x) => [x.key, x]));
  expect(byKey.tracks).toMatchObject({ type: 'choice', options: [10, 15, 20], default: 15 });
  expect(byKey.listenSeconds).toMatchObject({ type: 'choice', options: [10, 20, 30], default: 20 });
});

test('chaque réglage a un défaut dans ses options ou ses bornes', () => {
  for (const g of games)
    for (const s of g.settings) {
      if (s.type === 'choice') expect(s.options).toContain(s.default);
      else {
        expect(s.default).toBeGreaterThanOrEqual(s.min);
        expect(s.default).toBeLessThanOrEqual(s.max);
      }
    }
});

test('les réglages de Time Up ont les valeurs du spec', () => {
  const byKey = Object.fromEntries(gameById('timeup')!.settings.map((s) => [s.key, s]));
  expect(byKey.turnSeconds).toMatchObject({ type: 'choice', options: [30, 45, 60, 90], default: 60 });
  expect(byKey.rounds).toMatchObject({ type: 'int', min: 1, max: 3, default: 3 });
  expect(byKey.quickCards).toMatchObject({ type: 'choice', options: [20, 30, 40, 50], default: 40 });
  expect(byKey.wordsPerTeam).toMatchObject({ type: 'int', min: 3, max: 10, default: 5 });
});
