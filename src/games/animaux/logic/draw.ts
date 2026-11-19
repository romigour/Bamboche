import { shuffle, type Rng } from '../../../lib/random';
import type { Animal, AnimalLevel, GameLevel } from '../types';

/** Nombre de sons faciles et difficiles à tirer dans `pool`, selon le niveau de la partie. */
function targets(pool: Animal[], level: GameLevel, n: number): { e: number; h: number } {
  const E = pool.filter((a) => a.level === 'facile').length;
  const H = pool.length - E;
  if (level === 'facile') {
    const e = Math.min(n, E);
    return { e, h: Math.min(n - e, H) };
  }
  if (level === 'expert') {
    const h = Math.min(n, H);
    return { e: Math.min(n - h, E), h };
  }
  const e0 = Math.ceil(n / 2);
  const h0 = n - e0;
  let e = Math.min(e0, E);
  let h = Math.min(h0, H);
  if (e < e0) h = Math.min(H, h + (e0 - e));
  if (h < h0) e = Math.min(E, e + (h0 - h));
  return { e, h };
}

/**
 * Tire n sons selon le niveau, en évitant les animaux déjà entendus sur ce téléphone.
 * Si l'historique ne laisse pas assez d'animaux, il est remis à zéro.
 */
export function drawSounds(
  all: Animal[],
  level: GameLevel,
  n: number,
  history: string[],
  rng?: Rng,
): { picked: string[]; history: string[] } {
  const t = targets(all, level, n);
  const played = new Set(history);
  const fresh = all.filter((a) => !played.has(a.id));
  const freshE = fresh.filter((a) => a.level === 'facile').length;
  const reset = freshE < t.e || fresh.length - freshE < t.h;
  const pool = reset ? all : fresh;
  const easy = shuffle(pool.filter((a) => a.level === 'facile'), rng).slice(0, t.e).map((a) => a.id);
  const hard = shuffle(pool.filter((a) => a.level === 'difficile'), rng).slice(0, t.h).map((a) => a.id);
  const picked = level === 'expert' ? [...hard, ...easy] : level === 'facile' ? [...easy, ...hard] : shuffle([...easy, ...hard], rng);
  return { picked, history: [...(reset ? [] : history), ...picked] };
}

/** Règle de propositions d'un son : celle de la partie, ou celle du son lui-même en Mélangé. */
export function trapFor(level: GameLevel, animal: Animal): AnimalLevel {
  if (level === 'facile') return 'facile';
  if (level === 'expert') return 'difficile';
  return animal.level;
}

/**
 * Propositions (ids, ordre mélangé, réponse incluse).
 * Piège facile : des animaux faciles de familles différentes. Piège difficile : d'abord la même famille.
 */
export function drawOptions(answer: Animal, all: Animal[], count: number, trap: AnimalLevel, rng?: Rng): string[] {
  const others = all.filter((a) => a.id !== answer.id);
  const k = Math.max(0, Math.min(count - 1, others.length));
  const chosen: Animal[] = [];
  const take = (list: Animal[], distinctFamilies = false) => {
    const families = new Set([answer.family, ...chosen.map((a) => a.family)]);
    for (const a of list) {
      if (chosen.length >= k) return;
      if (chosen.includes(a)) continue;
      if (distinctFamilies && families.has(a.family)) continue;
      chosen.push(a);
      families.add(a.family);
    }
  };
  if (trap === 'facile') {
    const otherFamilies = shuffle(others.filter((a) => a.level === 'facile' && a.family !== answer.family), rng);
    take(otherFamilies, true);
    take(otherFamilies);
    take(shuffle(others.filter((a) => a.level === 'facile'), rng));
  } else {
    take(shuffle(others.filter((a) => a.family === answer.family), rng));
  }
  take(shuffle(others, rng));
  return shuffle([answer.id, ...chosen.map((a) => a.id)], rng);
}
