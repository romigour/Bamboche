import { fireEvent, render, screen } from '@testing-library/svelte';
import { expect, test, vi } from 'vitest';
import Duplicates from './Duplicates.svelte';

const team = { id: 'B', name: 'Les Pingouins', color: 'hipster' as const, playerIds: [] };
const dup = { teamId: 'B', index: 0, word: 'asterix', sameAs: 'Astérix' };

test('un remplaçant déjà pris est refusé', async () => {
  const onreplace = vi.fn();
  render(Duplicates, { team, dup, remaining: 1, taken: new Set(['asterix', 'tour eiffel']), onreplace });
  await fireEvent.input(screen.getByLabelText('Nouveau mot'), { target: { value: 'Tour  Eiffel !' } });
  expect(screen.getByText('Celui-là aussi est déjà pris !')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Remplacer' })).toBeDisabled();
});

test('un remplaçant libre est accepté', async () => {
  const onreplace = vi.fn();
  render(Duplicates, { team, dup, remaining: 1, taken: new Set(['asterix']), onreplace });
  await fireEvent.input(screen.getByLabelText('Nouveau mot'), { target: { value: ' Obélix ' } });
  await fireEvent.click(screen.getByRole('button', { name: 'Remplacer' }));
  expect(onreplace).toHaveBeenCalledWith('Obélix');
});
