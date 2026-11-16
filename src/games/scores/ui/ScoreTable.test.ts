import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ScoreTable from './ScoreTable.svelte';

const participants = [
  { id: 'a', name: 'Léa', members: ['Léa'] },
  { id: 'b', name: 'Tom', members: ['Tom'] },
];

describe('ScoreTable', () => {
  it('affiche les totaux des manches complètes seulement', () => {
    render(ScoreTable, { participants, rounds: [[10, 20], [5, 1]], pending: [7, null] });
    const rows = screen.getAllByRole('row');
    expect(rows[1].textContent).toContain('15');
    expect(rows[2].textContent).toContain('21');
    expect(rows[1].textContent).not.toContain('22');
  });

  it('un clic sur une cellule remplie appelle onselect', async () => {
    const onselect = vi.fn();
    render(ScoreTable, { participants, rounds: [[10, 20]], onselect });
    await fireEvent.click(screen.getByRole('button', { name: /20/ }));
    expect(onselect).toHaveBeenCalledWith({ round: 0, index: 1 });
  });

  it('la cellule du curseur affiche le brouillon et a aria-current', () => {
    render(ScoreTable, {
      participants, rounds: [[10, 20]], pending: [null, null],
      cursor: { round: 1, index: 0 }, draft: '42',
    });
    const cell = document.querySelector('[aria-current="true"]')!;
    expect(cell.textContent).toContain('42');
  });

  it('affiche un point sans brouillon', () => {
    render(ScoreTable, { participants, rounds: [], pending: [null, null], cursor: { round: 0, index: 1 }, draft: '' });
    expect(document.querySelector('[aria-current="true"]')!.textContent).toContain('·');
  });

  it('sans onselect, aucune cellule n’est un bouton', () => {
    render(ScoreTable, { participants, rounds: [[10, 20]] });
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });
});
