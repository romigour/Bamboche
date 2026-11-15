import { fireEvent, render, screen } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { beforeEach, expect, test, vi } from 'vitest';
import { players } from '../../../lib/players';
import { mrWhiteOn } from '../setup';
import Setup from './Setup.svelte';

const joueurs = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `Joueur${i + 1}` }));
const lancer = () => screen.getByRole('button', { name: /Lancer/ });

beforeEach(() => {
  mrWhiteOn.set(false);
});

test('5 joueurs sans Mr White : composition et lancement', async () => {
  players.set(joueurs(5));
  const onstart = vi.fn();
  render(Setup, { onstart, onback: () => {} });
  expect(screen.getByText('1 undercover · 4 civils')).toBeInTheDocument();
  expect(lancer()).toBeEnabled();
  await fireEvent.click(lancer());
  expect(onstart).toHaveBeenCalledOnce();
});

test('3 joueurs avec Mr White : erreur et Lancer désactivé', async () => {
  players.set(joueurs(3));
  render(Setup, { onstart: () => {}, onback: () => {} });
  await fireEvent.click(screen.getByRole('button', { name: 'Oui' }));
  expect(screen.getByText('Avec Mr White, il faut au moins 4 joueurs.')).toBeInTheDocument();
  expect(lancer()).toBeDisabled();
  expect(get(mrWhiteOn)).toBe(true);
});

test('5 joueurs avec Mr White : la composition l’indique', () => {
  players.set(joueurs(5));
  mrWhiteOn.set(true);
  render(Setup, { onstart: () => {}, onback: () => {} });
  expect(screen.getByText('1 undercover · 1 Mr White · 3 civils')).toBeInTheDocument();
});

test('2 joueurs : message et Lancer désactivé', () => {
  players.set(joueurs(2));
  render(Setup, { onstart: () => {}, onback: () => {} });
  expect(screen.getByText('Il faut au moins 3 joueurs.')).toBeInTheDocument();
  expect(lancer()).toBeDisabled();
});
