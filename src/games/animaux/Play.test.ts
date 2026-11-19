import { fireEvent, render, screen } from '@testing-library/svelte';
import { get } from 'svelte/store';
import { beforeEach, expect, test, vi } from 'vitest';
import { save } from '../../lib/storage';
import { ANIMALS, fakePlayer, game } from './screens/fixtures';

vi.mock('./catalog', async () => {
  const { ANIMALS: list } = await import('./screens/fixtures');
  return { animals: list, animalById: (id: string) => list.find((a) => a.id === id) };
});
const player = fakePlayer();
vi.mock('./audio', () => ({ animalPlayer: () => player }));

const { animauxGame } = await import('./session');
const Play = (await import('./Play.svelte')).default;

beforeEach(() => {
  animauxGame.set(null);
  localStorage.clear();
});

const answerAllWith = async (name: string) => {
  for (const p of ['Léa', 'Tom', 'Max']) await fireEvent.click(screen.getByRole('button', { name: `${p} : ${name}` }));
};

test('une partie sauvegardée reprend au même son', () => {
  save('animaux:game', game({ current: 1 }));
  render(Play);
  expect(screen.getByText('Son 2 / 2')).toBeInTheDocument();
  expect(get(animauxGame)?.current).toBe(1);
});

test('répondre pour tous puis Révéler montre la réponse, puis le son suivant', async () => {
  animauxGame.set(game());
  render(Play);
  await answerAllWith('Chouette');
  await fireEvent.click(screen.getByRole('button', { name: /Révéler/ }));
  expect(screen.getByRole('img', { name: 'Chouette' })).toBeInTheDocument();
  expect(get(animauxGame)?.phase).toBe('reveal');
  await new Promise((r) => setTimeout(r, 450));
  await fireEvent.click(screen.getByRole('button', { name: /Son suivant/ }));
  expect(screen.getByText('Son 2 / 2')).toBeInTheDocument();
});

test('après le dernier son : le podium', async () => {
  animauxGame.set(game({ current: 1 }));
  render(Play);
  await answerAllWith('Loup');
  await fireEvent.click(screen.getByRole('button', { name: /Révéler/ }));
  await new Promise((r) => setTimeout(r, 450));
  await fireEvent.click(screen.getByRole('button', { name: /Voir le podium/ }));
  expect(get(animauxGame)?.phase).toBe('podium');
  expect(screen.getByRole('button', { name: /Rejouer/ })).toBeInTheDocument();
});

test('la pause montre les scores et permet de reprendre', async () => {
  animauxGame.set(game());
  render(Play);
  await fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
  expect(screen.getByRole('dialog', { name: 'Pause' })).toBeInTheDocument();
  await fireEvent.click(screen.getByRole('button', { name: /Reprendre/ }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(ANIMALS).toHaveLength(4);
});
