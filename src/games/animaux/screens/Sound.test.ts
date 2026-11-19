import { fireEvent, render, screen } from '@testing-library/svelte';
import { expect, test, vi } from 'vitest';
import { ANIMALS, fakePlayer, game } from './fixtures';
import Sound from './Sound.svelte';

const props = (over = {}) => ({
  s: game(),
  options: ANIMALS,
  player: fakePlayer(),
  soundUrl: 'animaux/chouette.mp3',
  onanswer: vi.fn(),
  onreveal: vi.fn(),
  onskip: vi.fn(),
  onpause: vi.fn(),
  ...over,
});
const withAnswers = (answers: Record<string, string>) => {
  const g = game();
  g.rounds[0] = { ...g.rounds[0], answers };
  return g;
};

test('affiche les propositions, le numéro du son et une ligne par joueur', () => {
  render(Sound, props());
  for (const n of ['Hibou', 'Loup', 'Chouette', 'Chat']) expect(screen.getByText(n)).toBeInTheDocument();
  expect(screen.getByText('Son 1 / 2')).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /^Léa : / })).toHaveLength(4);
  expect(screen.getAllByRole('button', { name: /^Max : / })).toHaveLength(4);
});

test('toucher une lettre enregistre la réponse du joueur', async () => {
  const p = props();
  render(Sound, p);
  await fireEvent.click(screen.getByRole('button', { name: 'Tom : Chouette' }));
  expect(p.onanswer).toHaveBeenCalledWith('b', 'chouette');
});

test('Révéler reste désactivé tant qu’il manque une réponse', () => {
  render(Sound, props({ s: withAnswers({ a: 'loup', b: 'chat' }) }));
  expect(screen.getByText('Il manque 1 réponse')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Révéler/ })).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Léa : Loup' })).toHaveAttribute('aria-pressed', 'true');
});

test('toutes les réponses : Révéler actif', async () => {
  const p = props({ s: withAnswers({ a: 'loup', b: 'chat', c: 'hibou' }) });
  render(Sound, p);
  await fireEvent.click(screen.getByRole('button', { name: /Révéler/ }));
  expect(p.onreveal).toHaveBeenCalledOnce();
});

test('rien dans l’écran ne désigne la bonne réponse', () => {
  const { container } = render(Sound, props());
  expect(container.querySelector('img')).toBeNull();
  expect(container.innerHTML).not.toContain('chouette.mp3');
  expect(container.innerHTML).not.toContain('chouette.webp');
});

test('lecture au toucher ; si le navigateur refuse, le bouton invite à toucher', async () => {
  const player = fakePlayer(async () => {
    throw new Error('NotAllowedError');
  });
  render(Sound, props({ player }));
  await fireEvent.click(screen.getByRole('button', { name: 'Écouter le cri' }));
  expect(player.play).toHaveBeenCalledWith('animaux/chouette.mp3');
  expect(await screen.findByRole('button', { name: 'Touche pour écouter' })).toBeEnabled();
});

test('à plus de 4 joueurs aussi, un son bloqué est signalé à l’écran', async () => {
  const player = fakePlayer(async () => {
    throw new Error('NotAllowedError');
  });
  const many = game({ players: ['Léa', 'Tom', 'Max', 'Inès', 'Hugo', 'Sam'].map((name, i) => ({ id: `p${i}`, name, color: 'ok' as const })) });
  render(Sound, props({ s: many, player }));
  expect(screen.queryByText(/Le son est bloqué/)).toBeNull();
  await fireEvent.click(screen.getByRole('button', { name: 'Écouter le cri' }));
  expect(await screen.findByText(/Le son est bloqué/)).toBeInTheDocument();
});

test('après une première écoute, le bouton propose de réécouter', async () => {
  render(Sound, props());
  await fireEvent.click(screen.getByRole('button', { name: 'Écouter le cri' }));
  expect(await screen.findByRole('button', { name: 'Réécouter le cri' })).toBeInTheDocument();
});

test('son introuvable : message et bouton pour passer', async () => {
  const player = fakePlayer();
  const p = props({ player });
  render(Sound, p);
  player.fail();
  expect(await screen.findByText('Son introuvable')).toBeInTheDocument();
  await fireEvent.click(screen.getByRole('button', { name: 'Passer ce son' }));
  expect(p.onskip).toHaveBeenCalledOnce();
});

test('le bouton pause ouvre la pause', async () => {
  const p = props();
  render(Sound, p);
  await fireEvent.click(screen.getByRole('button', { name: 'Pause' }));
  expect(p.onpause).toHaveBeenCalledOnce();
});
