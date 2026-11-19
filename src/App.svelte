<script lang="ts">
  import { gameById } from './games/registry';
  import BlindtestApp from './games/blindtest/BlindtestApp.svelte';
  import BlindtestPlay from './games/blindtest/Play.svelte';
  import Play from './games/timeup/Play.svelte';
  import TimeUpApp from './games/timeup/TimeUpApp.svelte';
  import { totals } from './games/timeup/logic/game';
  import { abandonGame, loadSavedGame } from './games/timeup/session';
  import { scores as btScores } from './games/blindtest/logic/game';
  import { playlistById } from './games/blindtest/playlists';
  import { abandonBlindtest, loadSavedBlindtest } from './games/blindtest/session';
  import { abandonUndercover, loadSavedUndercover, resumeLines } from './games/undercover/session';
  import UndercoverApp from './games/undercover/UndercoverApp.svelte';
  import UndercoverPlay from './games/undercover/Play.svelte';
  import { abandonAnimaux, loadSavedAnimaux, resumeLines as animauxLines } from './games/animaux/session';
  import GameDetail from './games/scores/screens/GameDetail.svelte';
  import History from './games/scores/screens/History.svelte';
  import ScoresMenu from './games/scores/screens/Menu.svelte';
  import Result from './games/scores/screens/Result.svelte';
  import ScoresSetup from './games/scores/screens/Setup.svelte';
  import SheetScreen from './games/scores/screens/SheetScreen.svelte';
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
    if (active?.gameId === 'timeup') {
      const s = loadSavedGame(Date.now());
      if (!s || !s.teams[s.currentTeam]) return null;
      const score = totals(s)
        .map((t) => `${shortName(s.teams.find((x) => x.id === t.teamId)?.name ?? '')} ${t.total}`)
        .join(' – ');
      const lines = [`Time Up · Manche ${s.round}`, score];
      if (s.phase !== 'podium') lines.push(`Au tour des ${shortName(s.teams[s.currentTeam].name)}`);
      return { game: gameById('timeup')!, lines, route: '/timeup/partie', abandon: abandonGame };
    }
    if (active?.gameId === 'blindtest') {
      const s = loadSavedBlindtest();
      if (!s) return null;
      const pts = btScores(s);
      const score = s.teams.map((t) => `${shortName(t.name)} ${pts[t.id]}`).join(' – ');
      const lines = [`Blindtest · Extrait ${s.current + 1} / ${s.queue.length}`, score];
      const pl = playlistById(s.playlistId);
      if (pl) lines.push(pl.name);
      return { game: gameById('blindtest')!, lines, route: '/blindtest/partie', abandon: abandonBlindtest };
    }
    if (active?.gameId === 'undercover') {
      const s = loadSavedUndercover();
      if (!s) return null;
      return { game: gameById('undercover')!, lines: resumeLines(s), route: '/undercover/partie', abandon: abandonUndercover };
    }
    if (active?.gameId === 'animaux') {
      const s = loadSavedAnimaux();
      if (!s) return null;
      return { game: gameById('animaux')!, lines: animauxLines(s), route: '/animaux/partie', abandon: abandonAnimaux };
    }
    return null;
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
{:else if $route.path === '/blindtest'}
  {#key $route.query.etape}
    <BlindtestApp initialStep={$route.query.etape === 'playlist' ? 'playlist' : 'players'} onhome={() => navigate('/')} />
  {/key}
{:else if $route.path === '/blindtest/partie'}
  <BlindtestPlay />
{:else if $route.path === '/undercover'}
  <UndercoverApp onhome={() => navigate('/')} />
{:else if $route.path === '/undercover/partie'}
  <UndercoverPlay />
{:else if $route.path === '/scores'}
  <ScoresMenu />
{:else if $route.path === '/scores/nouvelle'}
  {#key $route.query.jeu}<ScoresSetup gameId={$route.query.jeu} />{/key}
{:else if $route.path === '/scores/partie'}
  <SheetScreen />
{:else if $route.path === '/scores/resultat'}
  <Result id={$route.query.id} />
{:else if $route.path === '/scores/historique'}
  {#key $route.query.jeu}<History gameId={$route.query.jeu} />{/key}
{:else if $route.path === '/scores/historique/partie'}
  <GameDetail id={$route.query.id} />
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
      onresume={() => navigate(offer.route)}
      onabandon={() => {
        offer.abandon();
        refresh++;
      }}
    />
  {/if}
{/if}
