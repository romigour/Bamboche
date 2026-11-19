import { expect, test } from 'vitest';
import { listenPageHtml } from './listen-page';

const credit = { author: 'Jean <b>', license: 'CC0', url: 'https://commons.wikimedia.org/wiki/File:X.ogg' };
const page = listenPageHtml([
  {
    entry: { id: 'hulotte', name: 'Chouette hulotte', level: 'difficile', family: 'nuit', sound: 'File:X.ogg', photo: 'File:X.jpg' },
    soundFile: 'hulotte.mp3',
    photoFile: 'hulotte.webp',
    credit: { sound: credit, photo: credit },
  },
]);

test('la page d’écoute montre chaque candidat avec son cri, sa photo et ses cases', () => {
  expect(page).toContain('Chouette hulotte');
  expect(page).toContain('src="hulotte.mp3"');
  expect(page).toContain('src="hulotte.webp"');
  expect(page).toContain('difficile · nuit');
  expect(page).toContain('name="hulotte"');
  expect(page).toContain('Exporter la sélection');
});

test('la page échappe le HTML des crédits', () => {
  expect(page).toContain('Jean &lt;b&gt;');
  expect(page).not.toContain('Jean <b>');
});
