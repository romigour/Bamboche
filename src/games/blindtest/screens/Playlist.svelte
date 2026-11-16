<script lang="ts">
  import { tap } from '../../../lib/feedback';
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import Icon from '../../../lib/ui/Icon.svelte';
  import Screen from '../../../lib/ui/Screen.svelte';
  import { playlists } from '../playlists';

  /** « Quelle musique ? » : choix de la playlist. */
  let { onback, onstart }: { onback: () => void; onstart: (playlistId: string) => void } = $props();

  const SOON = ['Années 80'];
  let selected = $state(playlists[0].id);
  const decade = (years: (number | null)[]) => {
    const ys = years.filter((y): y is number => !!y);
    return ys.length ? `des années ${String(Math.floor(Math.min(...ys) / 10) * 10).slice(2)} à aujourd'hui` : '';
  };
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
  .tip { margin: 0; text-align: center; font-size: 14px; color: var(--texte-doux); font-weight: 700; }
</style>
