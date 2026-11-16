import { describe, expect, it } from 'vitest';
import type { ScoreGameId } from '../defs';
import type { Participant } from './sheet';
import { nameConflict, playerStats, winners, type FinishedGame } from './stats';

const solo = (id: string, name: string): Participant => ({ id, name, members: [name] });

function game(
  id: string,
  gameId: ScoreGameId,
  finishedAt: number,
  participants: Participant[],
  rounds: number[][],
): FinishedGame {
  return { version: 1, id, gameId, startedAt: finishedAt - 1000, finishedAt, endValue: 100, participants, rounds };
}

describe('winners', () => {
  it('renvoie les ex æquo en tête', () => {
    const g = game('a', 'skyjo', 1, [solo('p1', 'Léa'), solo('p2', 'Tom'), solo('p3', 'Zoé')], [[5, 5, 9]]);
    expect(winners(g)).toEqual(['p1', 'p2']);
  });
});

describe('playerStats', () => {
  it('Léa et léa sont la même personne', () => {
    const h = [
      game('a', 'skyjo', 10, [solo('p1', 'Léa'), solo('p2', 'Tom')], [[1, 9]]),
      game('b', 'skyjo', 20, [solo('p1', 'léa'), solo('p2', 'Tom')], [[9, 1]]),
    ];
    const lea = playerStats(h, 'skyjo').filter((s) => s.key === 'lea');
    expect(lea).toHaveLength(1);
    expect(lea[0].played).toBe(2);
    expect(lea[0].name).toBe('léa');
  });

  it('accents et espaces ignorés', () => {
    const h = [
      game('a', 'skyjo', 10, [solo('p1', 'Inès'), solo('p2', 'Tom')], [[1, 9]]),
      game('b', 'skyjo', 20, [solo('p1', 'ines  '), solo('p2', 'Tom')], [[1, 9]]),
    ];
    const stats = playerStats(h, 'skyjo');
    expect(stats.filter((s) => s.key === 'ines')).toHaveLength(1);
    expect(stats.find((s) => s.key === 'ines')?.played).toBe(2);
  });

  it('ex æquo en tête : victoire pour chacun', () => {
    const h = [game('a', 'skyjo', 10, [solo('p1', 'Léa'), solo('p2', 'Tom'), solo('p3', 'Zoé')], [[5, 5, 9]])];
    const stats = playerStats(h, 'skyjo');
    expect(stats.find((s) => s.key === 'lea')?.wins).toBe(1);
    expect(stats.find((s) => s.key === 'tom')?.wins).toBe(1);
    expect(stats.find((s) => s.key === 'zoe')?.wins).toBe(0);
  });

  it("Belote : la victoire de l'équipe compte pour ses deux joueurs", () => {
    const eq1: Participant = { id: 'e1', name: 'Léa & Tom', members: ['Léa', 'Tom'] };
    const eq2: Participant = { id: 'e2', name: 'Zoé & Max', members: ['Zoé', 'Max'] };
    const stats = playerStats([game('a', 'belote', 10, [eq1, eq2], [[100, 52]])], 'belote');
    const wins = Object.fromEntries(stats.map((s) => [s.key, s.wins]));
    expect(wins).toEqual({ lea: 1, tom: 1, zoe: 0, max: 0 });
  });

  it('tri et pourcentage', () => {
    const h: FinishedGame[] = [];
    // Léa : 8 victoires sur 12 ; Tom : 3 sur 9 (parties disjointes pour le décompte)
    for (let i = 0; i < 12; i++) {
      h.push(game(`l${i}`, 'skyjo', i, [solo('p1', 'Léa'), solo('p2', 'Zed')], i < 8 ? [[1, 9]] : [[9, 1]]));
    }
    for (let i = 0; i < 9; i++) {
      h.push(game(`t${i}`, 'skyjo', 100 + i, [solo('p1', 'Tom'), solo('p2', 'Yan')], i < 3 ? [[1, 9]] : [[9, 1]]));
    }
    const stats = playerStats(h, 'skyjo');
    const lea = stats.find((s) => s.key === 'lea')!;
    const tom = stats.find((s) => s.key === 'tom')!;
    expect(lea).toMatchObject({ played: 12, wins: 8, pct: 67 });
    expect(tom).toMatchObject({ played: 9, wins: 3, pct: 33 });
    expect(stats.indexOf(lea)).toBeLessThan(stats.indexOf(tom));
  });

  it('seules les parties du jeu demandé comptent', () => {
    const h = [
      game('a', 'skyjo', 10, [solo('p1', 'Léa'), solo('p2', 'Tom')], [[1, 9]]),
      game('b', 'flip7', 20, [solo('p1', 'Léa'), solo('p2', 'Max')], [[1, 9]]),
    ];
    const stats = playerStats(h, 'skyjo');
    expect(stats.map((s) => s.key).sort()).toEqual(['lea', 'tom']);
    expect(stats.find((s) => s.key === 'lea')?.played).toBe(1);
  });
});

describe('nameConflict', () => {
  it('renvoie la 2e occurrence en double', () => {
    expect(nameConflict(['Léa', 'Tom', 'lea'])).toBe('lea');
  });
  it('renvoie null sans doublon', () => {
    expect(nameConflict(['Léa', 'Tom'])).toBeNull();
  });
});
