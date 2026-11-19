import { get } from 'svelte/store';
import { beforeEach, expect, test } from 'vitest';
import { getActiveGame } from '../../lib/activeGame';
import { players } from '../../lib/players';
import { load, save } from '../../lib/storage';
import { seq } from '../../lib/test-rng';
import { createAnimaux, reveal, setAnswer, type AnimauxState } from './logic/game';
import { abandonAnimaux, animauxGame, loadSavedAnimaux, readHistory, resumeLines, startAnimaux } from './session';
import { animauxLevel, validateSetup } from './setup';
import type { Animal } from './types';

const credit = { author: 'x', license: 'CC0', url: 'u' };
const a = (id: string, family: string): Animal => ({
  id, name: id, level: 'facile', family, sound: `animaux/${id}.mp3`, photo: `animaux/${id}.webp`, credits: { sound: credit, photo: credit },
});
const ALL = [a('vache', 'ferme'), a('chat', 'maison'), a('loup', 'canides'), a('lion', 'felins'), a('coq', 'ferme')];
const PLAYERS = [
  { id: 'a', name: 'Léa' },
  { id: 'b', name: 'Tom' },
];
const make = () => createAnimaux(PLAYERS, ALL, { sounds: 3, choices: 4 }, 'facile', [], seq(0.4, 0.8));

beforeEach(() => {
  animauxGame.set(null);
  localStorage.clear();
});

test('startAnimaux enregistre, marque actif, navigue et écrit l’historique', () => {
  const { state, history } = make();
  startAnimaux(state, history);
  expect(getActiveGame()).toEqual({ gameId: 'animaux' });
  expect(location.hash).toBe('#/animaux/partie');
  expect(readHistory()).toEqual(history);
  expect(load('animaux:game', null)).toEqual(state);
});

test('une partie rechargée revient au même son et aux mêmes réponses', () => {
  const { state, history } = make();
  startAnimaux(state, history);
  animauxGame.set(setAnswer(state, 'a', state.rounds[0].options[1]));
  animauxGame.set(null);
  const s = loadSavedAnimaux(ALL)!;
  expect(s.current).toBe(0);
  expect(s.phase).toBe('sound');
  expect(s.rounds[0].answers).toEqual({ a: state.rounds[0].options[1] });
});

test('une sauvegarde invalide est ignorée', () => {
  const { state } = make();
  save('animaux:game', { ...state, version: 2 });
  expect(loadSavedAnimaux(ALL)).toBeNull();
  save('animaux:game', { ...state, phase: 'bidule' });
  expect(loadSavedAnimaux(ALL)).toBeNull();
  save('animaux:game', { ...state, current: 9 });
  expect(loadSavedAnimaux(ALL)).toBeNull();
  save('animaux:game', 'nimporte');
  expect(loadSavedAnimaux(ALL)).toBeNull();
});

test('une partie qui cite un animal absent de la banque est abandonnée', () => {
  const { state } = make();
  save('animaux:game', state);
  const sansReponse = ALL.filter((x) => x.id !== state.rounds[0].animalId);
  expect(loadSavedAnimaux(sansReponse)).toBeNull();
  expect(loadSavedAnimaux(ALL)).not.toBeNull();
});

test('la partie rechargée garde ses joueurs même si la liste de la soirée change', () => {
  const { state, history } = make();
  startAnimaux(state, history);
  animauxGame.set(null);
  players.set([{ id: 'z', name: 'Zoé' }]);
  expect(loadSavedAnimaux(ALL)!.players.map((p) => p.name)).toEqual(['Léa', 'Tom']);
});

test('abandonAnimaux efface la partie et le jeu actif', () => {
  const { state, history } = make();
  startAnimaux(state, history);
  abandonAnimaux();
  expect(get(animauxGame)).toBeNull();
  expect(load('animaux:game', null)).toBeNull();
  expect(getActiveGame()).toBeNull();
});

test('resumeLines : numéro du son et scores', () => {
  let s: AnimauxState = make().state;
  s = setAnswer(setAnswer(s, 'a', s.rounds[0].animalId), 'b', s.rounds[0].options.find((o) => o !== s.rounds[0].animalId)!);
  s = { ...reveal(s), current: 1, phase: 'sound' };
  expect(resumeLines(s)).toEqual(["Cris d'animaux · Son 2 / 3", 'Léa 1 – Tom 0']);
});

test('le niveau vaut Mélangé par défaut et est mémorisé', () => {
  expect(get(animauxLevel)).toBe('melange');
  animauxLevel.set('expert');
  expect(load('animaux:level', null)).toBe('expert');
});

test('validateSetup : 2 joueurs minimum, 20 maximum', () => {
  expect(validateSetup(1)).toEqual({ ok: false, error: 'Il faut au moins 2 joueurs.' });
  expect(validateSetup(2)).toEqual({ ok: true, error: null });
  expect(validateSetup(21)).toEqual({ ok: false, error: '20 joueurs maximum.' });
});
