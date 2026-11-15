import type { Track } from '../types';

export type { Track } from '../types';

/** Analyse CSV (RFC 4180) : guillemets doublés, virgules et retours à la ligne entre guillemets. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  const src = text.replace(/^﻿/, '');
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else field += c;
  }
  if (field !== '' || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((v) => v !== ''));
}

/** Colonnes utiles, en-têtes français puis anglais d'Exportify. */
const COLUMNS = {
  id: ['URI du titre', 'Track URI'],
  title: ['Nom du titre', 'Track Name'],
  artists: ["Nom(s) de l'artiste", 'Artist Name(s)'],
  album: ["Nom de l'album", 'Album Name'],
  date: ["Date de sortie de l'album", 'Album Release Date'],
  cover: ["URL de l'image de l'album", 'Album Image URL'],
  duration: ['Durée du titre (ms)', 'Track Duration (ms)'],
  preview: ['URL de prévisualisation du titre', 'Track Preview URL'],
  popularity: ['Popularité', 'Popularity'],
  isrc: ['ISRC'],
} as const;

export function displayTitle(title: string): string {
  return title
    .replace(/\s*[([](feat\.?|ft\.?|with)\s[^)\]]*[)\]]/gi, '') // (feat. …) [feat. …]
    .replace(/\s*\[[^\]]*\]/g, '') // [The Official … Song]
    .replace(/\s*\((Radio Edit|Single Version|Remaster[^)]*|[^)]*Remaster(ed)?[^)]*)\)/gi, '')
    .replace(/\s+-\s+(.*Remaster.*|From\s.*|Live.*|Radio Edit.*|Single Version.*|Mono.*|Version.*|.*\bMix|.*\bEdit)$/i, '')
    .trim();
}

export function parseExportifyCsv(text: string): { tracks: Track[]; rejected: { title: string; reason: string }[] } {
  const [head = [], ...rows] = parseCsv(text);
  const norm = (s: string) => s.normalize('NFC').trim();
  const index = Object.fromEntries(
    Object.entries(COLUMNS).map(([k, names]) => [k, head.findIndex((h) => (names as readonly string[]).includes(norm(h)))]),
  ) as Record<keyof typeof COLUMNS, number>;
  const get = (r: string[], k: keyof typeof COLUMNS) => (index[k] >= 0 ? (r[index[k]] ?? '').trim() : '');

  const tracks: Track[] = [];
  const rejected: { title: string; reason: string }[] = [];
  for (const r of rows) {
    const title = get(r, 'title');
    const preview = get(r, 'preview');
    if (!preview) {
      rejected.push({ title, reason: 'pas d’extrait' });
      continue;
    }
    const year = Number.parseInt(get(r, 'date').slice(0, 4), 10);
    tracks.push({
      id: get(r, 'id'),
      title,
      displayTitle: displayTitle(title) || title,
      artists: get(r, 'artists')
        .split(/\s*,\s*/)
        .filter(Boolean),
      album: get(r, 'album'),
      year: Number.isFinite(year) ? year : null,
      cover: get(r, 'cover'),
      preview,
      durationMs: Number(get(r, 'duration')) || 0,
      isrc: get(r, 'isrc'),
      popularity: Number(get(r, 'popularity')) || 0,
    });
  }
  return { tracks, rejected };
}
