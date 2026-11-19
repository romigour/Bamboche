import data from './animals.json';
import type { Animal } from './types';

/** Banque de sons intégrée (générée par `npm run import-animals`). */
export const animals: Animal[] = data as Animal[];

export function animalById(id: string): Animal | undefined {
  return animals.find((a) => a.id === id);
}
