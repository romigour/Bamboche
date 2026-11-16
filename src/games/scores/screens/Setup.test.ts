import { fireEvent, render, screen } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { beforeEach, describe, expect, it } from 'vitest';
import { players } from '../../../lib/players';
import { currentSheet } from '../session';
import Setup from './Setup.svelte';

const joueurs = (...noms: string[]) => noms.map((name, i) => ({ id: `p${i}`, name }));
const lancer = () => screen.getByRole('button', { name: /C'est parti/ });
const caseDe = (n: string) => screen.getByRole('checkbox', { name: n });

beforeEach(() => {
  currentSheet.set(null);
  localStorage.clear();
  location.hash = '#/scores/nouvelle';
});

describe('Setup', () => {
  it('3 joueurs cochés : lance une feuille à 3 participants, fin à 100', async () => {
    players.set(joueurs('Léa', 'Tom', 'Inès'));
    render(Setup, { gameId: 'skyjo' });
    expect(caseDe('Léa')).toBeChecked();
    expect(lancer()).toBeEnabled();
    await fireEvent.click(lancer());
    const s = get(currentSheet)!;
    expect(s.gameId).toBe('skyjo');
    expect(s.participants.map((p) => p.name)).toEqual(['Léa', 'Tom', 'Inès']);
    expect(s.endValue).toBe(100);
    expect(location.hash).toBe('#/scores/partie');
  });

  it('décocher deux joueurs sur trois : il faut au moins 2 joueurs', async () => {
    players.set(joueurs('Léa', 'Tom', 'Inès'));
    render(Setup, { gameId: 'skyjo' });
    await fireEvent.click(caseDe('Tom'));
    await fireEvent.click(caseDe('Inès'));
    expect(screen.getByText('Il faut au moins 2 joueurs.')).toBeInTheDocument();
    expect(lancer()).toBeDisabled();
  });

  it('Léa et lea : conflit de prénoms', () => {
    players.set(joueurs('Léa', 'lea', 'Tom'));
    render(Setup, { gameId: 'skyjo' });
    expect(screen.getByText("Deux joueurs s'appellent lea : ajoute une initiale.")).toBeInTheDocument();
    expect(lancer()).toBeDisabled();
  });

  it('Belote à 4 : équipes en alternance', async () => {
    players.set(joueurs('Joueur1', 'Joueur2', 'Joueur3', 'Joueur4'));
    render(Setup, { gameId: 'belote' });
    expect(lancer()).toBeEnabled();
    await fireEvent.click(lancer());
    const s = get(currentSheet)!;
    expect(s.participants.map((p) => p.name)).toEqual(['Joueur1 & Joueur3', 'Joueur2 & Joueur4']);
    expect(s.participants[0].members).toEqual(['Joueur1', 'Joueur3']);
    expect(s.endValue).toBe(1000);
  });

  it('Belote à 5 cochés : la belote se joue à 4', () => {
    players.set(joueurs('A', 'B', 'C', 'D', 'E'));
    render(Setup, { gameId: 'belote' });
    expect(screen.getByText('La belote se joue à 4 joueurs.')).toBeInTheDocument();
    expect(lancer()).toBeDisabled();
  });

  it('Belote : équipes 3 + 1 refusées', async () => {
    players.set(joueurs('A', 'B', 'C', 'D'));
    render(Setup, { gameId: 'belote' });
    await fireEvent.click(screen.getAllByRole('button', { name: 'Équipe 1' })[1]); // B passe en équipe 1
    expect(screen.getByText('Chaque équipe doit avoir 2 joueurs.')).toBeInTheDocument();
    expect(lancer()).toBeDisabled();
  });

  it('ajouter un joueur le coche', async () => {
    players.set(joueurs('Léa', 'Tom'));
    render(Setup, { gameId: 'skyjo' });
    await fireEvent.input(screen.getByLabelText('Ajouter un joueur'), { target: { value: 'Inès' } });
    await fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
    expect(caseDe('Inès')).toBeChecked();
    expect(get(players).map((p) => p.name)).toContain('Inès');
  });

  it('jeu inconnu : retour au sous-menu', () => {
    location.hash = '#/scores/nouvelle?jeu=zzz';
    render(Setup, { gameId: 'zzz' });
    expect(location.hash).toBe('#/scores');
  });
});
