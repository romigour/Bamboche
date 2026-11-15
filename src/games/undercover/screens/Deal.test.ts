import { fireEvent, render, screen } from '@testing-library/svelte';
import { expect, test, vi } from 'vitest';
import Deal from './Deal.svelte';

test('le mot est caché tant que le joueur ne touche pas', () => {
  render(Deal, { name: 'Léa', word: 'Plage', onseen: () => {} });
  expect(screen.getByText('Léa')).toBeInTheDocument();
  expect(screen.queryByText('Plage')).toBeNull();
});

test('le mot apparaît au tap puis onseen est appelé', async () => {
  const onseen = vi.fn();
  render(Deal, { name: 'Léa', word: 'Plage', onseen });
  await fireEvent.click(screen.getByRole('button', { name: "C'est moi, voir mon mot" }));
  expect(screen.getByText('Plage')).toBeInTheDocument();
  expect(onseen).not.toHaveBeenCalled();
  await fireEvent.click(screen.getByRole('button', { name: "J'ai retenu" }));
  expect(onseen).toHaveBeenCalledOnce();
});

test('doneLabel personnalisé', async () => {
  render(Deal, { name: 'Léa', word: 'Plage', onseen: () => {}, doneLabel: 'Fermer' });
  await fireEvent.click(screen.getByRole('button', { name: "C'est moi, voir mon mot" }));
  expect(screen.getByRole('button', { name: 'Fermer' })).toBeInTheDocument();
});

test('Mr White : pas de mot', async () => {
  const onseen = vi.fn();
  render(Deal, { name: 'Max', word: null, onseen });
  await fireEvent.click(screen.getByRole('button', { name: "C'est moi, voir mon mot" }));
  expect(screen.getByText('Mr White')).toBeInTheDocument();
  expect(screen.getByText("Tu n'as pas de mot. Écoute et bluffe !")).toBeInTheDocument();
  await fireEvent.click(screen.getByRole('button', { name: "J'ai compris" }));
  expect(onseen).toHaveBeenCalledOnce();
});
