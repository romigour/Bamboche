import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { createSeries, type UndercoverState } from '../logic/game';
import words from '../words.json';
import GameEnd from './GameEnd.svelte';

beforeEach(() => vi.useFakeTimers({ toFake: ['Date'] }));
afterEach(() => vi.useRealTimers());

function state(over: Partial<UndercoverState> = {}): UndercoverState {
  const base = createSeries(
    ['p1', 'p2', 'p3', 'p4'].map((id, i) => ({ id, name: ['Tom', 'Léa', 'Inès', 'Max'][i] })),
    false,
    words,
  );
  return {
    ...base,
    civilWord: 'Plage',
    undercoverWord: 'Piscine',
    roles: { p1: 'civil', p2: 'civil', p3: 'civil', p4: 'undercover' },
    eliminated: ['p4'],
    winner: 'civils',
    gained: { p1: 2, p2: 2, p3: 2, p4: 0 },
    ...over,
  };
}

test('victoire des civils : titre, mots et points', () => {
  render(GameEnd, { s: state(), oncontinue: () => {} });
  expect(screen.getByText('Les civils gagnent !')).toBeInTheDocument();
  expect(screen.getByText('Plage')).toBeInTheDocument();
  expect(screen.getByText('Piscine')).toBeInTheDocument();
  expect(screen.getAllByText('+2')).toHaveLength(3);
  expect(screen.getByText('+0')).toBeInTheDocument();
});

test("un seul imposteur en jeu : « L'undercover gagne ! »", () => {
  render(GameEnd, { s: state({ winner: 'imposteurs', eliminated: [] }), oncontinue: () => {} });
  expect(screen.getByText("L'undercover gagne !")).toBeInTheDocument();
});

test('Mr White a trouvé le mot', () => {
  render(GameEnd, { s: state({ winner: 'mrwhite' }), oncontinue: () => {} });
  expect(screen.getByText('Mr White a trouvé le mot !')).toBeInTheDocument();
});

test('« Voir les scores » : ignoré juste après l’ouverture, accepté ensuite', async () => {
  const oncontinue = vi.fn();
  render(GameEnd, { s: state(), oncontinue });
  await fireEvent.click(screen.getByRole('button', { name: 'Voir les scores' }));
  expect(oncontinue).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1000);
  await fireEvent.click(screen.getByRole('button', { name: 'Voir les scores' }));
  expect(oncontinue).toHaveBeenCalledOnce();
});
