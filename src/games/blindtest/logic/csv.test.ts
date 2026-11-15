import { expect, test } from 'vitest';
import { parseExportifyCsv } from './csv';

const FR = [
  'URI du titre',
  'Nom du titre',
  "Nom(s) de l'artiste",
  "Nom de l'album",
  "Date de sortie de l'album",
  "URL de l'image de l'album",
  'Durée du titre (ms)',
  'URL de prévisualisation du titre',
  'Popularité',
  'ISRC',
];
const EN = ['Track URI', 'Track Name', 'Artist Name(s)', 'Album Name', 'Album Release Date', 'Album Image URL', 'Track Duration (ms)', 'Track Preview URL', 'Popularity', 'ISRC'];

const rows = [
  ['spotify:track:1', 'I Love It (feat. Charli XCX)', 'Icona Pop,Charli xcx', 'This Is', '2013-01-01', 'https://i/1', '157000', 'https://p/1', '70', 'SE1'],
  ['spotify:track:2', 'Love Is All Around - From "Four Weddings And A Funeral"', 'Wet Wet Wet', 'End Of Part One, Their Greatest', '', 'https://i/2', '240000', 'https://p/2', '60', 'GB2'],
  ['spotify:track:3', 'Zombie - Remastered 2002', 'The Cranberries', 'No Need', '1994-10-03', '', '306000', '', '80', 'IE3'],
];
const q = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
const csv = (head: string[]) => [head, ...rows].map((r) => r.map(q).join(',')).join('\n');

test('analyse un export Exportify (en-têtes français)', () => {
  const { tracks, rejected } = parseExportifyCsv(csv(FR));
  expect(tracks).toHaveLength(2);
  expect(tracks[0]).toMatchObject({
    id: 'spotify:track:1',
    title: 'I Love It (feat. Charli XCX)',
    displayTitle: 'I Love It',
    artists: ['Icona Pop', 'Charli xcx'],
    year: 2013,
    cover: 'https://i/1',
    preview: 'https://p/1',
    durationMs: 157000,
    popularity: 70,
    isrc: 'SE1',
  });
  expect(tracks[1].displayTitle).toBe('Love Is All Around');
  expect(tracks[1].album).toBe('End Of Part One, Their Greatest');
  expect(tracks[1].year).toBeNull();
  expect(rejected).toEqual([{ title: 'Zombie - Remastered 2002', reason: 'pas d’extrait' }]);
});

test('les en-têtes anglais donnent le même résultat', () => {
  expect(parseExportifyCsv(csv(EN))).toEqual(parseExportifyCsv(csv(FR)));
});

test('displayTitle retire « - Remastered »', async () => {
  const { displayTitle } = await import('./csv');
  expect(displayTitle('Zombie - Remastered 2002')).toBe('Zombie');
  expect(displayTitle('Hasta la Vista')).toBe('Hasta la Vista');
});

test('retours à la ligne entre guillemets', () => {
  const text = [FR.join(','), 'spotify:track:9,"Deux\nlignes",A,B,2001,,1000,https://p/9,1,X'].join('\n');
  expect(parseExportifyCsv(text).tracks[0].title).toBe('Deux\nlignes');
});

test('displayTitle : mixes, éditions et mentions entre crochets', async () => {
  const { displayTitle } = await import('./csv');
  expect(displayTitle('I Like To Move It (feat. The Mad Stuntman) - Erick "More" Album Mix')).toBe('I Like To Move It');
  expect(displayTitle('Get Lucky (Radio Edit) [feat. Pharrell Williams and Nile Rodgers]')).toBe('Get Lucky');
  expect(displayTitle('Waka Waka (This Time for Africa) [The Official 2010 FIFA World Cup (TM) Song] (feat. Freshlyground)')).toBe(
    'Waka Waka (This Time for Africa)',
  );
  expect(displayTitle('Sweet Dreams (Are Made of This) - 2005 Remaster')).toBe('Sweet Dreams (Are Made of This)');
});
