import { render, screen } from '@testing-library/svelte';
import { expect, test, vi } from 'vitest';
import PodiumView from './PodiumView.svelte';

test('deux premiers ex æquo : égalité en tête', () => {
  render(PodiumView, {
    ranking: [
      { id: 'a', name: 'Léa', color: 'blindtest', total: 7, rank: 1 },
      { id: 'b', name: 'Hugo', color: 'hipster', total: 7, rank: 1 },
      { id: 'c', name: 'Tom', color: 'ok', total: 3, rank: 3 },
    ],
    onreplay: vi.fn(),
    onhome: vi.fn(),
  });
  expect(screen.getByText('Égalité parfaite en tête !')).toBeInTheDocument();
  expect(screen.getByText('Léa et Hugo !')).toBeInTheDocument();
});
