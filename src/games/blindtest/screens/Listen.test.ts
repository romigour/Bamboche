import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, expect, test, vi } from 'vitest';
import { createBlindtest } from '../logic/game';
import type { MusicSource } from '../music/source';
import type { Track } from '../types';
import Listen from './Listen.svelte';

function fakeSource() {
  const errors = new Set<() => void>();
  const src: MusicSource & { fail(): void } = {
    play: vi.fn(async () => {}),
    preload: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    positionMs: () => 0,
    playing: () => true,
    onEnded: () => () => {},
    onError: (cb) => {
      errors.add(cb);
      return () => errors.delete(cb);
    },
    fail: () => errors.forEach((cb) => cb()),
  };
  return src;
}

const s = createBlindtest(
  [
    { id: 'A', name: 'Léa', color: 'blindtest', playerIds: ['a'] },
    { id: 'B', name: 'Hugo', color: 'hipster', playerIds: ['b'] },
  ],
  [
    { id: 'a', name: 'Léa' },
    { id: 'b', name: 'Hugo' },
  ],
  ['t0', 't1', 's0'],
  'hits-de-toujours',
  { tracks: 2, listenSeconds: 20 },
);
const track: Track = {
  id: 't0', title: 'Poker Face', displayTitle: 'Poker Face', artists: ['Lady Gaga'], album: 'The Fame', year: 2008,
  cover: '', preview: 'https://p/0', durationMs: 30000, isrc: '', popularity: 0,
};

afterEach(() => {
  window.dispatchEvent(new Event('online'));
  vi.useRealTimers();
});

/** Laisse passer le temps mort d'ouverture de l'écran (anti double tap d'un écran à l'autre). */
function later() {
  vi.setSystemTime(Date.now() + 1000);
}

function setup() {
  vi.useFakeTimers({ toFake: ['Date'] });
  const source = fakeSource();
  const props = { s, track, playlistName: 'Hits de toujours', source, onaward: vi.fn(), onskip: vi.fn(), onquit: vi.fn(), onhome: vi.fn() };
  render(Listen, props);
  return props;
}

test('double tap sur un joueur : un seul point attribué, et la musique s’arrête', async () => {
  const { onaward, source } = setup();
  const btn = screen.getByRole('button', { name: 'Léa' });
  later();
  await fireEvent.click(btn);
  await fireEvent.click(btn);
  expect(onaward).toHaveBeenCalledOnce();
  expect(onaward).toHaveBeenCalledWith('A');
  expect(source.stop).toHaveBeenCalled();
});

test('« Personne n’a trouvé » attribue à personne', async () => {
  const { onaward } = setup();
  later();
  await fireEvent.click(screen.getByRole('button', { name: /Personne/ }));
  expect(onaward).toHaveBeenCalledWith(null);
});

test('extrait indisponible avec réseau : message et passage au suivant', async () => {
  const { source, onskip } = setup();
  source.fail();
  await Promise.resolve();
  expect(await screen.findByText('Extrait indisponible, on passe au suivant')).toBeInTheDocument();
  expect(onskip).toHaveBeenCalledOnce();
});

test('échec sans réseau : écran « Connexion requise », pas de saut', async () => {
  const { source, onskip } = setup();
  window.dispatchEvent(new Event('offline'));
  source.fail();
  expect(await screen.findByText('Connexion requise pour la musique')).toBeInTheDocument();
  expect(onskip).not.toHaveBeenCalled();
});

test('un tap juste à l’ouverture de l’écran est ignoré (double tap venu de l’écran précédent)', async () => {
  const { onaward } = setup();
  await fireEvent.click(screen.getByRole('button', { name: /Personne/ }));
  expect(onaward).not.toHaveBeenCalled();
});

test('deux échecs de suite malgré « en ligne » : écran « Connexion requise »', async () => {
  const { source, onskip } = setup();
  source.fail();
  source.fail();
  expect(await screen.findByText('Connexion requise pour la musique')).toBeInTheDocument();
  expect(onskip).toHaveBeenCalledOnce();
});

test('sans connexion, « Retour à l’accueil » garde la partie', async () => {
  const { source, onhome, onquit } = setup();
  window.dispatchEvent(new Event('offline'));
  source.fail();
  await fireEvent.click(await screen.findByRole('button', { name: /Retour à l’accueil|Retour à l'accueil/ }));
  expect(onhome).toHaveBeenCalledOnce();
  expect(onquit).not.toHaveBeenCalled();
});

test('la réponse est masquée par défaut, puis s’affiche et se masque au bouton', async () => {
  const { source } = setup();
  const show = await screen.findByRole('button', { name: 'Voir la réponse' });
  expect(screen.queryByText('Poker Face')).toBeNull();
  await fireEvent.click(show);
  expect(screen.getByText('Poker Face')).toBeTruthy();
  expect(screen.getByText('Lady Gaga')).toBeTruthy();
  expect(screen.getByText('2008')).toBeTruthy();
  expect(source.pause).not.toHaveBeenCalled();
  expect(source.stop).not.toHaveBeenCalled();
  await fireEvent.click(screen.getByRole('button', { name: 'Masquer la réponse' }));
  expect(screen.queryByText('Poker Face')).toBeNull();
});

test('réponse affichée : choisir une équipe attribue toujours le point', async () => {
  const { onaward } = setup();
  await fireEvent.click(await screen.findByRole('button', { name: 'Voir la réponse' }));
  later();
  await fireEvent.click(screen.getByRole('button', { name: 'Léa' }));
  expect(onaward).toHaveBeenCalledWith('A');
});
