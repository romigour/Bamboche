import { fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import Deal from './Deal.svelte';

beforeEach(() => vi.useFakeTimers({ toFake: ['Date'] }));
afterEach(() => vi.useRealTimers());

const voir = () => screen.getByRole('button', { name: "C'est moi, voir mon mot" });

test('le mot est caché tant que le joueur ne touche pas', () => {
  render(Deal, { name: 'Léa', word: 'Plage', onseen: () => {} });
  expect(screen.getByText('Léa')).toBeInTheDocument();
  expect(screen.queryByText('Plage')).toBeNull();
});

test('le mot apparaît au tap puis onseen est appelé', async () => {
  const onseen = vi.fn();
  render(Deal, { name: 'Léa', word: 'Plage', onseen });
  vi.advanceTimersByTime(1000);
  await fireEvent.click(voir());
  expect(screen.getByText('Plage')).toBeInTheDocument();
  expect(onseen).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1000);
  await fireEvent.click(screen.getByRole('button', { name: "J'ai retenu" }));
  expect(onseen).toHaveBeenCalledOnce();
});

test('doneLabel personnalisé', async () => {
  render(Deal, { name: 'Léa', word: 'Plage', onseen: () => {}, doneLabel: 'Fermer' });
  vi.advanceTimersByTime(1000);
  await fireEvent.click(voir());
  expect(screen.getByRole('button', { name: 'Fermer' })).toBeInTheDocument();
});

test('Mr White : pas de mot', async () => {
  const onseen = vi.fn();
  render(Deal, { name: 'Max', word: null, onseen });
  vi.advanceTimersByTime(1000);
  await fireEvent.click(voir());
  expect(screen.getByText('Mr White')).toBeInTheDocument();
  expect(screen.getByText("Tu n'as pas de mot. Écoute et bluffe !")).toBeInTheDocument();
  vi.advanceTimersByTime(1000);
  await fireEvent.click(screen.getByRole('button', { name: "J'ai compris" }));
  expect(onseen).toHaveBeenCalledOnce();
});

test('un tap juste au montage est ignoré, puis accepté après le temps mort', async () => {
  render(Deal, { name: 'Léa', word: 'Plage', onseen: () => {} });
  await fireEvent.click(voir());
  expect(screen.queryByText('Plage')).toBeNull();
  vi.advanceTimersByTime(1000);
  await fireEvent.click(voir());
  expect(screen.getByText('Plage')).toBeInTheDocument();
});

test('un tap immédiat sur le bouton final est ignoré, puis accepté après le temps mort', async () => {
  const onseen = vi.fn();
  render(Deal, { name: 'Léa', word: 'Plage', onseen });
  vi.advanceTimersByTime(1000);
  await fireEvent.click(voir());
  await fireEvent.click(screen.getByRole('button', { name: "J'ai retenu" }));
  expect(onseen).not.toHaveBeenCalled();
  vi.advanceTimersByTime(1000);
  await fireEvent.click(screen.getByRole('button', { name: "J'ai retenu" }));
  expect(onseen).toHaveBeenCalledOnce();
});

test('sans onquit : pas de bouton Quitter', () => {
  render(Deal, { name: 'Léa', word: 'Plage', onseen: () => {} });
  expect(screen.queryByRole('button', { name: 'Quitter' })).toBeNull();
});

test('avec onquit : Quitter, confirmation, puis onquit appelé une fois, sans jamais montrer le mot', async () => {
  const onquit = vi.fn();
  render(Deal, { name: 'Léa', word: 'Plage', onseen: () => {}, onquit });
  await fireEvent.click(screen.getByRole('button', { name: 'Quitter' }));
  expect(screen.getByText('Quitter la série ?')).toBeInTheDocument();
  expect(screen.getByText('Les scores seront perdus.')).toBeInTheDocument();
  expect(onquit).not.toHaveBeenCalled();
  await fireEvent.click(screen.getByRole('button', { name: 'Oui, quitter' }));
  expect(onquit).toHaveBeenCalledOnce();
  expect(document.body.textContent).not.toContain('Plage');
});

test('Non, on continue : retour à « Passe le téléphone »', async () => {
  render(Deal, { name: 'Léa', word: 'Plage', onseen: () => {}, onquit: () => {} });
  await fireEvent.click(screen.getByRole('button', { name: 'Quitter' }));
  await fireEvent.click(screen.getByRole('button', { name: 'Non, on continue' }));
  expect(screen.getByText('Léa')).toBeInTheDocument();
  expect(voir()).toBeInTheDocument();
});

test("l'écran du mot n'a pas de bouton Quitter", async () => {
  render(Deal, { name: 'Léa', word: 'Plage', onseen: () => {}, onquit: () => {} });
  vi.advanceTimersByTime(1000);
  await fireEvent.click(voir());
  expect(screen.queryByRole('button', { name: 'Quitter' })).toBeNull();
});
