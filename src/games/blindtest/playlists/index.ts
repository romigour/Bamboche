import type { Playlist } from '../types';
import hitsDeToujours from './hits-de-toujours.json';

/** Playlists intégrées, dans l'ordre d'affichage. Pour en ajouter : npm run import-playlist (voir README). */
export const playlists: Playlist[] = [hitsDeToujours as Playlist];

export function playlistById(id: string): Playlist | undefined {
  return playlists.find((p) => p.id === id);
}

export function trackById(playlistId: string, trackId: string) {
  return playlistById(playlistId)?.tracks.find((t) => t.id === trackId);
}
