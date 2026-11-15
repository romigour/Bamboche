<script lang="ts">
  import { gameById } from './games/registry';
  import { unlockAudio } from './lib/feedback';
  import { players } from './lib/players';
  import { navigate, route } from './lib/router';
  import GameSettings from './screens/GameSettings.svelte';
  import Home from './screens/Home.svelte';
  import Players from './screens/Players.svelte';

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
{:else}
  <Home
    playerCount={$players.length}
    onopen={(g) => g.status === 'disponible' && navigate(g.route)}
    onplayers={() => navigate('/joueurs')}
  />
{/if}
