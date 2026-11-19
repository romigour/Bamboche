import { fireEvent, render, screen } from '@testing-library/svelte';
import { expect, test, vi } from 'vitest';
import { reveal } from '../logic/game';
import { ANIMALS, fakePlayer, game } from './fixtures';
import Reveal from './Reveal.svelte';

const revealed = (answers: Record<string, string>, current = 0) => {
  const g = game({ current });
  g.rounds[current] = { ...g.rounds[current], answers };
  return reveal(g);
};

test('montre la photo, le nom, qui a trouvé et les réponses des autres', () => {
  render(Reveal, {
    s: revealed({ a: 'chouette', b: 'hibou', c: 'chouette' }),
    animal: ANIMALS[2],
    options: ANIMALS,
    player: fakePlayer(),
    onnext: () => {},
  });
  expect(screen.getByRole('img', { name: 'Chouette' })).toHaveAttribute('src', 'animaux/chouette.webp');
  expect(screen.getByRole('heading', { name: /Chouette/ })).toBeInTheDocument();
  expect(screen.getByText('Léa +1')).toBeInTheDocument();
  expect(screen.getByText('Max +1')).toBeInTheDocument();
  expect(screen.getByText('Tom : Hibou')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Son suivant/ })).toBeInTheDocument();
});

test('personne n’a trouvé', () => {
  render(Reveal, {
    s: revealed({ a: 'loup', b: 'hibou', c: 'chat' }),
    animal: ANIMALS[2],
    options: ANIMALS,
    player: fakePlayer(),
    onnext: () => {},
  });
  expect(screen.getByText("Personne n'a trouvé")).toBeInTheDocument();
});

test('au dernier son : Voir le podium ; réécouter rejoue le cri', async () => {
  const onnext = vi.fn();
  const player = fakePlayer();
  render(Reveal, { s: revealed({ a: 'loup', b: 'loup', c: 'loup' }, 1), animal: ANIMALS[1], options: ANIMALS, player, onnext });
  await fireEvent.click(screen.getByRole('button', { name: 'Réécouter le cri' }));
  expect(player.play).toHaveBeenCalledWith('animaux/loup.mp3');
  await new Promise((r) => setTimeout(r, 450));
  await fireEvent.click(screen.getByRole('button', { name: /Voir le podium/ }));
  expect(onnext).toHaveBeenCalledOnce();
});
