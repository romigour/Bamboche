import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { route } from '../../../lib/router';
import { createSheet, type Participant } from '../logic/sheet';
import { currentSheet, scoreHistory } from '../session';
import SheetScreen from './SheetScreen.svelte';

const solo = (id: string, name: string): Participant => ({ id, name, members: [name] });
const skyjo = () =>
  createSheet('skyjo', [solo('a', 'Léa'), solo('b', 'Tom'), solo('c', 'Inès')], 100, 1000, 's1');
const belote = () =>
  createSheet(
    'belote',
    [
      { id: 'a', name: 'Léa & Tom', members: ['Léa', 'Tom'] },
      { id: 'b', name: 'Inès & Max', members: ['Inès', 'Max'] },
    ],
    1000,
    1000,
    's2',
  );

async function type(...keys: string[]) {
  for (const k of keys) await fireEvent.click(screen.getAllByRole('button', { name: k }).at(-1)!); // le pavé suit le tableau
}
const next = () => fireEvent.click(screen.getByRole('button', { name: 'Suivant' }));
const pending = () => get(currentSheet)!.pending;

beforeEach(() => {
  currentSheet.set(null);
  scoreHistory.set([]);
  location.hash = '#/scores/partie';
});

describe('SheetScreen', () => {
  it('taper 1, 2, Suivant remplit Léa et passe à Tom', async () => {
    currentSheet.set(skyjo());
    render(SheetScreen);
    await type('1', '2');
    await next();
    expect(pending()[0]).toBe(12);
    expect(pending()[1]).toBeNull();
  });

  it('Suivant sur vide vaut 0', async () => {
    currentSheet.set(skyjo());
    render(SheetScreen);
    await next();
    expect(pending()[0]).toBe(0);
  });

  it('toucher une cellule passée puis taper corrige la valeur', async () => {
    currentSheet.set({ ...skyjo(), rounds: [[10, 20, 30]] });
    render(SheetScreen);
    await fireEvent.click(screen.getByRole('button', { name: /20/ }));
    await type('7');
    await next();
    expect(get(currentSheet)!.rounds[0]).toEqual([10, 7, 30]);
  });

  it('la fin atteinte propose le classement', async () => {
    currentSheet.set({ ...skyjo(), rounds: [[5, 5, 5]], pending: [1, 1, null] });
    render(SheetScreen);
    await type('1', '0', '0');
    await next();
    expect(screen.getByText('Inès a atteint 100 !')).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Continuer la feuille' }));
    expect(screen.queryByText('Inès a atteint 100 !')).not.toBeInTheDocument();
    await next();
    await next();
    await next();
    expect(screen.getByText('Inès a atteint 100 !')).toBeInTheDocument();
  });

  it('Voir le classement enregistre la partie', async () => {
    currentSheet.set({ ...skyjo(), pending: [1, 1, null] });
    render(SheetScreen);
    await type('1', '0', '0');
    await next();
    await fireEvent.click(screen.getByRole('button', { name: 'Voir le classement' }));
    expect(get(scoreHistory)).toHaveLength(1);
    expect(get(currentSheet)).toBeNull();
  });

  it('Belote : 162 − x est proposé et accepté par Suivant', async () => {
    currentSheet.set(belote());
    render(SheetScreen);
    await type('1', '0', '0');
    await next();
    await next();
    expect(get(currentSheet)!.rounds[0]).toEqual([100, 62]);
  });

  it('Belote : taper un chiffre remplace la proposition', async () => {
    currentSheet.set(belote());
    render(SheetScreen);
    await type('1', '0', '0');
    await next();
    await type('5');
    await next();
    expect(get(currentSheet)!.rounds[0]).toEqual([100, 5]);
  });

  it('Terminer est désactivé sans manche complète', async () => {
    currentSheet.set(skyjo());
    render(SheetScreen);
    await fireEvent.click(screen.getByRole('button', { name: 'Options' }));
    expect(screen.getByRole('button', { name: 'Terminer la partie' })).toBeDisabled();
  });

  it('Terminer avertit que la manche en cours ne sera pas comptée', async () => {
    currentSheet.set({ ...skyjo(), rounds: [[1, 2, 3]], pending: [4, null, null] });
    render(SheetScreen);
    await fireEvent.click(screen.getByRole('button', { name: 'Options' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Terminer la partie' }));
    expect(screen.getByText(/La manche en cours ne sera pas comptée/)).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Oui, terminer' }));
    expect(get(scoreHistory)[0].rounds).toEqual([[1, 2, 3]]);
  });

  it('Modifier la fin de partie met à jour la feuille', async () => {
    currentSheet.set(skyjo());
    render(SheetScreen);
    await fireEvent.click(screen.getByRole('button', { name: 'Options' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Plus' }));
    expect(get(currentSheet)!.endValue).toBe(110);
  });

  it('Supprimer la dernière manche retire la manche', async () => {
    currentSheet.set({ ...skyjo(), rounds: [[1, 2, 3]] });
    render(SheetScreen);
    await fireEvent.click(screen.getByRole('button', { name: 'Options' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Supprimer la dernière manche' }));
    expect(get(currentSheet)!.rounds).toEqual([]);
  });

  it('Abandonner vide la feuille et revient au sous-menu', async () => {
    currentSheet.set({ ...skyjo(), rounds: [[1, 2, 3]] });
    render(SheetScreen);
    await fireEvent.click(screen.getByRole('button', { name: 'Options' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Abandonner la partie' }));
    expect(screen.getByText('Abandonner la partie ? Rien ne sera enregistré.')).toBeInTheDocument();
    await fireEvent.click(screen.getByRole('button', { name: 'Oui, abandonner' }));
    expect(get(currentSheet)).toBeNull();
    expect(get(route).path).toBe('/scores');
  });
});
