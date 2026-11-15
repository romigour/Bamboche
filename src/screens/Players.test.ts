import { fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import { beforeEach, expect, test, vi } from 'vitest';
import { initUpdater, resetUpdaterForTests, type RegisterFn } from '../lib/update';
import Players from './Players.svelte';

type Opts = Parameters<RegisterFn>[0];
let opts: Opts;

/** Simule un service worker enregistré, sans nouvelle version sur le serveur. */
function registerFakeSW() {
  const reg = { update: vi.fn(async () => {}), installing: null, waiting: null };
  initUpdater((o) => {
    opts = o;
    return async () => {};
  });
  opts.onRegisteredSW?.('sw.js', reg as unknown as ServiceWorkerRegistration);
}

beforeEach(() => resetUpdaterForTests());

test('sans service worker : bouton désactivé et « Indisponible »', () => {
  render(Players, { onback: () => {} });
  expect(screen.getByRole('button', { name: 'Rechercher une mise à jour' })).toBeDisabled();
  expect(screen.getByText('Indisponible')).toBeInTheDocument();
});

test('affiche la version quand aucun message', () => {
  registerFakeSW();
  render(Players, { onback: () => {} });
  expect(screen.getByRole('button', { name: 'Rechercher une mise à jour' })).toBeEnabled();
  expect(screen.getByText('Version 0.0.0-test · 15/11/2026 · abc1234')).toBeInTheDocument();
});

test('appui → « Bamboche est à jour »', async () => {
  registerFakeSW();
  render(Players, { onback: () => {} });
  await fireEvent.click(screen.getByRole('button', { name: 'Rechercher une mise à jour' }));
  expect(await screen.findByText('Bamboche est à jour')).toBeInTheDocument();
});

test('version téléchargée → libellé « Installer la mise à jour »', async () => {
  registerFakeSW();
  render(Players, { onback: () => {} });
  opts.onNeedRefresh?.();
  await tick();
  expect(screen.getByRole('button', { name: 'Installer la mise à jour' })).toBeInTheDocument();
});
