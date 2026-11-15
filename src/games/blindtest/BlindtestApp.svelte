<script lang="ts">
  import { untrack } from 'svelte';
  import { get } from 'svelte/store';
  import { online } from '../../lib/online';
  import { players } from '../../lib/players';
  import { getSettings } from '../../lib/settings';
  import { drawTracks } from './logic/draw';
  import { createBlindtest, currentTrackId } from './logic/game';
  import { blindtest } from './module';
  import { music } from './music/player';
  import { playlistById, trackById } from './playlists';
  import Offline from './screens/Offline.svelte';
  import Players from './screens/Players.svelte';
  import Playlist from './screens/Playlist.svelte';
  import { readHistory, startBlindtest } from './session';
  import { animatorId, btMode, btTeamsDraft, buildTeams, validateSetup } from './setup';

  /** Préparation : joueurs → playlist ; sans réseau, l'écran « Connexion requise ». */
  let { initialStep = 'players', onhome }: { initialStep?: 'players' | 'playlist'; onhome: () => void } = $props();

  // « Rejouer » ouvre la playlist, sauf si la préparation a été perdue (rechargement) ou n'est plus valide
  const startAt = untrack(() =>
    initialStep === 'playlist' && validateSetup(get(btMode), get(players), get(btTeamsDraft), get(animatorId)).ok
      ? 'playlist'
      : 'players',
  );
  let step = $state<'players' | 'playlist'>(startAt);
  let retried = $state(0);

  function start(playlistId: string) {
    const playlist = playlistById(playlistId)!;
    const settings = getSettings(blindtest);
    const { picked, history } = drawTracks(
      playlist.tracks.map((t) => t.id),
      settings.tracks,
      readHistory(playlistId),
    );
    const teams = buildTeams(get(btMode), get(players), get(btTeamsDraft), get(animatorId));
    const s = createBlindtest(teams, get(players), picked, playlistId, {
      tracks: settings.tracks,
      listenSeconds: settings.listenSeconds,
    });
    // la musique démarre dans le même tap (exigence iOS)
    music()
      .play(trackById(playlistId, currentTrackId(s))!.preview)
      .catch(() => {});
    startBlindtest(s, history);
  }
</script>

{#if !$online}
  {#key retried}
    <Offline onretry={() => retried++} {onhome} />
  {/key}
{:else if step === 'players'}
  <Players onback={onhome} onnext={() => (step = 'playlist')} />
{:else}
  <Playlist onback={() => (step = 'players')} onstart={start} />
{/if}
