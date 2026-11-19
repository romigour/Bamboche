import { render, screen } from '@testing-library/svelte';
import { expect, test } from 'vitest';
import type { Animal } from '../types';
import Credits from './Credits.svelte';

const animal = (id: string, name: string): Animal => ({
  id, name, level: 'facile', family: 'f', sound: 's', photo: 'p',
  credits: {
    sound: { author: `Auteur son ${name}`, license: 'CC BY-SA 4.0', url: `https://commons.wikimedia.org/wiki/File:${id}.ogg` },
    photo: { author: `Auteur photo ${name}`, license: 'CC0', url: `https://commons.wikimedia.org/wiki/File:${id}.jpg` },
  },
});

test('les crédits listent chaque animal, par ordre alphabétique, avec auteurs, licences et liens', () => {
  render(Credits, { animals: [animal('vache', 'Vache'), animal('ane', 'Âne')], onback: () => {} });
  const names = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
  expect(names).toEqual(['Âne', 'Vache']);
  expect(screen.getByText('Son : Auteur son Vache · CC BY-SA 4.0')).toBeInTheDocument();
  expect(screen.getByText('Photo : Auteur photo Âne · CC0')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Son : Auteur son Vache/ })).toHaveAttribute('href', 'https://commons.wikimedia.org/wiki/File:vache.ogg');
});
