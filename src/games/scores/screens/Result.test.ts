import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { route } from '../../../lib/router';
import { createSheet } from '../logic/sheet';
import type { FinishedGame } from '../logic/stats';
import { currentSheet, scoreHistory } from '../session';
import Result from './Result.svelte';

const game: FinishedGame = {
  version: 1,
  id: 'g1',
  gameId: 'skyjo',
  startedAt: 1,
  finishedAt: 2,
  endValue: 100,
  participants: [
    { id: 'a', name: 'Léa', members: ['Léa'] },
    { id: 'b', name: 'Tom', members: ['Tom'] },
    { id: 'c', name: 'Inès', members: ['Inès'] },
  ],
  rounds: [
    [30, 5, 20],
    [40, 10, 15],
  ],
};

beforeEach(() => {
  currentSheet.set(null);
  scoreHistory.set([game]);
});

describe('Result', () => {
  it('Skyjo : le plus petit total est en tête', () => {
    render(Result, { id: 'g1' });
    expect(screen.getByRole('heading', { name: 'Tom !' })).toBeInTheDocument();
  });

  it('Rejouer démarre une nouvelle feuille vide avec les mêmes noms', async () => {
    render(Result, { id: 'g1' });
    await fireEvent.click(screen.getByRole('button', { name: /Rejouer/ }));
    const s = get(currentSheet)!;
    expect(s.participants.map((p) => p.name)).toEqual(['Léa', 'Tom', 'Inès']);
    expect(s.rounds).toEqual([]);
  });

  it('Rejouer avec une feuille en cours demande confirmation', async () => {
    const old = createSheet('flip7', [{ id: 'x', name: 'Zoé', members: ['Zoé'] }, { id: 'y', name: 'Max', members: ['Max'] }], 200, 1, 'old');
    currentSheet.set(old);
    render(Result, { id: 'g1' });
    await fireEvent.click(screen.getByRole('button', { name: /Rejouer/ }));
    expect(screen.getByText('La partie de Flip 7 en cours sera abandonnée.')).toBeInTheDocument();
    expect(get(currentSheet)!.id).toBe('old');
    await fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(get(currentSheet)!.id).toBe('old');
    await fireEvent.click(screen.getByRole('button', { name: /Rejouer/ }));
    await fireEvent.click(screen.getByRole('button', { name: 'Abandonner et commencer' }));
    const s = get(currentSheet)!;
    expect(s.id).not.toBe('old');
    expect(s.participants.map((p) => p.name)).toEqual(['Léa', 'Tom', 'Inès']);
  });

  it('une partie inconnue renvoie au sous-menu', () => {
    render(Result, { id: 'nope' });
    expect(get(route).path).toBe('/scores');
  });
});
