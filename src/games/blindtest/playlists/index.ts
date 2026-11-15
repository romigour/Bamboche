import type { Playlist } from '../types';
import hitsDeToujours from './hits-de-toujours.json';
import hitsterFrancais from './hitster-francais.json';
import annees2000Fr from './annees-2000-fr.json';
import rapFr from './rap-fr.json';

/** Playlists intégrées, dans l'ordre d'affichage. Pour en ajouter : npm run import-playlist (voir README). */
export const playlists: Playlist[] = [hitsDeToujours, hitsterFrancais, annees2000Fr, rapFr] as Playlist[];

export function playlistById(id: string): Playlist | undefined {
  return playlists.find((p) => p.id === id);
}

export function trackById(playlistId: string, trackId: string) {
  return playlistById(playlistId)?.tracks.find((t) => t.id === trackId);
}
