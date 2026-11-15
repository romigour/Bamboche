import { expect, test } from 'vitest';
import { rankScores } from './ranking';

test('classement décroissant, ex æquo au même rang', () => {
  expect(rankScores([{ id: 'c', total: 2 }, { id: 'a', total: 5 }, { id: 'b', total: 5 }])).toEqual([
    { id: 'a', total: 5, rank: 1 },
    { id: 'b', total: 5, rank: 1 },
    { id: 'c', total: 2, rank: 3 },
  ]);
});
