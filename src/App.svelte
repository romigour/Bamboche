<script lang="ts">
  import { gameById } from './games/registry';
  import { unlockAudio } from './lib/feedback';
  import { players } from './lib/players';
  import { navigate, route } from './lib/router';
  import GameSettings from './screens/GameSettings.svelte';
  import Home from './screens/Home.svelte';
  import Players from './screens/Players.svelte';
  import TimeUpApp from './games/timeup/TimeUpApp.svelte';

  const back = (fallback = '/') => navigate($route.query.retour || fallback);
  const settingsGame = $derived(
    $route.path.startsWith('/reglages/') ? gameById($route.path.slice('/reglages/'.length)) : undefined,
  );
</script>

<svelte:window onpointerdown={unlockAudio} />

{#if $route.path === '/joueurs'}
  <Players onback={() => back()} />
{:else if settingsGame}
  {#key settingsGame.id}<GameSettings game={settingsGame} onback={() => back(settingsGame.route)} />{/key}
{:else if $route.path === '/timeup'}
  {#key $route.query.etape}
    <TimeUpApp initialStep={$route.query.etape === 'mode' ? 'mode' : 'teams'} onhome={() => navigate('/')} />
  {/key}
{:else if $route.path === '/timeup/partie'}
  <p style="padding: 40px; text-align: center">Partie lancée (écrans de jeu : Task 10)</p>
{:else}
  <Home
    playerCount={$players.length}
    onopen={(g) => g.status === 'disponible' && navigate(g.route)}
    onplayers={() => navigate('/joueurs')}
  />
{/if}
