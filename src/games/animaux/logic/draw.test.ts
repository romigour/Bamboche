import { expect, test } from 'vitest';
import { seq } from '../../../lib/test-rng';
import type { Animal, AnimalLevel } from '../types';
import { drawOptions, drawSounds, trapFor } from './draw';

const credit = { author: 'x', license: 'CC0', url: 'u' };
const a = (id: string, level: AnimalLevel, family: string): Animal => ({
  id, name: id, level, family, sound: `animaux/${id}.mp3`, photo: `animaux/${id}.webp`, credits: { sound: credit, photo: credit },
});
const ALL: Animal[] = [
  a('vache', 'facile', 'ferme'), a('coq', 'facile', 'ferme'), a('chat', 'facile', 'maison'),
  a('chien', 'facile', 'maison'), a('loup', 'facile', 'canides'), a('lion', 'facile', 'felins'),
  a('hulotte', 'difficile', 'nuit'), a('effraie', 'difficile', 'nuit'), a('grandduc', 'difficile', 'nuit'),
  a('engoulevent', 'difficile', 'nuit'), a('cerf', 'difficile', 'foret'), a('grenouille', 'difficile', 'mare'),
];
const byId = (id: string) => ALL.find((x) => x.id === id)!;
const level = (id: string) => byId(id).level;

test('drawSounds facile : uniquement des faciles, distincts', () => {
  const { picked } = drawSounds(ALL, 'facile', 4, [], seq(0.3, 0.7, 0.1));
  expect(picked).toHaveLength(4);
  expect(new Set(picked).size).toBe(4);
  expect(picked.every((id) => level(id) === 'facile')).toBe(true);
});

test('drawSounds expert : les difficiles d’abord, complétés par des faciles', () => {
  const { picked } = drawSounds(ALL, 'expert', 8, [], seq(0.5));
  expect(picked.slice(0, 6).every((id) => level(id) === 'difficile')).toBe(true);
  expect(picked.slice(6).every((id) => level(id) === 'facile')).toBe(true);
});

test('drawSounds mélangé : moitié faciles (arrondi au-dessus), moitié difficiles', () => {
  const four = drawSounds(ALL, 'melange', 4, [], seq(0.2, 0.8)).picked;
  expect(four.filter((id) => level(id) === 'facile')).toHaveLength(2);
  const five = drawSounds(ALL, 'melange', 5, [], seq(0.2, 0.8)).picked;
  expect(five.filter((id) => level(id) === 'facile')).toHaveLength(3);
  expect(new Set(five).size).toBe(5);
});

test('drawSounds mélangé : un niveau qui manque est complété par l’autre', () => {
  const few = ALL.filter((x) => x.level === 'facile').concat(byId('cerf'));
  const { picked } = drawSounds(few, 'melange', 6, [], seq(0.4));
  expect(picked).toHaveLength(6);
  expect(picked.filter((id) => level(id) === 'difficile')).toEqual(['cerf']);
});

test('drawSounds évite l’historique et y ajoute les tirés', () => {
  const history = ['vache', 'coq', 'chat'];
  const { picked, history: h } = drawSounds(ALL, 'facile', 3, history, seq(0.5));
  expect(picked.sort()).toEqual(['chien', 'lion', 'loup']);
  expect(h).toEqual([...history, ...picked]);
});

test('drawSounds remet l’historique à zéro quand il ne reste pas assez d’animaux frais', () => {
  const history = ['vache', 'coq', 'chat', 'chien', 'loup'];
  const { picked, history: h } = drawSounds(ALL, 'facile', 3, history, seq(0.5));
  expect(picked).toHaveLength(3);
  expect(h).toEqual(picked);
});

test('drawSounds avec n plus grand que la banque : toute la banque, sans doublon', () => {
  const { picked } = drawSounds(ALL, 'melange', 20, [], seq(0.6));
  expect(picked).toHaveLength(ALL.length);
  expect(new Set(picked).size).toBe(ALL.length);
});

test('drawOptions piège facile : réponse + faciles de familles toutes différentes', () => {
  const opts = drawOptions(byId('vache'), ALL, 4, 'facile', seq(0.3, 0.6));
  expect(opts).toHaveLength(4);
  expect(opts).toContain('vache');
  expect(new Set(opts).size).toBe(4);
  expect(opts.every((id) => level(id) === 'facile')).toBe(true);
  expect(new Set(opts.map((id) => byId(id).family)).size).toBe(4);
});

test('drawOptions piège difficile : d’abord la même famille', () => {
  const opts = drawOptions(byId('hulotte'), ALL, 4, 'difficile', seq(0.3, 0.6));
  expect(opts.sort()).toEqual(['effraie', 'engoulevent', 'grandduc', 'hulotte']);
  const six = drawOptions(byId('hulotte'), ALL, 6, 'difficile', seq(0.3, 0.6));
  expect(six.filter((id) => byId(id).family === 'nuit')).toHaveLength(4);
  expect(new Set(six).size).toBe(6);
});

test('drawOptions avec count plus grand que la banque : toute la banque', () => {
  const small = ALL.slice(0, 3);
  const opts = drawOptions(small[0], small, 6, 'facile', seq(0.5));
  expect(opts.sort()).toEqual(['chat', 'coq', 'vache']);
});

test('la réponse ne tombe pas toujours à la même place', () => {
  const positions = new Set(
    [seq(0.05), seq(0.95), seq(0.5, 0.2), seq(0.8, 0.1)].map((rng) => drawOptions(byId('vache'), ALL, 4, 'facile', rng).indexOf('vache')),
  );
  expect(positions.size).toBeGreaterThan(1);
});

test('trapFor suit le niveau de la partie, ou celui du son en mélangé', () => {
  expect(trapFor('facile', byId('hulotte'))).toBe('facile');
  expect(trapFor('expert', byId('vache'))).toBe('difficile');
  expect(trapFor('melange', byId('vache'))).toBe('facile');
  expect(trapFor('melange', byId('hulotte'))).toBe('difficile');
});
