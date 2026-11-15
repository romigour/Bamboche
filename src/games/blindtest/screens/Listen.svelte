<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { tap } from '../../../lib/feedback';
  import { isOnline } from '../../../lib/online';
  import { shortName } from '../../../lib/teams';
  import BigButton from '../../../lib/ui/BigButton.svelte';
  import Icon from '../../../lib/ui/Icon.svelte';
  import IconButton from '../../../lib/ui/IconButton.svelte';
  import { scores, type BlindtestState } from '../logic/game';
  import type { MusicSource } from '../music/source';
  import type { Track } from '../types';
  import Offline from './Offline.svelte';
  import PauseSheet from './PauseSheet.svelte';

  /** Écoute d'un extrait et « Qui a trouvé ? ». La lecture est lancée par le tap qui mène ici. */
  let {
    s,
    track,
    playlistName,
    source,
    onaward,
    onskip,
    onquit,
  }: {
    s: BlindtestState;
    track: Track;
    playlistName: string;
    source: MusicSource;
    onaward: (teamId: string | null) => void;
    onskip: () => void;
    onquit: () => void;
  } = $props();

  const limit = $derived(s.settings.listenSeconds * 1000);
  let pos = $state(0);
  let playing = $state(false);
  let decided = false;
  let offline = $state(false);
  let toast = $state('');
  let paused = $state(false);
  let toastTimer: ReturnType<typeof setTimeout> | undefined;
  let poll: ReturnType<typeof setInterval> | undefined;
  const offs: (() => void)[] = [];

  const fmt = (ms: number) => {
    const sec = Math.floor(ms / 1000);
    return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  };

  function start(fromMs = 0) {
    offline = false;
    paused = false;
    // appel direct dans le geste : exigence iOS
    source.play(track.preview, fromMs).catch(() => {
      playing = false;
    });
  }

  onMount(() => {
    offs.push(
      source.onError(() => {
        playing = false;
        if (!isOnline()) {
          offline = true;
          return;
        }
        toast = 'Extrait indisponible, on passe au suivant';
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => (toast = ''), 3500);
        onskip();
      }),
      source.onEnded(() => (playing = false)),
    );
    poll = setInterval(() => {
      pos = Math.min(source.positionMs(), limit);
      playing = source.playing();
      if (playing && source.positionMs() >= limit) {
        source.pause();
        playing = false;
      }
    }, 150);
  });
  onDestroy(() => {
    offs.forEach((off) => off());
    clearInterval(poll);
    clearTimeout(toastTimer);
  });

  function decide(teamId: string | null) {
    if (decided) return;
    decided = true;
    tap();
    source.stop();
    onaward(teamId);
  }

  const pts = $derived(scores(s));
</script>

<div class="page">
  <div class="top">
    <IconButton
      icon="pause"
      label="Pause"
      onclick={() => {
        source.pause();
        paused = true;
      }}
    />
    <div class="where">
      <span class="eyebrow">{playlistName}</span>
      <span class="count">Extrait {s.current + 1} / {s.queue.length}</span>
    </div>
    <IconButton icon="undo" label="Réécouter depuis le début" onclick={() => start(0)} />
  </div>

  <div class="mid">
    <div class="disc" class:on={playing}>
      <div class="bars" aria-hidden="true">
        {#each [48, 88, 64, 96, 40, 72] as h, i}<span style:height="{h}px" style:animation-delay="{i * 0.12}s"></span>{/each}
      </div>
    </div>
    {#if !playing && pos === 0}
      <BigButton variant="pop" onclick={() => start(0)}><Icon name="play" size={22} />Lancer l'extrait</BigButton>
    {:else}
      <div class="ask">
        <div class="q">Qui chante ?</div>
        <div class="sub">Le premier qui crie titre et artiste marque.</div>
      </div>
    {/if}
    <div class="progress">
      <div class="track"><div class="fill" style:width="{(pos / limit) * 100}%"></div></div>
      <div class="times"><span>{fmt(pos)}</span><span>{fmt(limit)}</span></div>
    </div>
  </div>

  {#if toast}<div class="toast" role="status">{toast}</div>{/if}

  <div class="answers">
    <div class="label">Qui a trouvé ?</div>
    <div class="grid">
      {#each s.teams as t (t.id)}
        <button
          type="button"
          class="team"
          style:--bg="var(--{t.color})"
          style:--sh="var(--{t.color}-ombre)"
          aria-label={t.name}
          onclick={() => decide(t.id)}>{shortName(t.name)}</button
        >
      {/each}
    </div>
    <button type="button" class="nobody" onclick={() => decide(null)}>Personne n'a trouvé</button>
  </div>
</div>

{#if paused}
  <PauseSheet
    {s}
    points={pts}
    onresume={() => start(source.positionMs())}
    {onquit}
  />
{/if}
{#if offline}
  <Offline overlay onretry={() => start(0)} onhome={onquit} />
{/if}

<style>
  .page {
    flex: 1;
    min-height: 100dvh;
    padding: calc(24px + env(safe-area-inset-top)) 20px calc(24px + env(safe-area-inset-bottom));
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .top { display: flex; justify-content: space-between; align-items: center; }
  .where { display: flex; flex-direction: column; align-items: center; }
  .eyebrow { font-size: 12px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: var(--texte-doux); }
  .count { font-family: var(--font-display); font-weight: 600; font-size: 18px; }
  .mid { flex-grow: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; }
  .disc {
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background: var(--blindtest);
    box-shadow: 0 10px 0 var(--blindtest-ombre);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .bars { display: flex; align-items: flex-end; gap: 10px; height: 96px; }
  .bars span { width: 16px; border-radius: 8px; background: var(--nuit); transform-origin: bottom; transform: scaleY(0.35); transition: transform 0.3s; }
  .on .bars span { animation: bounce 0.9s ease-in-out infinite alternate; }
  @keyframes bounce {
    from { transform: scaleY(0.3); }
    to { transform: scaleY(1); }
  }
  .ask { display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; }
  .q { font-family: var(--font-display); font-weight: 700; font-size: 28px; }
  .sub { font-size: 15px; color: var(--texte-doux); }
  .progress { width: 100%; display: flex; flex-direction: column; gap: 6px; }
  .track { height: 12px; border-radius: 999px; background: var(--surface-plus); overflow: hidden; }
  .fill { height: 100%; border-radius: 999px; background: var(--blindtest); transition: width 0.15s linear; }
  .times { display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; color: var(--texte-doux); }
  .toast { align-self: center; background: var(--surface-plus); border-radius: 999px; padding: 10px 16px; font-weight: 800; font-size: 14px; }
  .answers { display: flex; flex-direction: column; gap: 10px; }
  .label { font-size: 13px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; color: var(--texte-doux); text-align: center; }
  .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .team {
    height: 68px;
    border-radius: 22px;
    background: var(--bg);
    color: var(--nuit);
    box-shadow: 0 6px 0 var(--sh);
    font-family: var(--font-display);
    font-weight: 700;
    font-size: 21px;
    margin-bottom: 6px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding: 0 10px;
  }
  .team:active { transform: translateY(4px); box-shadow: 0 2px 0 var(--sh); }
  .nobody {
    height: 56px;
    border-radius: 20px;
    border: 3px solid var(--ligne);
    font-family: var(--font-display);
    font-weight: 600;
    font-size: 20px;
  }
</style>
