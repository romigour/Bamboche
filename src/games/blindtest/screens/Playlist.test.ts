import { fireEvent, render, screen } from '@testing-library/svelte';
import { expect, test, vi } from 'vitest';
import { playlists } from '../playlists';
import Playlist from './Playlist.svelte';

test("n'affiche plus les réglages d'extraits ni de durée", () => {
  render(Playlist, { onback: vi.fn(), onstart: vi.fn() });
  expect(screen.queryByText("Nombre d'extraits")).toBeNull();
  expect(screen.queryByText("Durée d'écoute")).toBeNull();
});

test("« C'est parti ! » lance la playlist sélectionnée", async () => {
  const onstart = vi.fn();
  render(Playlist, { onback: vi.fn(), onstart });
  const last = playlists[playlists.length - 1];
  await fireEvent.click(screen.getByText(last.name));
  await fireEvent.click(screen.getByText("C'est parti !"));
  expect(onstart).toHaveBeenCalledWith(last.id);
});
