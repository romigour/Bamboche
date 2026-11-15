import { expect, test } from 'vitest';
import { newTeam, randomAssign, TEAM_NAMES, validateTeams, type TeamDraft } from './teams';
import { seq } from './test-rng';

const team = (name: string, playerIds: string[]): TeamDraft => ({ id: name, name, color: 'pop', playerIds });

test('newTeam suit la liste des noms puis « Équipe N »', () => {
  expect(newTeam(0).name).toBe('Les Flamants');
  expect(newTeam(1).name).toBe('Les Pingouins');
  expect(newTeam(7).name).toBe(TEAM_NAMES[7]);
  expect(newTeam(8).name).toBe('Équipe 9');
  expect(newTeam(0).color).toBe('blindtest');
});

test('randomAssign équilibre 7 joueurs en 3 équipes, chacun une seule fois', () => {
  const ids = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
  const groups = randomAssign(ids, 3, seq(0.2, 0.9, 0.5, 0.1));
  expect(groups.map((g) => g.length).sort()).toEqual([2, 2, 3]);
  expect(groups.flat().sort()).toEqual(ids);
});

test('validateTeams : une seule équipe est refusée', () => {
  const r = validateTeams([team('Les Flamants', ['a', 'b'])], 2, 2);
  expect(r.ok).toBe(false);
  expect(r.errors).toContain('Il faut au moins 2 équipes.');
});

test('validateTeams : une équipe à 1 joueur est nommée', () => {
  const r = validateTeams([team('Les Flamants', ['a', 'b']), team('Les Pingouins', ['c'])], 2, 2);
  expect(r.errors).toEqual(['Les Pingouins : au moins 2 joueurs.']);
});

test('validateTeams : un joueur dans deux équipes est signalé', () => {
  const r = validateTeams([team('A', ['a', 'b']), team('B', ['a', 'c'])], 2, 2, { a: 'Léa' });
  expect(r.errors).toEqual(['Léa est dans deux équipes.']);
});

test('validateTeams : 2 équipes de 2 sont valides', () => {
  expect(validateTeams([team('A', ['a', 'b']), team('B', ['c', 'd'])], 2, 2)).toEqual({ ok: true, errors: [] });
});

test('shortName retire « Les »', async () => {
  const { shortName } = await import('./teams');
  expect(shortName('Les Flamants')).toBe('Flamants');
  expect(shortName('Équipe 9')).toBe('Équipe 9');
});

test('soloTeams : une équipe par joueur, couleurs distinctes', async () => {
  const { soloTeams } = await import('./teams');
  const t = soloTeams([{ id: 'a', name: 'Léa' }, { id: 'b', name: 'Hugo' }, { id: 'c', name: 'Tom' }]);
  expect(t.map((x) => x.name)).toEqual(['Léa', 'Hugo', 'Tom']);
  expect(t.map((x) => x.playerIds)).toEqual([['a'], ['b'], ['c']]);
  expect(new Set(t.map((x) => x.color)).size).toBe(3);
});
