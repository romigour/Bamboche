import { fireEvent, render, screen } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { beforeEach, expect, test, vi } from 'vitest';
import { players } from '../../../lib/players';
import { animauxLevel } from '../setup';
import Setup from './Setup.svelte';

const joueurs = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `Joueur${i + 1}` }));
const READY = { ready: true, done: 20, total: 20, failed: 0, offline: false };
const jouer = () => screen.getByRole('button', { name: /Jouer/ });
const props = (over = {}) => ({ bank: READY, onstart: vi.fn(), onback: () => {}, oncredits: vi.fn(), onretry: () => {}, ...over });

beforeEach(() => animauxLevel.set('melange'));

test('1 joueur : message et Jouer désactivé', () => {
  players.set(joueurs(1));
  render(Setup, props());
  expect(screen.getByText('Il faut au moins 2 joueurs.')).toBeInTheDocument();
  expect(jouer()).toBeDisabled();
});

test('2 joueurs et banque prête : Jouer lance la partie', async () => {
  players.set(joueurs(2));
  const p = props();
  render(Setup, p);
  expect(screen.getByText('Joueur1')).toBeInTheDocument();
  expect(screen.getByText(/sans connexion/)).toBeInTheDocument();
  await fireEvent.click(jouer());
  expect(p.onstart).toHaveBeenCalledOnce();
});

test('choisir Expert change le niveau et son explication', async () => {
  players.set(joueurs(2));
  render(Setup, props());
  await fireEvent.click(screen.getByRole('button', { name: 'Expert' }));
  expect(get(animauxLevel)).toBe('expert');
  expect(screen.getByRole('button', { name: 'Expert' })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByText(/choix qui se ressemblent/)).toBeInTheDocument();
});

test('téléchargement en cours : progression et Jouer désactivé', () => {
  players.set(joueurs(3));
  render(Setup, props({ bank: { ready: false, done: 12, total: 40, failed: 0, offline: false } }));
  expect(screen.getByText('Téléchargement des sons… 12 / 40')).toBeInTheDocument();
  expect(jouer()).toBeDisabled();
});

test('banque incomplète hors ligne : message de connexion', () => {
  players.set(joueurs(3));
  render(Setup, props({ bank: { ready: false, done: 0, total: 40, failed: 0, offline: true } }));
  expect(screen.getByText('Connexion requise pour télécharger les sons la première fois.')).toBeInTheDocument();
  expect(jouer()).toBeDisabled();
});

test('des sons en échec : bouton Réessayer', async () => {
  players.set(joueurs(3));
  const p = props({ bank: { ready: true, done: 40, total: 40, failed: 2, offline: false } });
  render(Setup, p);
  expect(screen.getByText('2 fichiers n’ont pas pu être téléchargés.')).toBeInTheDocument();
  await fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
  expect(jouer()).toBeEnabled();
});

test('le lien Crédits ouvre les crédits', async () => {
  players.set(joueurs(2));
  const p = props();
  render(Setup, p);
  await fireEvent.click(screen.getByRole('button', { name: 'Crédits des sons et photos' }));
  expect(p.oncredits).toHaveBeenCalledOnce();
});
