import { fireEvent, render, screen } from '@testing-library/svelte';
import { createRawSnippet } from 'svelte';
import { expect, test, vi } from 'vitest';
import BigButton from './BigButton.svelte';

const label = (text: string) => createRawSnippet(() => ({ render: () => `<span>${text}</span>` }));

test('un clic appelle onclick', async () => {
  const onclick = vi.fn();
  render(BigButton, { variant: 'pop', onclick, children: label('Lancer') });
  await fireEvent.click(screen.getByRole('button', { name: 'Lancer' }));
  expect(onclick).toHaveBeenCalledOnce();
});

test('désactivé : attribut disabled et onclick non appelé', async () => {
  const onclick = vi.fn();
  render(BigButton, { variant: 'pop', disabled: true, onclick, children: label('Continuer') });
  const btn = screen.getByRole('button', { name: 'Continuer' });
  expect(btn).toBeDisabled();
  await fireEvent.click(btn);
  expect(onclick).not.toHaveBeenCalled();
});
