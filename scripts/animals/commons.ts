/** Fonctions pures du script d'import des Cris d'animaux (API Wikimedia Commons, ffmpeg). */
import { createHash } from 'node:crypto';
import type { Credit } from '../../src/games/animaux/types';

export interface FileInfo {
  url: string;
  thumbUrl?: string;
  credit: Credit;
}

export const MAX_SECONDS = 8;

export function commonsQueryUrl(titles: string[], thumbWidth: number): string {
  const p = new URLSearchParams({
    action: 'query',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: String(thumbWidth),
    titles: titles.join('|'),
    format: 'json',
  });
  return `https://commons.wikimedia.org/w/api.php?${p}`;
}

export function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, '')
    .replace(/&#160;|&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

type Page = { title?: string; imageinfo?: { url?: string; thumburl?: string; descriptionurl?: string; extmetadata?: Record<string, { value?: string }> }[] };

/** Infos par titre de fichier (le titre demandé et le titre normalisé par Commons). */
export function parseImageInfo(json: unknown): Record<string, FileInfo> {
  const q = (json as { query?: { pages?: Record<string, Page>; normalized?: { from: string; to: string }[] } } | null)?.query;
  const out: Record<string, FileInfo> = {};
  for (const page of Object.values(q?.pages ?? {})) {
    const ii = page.imageinfo?.[0];
    if (!page.title || !ii?.url) continue;
    const meta = ii.extmetadata ?? {};
    out[page.title] = {
      url: ii.url,
      thumbUrl: ii.thumburl,
      credit: {
        author: stripHtml(meta.Artist?.value ?? '') || 'Auteur inconnu',
        license: stripHtml(meta.LicenseShortName?.value ?? ''),
        url: ii.descriptionurl ?? '',
      },
    };
  }
  for (const n of q?.normalized ?? []) if (out[n.to]) out[n.from] = out[n.to];
  return out;
}

/** Licences libres acceptées : CC0, domaine public, CC BY, CC BY-SA (pas NC, pas ND). */
export function isFreeLicense(shortName: string): boolean {
  const l = shortName.toLowerCase().replace(/[\s_]+/g, '-');
  if (!l || /nc|nd/.test(l.replace(/^cc-?/, '').replace(/^cc0/, ''))) return false;
  return /^cc0/.test(l) || /^public-domain|^pd/.test(l) || /^cc-by(-sa)?(-\d|$)/.test(l);
}

/** Nom de fichier neutre et stable, qui ne trahit pas l'animal. */
export function neutralName(id: string): string {
  return createHash('sha1').update(`bamboche-animaux:${id}`).digest('hex').slice(0, 10);
}

/** Découpe (8 s au plus), mono, 48 kbit/s, volume normalisé. */
export function ffmpegSoundArgs(input: string, output: string, start?: number, end?: number): string[] {
  const from = start ?? 0;
  const length = end !== undefined && end > from ? Math.min(end - from, MAX_SECONDS) : MAX_SECONDS;
  return [
    '-y', '-hide_banner', '-loglevel', 'error',
    ...(start !== undefined && start > 0 ? ['-ss', String(start)] : []),
    '-i', input,
    '-t', String(length),
    '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11,afade=t=out:st=' + Math.max(0, length - 0.4) + ':d=0.4',
    '-ac', '1', '-ar', '44100', '-c:a', 'libmp3lame', '-b:a', '48k',
    output,
  ];
}
