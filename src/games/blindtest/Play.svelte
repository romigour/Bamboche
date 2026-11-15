<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { rankScores } from '../../lib/ranking';
  import { navigate } from '../../lib/router';
  import PodiumView from '../../lib/ui/PodiumView.svelte';
  import { keepAwake, releaseAwake } from '../../lib/wakelock';
  import { award, changeWinner, currentTrackId, nextTrack, scores, skipCurrent, type BlindtestState } from './logic/game';
  import { music } from './music/player';
  import { playlistById, trackById } from './playlists';
  import Listen from './screens/Listen.svelte';
  import Reveal from './screens/Reveal.svelte';
  import { abandonBlindtest, btGame, loadSavedBlindtest } from './session';
  import { animatorId, btMode, btTeamsDraft } from './setup';

  /** Partie de Blindtest : écoute → révélation → … → podium. */
  if (!$btGame) {
    const saved = loadSavedBlindtest();
    if (saved) btGame.set(saved);
    else navigate('/');
  }

  const source = music();
  onMount(() => void keepAwake());
  onDestroy(() => {
    source.stop();
    void releaseAwake();
  });

  const s = $derived($btGame);
  const track = $derived(s ? trackById(s.playlistId, currentTrackId(s)) : undefined);
  const nextT = $derived(s && s.current + 1 < s.queue.length ? trackById(s.playlistId, s.queue[s.current + 1]) : undefined);
  const playlistName = $derived(s ? (playlistById(s.playlistId)?.name ?? '') : '');

  function apply(f: (x: BlindtestState) => BlindtestState): BlindtestState | null {
    const cur = $btGame;
    if (!cur) return null;
    const next = f(cur);
    if (next !== cur) btGame.set(next);
    return next;
  }

  function playCurrent(x: BlindtestState | null) {
    if (!x || x.phase !== 'listen') return;
    const t = trackById(x.playlistId, currentTrackId(x));
    if (t) source.play(t.preview).catch(() => {});
  }

  function quit() {
    source.stop();
    abandonBlindtest();
    navigate('/');
  }
</script>

{#if s}
  {#if s.phase === 'listen' && track}
    {#key s.current}
      <Listen
        {s}
        {track}
        {playlistName}
        {source}
        onaward={(id) => apply((x) => award(x, id))}
        onskip={() => playCurrent(apply(skipCurrent))}
        onquit={quit}
        onhome={() => {
          source.stop();
          navigate('/');
        }}
      />
    {/key}
  {:else if s.phase === 'reveal' && track}
    {#key s.current}
      <Reveal
        {s}
        {track}
        next={nextT}
        {source}
        onchange={(id) => apply((x) => changeWinner(x, id))}
        onnext={() => playCurrent(apply(nextTrack))}
      />
    {/key}
  {:else if s.phase === 'podium'}
    <PodiumView
      ranking={rankScores(Object.entries(scores(s)).map(([id, total]) => ({ id, total }))).map((r) => {
        const t = s.teams.find((x) => x.id === r.id)!;
        return { ...r, name: t.name, color: t.color };
      })}
      onreplay={() => {
        // mêmes joueurs : on garde le mode et les équipes de cette partie
        if (s.teams.every((t) => t.id.startsWith('solo-'))) btMode.set('solo');
        else {
          btMode.set('equipes');
          btTeamsDraft.set(s.teams.map((t) => ({ id: t.id, name: t.name, color: t.color, playerIds: t.players.map((p) => p.id) })));
          animatorId.set(null);
        }
        abandonBlindtest();
        navigate('/blindtest', { etape: 'playlist' });
      }}
      onhome={quit}
    />
  {/if}
{/if}
