import { render, screen } from '@testing-library/svelte';
import { expect, test } from 'vitest';
import { blindtest } from '../../games/blindtest/module';
import GameCard from './GameCard.svelte';

test('une note remplace le nombre de joueurs', () => {
  render(GameCard, { game: blindtest, note: 'Connexion requise' });
  expect(screen.getByText('Connexion requise')).toBeInTheDocument();
  expect(screen.queryByText(/joueurs et \+/)).toBeNull();
});
