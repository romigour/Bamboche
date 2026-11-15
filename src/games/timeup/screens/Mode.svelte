<script lang="ts">
  import { tap } from '../../../lib/feedback';
  import { getSettings, setSetting } from '../../../lib/settings';
  import Icon from '../../../lib/ui/Icon.svelte';
  import Screen from '../../../lib/ui/Screen.svelte';
  import Stepper from '../../../lib/ui/Stepper.svelte';
  import { timeup } from '../module';

  let {
    onback,
    onquick,
    oncustom,
  }: { onback: () => void; onquick: () => void; oncustom: (wordsPerTeam: number) => void } = $props();

  const settings = getSettings(timeup);
  let wordsPerTeam = $state(settings.wordsPerTeam);
  const wDef = timeup.settings.find((s) => s.key === 'wordsPerTeam')!;
  const [wMin, wMax] = wDef.type === 'int' ? [wDef.min, wDef.max] : [3, 10];
  const rules =
    settings.rounds === 1
      ? '1 manche : décrire.'
      : settings.rounds === 2
        ? '2 manches avec les mêmes cartes : décrire, puis un seul mot.'
        : '3 manches avec les mêmes cartes : décrire, un seul mot, mimer.';
</script>

<Screen color="timeup" eyebrow="Time Up · étape 2 sur 2" title="Quelles cartes ?" back={onback} backLabel="Retour aux équipes">
  <button
    type="button"
    class="quick"
    onclick={() => {
      tap();
      onquick();
    }}
  >
    <div class="head">
      <div class="ic"><Icon name="play" size={28} /></div>
      <div class="titles">
        <span class="t">Partie rapide</span>
        <span class="s">{settings.quickCards} cartes prêtes à jouer</span>
      </div>
    </div>
    <span class="desc">Célébrités, personnages, objets… On lance tout de suite.</span>
  </button>

  <div class="custom">
    <div class="head">
      <div class="ic dark"><Icon name="edit" size={26} /></div>
      <div class="titles">
        <span class="t">Partie perso</span>
        <span class="s soft">Chaque équipe écrit ses mots</span>
      </div>
    </div>
    <div class="words">
      <span class="label">Mots par équipe</span>
      <Stepper
        value={wordsPerTeam}
        min={wMin}
        max={wMax}
        format={(n) => `${n} mots`}
        lessLabel="Un mot de moins"
        moreLabel="Un mot de plus"
        onchange={(n) => {
          wordsPerTeam = n;
          setSetting('timeup', 'wordsPerTeam', n);
        }}
      />
    </div>
    <button
      type="button"
      class="write"
      onclick={() => {
        tap();
        oncustom(wordsPerTeam);
      }}>Écrire nos mots</button
    >
  </div>

  <div class="grow"></div>
  <p class="rules">{rules}</p>
</Screen>

<style>
  .quick {
    background: var(--pop);
    color: var(--nuit);
    border-radius: 28px;
    box-shadow: 0 7px 0 var(--pop-ombre);
    padding: 22px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    text-align: left;
    margin-bottom: 7px;
    transition: transform 0.08s ease, box-shadow 0.08s ease;
  }
  .quick:active { transform: translateY(5px); box-shadow: 0 2px 0 var(--pop-ombre); }
  .head { display: flex; align-items: center; gap: 14px; }
  .ic {
    width: 56px;
    height: 56px;
    border-radius: 18px;
    background: rgba(26, 16, 51, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .ic.dark { background: var(--surface-plus); color: var(--timeup); }
  .titles { display: flex; flex-direction: column; gap: 2px; }
  .t { font-family: var(--font-display); font-weight: 700; font-size: 26px; line-height: 1.05; }
  .s { font-size: 15px; font-weight: 800; }
  .soft { color: var(--texte-doux); }
  .desc { font-size: 15px; font-weight: 700; }
  .custom { background: var(--surface); border-radius: 28px; padding: 22px; display: flex; flex-direction: column; gap: 16px; }
  .words { display: flex; flex-direction: column; gap: 8px; }
  .words :global(.stepper) { background: var(--nuit); }
  .label { font-size: 13px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: var(--texte-doux); }
  .write {
    height: 60px;
    border-radius: 20px;
    background: var(--timeup);
    color: var(--nuit);
    box-shadow: 0 6px 0 var(--timeup-ombre);
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 22px;
    margin-bottom: 6px;
  }
  .write:active { transform: translateY(4px); box-shadow: 0 2px 0 var(--timeup-ombre); }
  .grow { flex-grow: 1; }
  .rules { margin: 0; text-align: center; font-size: 15px; color: var(--texte-doux); font-weight: 700; }
</style>
