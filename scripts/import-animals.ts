/**
 * Banque de sons des Cris d'animaux, depuis Wikimedia Commons (voir README).
 *   npm run import-animals -- candidats [ids…]       télécharge et prépare les candidats + page d'écoute
 *   npm run import-animals -- banque [selection.json] construit public/animaux/ et animals.json
 */
import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import ffmpegPath from 'ffmpeg-static';
import type { Animal } from '../src/games/animaux/types';
import { commonsQueryUrl, ffmpegSoundArgs, isFreeLicense, neutralName, parseImageInfo, type FileInfo } from './animals/commons';
import { listenPageHtml, type Candidate, type SourceEntry } from './animals/listen-page';

const SOURCE = resolve('scripts/animals.source.json');
const WORK = resolve('scripts/.animaux-candidats');
const ORIG = join(WORK, 'originaux');
const PUBLIC = resolve('public/animaux');
const CATALOG = resolve('src/games/animaux/animals.json');
const UA = { 'User-Agent': 'Bamboche-import/1.0 (script local)' };
const THUMB = 480;
const BUDGET = 10 * 1024 * 1024;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** GET poli : pause entre les appels, et attente demandée par Wikimedia en cas de 429. */
async function get(url: string): Promise<Response> {
  for (let attempt = 0; attempt < 6; attempt++) {
    await sleep(1500);
    const res = await fetch(url, { headers: UA });
    if (res.status !== 429 && res.status < 500) return res;
    const wait = Number(res.headers.get('retry-after')) || 15;
    console.log(`  ${res.status}, nouvel essai dans ${wait} s`);
    await sleep(wait * 1000);
  }
  throw new Error(`Échec répété : ${url}`);
}

function ffmpeg(args: string[]) {
  execFileSync(ffmpegPath as unknown as string, args, { stdio: ['ignore', 'ignore', 'inherit'] });
}

async function fetchInfos(titles: string[]): Promise<Record<string, FileInfo>> {
  const out: Record<string, FileInfo> = {};
  for (let i = 0; i < titles.length; i += 50) {
    const res = await get(commonsQueryUrl(titles.slice(i, i + 50), THUMB));
    Object.assign(out, parseImageInfo(await res.json()));
  }
  return out;
}

async function download(url: string, file: string) {
  if (existsSync(file)) return;
  const res = await get(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} pour ${url}`);
  writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}

async function candidats(onlyIds: string[]) {
  const source: SourceEntry[] = JSON.parse(readFileSync(SOURCE, 'utf8'));
  const entries = onlyIds.length ? source.filter((e) => onlyIds.includes(e.id)) : source;
  mkdirSync(ORIG, { recursive: true });
  const infos = await fetchInfos([...new Set(entries.flatMap((e) => [e.sound, e.photo]))]);
  const listFile = join(WORK, 'candidats.json');
  const previous: Candidate[] = existsSync(listFile) ? JSON.parse(readFileSync(listFile, 'utf8')) : [];
  const ready = new Map(previous.filter((c) => source.some((e) => e.id === c.entry.id)).map((c) => [c.entry.id, c]));
  const problems: string[] = [];
  for (const e of entries) {
    ready.delete(e.id);
    const s = infos[e.sound];
    const p = infos[e.photo];
    if (!s || !p) {
      problems.push(`${e.id} : fichier introuvable (${!s ? e.sound : e.photo})`);
      continue;
    }
    const bad = [s, p].find((x) => !isFreeLicense(x.credit.license));
    if (bad) {
      problems.push(`${e.id} : licence refusée « ${bad.credit.license} » (${bad.credit.url})`);
      continue;
    }
    try {
      console.log(`- ${e.name}`);
      const photoUrl = p.thumbUrl ?? p.url;
      const soundOrig = join(ORIG, `${e.id}-son${extname(new URL(s.url).pathname)}`);
      const photoOrig = join(ORIG, `${e.id}-photo${extname(new URL(photoUrl).pathname)}`);
      await download(s.url, soundOrig);
      await download(photoUrl, photoOrig);
      ffmpeg(ffmpegSoundArgs(soundOrig, join(WORK, `${e.id}.mp3`), e.start, e.end));
      ffmpeg(['-y', '-hide_banner', '-loglevel', 'error', '-i', photoOrig, '-vf', `scale='min(${THUMB},iw)':-2`, '-c:v', 'libwebp', '-quality', '72', join(WORK, `${e.id}.webp`)]);
      ready.set(e.id, { entry: e, soundFile: `${e.id}.mp3`, photoFile: `${e.id}.webp`, credit: { sound: s.credit, photo: p.credit } });
    } catch (err) {
      problems.push(`${e.id} : ${(err as Error).message}`);
    }
  }
  const all = source.map((e) => ready.get(e.id)).filter((c): c is Candidate => !!c);
  writeFileSync(listFile, JSON.stringify(all, null, 1));
  writeFileSync(join(WORK, 'ecoute.html'), listenPageHtml(all));
  console.log(`\n${all.length} candidats prêts. Page d'écoute : ${join(WORK, 'ecoute.html')}`);
  if (problems.length) console.log(`\n${problems.length} écarté(s) :\n  ${problems.join('\n  ')}`);
}

function banque(selectionPath?: string) {
  const candidates: Candidate[] = JSON.parse(readFileSync(join(WORK, 'candidats.json'), 'utf8'));
  const keep = selectionPath ? new Set<string>(JSON.parse(readFileSync(selectionPath, 'utf8')).keep) : null;
  const chosen = candidates.filter((c) => !keep || keep.has(c.entry.id));
  mkdirSync(PUBLIC, { recursive: true });
  const animals: Animal[] = [];
  const wanted = new Set<string>();
  for (const c of chosen) {
    const n = neutralName(c.entry.id);
    copyFileSync(join(WORK, c.soundFile), join(PUBLIC, `${n}.mp3`));
    copyFileSync(join(WORK, c.photoFile), join(PUBLIC, `${n}.webp`));
    wanted.add(`${n}.mp3`).add(`${n}.webp`);
    const { id, name, level, family } = c.entry;
    animals.push({ id, name, level, family, sound: `animaux/${n}.mp3`, photo: `animaux/${n}.webp`, credits: c.credit });
  }
  for (const f of readdirSync(PUBLIC)) if (!wanted.has(f)) rmSync(join(PUBLIC, f));
  animals.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  writeFileSync(CATALOG, JSON.stringify(animals, null, 1) + '\n');

  const size = [...wanted].reduce((t, f) => t + statSync(join(PUBLIC, f)).size, 0);
  console.log(`${animals.length} animaux → ${CATALOG}`);
  console.log(`Taille de la banque : ${(size / 1024 / 1024).toFixed(2)} Mo`);
  if (size > BUDGET) console.log("⚠ Au-delà de l'objectif de 10 Mo.");
  const families = new Map<string, number>();
  for (const a of animals) families.set(a.family, (families.get(a.family) ?? 0) + 1);
  for (const [f, n] of families) if (n < 4) console.log(`⚠ Famille « ${f} » : ${n} animal(aux), il en faut 4 pour le niveau Expert.`);
  const easy = animals.filter((a) => a.level === 'facile');
  const easyFamilies = new Set(easy.map((a) => a.family)).size;
  if (easy.length < 30 || easyFamilies < 5) console.log(`⚠ ${easy.length} faciles sur ${easyFamilies} familles (objectif : 30 sur 5).`);
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === 'candidats') await candidats(args);
else if (cmd === 'banque') banque(args[0]);
else {
  console.error('Usage : npm run import-animals -- candidats [ids…] | banque [selection.json]');
  process.exit(1);
}
