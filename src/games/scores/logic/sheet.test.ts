import { describe, expect, it } from 'vitest';
import { scoreGameById } from '../defs';
import {
  createSheet,
  cursor,
  endMessage,
  endReached,
  enter,
  hasPending,
  progressLine,
  ranks,
  removeLast,
  select,
  suggestion,
  totals,
  type Participant,
  type Sheet,
} from './sheet';

const solo = (name: string): Participant => ({ id: name.toLowerCase(), name, members: [name] });
const trio = [solo('Léa'), solo('Tom'), solo('Inès')];
const def = (id: string) => scoreGameById(id)!;
const skyjo = def('skyjo');
const nouvelle = (gameId: 'skyjo' | 'cinq-rois' | 'mille-sabords' | 'belote' | 'flip7' = 'skyjo', endValue = 100, ps = trio) =>
  createSheet(gameId, ps, endValue, 1000, 'f1');
const saisir = (s: Sheet, ...vals: number[]) => vals.reduce((acc, v) => enter(acc, v), s);

describe('feuille de score', () => {
  it('la saisie avance joueur par joueur puis ouvre la manche suivante', () => {
    const s = saisir(nouvelle(), 12, 5, 20);
    expect(s.rounds).toEqual([[12, 5, 20]]);
    expect(s.pending).toEqual([null, null, null]);
    expect(cursor(s)).toEqual({ round: 1, index: 0 });
  });

  it('corriger une ancienne cellule revient ensuite au curseur', () => {
    let s = saisir(nouvelle(), 12, 5, 20, 9);
    s = select(s, { round: 0, index: 1 });
    expect(cursor(s)).toEqual({ round: 0, index: 1 });
    s = enter(s, 7);
    expect(s.rounds[0][1]).toBe(7);
    expect(cursor(s)).toEqual({ round: 1, index: 1 });
    expect(s.pending[0]).toBe(9);
  });

  it('corriger une case de la manche entamée', () => {
    let s = saisir(nouvelle(), 12, 5, 20, 9);
    s = select(s, { round: 1, index: 0 });
    s = enter(s, 3);
    expect(s.pending[0]).toBe(3);
    expect(cursor(s)).toEqual({ round: 1, index: 1 });
  });

  it('sélectionner la cellule du curseur naturel annule la correction', () => {
    let s = saisir(nouvelle(), 12, 5, 20);
    s = select(s, { round: 0, index: 0 });
    expect(s.editing).not.toBeNull();
    s = select(s, { round: 1, index: 0 });
    expect(s.editing).toBeNull();
  });

  it('les totaux ignorent la manche entamée', () => {
    const s = saisir(nouvelle(), 12, 5, 20, 9);
    expect(totals(s)).toEqual([12, 5, 20]);
  });

  it('les fonctions ne modifient pas la feuille reçue', () => {
    const s = nouvelle();
    const copie = JSON.parse(JSON.stringify(s));
    enter(s, 4);
    select(s, { round: 0, index: 2 });
    removeLast(s);
    expect(s).toEqual(copie);
  });

  it('ranks Skyjo : le plus bas est premier, ex æquo partagés', () => {
    expect(ranks(skyjo, [47, 31, 31])).toEqual([3, 1, 1]);
    expect(ranks(def('flip7'), [47, 31, 31])).toEqual([1, 2, 2]);
  });

  it('endReached seuil puis correction qui repasse dessous', () => {
    let s = saisir(nouvelle(), 100, 5, 20);
    expect(endReached(skyjo, s)).toBe(true);
    s = select(s, { round: 0, index: 0 });
    s = enter(s, 90);
    expect(endReached(skyjo, s)).toBe(false);
  });

  it('endReached est faux sans manche complète', () => {
    expect(endReached(skyjo, nouvelle())).toBe(false);
  });

  it('endReached manches : faux à 10, vrai à 11', () => {
    const cr = def('cinq-rois');
    const duo = [solo('Léa'), solo('Tom')];
    let s = nouvelle('cinq-rois', 11, duo);
    for (let i = 0; i < 10; i++) s = saisir(s, 1, 2);
    expect(endReached(cr, s)).toBe(false);
    s = saisir(s, 1, 2);
    expect(endReached(cr, s)).toBe(true);
  });

  it('endMessage singulier, pluriel, manches', () => {
    expect(endMessage(skyjo, saisir(nouvelle(), 10, 20, 100))).toBe('Inès a atteint 100 !');
    expect(endMessage(skyjo, saisir(nouvelle(), 110, 20, 130))).toBe('Inès et Léa ont atteint 100 !');
    const cr = def('cinq-rois');
    expect(endMessage(cr, nouvelle('cinq-rois', 11))).toBe('Les 11 manches sont jouées !');
  });

  it('endMessage pluriel : trié par total décroissant', () => {
    expect(endMessage(skyjo, saisir(nouvelle(), 100, 20, 130))).toBe('Inès et Léa ont atteint 100 !');
  });

  it('progressLine', () => {
    expect(progressLine(skyjo, nouvelle())).toBe('Fin à 100 points');
    expect(progressLine(skyjo, saisir(nouvelle(), 10, 20, 58))).toBe('Inès est à 58 / 100');
    let cr = nouvelle('cinq-rois', 11);
    cr = saisir(cr, 1, 2, 3, 1, 2, 3, 1, 2, 3);
    expect(progressLine(def('cinq-rois'), cr)).toBe('Manche 4 / 11 · 6 cartes');
    const ms = saisir(nouvelle('mille-sabords', 6000), 1500, 200, 300);
    expect(progressLine(def('mille-sabords'), ms)).toBe('Léa est à 1 500 / 6 000');
  });

  it('progressLine : le premier participant gagne une égalité', () => {
    expect(progressLine(skyjo, saisir(nouvelle(), 10, 10, 5))).toBe('Léa est à 10 / 100');
  });

  it('removeLast efface d’abord la manche entamée, puis la dernière complète', () => {
    let s = saisir(nouvelle(), 1, 2, 3, 4, 5);
    expect(hasPending(s)).toBe(true);
    s = removeLast(s);
    expect(hasPending(s)).toBe(false);
    expect(s.rounds).toHaveLength(1);
    s = removeLast(s);
    expect(s.rounds).toHaveLength(0);
    expect(removeLast(s).rounds).toHaveLength(0);
  });

  it('removeLast remet editing à null', () => {
    let s = saisir(nouvelle(), 1, 2, 3);
    s = select(s, { round: 0, index: 1 });
    expect(removeLast(s).editing).toBeNull();
  });

  it('suggestion Belote', () => {
    const equipes = [
      { id: 'a', name: 'Léa & Tom', members: ['Léa', 'Tom'] },
      { id: 'b', name: 'Inès & Max', members: ['Inès', 'Max'] },
    ];
    const belote = def('belote');
    expect(suggestion(belote, saisir(nouvelle('belote', 1000, equipes), 100))).toBe(62);
    expect(suggestion(belote, saisir(nouvelle('belote', 1000, equipes), 200))).toBeNull();
    expect(suggestion(belote, nouvelle('belote', 1000, equipes))).toBeNull();
    expect(suggestion(skyjo, saisir(nouvelle(), 10))).toBeNull();
  });

  it('les scores négatifs comptent', () => {
    expect(totals(saisir(nouvelle(), -10, 0, 4))).toEqual([-10, 0, 4]);
  });
});
