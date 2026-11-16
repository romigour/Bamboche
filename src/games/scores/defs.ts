import type { GameColor } from '../types';

export type ScoreGameId = 'mille-sabords' | 'cinq-rois' | 'skyjo' | 'flip7' | 'belote';

export interface ScoreGameDef {
  id: ScoreGameId;
  name: string; // nom affiché
  short: string; // libellé de pastille
  color: GameColor;
  winner: 'haut' | 'bas'; // qui gagne : le plus haut ou le plus bas total
  end: { kind: 'seuil' | 'manches'; default: number; min: number; max: number; step: number };
  teams: boolean;
  minPlayers: number;
  maxPlayers?: number;
  complement?: number; // Belote : 162 (le second score se déduit du premier)
  roundLabel?: (round: number) => string; // round 1-based
}

export const scoreGames: ScoreGameDef[] = [
  {
    id: 'mille-sabords',
    name: 'Mille Sabords',
    short: 'Sabords',
    color: 'timeup',
    winner: 'haut',
    end: { kind: 'seuil', default: 6000, min: 1000, max: 20000, step: 500 },
    teams: false,
    minPlayers: 2,
  },
  {
    id: 'cinq-rois',
    name: 'Les Cinq Rois',
    short: '5 Rois',
    color: 'undercover',
    winner: 'bas',
    end: { kind: 'manches', default: 11, min: 1, max: 11, step: 1 },
    teams: false,
    minPlayers: 2,
    roundLabel: (n) => `${n + 2} cartes`,
  },
  {
    id: 'skyjo',
    name: 'Skyjo',
    short: 'Skyjo',
    color: 'hipster',
    winner: 'bas',
    end: { kind: 'seuil', default: 100, min: 50, max: 500, step: 10 },
    teams: false,
    minPlayers: 2,
  },
  {
    id: 'flip7',
    name: 'Flip 7',
    short: 'Flip 7',
    color: 'blindtest',
    winner: 'haut',
    end: { kind: 'seuil', default: 200, min: 50, max: 1000, step: 10 },
    teams: false,
    minPlayers: 2,
  },
  {
    id: 'belote',
    name: 'Belote',
    short: 'Belote',
    color: 'ok',
    winner: 'haut',
    end: { kind: 'seuil', default: 1000, min: 500, max: 3000, step: 50 },
    teams: true,
    minPlayers: 4,
    maxPlayers: 4,
    complement: 162,
  },
];

export function scoreGameById(id: string): ScoreGameDef | undefined {
  return scoreGames.find((g) => g.id === id);
}

/** 6000 → « 6 000 » (espace normale, pas l'espace fine insécable de fr-FR). */
export function fmt(n: number): string {
  return n.toLocaleString('fr-FR').replace(/\s/g, ' ');
}

export function endLabel(def: ScoreGameDef, value: number): string {
  return def.end.kind === 'seuil' ? `Fin à ${fmt(value)} points` : `${value} manches`;
}
