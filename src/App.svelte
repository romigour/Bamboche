<script lang="ts">
  import { gameById } from './games/registry';
  import Play from './games/timeup/Play.svelte';
  import TimeUpApp from './games/timeup/TimeUpApp.svelte';
  import { totals } from './games/timeup/logic/game';
  import { abandonGame, loadSavedGame } from './games/timeup/session';
  import { getActiveGame } from './lib/activeGame';
  import { installAudioUnlock } from './lib/feedback';
  import { players } from './lib/players';
  import { navigate, route } from './lib/router';
  import { shortName } from './lib/teams';
  import GameSettings from './screens/GameSettings.svelte';
  import Home from './screens/Home.svelte';
  import Players from './screens/Players.svelte';
  import ResumeSheet from './screens/ResumeSheet.svelte';

  const back = (fallback = '/') => navigate($route.query.retour || fallback);
  const settingsGame = $derived(
    $route.path.startsWith('/reglages/') ? gameById($route.path.slice('/reglages/'.length)) : undefined,
  );

  /** Proposition de reprise : chaque fois qu'on arrive sur l'accueil avec une partie sauvegardée. */
  function resumeOffer() {
    const active = getActiveGame();
    if (!active || active.gameId !== 'timeup') return null;
    const s = loadSavedGame(Date.now());
    if (!s || !s.teams[s.currentTeam]) return null;
    const score = totals(s)
      .map((t) => `${shortName(s.teams.find((x) => x.id === t.teamId)?.name ?? '')} ${t.total}`)
      .join(' – ');
    const lines = [`Time Up · Manche ${s.round}`, score];
    if (s.phase !== 'podium') lines.push(`Au tour des ${shortName(s.teams[s.currentTeam].name)}`);
    return { game: gameById('timeup')!, lines };
  }
  let refresh = $state(0);
  const offer = $derived.by(() => {
    void refresh; // recalcul après « Abandonner »
    return $route.path === '/' ? resumeOffer() : null;
  });
  installAudioUnlock(window);
</script>


{#if $route.path === '/joueurs'}
  <Players onback={() => back()} />
{:else if settingsGame}
  {#key settingsGame.id}<GameSettings game={settingsGame} onback={() => back(settingsGame.route)} />{/key}
{:else if $route.path === '/timeup'}
  {#key $route.query.etape}
    <TimeUpApp initialStep={$route.query.etape === 'mode' ? 'mode' : 'teams'} onhome={() => navigate('/')} />
  {/key}
{:else if $route.path === '/timeup/partie'}
  <Play />
{:else}
  <Home
    playerCount={$players.length}
    onopen={(g) => g.status === 'disponible' && navigate(g.route)}
    onplayers={() => navigate('/joueurs')}
  />
  {#if offer}
    <ResumeSheet
      game={offer.game}
      lines={offer.lines}
      onresume={() => navigate('/timeup/partie')}
      onabandon={() => {
        abandonGame();
        refresh++;
      }}
    />
  {/if}
{/if}
