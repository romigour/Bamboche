import { fireEvent, render, screen } from '@testing-library/svelte';
import { expect, test, vi } from 'vitest';
import Switch from './Switch.svelte';

const description = 'Un joueur sans mot, qui doit bluffer';

test('nom accessible = libellé, description reliée', () => {
  render(Switch, { checked: false, label: 'Mr White', description, onchange: () => {} });
  const sw = screen.getByRole('switch', { name: 'Mr White' });
  expect(sw).toHaveAttribute('aria-checked', 'false');
  expect(sw).toHaveAccessibleDescription(description);
});

test('un clic sur la description bascule', async () => {
  const onchange = vi.fn();
  render(Switch, { checked: false, label: 'Mr White', description, onchange });
  await fireEvent.click(screen.getByText(description));
  expect(onchange).toHaveBeenCalledOnce();
  expect(onchange).toHaveBeenCalledWith(true);
});

test('actif : aria-checked true, clic envoie false', async () => {
  const onchange = vi.fn();
  render(Switch, { checked: true, label: 'Sons et vibrations', onchange });
  const sw = screen.getByRole('switch', { name: 'Sons et vibrations' });
  expect(sw).toHaveAttribute('aria-checked', 'true');
  await fireEvent.click(sw);
  expect(onchange).toHaveBeenCalledWith(false);
});
