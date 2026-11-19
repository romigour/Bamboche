import { expect, test } from 'vitest';
import { commonsQueryUrl, ffmpegSoundArgs, isFreeLicense, neutralName, parseImageInfo, stripHtml } from './commons';

const SAMPLE = {
  query: {
    normalized: [{ from: 'File:Strix_aluco.ogg', to: 'File:Strix aluco.ogg' }],
    pages: {
      '42': {
        title: 'File:Strix aluco.ogg',
        imageinfo: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Strix_aluco.ogg',
            descriptionurl: 'https://commons.wikimedia.org/wiki/File:Strix_aluco.ogg',
            extmetadata: {
              Artist: { value: '<a href="//commons.wikimedia.org/wiki/User:Jean">Jean&#160;Dupont</a>' },
              LicenseShortName: { value: 'CC BY-SA 4.0' },
            },
          },
        ],
      },
      '43': {
        title: 'File:Vache.jpg',
        imageinfo: [
          {
            url: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Vache.jpg',
            thumburl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Vache.jpg/480px-Vache.jpg',
            descriptionurl: 'https://commons.wikimedia.org/wiki/File:Vache.jpg',
            extmetadata: { Artist: { value: 'Marie' }, LicenseShortName: { value: 'Public domain' } },
          },
        ],
      },
      '-1': { title: 'File:Absent.ogg', missing: '' },
    },
  },
};

test('parseImageInfo lit url, miniature, auteur et licence, sous le titre demandé et le titre normalisé', () => {
  const info = parseImageInfo(SAMPLE);
  const owl = info['File:Strix aluco.ogg'];
  expect(owl).toEqual({
    url: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Strix_aluco.ogg',
    thumbUrl: undefined,
    credit: { author: 'Jean Dupont', license: 'CC BY-SA 4.0', url: 'https://commons.wikimedia.org/wiki/File:Strix_aluco.ogg' },
  });
  expect(info['File:Strix_aluco.ogg']).toEqual(owl);
  expect(info['File:Vache.jpg'].thumbUrl).toBe('https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Vache.jpg/480px-Vache.jpg');
  expect(info['File:Vache.jpg'].credit.license).toBe('Public domain');
  expect(info['File:Absent.ogg']).toBeUndefined();
  expect(parseImageInfo(null)).toEqual({});
});

test('stripHtml retire les balises et décode les entités courantes', () => {
  expect(stripHtml('<b>Jean</b>&#160;&amp; <i>Marie</i>')).toBe('Jean & Marie');
});

test('isFreeLicense : CC0, domaine public, CC BY, CC BY-SA oui ; NC, ND, vide non', () => {
  for (const l of ['CC0', 'Public domain', 'CC BY 3.0', 'CC BY-SA 4.0', 'CC-BY-SA-2.5']) expect(isFreeLicense(l)).toBe(true);
  for (const l of ['CC BY-NC 4.0', 'CC BY-ND 2.0', 'CC BY-NC-SA 3.0', '', 'Copyrighted']) expect(isFreeLicense(l)).toBe(false);
});

test('neutralName est stable, hexadécimal, sans le nom de l’animal', () => {
  const n = neutralName('vache');
  expect(n).toMatch(/^[0-9a-f]{10}$/);
  expect(neutralName('vache')).toBe(n);
  expect(neutralName('coq')).not.toBe(n);
});

test('ffmpegSoundArgs coupe à 8 s par défaut, ou selon start/end, en MP3 mono 48 kbit/s', () => {
  const def = ffmpegSoundArgs('in.ogg', 'out.mp3');
  expect(def).toEqual(expect.arrayContaining(['-i', 'in.ogg', '-t', '8', '-ac', '1', '-b:a', '48k']));
  expect(def).not.toContain('-ss');
  expect(def.at(-1)).toBe('out.mp3');
  const cut = ffmpegSoundArgs('in.ogg', 'out.mp3', 2.5, 7);
  expect(cut).toEqual(expect.arrayContaining(['-ss', '2.5', '-t', '4.5']));
  expect(ffmpegSoundArgs('in.ogg', 'out.mp3', 3)).toEqual(expect.arrayContaining(['-ss', '3', '-t', '8']));
  expect(ffmpegSoundArgs('in.ogg', 'out.mp3', 0, 20)).toEqual(expect.arrayContaining(['-t', '8']));
});

test('commonsQueryUrl demande url et métadonnées, avec la largeur de miniature', () => {
  const u = new URL(commonsQueryUrl(['File:A b.ogg', 'File:C.jpg'], 480));
  expect(u.origin + u.pathname).toBe('https://commons.wikimedia.org/w/api.php');
  expect(u.searchParams.get('titles')).toBe('File:A b.ogg|File:C.jpg');
  expect(u.searchParams.get('iiprop')).toBe('url|extmetadata');
  expect(u.searchParams.get('iiurlwidth')).toBe('480');
  expect(u.searchParams.get('format')).toBe('json');
});
