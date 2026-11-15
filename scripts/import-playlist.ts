/**
 * Convertit un export CSV d'Exportify en playlist intégrée au Blindtest.
 * Usage : npm run import-playlist -- <fichier.csv> <id> "<nom>" "<description>"
 * Puis ajouter l'import du JSON dans src/games/blindtest/playlists/index.ts.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseExportifyCsv } from '../src/games/blindtest/logic/csv';
import type { Playlist } from '../src/games/blindtest/types';

const [csvPath, id, name, description = ''] = process.argv.slice(2);
if (!csvPath || !id || !name) {
  console.error('Usage : npm run import-playlist -- <fichier.csv> <id> "<nom>" "<description>"');
  process.exit(1);
}
if (!/^[a-z0-9-]+$/.test(id)) {
  console.error(`Id invalide « ${id} » : minuscules, chiffres et tirets seulement.`);
  process.exit(1);
}

const { tracks, rejected } = parseExportifyCsv(readFileSync(csvPath, 'utf8'));
const seen = new Set<string>();
const unique = tracks.filter((t) => !seen.has(t.id) && seen.add(t.id));
const playlist: Playlist = { id, name, description, color: 'blindtest', tracks: unique };
const out = resolve('src/games/blindtest/playlists', `${id}.json`);
writeFileSync(out, JSON.stringify(playlist, null, 1) + '\n', 'utf8');

console.log(`${unique.length} titres gardés → ${out}`);
if (tracks.length !== unique.length) console.log(`${tracks.length - unique.length} doublon(s) retiré(s)`);
console.log(`${rejected.length} rejeté(s)`);
for (const r of rejected) console.log(`  - ${r.title} : ${r.reason}`);
