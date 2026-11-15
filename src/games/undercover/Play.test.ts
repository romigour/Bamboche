import { fireEvent, render, screen } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { createSeries } from './logic/game';
import Play from './Play.svelte';
import { ucGame } from './session';

const PAIRS = [{ a: 'Plage', b: 'Piscine' }];
const players = [
  { id: 'p1', name: 'Léa' },
  { id: 'p2', name: 'Hugo' },
  { id: 'p3', name: 'Tom' },
];

function seed() {
  const s = createSeries(players, false, PAIRS, () => 0);
  ucGame.set({ ...s, roles: { p1: 'civil', p2: 'civil', p3: 'undercover' } });
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  seed();
});
afterEach(() => {
  vi.useRealTimers();
  ucGame.set(null);
});

async function click(name: string) {
  vi.advanceTimersByTime(1000);
  await fireEvent.click(screen.getByRole('button', { name }));
}

test('distribution : le nom du premier joueur est affiché, aucun mot dans le DOM', () => {
  render(Play);
  expect(screen.getByText('Léa')).toBeInTheDocument();
  expect(document.body.textContent).not.toContain('Plage');
  expect(document.body.textContent).not.toContain('Piscine');
});

test('parcours court : distribution, vote, révélation, fin et scores', async () => {
  render(Play);
  for (let i = 0; i < 3; i++) {
    await click("C'est moi, voir mon mot");
    await click("J'ai retenu");
  }
  await click('Passer au vote');
  await click('Tom');
  await click('Oui, éliminer');
  expect(screen.getByText('Undercover')).toBeInTheDocument();
  await click('Continuer');
  expect(screen.getByText('Les civils gagnent !')).toBeInTheDocument();
  await click('Voir les scores');
  expect(get(ucGame)!.totals).toEqual({ p1: 2, p2: 2, p3: 0 });
});
