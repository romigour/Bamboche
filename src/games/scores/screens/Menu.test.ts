import { fireEvent, render, screen } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { beforeEach, describe, expect, it } from 'vitest';
import { createSheet } from '../logic/sheet';
import { currentSheet } from '../session';
import Menu from './Menu.svelte';

const solo = (id: string, name: string) => ({ id, name, members: [name] });

beforeEach(() => {
  currentSheet.set(null);
  location.hash = '#/scores';
});

describe('Menu', () => {
  it('liste les 5 jeux', () => {
    render(Menu);
    for (const n of ['Mille Sabords', 'Les Cinq Rois', 'Skyjo', 'Flip 7', 'Belote']) {
      expect(screen.getByText(n)).toBeInTheDocument();
    }
  });

  it('sans feuille, toucher Skyjo ouvre la préparation', async () => {
    render(Menu);
    await fireEvent.click(screen.getByRole('button', { name: /Skyjo/ }));
    expect(location.hash).toBe('#/scores/nouvelle?jeu=skyjo');
  });

  it('avec une feuille, propose de la reprendre avec les totaux', async () => {
    const s = createSheet('flip7', [solo('a', 'Léa'), solo('b', 'Tom')], 200, 1, 's1');
    currentSheet.set({ ...s, rounds: [[10, 1200]] });
    render(Menu);
    expect(screen.getByText('Reprendre : Flip 7')).toBeInTheDocument();
    expect(screen.getByText('Manche 2 · Léa 10 – Tom 1 200')).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: /Reprendre/ }));
    expect(location.hash).toBe('#/scores/partie');
  });

  it('avec une feuille, toucher Skyjo ouvre la préparation sans toucher à la feuille', async () => {
    currentSheet.set(createSheet('flip7', [solo('a', 'Léa'), solo('b', 'Tom')], 200, 1, 's1'));
    render(Menu);
    await fireEvent.click(screen.getByRole('button', { name: /Skyjo/ }));
    expect(location.hash).toBe('#/scores/nouvelle?jeu=skyjo');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(get(currentSheet)).not.toBeNull();
  });

  it('Historique et bilans mène à l’historique', async () => {
    render(Menu);
    await fireEvent.click(screen.getByRole('button', { name: 'Historique et bilans' }));
    expect(location.hash).toBe('#/scores/historique');
  });
});
