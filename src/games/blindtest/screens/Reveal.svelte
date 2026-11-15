<script lang="ts">
  import { onMount } from 'svelte';
  import { tap } from '../../../lib/feedback';
  import { shortName } from '../../../lib/teams';
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import Icon from '../../../lib/ui/Icon.svelte';
  import { scores, type BlindtestState } from '../logic/game';
  import type { MusicSource } from '../music/source';
  import type { Track } from '../types';

  /** Révélation : pochette, titre, artiste, année, qui marque ; précharge l'extrait suivant. */
  let {
    s,
    track,
    next,
    source,
    onnext,
    onchange,
  }: {
    s: BlindtestState;
    track: Track;
    next?: Track;
    source: MusicSource;
    onnext: () => void;
    onchange: (teamId: string | null) => void;
  } = $props();

  let coverFailed = $state(false);
  let editing = $state(false);
  const winnerId = $derived(s.winners[s.current] ?? null);
  const winner = $derived(s.teams.find((t) => t.id === winnerId));
  const pts = $derived(scores(s));
  const last = $derived(s.current + 1 >= s.queue.length);

  onMount(() => {
    if (next) source.preload(next.preview);
  });
</script>

<div class="page">
  <div class="badge-row">
    {#if winner}
      <span class="badge ok"><Icon name="check" size={18} stroke={3.2} />+1 pour {shortName(winner.name)}</span>
    {:else}
      <span class="badge none">Personne n'a trouvé</span>
    {/if}
  </div>

  <div class="mid">
    <div class="cover">
      {#if track.cover && !coverFailed}
        <img src={track.cover} alt="Pochette de {track.album}" onerror={() => (coverFailed = true)} />
      {:else}
        <Icon name="disc" size={90} stroke={1.8} />
      {/if}
    </div>
    <div class="titles">
      <div class="title">{track.displayTitle}</div>
      <div class="artist">{track.artists.join(', ')}</div>
    </div>
    {#if track.year}<span class="year">{track.annee_corrigee ?? track.year}</span>{/if}
  </div>

  {#if editing}
    <div class="edit">
      <div class="label">Qui a vraiment trouvé ?</div>
      <div class="grid">
        {#each s.teams as t (t.id)}
          <button
            type="button"
            class="team"
            class:sel={t.id === winnerId}
            style:--bg="var(--{t.color})"
            onclick={() => {
              tap();
              onchange(t.id);
              editing = false;
            }}>{shortName(t.name)}</button
          >
        {/each}
      </div>
      <button
        type="button"
        class="nobody"
        onclick={() => {
          tap();
          onchange(null);
          editing = false;
        }}>Personne</button
      >
    </div>
  {:else}
    <div class="scores">
      {#each s.teams as t (t.id)}
        <div class="sc">
          <span class="sn" style:color="var(--{t.color})">{shortName(t.name)}</span>
          <span class="sv" class:lead={t.id === winnerId}>{pts[t.id]}</span>
        </div>
      {/each}
    </div>
    <button type="button" class="fix" onclick={() => (editing = true)}>Erreur ? Changer qui a marqué</button>
  {/if}

  <BigButton variant="pop" onclick={onnext}>
    {last ? 'Voir le podium' : 'Extrait suivant'}<Icon name="chevron" size={22} stroke={3} />
  </BigButton>
</div>

<style>
  .page {
    flex: 1;
    min-height: 100dvh;
    padding: calc(24px + env(safe-area-inset-top)) 20px calc(24px + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .badge-row { display: flex; justify-content: center; }
  .badge { height: 36px; padding: 0 16px; border-radius: 999px; font-weight: 800; font-size: 16px; display: inline-flex; align-items: center; gap: 8px; }
  .badge.ok { background: var(--ok); color: var(--nuit); }
  .badge.none { background: var(--surface-plus); color: var(--texte-doux); }
  .mid { flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px; text-align: center; }
  .cover {
    width: min(260px, 66vw);
    aspect-ratio: 1;
    border-radius: 28px;
    background: linear-gradient(140deg, var(--surface-plus), var(--blindtest) 60%, var(--pop));
    box-shadow: 0 10px 0 var(--blindtest-ombre);
    color: var(--nuit);
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }
  .cover img { width: 100%; height: 100%; object-fit: cover; }
  .titles { display: flex; flex-direction: column; gap: 4px; }
  .title { font-family: var(--font-display); font-weight: 700; font-size: 32px; line-height: 1.05; overflow-wrap: anywhere; }
  .artist { font-size: 20px; font-weight: 800; color: var(--blindtest); }
  .year { height: 40px; padding: 0 18px; border-radius: 999px; background: var(--surface); font-family: var(--font-display); font-weight: 700; font-size: 22px; display: inline-flex; align-items: center; }
  .scores { background: var(--surface); border-radius: 20px; padding: 10px 14px; display: flex; gap: 8px; justify-content: space-around; flex-wrap: wrap; }
  .sc { display: flex; flex-direction: column; align-items: center; gap: 2px; min-width: 56px; }
  .sn { font-size: 13px; font-weight: 800; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .sv { font-family: var(--font-display); font-weight: 700; font-size: 24px; }
  .sv.lead { color: var(--pop); }
  .fix { align-self: center; font-size: 14px; font-weight: 800; color: var(--texte-doux); text-decoration: underline; padding: 6px; min-height: 44px; }
  .edit { display: flex; flex-direction: column; gap: 10px; }
  .label { font-size: 13px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: var(--texte-doux); text-align: center; }
  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .team { height: 56px; border-radius: 20px; background: var(--bg); color: var(--nuit); font-family: var(--font-display); font-weight: 700; font-size: 19px; border: 4px solid transparent; }
  .team.sel { border-color: var(--texte); }
  .nobody { height: 52px; border-radius: 20px; border: 3px solid var(--ligne); font-family: var(--font-display); font-weight: 600; font-size: 18px; }
</style>
