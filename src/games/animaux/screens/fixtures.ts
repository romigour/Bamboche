import { vi } from 'vitest';
import type { AnimalPlayer } from '../audio';
import type { AnimauxState } from '../logic/game';
import type { Animal, AnimalLevel } from '../types';

const credit = { author: 'x', license: 'CC0', url: 'u' };
export const animal = (id: string, name = id, level: AnimalLevel = 'facile', family = id): Animal => ({
  id, name, level, family, sound: `animaux/${id}.mp3`, photo: `animaux/${id}.webp`, credits: { sound: credit, photo: credit },
});

export const ANIMALS = [animal('hibou', 'Hibou'), animal('loup', 'Loup'), animal('chouette', 'Chouette'), animal('chat', 'Chat')];

/** Partie de 2 sons, 3 joueurs ; la réponse du son 1 est « chouette » (option C). */
export function game(over: Partial<AnimauxState> = {}): AnimauxState {
  return {
    version: 1,
    phase: 'sound',
    level: 'melange',
    players: [
      { id: 'a', name: 'Léa', color: 'blindtest' },
      { id: 'b', name: 'Tom', color: 'hipster' },
      { id: 'c', name: 'Max', color: 'undercover' },
    ],
    rounds: [
      { animalId: 'chouette', options: ['hibou', 'loup', 'chouette', 'chat'], answers: {}, revealed: false, skipped: false },
      { animalId: 'loup', options: ['chat', 'loup', 'hibou', 'chouette'], answers: {}, revealed: false, skipped: false },
    ],
    current: 0,
    ...over,
  };
}

export function fakePlayer(play: () => Promise<void> = async () => {}) {
  const errors = new Set<() => void>();
  const p: AnimalPlayer & { fail(): void } = {
    play: vi.fn(play),
    stop: vi.fn(),
    onError: (cb) => {
      errors.add(cb);
      return () => errors.delete(cb);
    },
    fail: () => errors.forEach((cb) => cb()),
  };
  return p;
}
