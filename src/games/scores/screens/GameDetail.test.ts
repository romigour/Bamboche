import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { get } from 'svelte/store';
import type { FinishedGame } from '../logic/stats';
import { scoreHistory } from '../session';
import GameDetail from './GameDetail.svelte';

const game: FinishedGame = {
  version: 1,
  id: 'g1',
  gameId: 'skyjo',
  startedAt: 1,
  finishedAt: Date.UTC(2026, 10, 3, 12),
  endValue: 100,
  participants: [
    { id: 'a', name: 'Léa', members: ['Léa'] },
    { id: 'b', name: 'Tom', members: ['Tom'] },
  ],
  rounds: [
    [30, 5],
    [40, 10],
  ],
};

beforeEach(() => {
  location.hash = '#/scores/historique/partie?id=g1';
  scoreHistory.set([game]);
});

describe('GameDetail', () => {
  it('affiche le jeu, les manches, les totaux et le gagnant', () => {
    render(GameDetail, { id: 'g1' });
    expect(screen.getByRole('heading', { name: 'Skyjo' })).toBeInTheDocument();
    expect(screen.getByText('M2')).toBeInTheDocument();
    expect(screen.getByText('70')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('🏆 Tom')).toBeInTheDocument();
  });

  it('supprimer puis confirmer retire la partie et revient à l’historique', async () => {
    render(GameDetail, { id: 'g1' });
    await fireEvent.click(screen.getByRole('button', { name: 'Supprimer cette partie' }));
    expect(screen.getByText("Supprimer cette partie de l'historique ?")).toBeInTheDocument();
    expect(get(scoreHistory)).toHaveLength(1);
    await fireEvent.click(screen.getByRole('button', { name: 'Oui, supprimer' }));
    expect(get(scoreHistory)).toHaveLength(0);
    expect(location.hash).toBe('#/scores/historique?jeu=skyjo');
  });

  it('Annuler referme la confirmation', async () => {
    render(GameDetail, { id: 'g1' });
    await fireEvent.click(screen.getByRole('button', { name: 'Supprimer cette partie' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.queryByText("Supprimer cette partie de l'historique ?")).not.toBeInTheDocument();
    expect(get(scoreHistory)).toHaveLength(1);
  });

  it('id inconnu : retour à l’historique', () => {
    render(GameDetail, { id: 'nope' });
    expect(location.hash).toBe('#/scores/historique');
  });
});
