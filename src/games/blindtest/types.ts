import type { GameColor } from '../types';

export interface Track {
  /** URI Spotify, ex. 'spotify:track:…' */
  id: string;
  title: string;
  /** titre sans « - Remastered … », « - From "…" », « (feat. …) » */
  displayTitle: string;
  artists: string[];
  album: string;
  year: number | null;
  /** année corrigée à la main (compilations, remasters) — futur jeu type frise */
  annee_corrigee?: number;
  cover: string;
  preview: string;
  durationMs: number;
  isrc: string;
  popularity: number;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  color: GameColor;
  tracks: Track[];
}
