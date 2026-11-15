<script lang="ts">
  import { tap } from '../../../lib/feedback';
  import { getSettings, setSetting } from '../../../lib/settings';
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import Icon from '../../../lib/ui/Icon.svelte';
  import Pills from '../../../lib/ui/Pills.svelte';
  import Screen from '../../../lib/ui/Screen.svelte';
  import { blindtest } from '../module';
  import { playlists } from '../playlists';

  /** « Quelle musique ? » : playlist, nombre d'extraits, durée d'écoute. */
  let { onback, onstart }: { onback: () => void; onstart: (playlistId: string) => void } = $props();

  const SOON = ['Années 80'];
  let selected = $state(playlists[0].id);
  let values = $state(getSettings(blindtest));
  const opts = (key: string, unit = '') => {
    const d = blindtest.settings.find((s) => s.key === key)!;
    return d.type === 'choice' ? d.options.map((v) => ({ value: v, label: unit ? `${v} ${unit}` : String(v) })) : [];
  };
  const decade = (years: (number | null)[]) => {
    const ys = years.filter((y): y is number => !!y);
    return ys.length ? `des années ${String(Math.floor(Math.min(...ys) / 10) * 10).slice(2)} à aujourd'hui` : '';
  };
  function change(key: string, v: number) {
    setSetting('blindtest', key, v);
    values = { ...values, [key]: v };
  }
</script>

<Screen color="blindtest" eyebrow="Blindtest · étape 2 sur 2" title="Quelle musique ?" back={onback} backLabel="Retour aux joueurs">
  {#each playlists as p (p.id)}
    <button
      type="button"
      class="pl"
      class:sel={p.id === selected}
      onclick={() => {
        tap();
        selected = p.id;
      }}
    >
      <span class="art"><Icon name="music" size={34} /></span>
      <span class="txt">
        <span class="name">{p.name}</span>
        <span class="meta">{p.tracks.length} titres · {decade(p.tracks.map((t) => t.year))}</span>
      </span>
      {#if p.id === selected}<span class="check"><Icon name="check" size={18} stroke={3.2} /></span>{/if}
    </button>
  {/each}
  <div class="soon">
    {#each SOON as name}<div class="sc"><span class="sn">{name}</span><span class="sb">Bientôt</span></div>{/each}
  </div>

  <div class="field">
    <div class="label">Nombre d'extraits</div>
    <Pills label="Nombre d'extraits" options={opts('tracks')} value={values.tracks} onchange={(v) => change('tracks', v)} />
  </div>
  <div class="field">
    <div class="label">Durée d'écoute</div>
    <Pills label="Durée d'écoute" options={opts('listenSeconds', 's')} value={values.listenSeconds} onchange={(v) => change('listenSeconds', v)} />
  </div>

  {#snippet footer()}
    <p class="tip">Monte le son ! L'animateur garde le téléphone.</p>
    <BigButton variant="pop" onclick={() => onstart(selected)}><Icon name="play" size={22} />C'est parti !</BigButton>
  {/snippet}
</Screen>

<style>
  .pl {
    background: var(--surface);
    border: 4px solid transparent;
    border-radius: 26px;
    padding: 14px;
    display: flex;
    align-items: center;
    gap: 14px;
    text-align: left;
  }
  .pl.sel { border-color: var(--blindtest); }
  .art {
    width: 64px;
    height: 64px;
    border-radius: 18px;
    background: linear-gradient(135deg, var(--blindtest), var(--pop) 55%, var(--hipster));
    color: var(--nuit);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .txt { flex-grow: 1; display: flex; flex-direction: column; gap: 2px; }
  .name { font-family: var(--font-display); font-weight: 700; font-size: 22px; line-height: 1.1; }
  .meta { font-size: 14px; color: var(--texte-doux); font-weight: 700; }
  .check { width: 32px; height: 32px; border-radius: 50%; background: var(--blindtest); color: var(--nuit); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .soon { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .sc { border: 3px dashed var(--ligne); border-radius: 20px; padding: 12px; display: flex; flex-direction: column; gap: 2px; }
  .sn { font-family: var(--font-display); font-weight: 600; font-size: 17px; }
  .sb { font-size: 13px; font-weight: 800; color: var(--blindtest); }
  .field { display: flex; flex-direction: column; gap: 8px; }
  .label { font-size: 13px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: var(--texte-doux); }
  .tip { margin: 0; text-align: center; font-size: 14px; color: var(--texte-doux); font-weight: 700; }
</style>
