import type { AnimalLevel, Credit } from '../../src/games/animaux/types';

/** Entrée de `scripts/animals.source.json`, écrite à la main. `start`/`end` en secondes. */
export interface SourceEntry {
  id: string;
  name: string;
  level: AnimalLevel;
  family: string;
  /** Titres de fichiers Commons, ex. 'File:Strix aluco.ogg'. */
  sound: string;
  photo: string;
  start?: number;
  end?: number;
}

export interface Candidate {
  entry: SourceEntry;
  soundFile: string;
  photoFile: string;
  credit: { sound: Credit; photo: Credit };
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Page autonome pour écouter les candidats, cocher Garder / Jeter et exporter `selection.json`. */
export function listenPageHtml(candidates: Candidate[]): string {
  const cards = candidates
    .map(({ entry: e, soundFile, photoFile, credit }) => `
<article>
  <img src="${esc(photoFile)}" alt="${esc(e.name)}" loading="lazy">
  <div class="body">
    <h2>${esc(e.name)}</h2>
    <p class="meta">${esc(e.level)} · ${esc(e.family)} · <code>${esc(e.id)}</code></p>
    <audio controls preload="none" src="${esc(soundFile)}"></audio>
    <p class="credit">Son : <a href="${esc(credit.sound.url)}" target="_blank">${esc(credit.sound.author)} · ${esc(credit.sound.license)}</a><br>
    Photo : <a href="${esc(credit.photo.url)}" target="_blank">${esc(credit.photo.author)} · ${esc(credit.photo.license)}</a></p>
    <div class="choice">
      <label><input type="radio" name="${esc(e.id)}" value="keep"> Garder</label>
      <label><input type="radio" name="${esc(e.id)}" value="drop"> Jeter</label>
    </div>
    <input class="note" data-id="${esc(e.id)}" placeholder="Note de découpe (ex. commencer à 2 s)">
  </div>
</article>`)
    .join('\n');
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Écoute des cris d'animaux</title>
<style>
:root { color-scheme: dark; }
body { margin: 0; padding: 16px; background: #1A1033; color: #fff; font-family: system-ui, sans-serif; }
header { position: sticky; top: 0; background: #1A1033; padding: 8px 0 12px; display: flex; gap: 12px; align-items: center; flex-wrap: wrap; z-index: 1; }
h1 { margin: 0; font-size: 22px; flex: 1 1 auto; }
button { font: inherit; font-weight: 700; padding: 10px 16px; border: 0; border-radius: 12px; background: #FFD23F; color: #1A1033; cursor: pointer; }
main { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }
article { background: #2A1D52; border-radius: 16px; overflow: hidden; }
article.keep { outline: 3px solid #4ADE80; } article.drop { opacity: .45; }
img { width: 100%; height: 180px; object-fit: cover; display: block; background: #3A2A6B; }
.body { padding: 12px; display: flex; flex-direction: column; gap: 8px; }
h2 { margin: 0; font-size: 19px; } .meta, .credit { margin: 0; color: #C9BFEA; font-size: 13px; }
a { color: #C9BFEA; } audio { width: 100%; }
.choice { display: flex; gap: 16px; font-weight: 700; } .note { font: inherit; padding: 6px 8px; border-radius: 8px; border: 1px solid #4B3A80; background: #1A1033; color: #fff; }
</style></head>
<body>
<header><h1>Écoute des cris d'animaux</h1><span id="count"></span><button id="export" type="button">Exporter la sélection</button></header>
<main>${cards}
</main>
<script>
const KEY = 'bamboche-ecoute';
const saved = JSON.parse(localStorage.getItem(KEY) || '{"choices":{},"notes":{}}');
const render = () => {
  let keep = 0, drop = 0;
  document.querySelectorAll('article').forEach((a) => {
    const v = saved.choices[a.querySelector('input[type=radio]').name];
    a.className = v || '';
    if (v === 'keep') keep++; else if (v === 'drop') drop++;
  });
  document.getElementById('count').textContent = keep + ' gardés · ' + drop + ' jetés · ' + (document.querySelectorAll('article').length - keep - drop) + ' à écouter';
};
document.querySelectorAll('input[type=radio]').forEach((r) => {
  if (saved.choices[r.name] === r.value) r.checked = true;
  r.addEventListener('change', () => { saved.choices[r.name] = r.value; localStorage.setItem(KEY, JSON.stringify(saved)); render(); });
});
document.querySelectorAll('.note').forEach((n) => {
  n.value = saved.notes[n.dataset.id] || '';
  n.addEventListener('input', () => { saved.notes[n.dataset.id] = n.value; localStorage.setItem(KEY, JSON.stringify(saved)); });
});
document.getElementById('export').addEventListener('click', () => {
  const keep = Object.keys(saved.choices).filter((id) => saved.choices[id] === 'keep');
  const notes = Object.fromEntries(Object.entries(saved.notes).filter(([, v]) => v.trim()));
  const blob = new Blob([JSON.stringify({ keep, notes }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'selection.json'; a.click();
});
render();
</script>
</body></html>
`;
}
