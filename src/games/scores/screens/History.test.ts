import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import type { FinishedGame } from '../logic/stats';
import { scoreHistory } from '../session';
import History from './History.svelte';

const game = (id: string, gameId: FinishedGame['gameId'], finishedAt: number, names: string[], rounds: number[][]): FinishedGame => ({
  version: 1,
  id,
  gameId,
  startedAt: finishedAt - 1000,
  finishedAt,
  endValue: 100,
  participants: names.map((n, i) => ({ id: `${id}-${i}`, name: n, members: [n] })),
  rounds,
});

beforeEach(() => {
  location.hash = '#/scores/historique';
  scoreHistory.set([
    game('g1', 'skyjo', Date.UTC(2026, 10, 1, 12), ['Léa', 'Tom'], [[30, 5]]),
    game('g2', 'skyjo', Date.UTC(2026, 10, 3, 12), ['léa', 'Inès'], [[10, 40]]),
    game('g3', 'flip7', Date.UTC(2026, 10, 10, 12), ['Léa', 'Tom'], [[50, 20]]),
  ]);
});

describe('History', () => {
  it('par défaut, le jeu de la partie la plus récente', () => {
    render(History);
    expect(screen.getByRole('button', { name: 'Flip 7' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('Bilans · 1 partie')).toBeInTheDocument();
  });

  it('gameId fourni : bilans du jeu, Léa et léa en une seule ligne', () => {
    render(History, { gameId: 'skyjo' });
    expect(screen.getByText('Bilans · 2 parties')).toBeInTheDocument();
    expect(screen.getAllByText(/^\d\. /)).toHaveLength(3);
    expect(screen.getByText('2. léa')).toBeInTheDocument();
    expect(screen.getByText('1 victoire / 2')).toBeInTheDocument();
    expect(screen.getByText('50 %')).toBeInTheDocument();
  });

  it('liste les parties de la plus récente à la plus ancienne avec le gagnant', () => {
    render(History, { gameId: 'skyjo' });
    const rows = screen.getAllByRole('button', { name: /🏆/ });
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent('léa 10 – Inès 40');
    expect(rows[0]).toHaveTextContent('🏆 léa');
    expect(rows[1]).toHaveTextContent('Léa 30 – Tom 5');
    expect(rows[1]).toHaveTextContent('🏆 Tom');
  });

  it('toucher une partie ouvre son détail', async () => {
    render(History, { gameId: 'skyjo' });
    await fireEvent.click(screen.getAllByRole('button', { name: /🏆/ })[0]);
    expect(location.hash).toBe('#/scores/historique/partie?id=g2');
  });

  it('changer de pastille met à jour ?jeu= ; Belote est vide', async () => {
    render(History);
    await fireEvent.click(screen.getByRole('button', { name: 'Belote' }));
    expect(location.hash).toBe('#/scores/historique?jeu=belote');
    expect(screen.getByText("Aucune partie de Belote terminée pour l'instant.")).toBeInTheDocument();
  });

  it('sans historique, Mille Sabords', () => {
    scoreHistory.set([]);
    render(History);
    expect(screen.getByRole('button', { name: 'Sabords' })).toHaveAttribute('aria-pressed', 'true');
  });
});
